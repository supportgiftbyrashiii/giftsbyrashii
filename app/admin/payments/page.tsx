import { CreditCard, ShieldCheck } from 'lucide-react';
import { AdminPaymentQueue, type AdminPaymentQueueRow } from '@/components/admin-payment-queue';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type Metadata = Record<string, unknown>;

export default async function PaymentsPage() {
  await requireAdmin();
  const client = createAdminClient();
  if (!client) return <div className="admin-page"><p className="form-notice">Supabase service role is not configured.</p></div>;
  const { data, error } = await client.from('payments').select('id,order_id,status,amount,method,gateway_metadata,created_at,updated_at,orders(order_number,status,payment_status,profiles(full_name,email,mobile))').eq('gateway', 'manual_upi').order('created_at', { ascending: false }).limit(300);
  const rows = ((data ?? []) as unknown as Array<Record<string, unknown>>).map((payment): AdminPaymentQueueRow | null => {
    const metadata = (payment.gateway_metadata ?? {}) as Metadata;
    const order = (payment.orders ?? {}) as Record<string, unknown>;
    const profile = (order.profiles ?? {}) as Record<string, unknown>;
    const utr = typeof metadata.utrNumber === 'string' ? metadata.utrNumber : '';
    if (!utr) return null;
    return { id: String(payment.id), orderId: String(payment.order_id), orderNumber: String(order.order_number ?? 'Order'), orderStatus: String(order.status ?? 'pending'), paymentStatus: String(payment.status ?? 'pending'), amount: Number(payment.amount ?? 0), utr, submittedAt: String(metadata.submittedAt ?? payment.created_at), customerName: String(profile.full_name ?? 'Customer'), email: String(profile.email ?? 'No email'), mobile: String(profile.mobile ?? 'No mobile') };
  }).filter((row): row is AdminPaymentQueueRow => Boolean(row));
  const pending = rows.filter((row) => row.paymentStatus === 'authorized');
  const reviewed = rows.filter((row) => row.paymentStatus !== 'authorized');
  return <div className="admin-page">
    <div className="admin-title"><div><span>PAYMENT CONTROL</span><h1>UPI verification</h1><p>Review UTRs before a manual payment becomes captured revenue.</p></div><span className="admin-live-chip"><ShieldCheck />{pending.length} waiting</span></div>
    {error && <p className="form-notice">Payment queue could not load: {error.message}</p>}
    <div className="admin-payment-summary"><article><CreditCard /><span><small>Waiting for review</small><b>{pending.length}</b></span></article><article><ShieldCheck /><span><small>UTRs in history</small><b>{reviewed.length}</b></span></article><article><span className="admin-summary-dot" /><span><small>Rule</small><b>Capture only after checking bank/UPI</b></span></article></div>
    <AdminPaymentQueue rows={[...pending, ...reviewed]} />
  </div>;
}
