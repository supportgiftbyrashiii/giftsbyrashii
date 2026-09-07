import Link from 'next/link';
import { BadgePercent, ChevronDown, CircleHelp, CreditCard, Gift, House, Image, LayoutDashboard, LogOut, Mail, Megaphone, Menu, MessageSquare, Package, Settings, ShoppingBag, Star, Tags, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const groups = [
  ['Store', [
    ['Products', '/admin/products', Gift], ['Categories', '/admin/categories', Tags], ['Inventory', '/admin/inventory', Package], ['Orders', '/admin/orders', ShoppingBag], ['Payments', '/admin/payments', CreditCard], ['Customers', '/admin/customers', Users], ['Coupons & offers', '/admin/coupons', BadgePercent], ['Reviews', '/admin/reviews', Star],
  ]],
  ['Website', [
    ['Homepage', '/admin/homepage', House], ['Sliders & banners', '/admin/banners', Image], ['Announcement bar', '/admin/announcements', Megaphone], ['Pages & policies', '/admin/pages', MessageSquare], ['FAQs', '/admin/faqs', CircleHelp],
  ]],
  ['Leads & forms', [
    ['Contact messages', '/admin/contact-submissions', MessageSquare], ['Corporate enquiries', '/admin/corporate', Users], ['Newsletter', '/admin/newsletter', Mail],
  ]],
  ['Configuration', [['Store settings', '/admin/settings', Settings]]],
];

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return <div className="admin-shell"><aside className="admin-sidebar"><Link href="/admin" className="admin-brand"><span><Gift /></span>GiftsByRashii<small>ADMIN</small></Link><nav><Link href="/admin"><LayoutDashboard />Dashboard</Link>{groups.map(([group, items]) => <div key={String(group)}><small>{String(group)}</small>{(items as [string, string, typeof Gift][]).map(([label, url, Icon]) => <Link href={url} key={url}><Icon />{label}</Link>)}</div>)}</nav><div className="admin-user"><span>{(user.email ?? 'A')[0].toUpperCase()}</span><div><b>{user.email}</b><small>Administrator</small></div><form action="/api/auth/logout" method="post"><button aria-label="Sign out"><LogOut /></button></form></div></aside><main className="admin-main"><header><button aria-label="Open navigation"><Menu /></button><div>GiftsByRashii Control Room <ChevronDown /></div><span>Live storefront</span></header>{children}</main></div>;
}
