import assert from 'node:assert/strict';
const { getIndiaPeriodBounds, summarizeCapturedOrders } = await import('../lib/admin-dashboard.ts');

const bounds = getIndiaPeriodBounds(new Date('2026-09-23T08:00:00.000Z'));
assert.equal(bounds.todayStart.toISOString(), '2026-09-22T18:30:00.000Z');
assert.equal(bounds.monthStart.toISOString(), '2026-08-31T18:30:00.000Z');

const summary = summarizeCapturedOrders([
  { total: 1299, payment_status: 'authorized', created_at: '2026-09-23T05:00:00.000Z' },
  { total: 999, payment_status: 'captured', created_at: '2026-09-23T06:00:00.000Z' },
]);
assert.deepEqual(summary, { revenue: 999, orders: 1 });

console.log('admin dashboard fixture passed');
