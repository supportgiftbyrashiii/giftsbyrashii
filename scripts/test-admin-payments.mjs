import assert from 'node:assert/strict';
const { buildPaymentDecision } = await import('../lib/admin-payments.ts');

const captured = buildPaymentDecision({
  action: 'capture',
  payment: { status: 'authorized', gateway_metadata: { utrNumber: 'ABC123456' } },
  order: { status: 'payment_pending', payment_status: 'authorized' },
  note: 'Matched in bank statement',
  now: '2026-09-23T10:00:00.000Z',
});
assert.equal(captured.payment.status, 'captured');
assert.equal(captured.order.payment_status, 'captured');
assert.equal(captured.order.status, 'paid');
assert.equal(captured.metadata.verificationNote, 'Matched in bank statement');

const rejected = buildPaymentDecision({
  action: 'reject',
  payment: { status: 'authorized', gateway_metadata: { utrNumber: 'ABC123456' } },
  order: { status: 'payment_pending', payment_status: 'authorized' },
  note: 'UTR does not match amount',
  now: '2026-09-23T10:00:00.000Z',
});
assert.equal(rejected.payment.status, 'failed');
assert.equal(rejected.order.status, 'payment_pending');
assert.equal(rejected.order.payment_status, 'pending');

const idempotent = buildPaymentDecision({
  action: 'capture',
  payment: { status: 'captured', gateway_metadata: { utrNumber: 'ABC123456' } },
  order: { status: 'paid', payment_status: 'captured' },
  note: '',
  now: '2026-09-23T10:00:00.000Z',
});
assert.equal(idempotent.idempotent, true);

console.log('admin payment fixture passed');
