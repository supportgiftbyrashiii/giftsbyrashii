import assert from 'node:assert/strict';
const { summarizeCustomerOrders, normalizeCustomerAddress } = await import('../lib/admin-customers.ts');

assert.deepEqual(summarizeCustomerOrders([
  { total: 1000, status: 'paid' },
  { total: 500, status: 'cancelled' },
  { total: 250, status: 'delivered' },
]), { count: 2, spend: 1250 });
assert.deepEqual(normalizeCustomerAddress({ name: 'Rashii', line1: '12 Rose Lane', city: 'Jaipur', state: 'Rajasthan', postal_code: '302001' }), {
  recipient: 'Rashii', line: '12 Rose Lane', location: 'Jaipur, Rajasthan, 302001', mobile: 'No mobile',
});

console.log('admin customers fixture passed');
