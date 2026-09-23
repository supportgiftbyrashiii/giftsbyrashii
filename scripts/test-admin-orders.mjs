import assert from 'node:assert/strict';
const { parseOrderFilters, normalizeOrderContact } = await import('../lib/admin-orders.ts');

assert.deepEqual(parseOrderFilters(new URLSearchParams('q=GM-123&status=processing&payment=authorized&from=2026-09-01&to=2026-09-23')), {
  q: 'GM-123', status: 'processing', payment: 'authorized', from: '2026-09-01', to: '2026-09-23',
});
assert.deepEqual(normalizeOrderContact({ profiles: null }), { name: 'Customer', email: 'No email', mobile: 'No mobile' });
assert.deepEqual(normalizeOrderContact({ profiles: { full_name: 'Rashii', email: 'hi@example.com', mobile: '9999999999' } }), { name: 'Rashii', email: 'hi@example.com', mobile: '9999999999' });

console.log('admin orders fixture passed');
