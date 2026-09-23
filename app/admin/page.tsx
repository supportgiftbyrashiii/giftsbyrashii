import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Gift, IndianRupee, Package, ShieldCheck, ShoppingBag, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminDashboardSummary } from '@/lib/admin-dashboard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin dashboard' };

export default async function Page() {
  await requireAdmin();
  const client = createAdminClient();
  if (!client) return <div className="admin-page"><p className="form-notice">Supabase service role is not configured.</p></div>;

  const [summary, latest] = await Promise.all([
    getAdminDashboardSummary(client),
    client.from('orders').select('id,order_number,status,payment_status,total,created_at').order('created_at', { ascending: false }).limit(6),
  ]);

  return <div className="admin-page">
    <div className="admin-title">
      <div><span>LIVE OVERVIEW</span><h1>Good day, GiftsByRashii</h1><p>Real catalog, customers, payments and fulfilment data.</p></div>
      <Link href="/admin/products/new" className="button button-primary">+ Add product</Link>
    </div>
    {summary.error && <div className="admin-alert admin-alert-error"><AlertTriangle /><span><b>Some dashboard data could not be loaded.</b><small>{summary.error}</small></span><Link href="/admin">Refresh</Link></div>}
    {latest.error && <p className="form-notice">Latest orders could not be loaded: {latest.error.message}</p>}
    <div className="admin-metrics">
      <article><span><IndianRupee /></span><div><small>Revenue today</small><b>₹{summary.revenueToday.toLocaleString('en-IN')}</b><em>{summary.capturedOrdersToday} captured orders</em></div></article>
      <article><span><Package /></span><div><small>This month</small><b>₹{summary.revenueMonth.toLocaleString('en-IN')}</b><em>{summary.capturedOrdersMonth} captured orders</em></div></article>
      <article><span><Gift /></span><div><small>Products</small><b>{summary.products}</b><em>{summary.lowStock} low stock</em></div></article>
      <article><span><Users /></span><div><small>Customers</small><b>{summary.customers}</b><em>Registered profiles</em></div></article>
    </div>
    <div className="admin-ops-grid">
      <Link href="/admin/payments" className="admin-ops-card admin-ops-card-warm"><span><ShieldCheck /></span><div><b>{summary.pendingUtr} UTR payments waiting</b><small>Review submitted UTRs and capture verified payments.</small></div><strong>Review →</strong></Link>
      <Link href="/admin/orders" className="admin-ops-card"><span><ShoppingBag /></span><div><b>{summary.pendingOrders} orders to process</b><small>Keep payment and fulfilment timelines updated.</small></div><strong>Open queue →</strong></Link>
    </div>
    <div className="admin-grid">
      <section className="admin-card latest-orders"><div><h2>Latest orders</h2><Link href="/admin/orders">View all →</Link></div>{latest.data?.length ? latest.data.map((order) => <Link href={`/admin/orders/${order.id}`} key={order.id}><span><b>{order.order_number}</b><small>{new Date(order.created_at).toLocaleString('en-IN')}</small></span><span className="status-pill">{order.status}</span><b>₹{Number(order.total).toLocaleString('en-IN')}</b></Link>) : <p className="admin-empty">No orders yet.</p>}</section>
      <aside className="admin-card"><h2>Attention</h2><article className="attention"><AlertTriangle /><span><b>{summary.lowStock} low-stock products</b><small>Review inventory before they sell out.</small></span><Link href="/admin/inventory">→</Link></article><article className="attention"><CheckCircle2 /><span><b>{summary.pendingUtr} UTR checks waiting</b><small>Revenue starts after payment verification.</small></span><Link href="/admin/payments">→</Link></article></aside>
    </div>
  </div>;
}
