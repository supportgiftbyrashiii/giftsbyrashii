import Link from 'next/link';
import { ArrowLeft, Mail, MapPin, Phone, ShoppingBag, ShieldCheck, UserRound } from 'lucide-react';
import { notFound } from 'next/navigation';
import { normalizeCustomerAddress, summarizeCustomerOrders } from '@/lib/admin-customers';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();
  if (!admin) return <div className="admin-page"><p className="form-notice">Supabase service role is not configured.</p></div>;
  const [{ data: authResult }, { data: profile }, { data: addresses }, { data: orders, error: ordersError }] = await Promise.all([
    admin.auth.admin.getUserById(id),
    admin.from('profiles').select('id,full_name,email,mobile,created_at').eq('id', id).maybeSingle(),
    admin.from('addresses').select('id,name,mobile,alternate_mobile,line1,line2,landmark,city,state,postal_code,country,address_type,is_default').eq('user_id', id).order('is_default', { ascending: false }).order('created_at', { ascending: false }),
    admin.from('orders').select('id,order_number,status,payment_status,total,created_at').eq('user_id', id).order('created_at', { ascending: false }),
  ]);
  if (!authResult?.user && !profile) notFound();
  const user = authResult?.user;
  const email = profile?.email || user?.email || 'No email';
  const mobile = profile?.mobile || user?.phone || 'No mobile';
  const name = profile?.full_name || String(user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Customer');
  const stats = summarizeCustomerOrders(orders);
  return <div className="admin-page">
    <div className="admin-title"><div><Link className="admin-back-link" href="/admin/customers"><ArrowLeft /> Customers</Link><span>CUSTOMER PROFILE</span><h1>{name}</h1><p>Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN') : '—'}</p></div><span className={`admin-verified-chip ${user?.email_confirmed_at || user?.phone_confirmed_at ? 'is-verified' : ''}`}><ShieldCheck />{user?.email_confirmed_at || user?.phone_confirmed_at ? 'Verified account' : 'Verification pending'}</span></div>
    <div className="admin-customer-overview"><article><UserRound /><span><small>Name</small><b>{name}</b></span></article><article><Mail /><span><small>Email</small><b>{email}</b></span></article><article><Phone /><span><small>Mobile</small><b>{mobile}</b></span></article><article><ShoppingBag /><span><small>Lifetime spend</small><b>₹{stats.spend.toLocaleString('en-IN')} · {stats.count} orders</b></span></article></div>
    <div className="admin-grid admin-customer-detail-grid"><section className="admin-card"><div className="card-heading"><MapPin /><div><small>SAVED ADDRESSES</small><h2>{addresses?.length ?? 0} addresses</h2></div></div><div className="admin-address-list">{addresses?.length ? addresses.map((address) => { const normalized = normalizeCustomerAddress(address as Record<string, unknown>); return <article key={address.id} className={address.is_default ? 'is-default' : ''}><span>{address.is_default ? 'Default address' : address.address_type ?? 'Saved address'}</span><b>{normalized.recipient}</b><small>{normalized.line}</small><small>{normalized.location}</small><small>{normalized.mobile}</small></article>; }) : <p className="admin-empty">No saved addresses.</p>}</div></section><section className="admin-card"><div className="card-heading"><ShoppingBag /><div><small>ORDER HISTORY</small><h2>{stats.count} active orders</h2></div></div>{ordersError && <p className="form-notice">Orders could not load: {ordersError.message}</p>}<div className="admin-customer-orders">{orders?.length ? orders.map((order) => <Link href={`/admin/orders/${order.id}`} key={order.id}><span><b>{order.order_number}</b><small>{new Date(order.created_at).toLocaleString('en-IN')}</small></span><span className="status-pill">{order.status}</span><strong>₹{Number(order.total).toLocaleString('en-IN')}</strong></Link>) : <p className="admin-empty">No orders yet.</p>}</div></section></div>
  </div>;
}
