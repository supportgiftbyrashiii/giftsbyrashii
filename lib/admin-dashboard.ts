import type { SupabaseClient } from '@supabase/supabase-js';

type CapturedOrder = {
  total: number | string | null;
  payment_status: string | null;
  created_at: string;
};

export type AdminDashboardSummary = {
  revenueToday: number;
  revenueMonth: number;
  capturedOrdersToday: number;
  capturedOrdersMonth: number;
  pendingUtr: number;
  pendingOrders: number;
  customers: number;
  products: number;
  lowStock: number;
  error?: string;
};

export function getIndiaPeriodBounds(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
  const todayStart = new Date(Date.UTC(values.year, values.month - 1, values.day) - 330 * 60 * 1000);
  return { todayStart, monthStart: new Date(Date.UTC(values.year, values.month - 1, 1) - 330 * 60 * 1000) };
}

export function summarizeCapturedOrders(rows: CapturedOrder[] | null | undefined, start?: Date, end = new Date()) {
  const filtered = (rows ?? []).filter((row) => {
    const created = new Date(row.created_at).getTime();
    return row.payment_status === 'captured' && (!start || created >= start.getTime()) && created < end.getTime();
  });
  return { revenue: filtered.reduce((sum, row) => sum + Number(row.total ?? 0), 0), orders: filtered.length };
}

function errorMessage(errors: { error: { message?: string } | null }[]) {
  return errors.find((result) => result.error)?.error?.message ?? '';
}

export async function getAdminDashboardSummary(client: SupabaseClient, now = new Date()): Promise<AdminDashboardSummary> {
  const { todayStart, monthStart } = getIndiaPeriodBounds(now);
  const [today, month, pendingUtr, pendingOrders, customers, products, inventory] = await Promise.all([
    client.from('orders').select('total,payment_status,created_at').gte('created_at', todayStart.toISOString()).eq('payment_status', 'captured'),
    client.from('orders').select('total,payment_status,created_at').gte('created_at', monthStart.toISOString()).eq('payment_status', 'captured'),
    client.from('payments').select('id,gateway,status,gateway_metadata').eq('gateway', 'manual_upi').eq('status', 'authorized').limit(5000),
    client.from('orders').select('id', { count: 'exact', head: true }).in('status', ['paid', 'confirmed', 'processing', 'personalized', 'packed']),
    client.from('profiles').select('id', { count: 'exact', head: true }),
    client.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    client.from('products').select('stock,low_stock_threshold').eq('is_active', true).limit(5000),
  ]);
  const errors = [today, month, pendingUtr, pendingOrders, customers, products, inventory];
  const firstError = errorMessage(errors);
  const todaySummary = summarizeCapturedOrders(today.data as CapturedOrder[] | null, todayStart, now);
  const monthSummary = summarizeCapturedOrders(month.data as CapturedOrder[] | null, monthStart, now);
  const pendingUtrCount = (pendingUtr.data ?? []).filter((payment) => {
    const metadata = payment.gateway_metadata as Record<string, unknown> | null;
    return typeof metadata?.utrNumber === 'string' && metadata.utrNumber.length > 0;
  }).length;
  return {
    revenueToday: todaySummary.revenue,
    revenueMonth: monthSummary.revenue,
    capturedOrdersToday: todaySummary.orders,
    capturedOrdersMonth: monthSummary.orders,
    pendingUtr: pendingUtrCount,
    pendingOrders: pendingOrders.count ?? 0,
    customers: customers.count ?? 0,
    products: products.count ?? 0,
    lowStock: (inventory.data ?? []).filter((product) => Number(product.stock) <= Number(product.low_stock_threshold)).length,
    ...(firstError ? { error: firstError } : {}),
  };
}
