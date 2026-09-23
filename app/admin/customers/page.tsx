import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { summarizeCustomerOrders } from '@/lib/admin-customers';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return <div className="admin-page"><p className="form-notice">Supabase service role is not configured.</p></div>;

  const [{ data: authData, error: authError }, { data: profiles }, { data: orders }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from('profiles').select('id,full_name,mobile,email,created_at'),
    admin.from('orders').select('user_id,total,status'),
  ]);
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const ordersByUser = new Map<string, Array<{ total: number | string | null; status: string }>>();
  for (const order of orders ?? []) {
    ordersByUser.set(order.user_id, [...(ordersByUser.get(order.user_id) ?? []), { total: order.total, status: order.status }]);
  }
  const users = authData?.users ?? [];

  return <div className="admin-page">
    <div className="admin-title"><div><span>AUTH + COMMERCE</span><h1>Customers</h1><p>Registered accounts joined with profiles and order history.</p></div></div>
    {authError && <p className="form-notice">{authError.message}</p>}
    <section className="admin-card customer-table">
      <div className="customer-table-head"><span>Customer</span><span>Contact</span><span>Joined / last sign-in</span><span>Orders</span><span>Status</span></div>
      {users.length ? users.map((user) => {
        const profile = profileById.get(user.id);
        const metadata = user.user_metadata ?? {};
        const name = profile?.full_name || String(metadata.full_name ?? user.email?.split('@')[0] ?? 'Customer');
        const mobile = profile?.mobile || String(metadata.mobile ?? user.phone ?? '—');
        const stats = summarizeCustomerOrders(ordersByUser.get(user.id));
        return <article key={user.id}>
          <span><Link className="admin-customer-link" href={`/admin/customers/${user.id}`}><b>{name}</b><ArrowUpRight /></Link><small>{user.id.slice(0, 18)}</small></span>
          <span><b>{profile?.email || user.email || 'No email'}</b><small>{mobile}</small></span>
          <span><b>{new Date(user.created_at).toLocaleDateString('en-IN')}</b><small>{user.last_sign_in_at ? `Last login ${new Date(user.last_sign_in_at).toLocaleString('en-IN')}` : 'Never signed in'}</small></span>
          <span><b>{stats.count} orders</b><small>₹{stats.spend.toLocaleString('en-IN')}</small></span>
          <em className={user.email_confirmed_at || user.phone_confirmed_at ? 'live' : ''}>{user.email_confirmed_at || user.phone_confirmed_at ? 'Verified' : 'Pending'}</em>
        </article>;
      }) : <p className="admin-empty">No registered customers yet.</p>}
    </section>
  </div>;
}
