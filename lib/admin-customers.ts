export function summarizeCustomerOrders(rows: Array<{ total: number | string | null; status: string }> | null | undefined) {
  return (rows ?? []).filter((row) => row.status !== 'cancelled' && row.status !== 'refunded').reduce((summary, row) => ({ count: summary.count + 1, spend: summary.spend + Number(row.total ?? 0) }), { count: 0, spend: 0 });
}

export function normalizeCustomerAddress(address: Record<string, unknown> | null | undefined) {
  const row = address ?? {};
  const text = (...keys: string[]) => { const key = keys.find((candidate) => row[candidate]); return key ? String(row[key]) : ''; };
  return { recipient: text('name') || 'Address', line: [text('line1', 'address_line_1'), text('line2', 'address_line_2')].filter(Boolean).join(', ') || 'No address line', location: [text('city'), text('state'), text('postal_code', 'postalCode')].filter(Boolean).join(', ') || 'No location', mobile: text('mobile', 'phone') || 'No mobile' };
}
