import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { buildPaymentDecision } from '@/lib/admin-payments';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({
  paymentId: z.string().uuid(),
  action: z.enum(['capture', 'reject']),
  note: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const { admin } = await requireAdmin();
    const input = schema.parse(await request.json());
    const client = createAdminClient();
    if (!client) return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 });

    const { data: payment, error: paymentError } = await client.from('payments').select('id,order_id,gateway,status,signature_verified,gateway_metadata').eq('id', input.paymentId).maybeSingle();
    if (paymentError) throw paymentError;
    if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    if (payment.gateway !== 'manual_upi') return NextResponse.json({ error: 'Only manual UPI payments can be reviewed here.' }, { status: 409 });
    const { data: order, error: orderError } = await client.from('orders').select('id,order_number,status,payment_status').eq('id', payment.order_id).maybeSingle();
    if (orderError) throw orderError;
    if (!order) return NextResponse.json({ error: 'Related order not found.' }, { status: 404 });

    const decision = buildPaymentDecision({ action: input.action, payment, order, note: input.note });
    if ('idempotent' in decision) return NextResponse.json({ ok: true, idempotent: true });

    const { error: updatePaymentError } = await client.from('payments').update({ ...decision.payment }).eq('id', payment.id).eq('status', 'authorized');
    if (updatePaymentError) throw updatePaymentError;
    const { error: updateOrderError } = await client.from('orders').update(decision.order).eq('id', order.id);
    if (updateOrderError) throw updateOrderError;
    const { error: historyError } = await client.from('order_status_history').insert({ order_id: order.id, status: decision.historyStatus, note: input.note?.trim() || (input.action === 'capture' ? 'UPI UTR verified and payment captured' : 'UPI UTR rejected; payment can be resubmitted'), created_by: admin.user_id });
    if (historyError) throw historyError;
    const { error: auditError } = await client.from('audit_logs').insert({ admin_user_id: admin.id, action: `payment.${input.action}`, entity_type: 'payment', entity_id: payment.id, metadata: { orderId: order.id, orderNumber: order.order_number, utrNumber: decision.metadata.utrNumber, note: decision.metadata.verificationNote } });
    if (auditError) throw auditError;
    revalidatePath('/admin');
    revalidatePath('/admin/payments');
    revalidatePath(`/admin/orders/${order.id}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Invalid payment action.' : error instanceof Error ? error.message : 'Payment update failed.';
    const status = error instanceof z.ZodError ? 400 : message.includes('not found') ? 404 : message.includes('Only') || message.includes('authorized') ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
