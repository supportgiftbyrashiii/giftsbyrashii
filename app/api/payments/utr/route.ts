import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { paymentMetadata } from '@/lib/upi';

const schema = z.object({
  orderId: z.string().uuid(),
  utr: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6,24}$/),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const supabase = await createClient();
    const admin = createAdminClient();
    if (!supabase || !admin) return NextResponse.json({ error: 'Payment service unavailable.' }, { status: 503 });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Please sign in to submit payment details.' }, { status: 401 });
    const { data: order } = await admin.from('orders').select('id,user_id,status,payment_status').eq('id', input.orderId).eq('user_id', user.id).maybeSingle();
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    const { data: payment } = await admin.from('payments').select('id,status,gateway_metadata').eq('order_id', order.id).eq('gateway', 'manual_upi').maybeSingle();
    if (!payment) return NextResponse.json({ error: 'UPI payment record not found.' }, { status: 404 });
    if (payment.status === 'captured') return NextResponse.json({ ok: true, idempotent: true });
    if (['refunded', 'partially_refunded'].includes(payment.status)) return NextResponse.json({ error: 'This payment can no longer be updated.' }, { status: 409 });
    const { data: duplicate } = await admin.from('payments').select('id').contains('gateway_metadata', { utrNumber: input.utr }).neq('id', payment.id).limit(1).maybeSingle();
    if (duplicate) return NextResponse.json({ error: 'This UTR is already attached to another order.' }, { status: 409 });
    const metadata = paymentMetadata(payment.gateway_metadata);
    const submittedAt = new Date().toISOString();
    const { error: paymentError } = await admin.from('payments').update({ status: 'authorized', gateway_metadata: { ...metadata, utrNumber: input.utr, submittedAt, rejectedAt: null, verificationNote: null } }).eq('id', payment.id);
    if (paymentError) throw paymentError;
    await admin.from('orders').update({ payment_status: 'authorized', status: 'payment_pending' }).eq('id', order.id);
    await admin.from('order_status_history').insert({ order_id: order.id, status: 'payment_pending', note: 'UPI UTR submitted; payment verification pending' });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Enter a valid 6–24 character UTR.' : error instanceof Error ? error.message : 'UTR submission failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
