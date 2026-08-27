export type UpiPaymentMetadata = {
  orderNumber?: string;
  upiId?: string;
  payeeName?: string;
  utrNumber?: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  verifiedBy?: string;
  verificationNote?: string;
};

export function paymentMetadata(value: unknown): UpiPaymentMetadata {
  return value && typeof value === 'object' ? value as UpiPaymentMetadata : {};
}

export function isValidUpiId(value: string) {
  return /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(value.trim());
}

export function buildUpiPaymentUri({ upiId, payeeName, amount, orderNumber }: { upiId: string; payeeName: string; amount: number; orderNumber: string }) {
  const query = new URLSearchParams({
    pa: upiId.trim(),
    pn: payeeName.trim() || 'GiftsByRashii',
    am: amount.toFixed(2),
    cu: 'INR',
    tn: `Order ${orderNumber}`,
  });
  return `upi://pay?${query.toString()}`;
}
