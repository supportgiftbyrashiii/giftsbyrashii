type PaymentRow = { status: string; gateway_metadata: Record<string, unknown> | null };
type OrderRow = { status: string; payment_status: string };

export type PaymentDecision = {
  action: 'capture' | 'reject';
  payment: PaymentRow;
  order: OrderRow;
  note?: string;
  now?: string;
};

const fulfilmentStatuses = new Set(['confirmed', 'processing', 'personalized', 'packed', 'shipped', 'out_for_delivery', 'delivered']);

export function buildPaymentDecision(input: PaymentDecision) {
  const metadata = { ...(input.payment.gateway_metadata ?? {}) };
  if (input.action === 'capture' && input.payment.status === 'captured') return { idempotent: true as const };
  if (input.action === 'reject' && input.payment.status === 'failed') return { idempotent: true as const };
  if (input.payment.status !== 'authorized') throw new Error('Only an authorized UTR can be reviewed.');
  if (typeof metadata.utrNumber !== 'string' || metadata.utrNumber.length < 6) throw new Error('This payment has no submitted UTR.');
  const timestamp = input.now ?? new Date().toISOString();
  const note = input.note?.trim() || (input.action === 'capture' ? 'UTR verified by admin' : 'UTR rejected by admin');
  if (input.action === 'capture') {
    metadata.verifiedAt = timestamp;
    metadata.verificationNote = note;
    metadata.rejectedAt = null;
    return {
      payment: { status: 'captured', signature_verified: true, gateway_metadata: metadata },
      order: { payment_status: 'captured', status: fulfilmentStatuses.has(input.order.status) ? input.order.status : 'paid' },
      historyStatus: 'paid',
      metadata,
    };
  }
  metadata.rejectedAt = timestamp;
  metadata.verificationNote = note;
  metadata.verifiedAt = null;
  return {
    payment: { status: 'failed', signature_verified: false, gateway_metadata: metadata },
    order: { payment_status: 'pending', status: 'payment_pending' },
    historyStatus: 'payment_pending',
    metadata,
  };
}
