'use client';

import Link from 'next/link';
import { CheckCircle2, Copy, Gift, IndianRupee, LoaderCircle, LockKeyhole, QrCode, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';
import { useState } from 'react';
import { calculateTotals } from '@/lib/pricing';
import { CouponBox, type AppliedCoupon } from './coupon-box';
import { useCart } from './cart-provider';
import { OrderConfirmationModal } from './order-confirmation-modal';

type UpiOrder = {
  orderNumber: string;
  orderId: string;
  amount: number;
  upiId: string;
  payeeName: string;
  upiUri: string;
  qrDataUrl: string;
};

export function CheckoutPage() {
  const { items, clear, couponCode, setCouponCode } = useCart();
  const method = 'manual_upi' as const;
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [upiOrder, setUpiOrder] = useState<UpiOrder | null>(null);
  const [confirmed, setConfirmed] = useState<{ orderNumber: string; orderId: string } | null>(null);
  const couponItems = items.map((item) => ({ productId: item.productId, quantity: item.quantity }));
  const fingerprint = JSON.stringify([couponItems, method]);
  const activeCoupon = applied?.fingerprint === fingerprint ? applied : null;
  const totals = calculateTotals(items.map((item) => ({ id: item.id, price: item.price, mrp: item.mrp, quantity: item.quantity })), activeCoupon ? { type: 'fixed', value: activeCoupon.discount } : undefined);

  function updateCoupon(coupon: AppliedCoupon | null) {
    setApplied(coupon);
    setCouponCode(coupon?.code ?? '');
  }

  async function submitUtr(form: FormData) {
    if (!upiOrder) return;
    const utr = String(form.get('utr') ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6,24}$/.test(utr)) {
      setNotice('Enter the 6–24 character UTR / transaction reference from your UPI app.');
      return;
    }
    const response = await fetch('/api/payments/utr', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orderId: upiOrder.orderId, utr }),
    });
    const data = await response.json() as { error?: string };
    if (!response.ok) {
      setNotice(data.error ?? 'UTR could not be submitted.');
      return;
    }
    clear();
    setConfirmed({ orderNumber: upiOrder.orderNumber, orderId: upiOrder.orderId });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) { setNotice('Your cart is empty.'); return; }
    setBusy(true);
    setNotice('');
    const form = new FormData(event.currentTarget);
    try {
      if (upiOrder) {
        await submitUtr(form);
        return;
      }
      const payload = {
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity, personalization: item.personalization, hamper: item.hamper, name: item.name, price: item.price, mrp: item.mrp })),
        address: { name: form.get('name'), mobile: form.get('mobile'), line1: form.get('line1'), city: form.get('city'), state: form.get('state'), postalCode: form.get('postalCode') },
        paymentMethod: method,
        couponCode: activeCoupon?.code,
        deliveryDate: form.get('deliveryDate') || undefined,
      };
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json() as { error?: string; orderNumber?: string; orderId?: string; amount?: number; upiId?: string; payeeName?: string; upiUri?: string };
      if (!response.ok || !data.orderNumber || !data.orderId || !data.amount || !data.upiId || !data.upiUri) {
        setNotice(data.error ?? 'UPI payment could not be started.');
        return;
      }
      let qrDataUrl = '';
      try {
        qrDataUrl = await QRCode.toDataURL(data.upiUri, { width: 320, margin: 1, color: { dark: '#351722', light: '#ffffff' } });
      } catch {
        // App buttons and the UPI ID remain available if QR rendering is unavailable.
      }
      setUpiOrder({ orderNumber: data.orderNumber, orderId: data.orderId, amount: data.amount, upiId: data.upiId, payeeName: data.payeeName ?? 'GiftsByRashii', upiUri: data.upiUri, qrDataUrl });
      setNotice('Order created. Pay the exact amount, then enter your UTR below.');
    } catch {
      setNotice('Checkout could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const upiQuery = upiOrder?.upiUri.split('?')[1] ?? '';

  return <main className="checkout-page shell"><Link href="/cart" className="back-link">← Back to bag</Link><div className="checkout-heading"><div><span className="eyebrow">ALMOST THERE</span><h1>Send a little joy</h1></div><span><LockKeyhole />Manual UPI payment</span></div><form className="checkout-layout" onSubmit={submit}><section className="checkout-form"><div className="checkout-card"><span className="step-number">1</span><div><h2>Contact</h2><div className="form-grid"><label className="field"><span>Email</span><input name="email" type="email" required placeholder="you@example.com" disabled={Boolean(upiOrder)} /></label><label className="field"><span>Mobile</span><input name="mobile" required pattern="[0-9+ -]{10,15}" inputMode="tel" disabled={Boolean(upiOrder)} /></label></div></div></div><div className="checkout-card"><span className="step-number">2</span><div><h2>Delivery address</h2><div className="form-grid"><label className="field"><span>Full name</span><input name="name" required disabled={Boolean(upiOrder)} /></label><label className="field"><span>Address</span><input name="line1" required disabled={Boolean(upiOrder)} /></label><label className="field"><span>City</span><input name="city" required disabled={Boolean(upiOrder)} /></label><label className="field"><span>State</span><input name="state" required disabled={Boolean(upiOrder)} /></label><label className="field"><span>PIN code</span><input name="postalCode" required pattern="[0-9]{6}" inputMode="numeric" disabled={Boolean(upiOrder)} /></label><label className="field"><span>Preferred date</span><input name="deliveryDate" type="date" disabled={Boolean(upiOrder)} /></label></div></div></div><div className="checkout-card upi-checkout-card"><span className="step-number">3</span><div><h2>Pay with UPI</h2>{upiOrder ? <div className="upi-payment-panel"><div className="upi-qr-wrap">{upiOrder.qrDataUrl ? <img src={upiOrder.qrDataUrl} alt={`UPI QR code to pay ₹${upiOrder.amount.toLocaleString('en-IN')}`} /> : <QrCode aria-hidden="true" />}</div><div className="upi-payment-details"><span className="upi-amount"><IndianRupee /><small>Pay exact amount</small><b>₹{upiOrder.amount.toLocaleString('en-IN')}</b></span><p>Scan the QR or open your preferred UPI app. Payment goes directly to <strong>{upiOrder.payeeName}</strong>.</p><div className="upi-id-row"><span><small>UPI ID</small><b>{upiOrder.upiId}</b></span><button type="button" onClick={() => { void navigator.clipboard.writeText(upiOrder.upiId); setNotice('UPI ID copied.'); }} aria-label="Copy UPI ID"><Copy /></button></div><div className="upi-app-grid"><a href={upiOrder.upiUri}><Smartphone />Any UPI App</a><a href={`phonepe://pay?${upiQuery}`}>PhonePe</a><a href={`paytmmp://pay?${upiQuery}`}>Paytm</a><a href={`tez://upi/pay?${upiQuery}`}>Google Pay</a></div></div><label className="field wide utr-field"><span>UTR / Transaction reference</span><input name="utr" required minLength={6} maxLength={24} pattern="[A-Za-z0-9]{6,24}" autoCapitalize="characters" placeholder="Enter UTR after payment" /><small>Find this number in your UPI app’s payment details. Admin will verify it before processing the order.</small></label></div> : <div className="upi-payment-intro"><span><QrCode /></span><div><b>QR code + PhonePe, Paytm, Google Pay</b><p>First create your order. We’ll show a QR for the server-verified final amount and ask for the UTR after payment.</p></div></div>}</div></div>{notice && <p className="form-notice" role="status">{notice}</p>}</section><aside className="order-summary checkout-summary"><h2>Your gifts</h2>{items.map((item) => <div className="checkout-item" key={item.id}><span className="mini-art" style={{ background: item.color }}><Gift /></span><span>{item.name}<small>Qty {item.quantity}</small></span><b>₹{(item.price * item.quantity).toLocaleString('en-IN')}</b></div>)}<div><span>Subtotal</span><b>₹{totals.subtotal.toLocaleString('en-IN')}</b></div>{activeCoupon && <div><span>Coupon ({activeCoupon.code})</span><b className="saving">−₹{totals.couponDiscount.toLocaleString('en-IN')}</b></div>}<div><span>Shipping</span><b>{totals.shipping ? `₹${totals.shipping}` : 'Free'}</b></div>{!upiOrder && <CouponBox key={`${couponCode || 'checkout-coupon'}-${method}`} items={couponItems} paymentMethod={method} initialCode={couponCode} applied={applied} onApplied={updateCoupon} />}<div className="total"><span>Total</span><b>₹{(upiOrder?.amount ?? totals.total).toLocaleString('en-IN')}</b></div><button className="button button-primary" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <CheckCircle2 />}{busy ? 'Please wait…' : upiOrder ? 'I have paid — submit UTR' : 'Create order & show UPI QR'}</button><p>{upiOrder ? 'Your order will be processed after admin verifies the UTR.' : 'Final coupon, stock and amount are verified again on the server.'}</p></aside></form>{confirmed && <OrderConfirmationModal orderNumber={confirmed.orderNumber} orderId={confirmed.orderId} paymentPending onClose={() => setConfirmed(null)} />}</main>;
}
