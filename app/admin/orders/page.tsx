import Link from 'next/link';
import { Filter, Search, SlidersHorizontal } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeOrderContact, parseOrderFilters } from '@/lib/admin-orders';

export const dynamic = 'force-dynamic';

const statuses = ['pending', 'payment_pending', 'paid', 'confirmed', 'processing', 'personalized', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned', 'refund_pending', 'refunded'];
const paymentStatuses = ['pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'];

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const client = createAdminClient();
  if (!client) return <div className="admin-page"><p className="form-notice">Supabase service role is not configured.</p></div>;
  const rawParams = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) if (typeof value === 'string') params.set(key, value);
  const filters = parseOrderFilters(params);
  let query = client.from('orders').select('id,order_number,status,payment_status,payment_method,total,created_at,profiles(full_name,email,mobile)', { count: 'exact' }).order('created_at', { ascending: false });
  if (filters.q) query = query.ilike('order_number', `%${filters.q.replace(/[%_,]/g, '')}%`);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.payment) query = query.eq('payment_status', filters.payment);
  if (filters.from) query = query.gte('created_at', new Date(`${filters.from}T00:00:00+05:30`).toISOString());
  if (filters.to) { const end = new Date(`${filters.to}T00:00:00+05:30`); query = query.lt('created_at', new Date(end.getTime() + 86400000).toISOString()); }
  const { data, error, count } = await query;
  return <div className="admin-page">
    <div className="admin-title"><div><span>FULFILMENT</span><h1>Orders</h1><p>Payment, personalisation and delivery state in one queue.</p></div><span className="admin-list-count">{count ?? data?.length ?? 0} orders</span></div>
    <form className="admin-order-filters" method="get"><label><Search /><input name="q" defaultValue={filters.q} placeholder="Search order number" /></label><label><SlidersHorizontal /><select name="status" defaultValue={filters.status}><option value="">All fulfilment</option>{statuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></label><label><Filter /><select name="payment" defaultValue={filters.payment}><option value="">All payments</option>{paymentStatuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></label><label><span>From</span><input name="from" type="date" defaultValue={filters.from} /></label><label><span>To</span><input name="to" type="date" defaultValue={filters.to} /></label><button className="button button-primary" type="submit">Apply</button><Link className="button button-soft" href="/admin/orders">Clear</Link></form>
    {error && <p className="form-notice">Orders could not load: {error.message}</p>}
    <section className="admin-card admin-table orders-table"><div className="table-head"><span>Order</span><span>Customer</span><span>Payment</span><span>Fulfilment</span><span>Total</span></div>{data?.length ? data.map((order) => { const contact = normalizeOrderContact({ profiles: order.profiles as unknown as { full_name?: string | null; email?: string | null; mobile?: string | null } | null }); return <Link href={`/admin/orders/${order.id}`} key={order.id}><span><b>{order.order_number}</b><small>{new Date(order.created_at).toLocaleString('en-IN')}</small></span><span className="order-customer-cell"><b>{contact.name}</b><small>{contact.mobile}</small></span><span><b>{order.payment_status}</b><small>{order.payment_method ?? 'Manual UPI'}</small></span><span className="status-pill">{order.status}</span><b>₹{Number(order.total).toLocaleString('en-IN')}</b></Link>; }) : <p className="admin-empty">No orders match these filters.</p>}</section>
  </div>;
}
