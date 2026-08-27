import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateCoupon } from '@/lib/coupons';
import { calculateTotals } from '@/lib/pricing';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { buildUpiPaymentUri, isValidUpiId } from '@/lib/upi';

const hamper = z.object({ recipient: z.string(), occasion: z.string(), packaging: z.string(), items: z.array(z.string()), recipientName: z.string().optional(), message: z.string().optional(), deliveryDate: z.string().optional(), total: z.number().positive() });
const schema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(20), personalization: z.record(z.string(), z.string()).optional(), hamper: hamper.optional(), name: z.string().optional(), price: z.number().optional(), mrp: z.number().optional() })).min(1),
  address: z.object({ name: z.string().min(2), mobile: z.string().min(10), line1: z.string().min(5), city: z.string().min(2), state: z.string().min(2), postalCode: z.string().regex(/^\d{6}$/) }),
  paymentMethod: z.literal('manual_upi'),
  couponCode: z.string().max(50).optional(),
  deliveryDate: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const supabase = await createClient();
    const admin = createAdminClient();
    if (!supabase || !admin) return NextResponse.json({ error: 'Checkout is ready but Supabase environment variables are not configured.' }, { status: 503 });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Please sign in before checkout.' }, { status: 401 });

    const normal = input.items.filter((item) => !item.hamper);
    const productIds = [...new Set(normal.map((item) => item.productId))];
    const { data: products, error } = productIds.length
      ? await admin.from('products').select('id,name,slug,sku,price,mrp,stock,category_id').in('id', productIds).eq('is_active', true)
      : { data: [], error: null };
    if (error || !products || products.length !== productIds.length) return NextResponse.json({ error: 'One or more gifts are no longer available.' }, { status: 409 });

    const lines = input.items.map((item) => {
      if (item.hamper) {
        if (Math.abs(item.hamper.total - (item.price ?? 0)) > .01) throw new Error('Hamper price mismatch. Please rebuild the hamper.');
        return { id: null, categoryId: null, price: item.hamper.total, mrp: item.hamper.total, quantity: 1, product: { name: item.name ?? 'Custom Hamper', slug: 'custom-hamper', sku: 'CUSTOM-HAMPER' }, personalization: item.personalization ?? {}, hamper: item.hamper };
      }
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product || product.stock < item.quantity) throw new Error(`${product?.name ?? 'Gift'} does not have enough stock.`);
      return { id: product.id, categoryId: product.category_id, price: Number(product.price), mrp: Number(product.mrp), quantity: item.quantity, product, personalization: item.personalization ?? {}, hamper: undefined };
    });

    const baseTotals = calculateTotals(lines.map((line) => ({ id: line.id ?? 'hamper', price: line.price, mrp: line.mrp, quantity: line.quantity })));
    const coupon = input.couponCode?.trim()
      ? await validateCoupon(admin, { code: input.couponCode, paymentMethod: input.paymentMethod, userId: user.id, lines: lines.map((line) => ({ productId: line.id, categoryId: line.categoryId, price: line.price, quantity: line.quantity })) })
      : null;
    const discount = coupon?.discount ?? 0;

    const { data: settingRows } = await admin.from('site_settings').select('key,value').in('key', ['payments', 'shipping']);
    const setting = Object.fromEntries((settingRows ?? []).map((row) => [row.key, row.value as Record<string, unknown>]));
    const payments = setting.payments ?? {};
    const shippingConfig = setting.shipping ?? {};
    if (!Boolean(payments.manualUpiEnabled ?? true)) throw new Error('UPI payment is currently unavailable.');
    const upiId = String(payments.upiId ?? '').trim();
    const payeeName = String(payments.upiPayeeName ?? 'GiftsByRashii').trim();
    if (!isValidUpiId(upiId)) throw new Error('UPI payment is not configured yet. Please contact support or ask the admin to add the UPI ID in Settings.');
    const freeAbove = Number(shippingConfig.freeShippingAbove ?? 999);
    const shippingCharge = baseTotals.subtotal - discount >= freeAbove ? 0 : Number(shippingConfig.standardCharge ?? 99);
    const total = Math.max(0, baseTotals.subtotal - discount + shippingCharge);

    const { data: order, error: orderError } = await admin.from('orders').insert({ user_id: user.id, address_snapshot: input.address, status: 'payment_pending', payment_status: 'pending', payment_method: 'manual_upi', subtotal: baseTotals.subtotal, discount, shipping: shippingCharge, cod_surcharge: 0, total, coupon_code: coupon?.code ?? null, preferred_delivery_date: input.deliveryDate }).select('id,order_number').single();
    if (orderError) throw orderError;
    const { error: itemError } = await admin.from('order_items').insert(lines.map((line) => ({ order_id: order.id, product_id: line.id, product_snapshot: { name: line.product.name, slug: line.product.slug, sku: line.product.sku }, quantity: line.quantity, unit_price: line.price, mrp: line.mrp, personalization: line.personalization, hamper_configuration: line.hamper ?? null })));
    if (itemError) throw itemError;

    const gatewayMetadata = { orderNumber: order.order_number, upiId, payeeName, createdAt: new Date().toISOString() };
    const { error: paymentError } = await admin.from('payments').insert({ order_id: order.id, gateway: 'manual_upi', status: 'pending', method: 'upi', amount: total, gateway_metadata: gatewayMetadata });
    if (paymentError) throw paymentError;
    await admin.from('order_status_history').insert({ order_id: order.id, status: 'payment_pending', note: 'Waiting for UPI payment and UTR submission' });
    const upiUri = buildUpiPaymentUri({ upiId, payeeName, amount: total, orderNumber: order.order_number });
    return NextResponse.json({ orderNumber: order.order_number, orderId: order.id, amount: total, currency: 'INR', upiId, payeeName, upiUri, totals: { subtotal: baseTotals.subtotal, discount, shipping: shippingCharge, codSurcharge: 0, total } });
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Invalid checkout details.' : error instanceof Error ? error.message : 'Checkout failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
