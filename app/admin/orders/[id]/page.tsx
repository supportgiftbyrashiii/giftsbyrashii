import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock3, CreditCard, MapPin, UserRound } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AdminOrderActions } from '@/components/admin-order-actions';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

type Details = Record<string, unknown>;

function label(key: string) { return key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function detailText(details: Details | null | undefined) { return Object.entries(details ?? {}).filter(([, value]) => value !== null && value !== undefined && value !== '').map(([key, value]) => `${label(key)}: ${String(value)}`).join(' · '); }
function Address({ value }: { value: Details | null }) {
  const address = value ?? {};
  const get = (...keys: string[]) => { const key = keys.find((candidate) => address[candidate]); return key ? String(address[key]) : ''; };
  const location = [get('city'), get('state'), get('postalCode', 'postal_code')].filter(Boolean).join(', ');
  return <address className="admin-order-address">{get('name') && <strong>{get('name')}</strong>}{get('line1', 'address_line_1') && <span>{get('line1', 'address_line_1')}</span>}{get('line2', 'address_line_2') && <span>{get('line2', 'address_line_2')}</span>}{get('landmark') && <span>Near {get('landmark')}</span>}{location && <span>{location}</span>}{get('mobile', 'phone') && <span>Phone: {get('mobile', 'phone')}</span>}</address>;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const client = createAdminClient();
  if (!client) return <div className="admin-page"><p className="form-notice">Supabase service role is not configured.</p></div>;
  const { data, error } = await client.from('orders').select('*,profiles(full_name,email,mobile),order_items(*),payments(*),order_status_history(*)').eq('id', id).maybeSingle();
  if (error || !data) notFound();
  const profile = (data.profiles ?? {}) as Details;
  const payments = (data.payments ?? []) as Array<Details>;
  const history = [...((data.order_status_history ?? []) as Array<Details>)].sort((a, b) => new Date(String(a.created_at)).getTime() - new Date(String(b.created_at)).getTime());
  return <div className="admin-page">
    <div className="admin-title"><div><Link className="admin-back-link" href="/admin/orders"><ArrowLeft /> Orders</Link><span>{data.order_number}</span><h1>Order details</h1><p>Placed {new Date(data.created_at).toLocaleString('en-IN')} · Last updated {new Date(data.updated_at ?? data.created_at).toLocaleString('en-IN')}</p></div><span className="status-pill">{data.status}</span></div>
    <div className="admin-detail-grid">
      <section className="admin-card admin-detail-card"><div className="card-heading"><UserRound /><div><small>CUSTOMER</small><h2>{String(profile.full_name ?? 'Customer')}</h2></div></div><div className="admin-contact-grid"><span><small>Email</small><b>{String(profile.email ?? 'No email')}</b></span><span><small>Mobile</small><b>{String(profile.mobile ?? 'No mobile')}</b></span></div></section>
      <section className="admin-card admin-detail-card"><div className="card-heading"><MapPin /><div><small>DELIVERY</small><h2>Address snapshot</h2></div></div><Address value={data.address_snapshot as Details | null} /></section>
    </div>
    <div className="admin-grid order-admin">
      <section className="admin-card"><div className="card-heading"><CheckCircle2 /><div><small>FULFILMENT</small><h2>Gift items</h2></div></div>{(data.order_items as Array<Details>).map((item) => { const snapshot = (item.product_snapshot ?? {}) as Details; const personalisation = detailText(item.personalization as Details | null); return <article className="order-item-row" key={String(item.id)}><span><b>{String(snapshot.name ?? 'Gift item')}</b><small>Qty {String(item.quantity)}{personalisation ? ` · ${personalisation}` : ''}</small></span><b>₹{(Number(item.unit_price) * Number(item.quantity)).toLocaleString('en-IN')}</b></article>; })}</section>
      <aside className="admin-card"><div className="card-heading"><CreditCard /><div><small>AMOUNT</small><h2>Order summary</h2></div></div><p><span>Subtotal</span><b>₹{Number(data.subtotal).toLocaleString('en-IN')}</b></p><p><span>Shipping</span><b>₹{Number(data.shipping).toLocaleString('en-IN')}</b></p><p><span>COD fee</span><b>₹{Number(data.cod_surcharge).toLocaleString('en-IN')}</b></p><p><span>Discount</span><b>−₹{Number(data.discount).toLocaleString('en-IN')}</b></p><p className="total"><span>Total</span><b>₹{Number(data.total).toLocaleString('en-IN')}</b></p></aside>
    </div>
    <section className="admin-card admin-payment-detail"><div className="card-heading"><CreditCard /><div><small>PAYMENT</small><h2>Payment records & UTR</h2></div></div>{payments.length ? payments.map((payment) => { const meta = (payment.gateway_metadata ?? {}) as Details; return <article key={String(payment.id)}><span className={`payment-state payment-state-${String(payment.status)}`}><CreditCard />{String(payment.status)}</span><span><small>Method</small><b>{String(payment.method ?? payment.gateway ?? '—')}</b></span><span><small>Amount</small><b>₹{Number(payment.amount).toLocaleString('en-IN')}</b></span><span><small>UTR</small><b>{String(meta.utrNumber ?? 'Not submitted')}</b></span><span><small>Note</small><b>{String(meta.verificationNote ?? '—')}</b></span></article>; }) : <p className="admin-empty">No payment record attached.</p>}</section>
    <section className="admin-card admin-timeline"><div className="card-heading"><Clock3 /><div><small>ACTIVITY</small><h2>Order timeline</h2></div></div>{history.length ? history.map((event) => <article key={String(event.id)}><span className="timeline-dot" /><div><b>{String(event.status).replaceAll('_', ' ')}</b><small>{String(event.note ?? 'Status updated')}</small></div><time>{new Date(String(event.created_at)).toLocaleString('en-IN')}</time></article>) : <p className="admin-empty">No timeline events yet.</p>}</section>
    <AdminOrderActions orderId={data.id} current={data.status} />
  </div>;
}
