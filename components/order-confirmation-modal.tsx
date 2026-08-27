'use client';

import Link from 'next/link';
import { Check, Gift, PackageSearch, ShoppingBag, Sparkles, X } from 'lucide-react';

export function OrderConfirmationModal({ orderNumber, orderId, paymentPending = false, onClose }: { orderNumber: string; orderId: string; paymentPending?: boolean; onClose: () => void }) {
  return <div className="order-confirmation-backdrop" role="dialog" aria-modal="true" aria-labelledby="order-confirmation-title">
    <section className="order-confirmation-modal">
      <button className="modal-close" onClick={onClose} aria-label="Close confirmation"><X /></button>
      <div className="celebration-mark"><span><Gift /></span><i><Sparkles /></i><b><Check /></b></div>
      <span className="eyebrow">{paymentPending ? 'PAYMENT SUBMITTED' : 'ORDER CONFIRMED'}</span>
      <h2 id="order-confirmation-title">{paymentPending ? 'Your UTR is with us for a quick payment check.' : 'Your gift is officially on its way to becoming a happy memory.'}</h2>
      <p>{paymentPending ? <>We’ve received the payment details for <strong>{orderNumber}</strong>. Your order will move forward after admin verification.</> : <>We’ve received <strong>{orderNumber}</strong>. You can follow every packing and delivery update from your account.</>}</p>
      <div className="confirmation-steps"><span className="done"><i><Check /></i><b>{paymentPending ? 'UTR submitted' : 'Confirmed'}</b></span><em></em><span><i>2</i><b>{paymentPending ? 'Payment verified' : 'Beautifully packed'}</b></span><em></em><span><i>3</i><b>{paymentPending ? 'Order processing' : 'Delivered'}</b></span></div>
      <div className="confirmation-actions"><Link href={`/account/orders/${orderId}`} className="button button-primary"><PackageSearch />Track this order</Link><Link href="/shop" className="button button-soft"><ShoppingBag />Continue shopping</Link></div>
    </section>
  </div>;
}
