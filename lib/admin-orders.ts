export type OrderFilters = { q: string; status: string; payment: string; from: string; to: string };

export function parseOrderFilters(params: URLSearchParams): OrderFilters {
  return {
    q: (params.get('q') ?? '').trim(),
    status: (params.get('status') ?? '').trim(),
    payment: (params.get('payment') ?? '').trim(),
    from: (params.get('from') ?? '').trim(),
    to: (params.get('to') ?? '').trim(),
  };
}

export function normalizeOrderContact(row: { profiles?: { full_name?: string | null; email?: string | null; mobile?: string | null } | null }) {
  return {
    name: row.profiles?.full_name || 'Customer',
    email: row.profiles?.email || 'No email',
    mobile: row.profiles?.mobile || 'No mobile',
  };
}
