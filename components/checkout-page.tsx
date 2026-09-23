'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Gift, LoaderCircle, LockKeyhole, QrCode, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { calculateTotals } from '@/lib/pricing';
import { CouponBox, type AppliedCoupon } from './coupon-box';
import { useCart } from './cart-provider';

const PAYMENT_STORAGE_KEY = 'giftsbyrashii:upi-order';

type CheckoutPaymentData = {
  orderNumber: string;
  orderId: string;
  amount: number;
  upiId: string;
  payeeName: string;
  upiUri: string;
  qrDataUrl: string;
};

export function CheckoutPage() {
  const router = useRouter();
  const { items, couponCode, setCouponCode } = useCart();
  const method = 'manual_upi' as const;
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const couponItems = items.map((item) => ({ productId: item.productId, quantity: item.quantity }));
  const fingerprint = JSON.stringify([couponItems, method]);
  const activeCoupon = applied?.fingerprint === fingerprint ? applied : null;
  const totals = calculateTotals(items.map((item) => ({ id: item.id, price: item.price, mrp: item.mrp, quantity: item.quantity })), activeCoupon ? { type: 'fixed', value: activeCoupon.discount } : undefined);

  function updateCoupon(coupon: AppliedCoupon | null) {
    setApplied(coupon);
    setCouponCode(coupon?.code ?? '');
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) {
      setNotice('Your cart is empty.');
      return;
    }
    setBusy(true);
    setNotice('');
    const form = new FormData(event.currentTarget);
    try {
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
        const QRCode = (await import('qrcode')).default;
        qrDataUrl = await QRCode.toDataURL(data.upiUri, { width: 360, margin: 1, color: { dark: '#351722', light: '#ffffff' } });
      } catch {
        // The payment page still offers UPI app links and UPI ID copy if QR generation fails.
      }
      const paymentData: CheckoutPaymentData = { orderNumber: data.orderNumber, orderId: data.orderId, amount: data.amount, upiId: data.upiId, payeeName: data.payeeName ?? 'GiftsByRashii', upiUri: data.upiUri, qrDataUrl };
      window.sessionStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(paymentData));
      router.push('/payment/upi');
    } catch {
      setNotice('Checkout could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="checkout-standalone">
    <header className="checkout-topbar"><Link href="/" className="checkout-brand"><span><Gift /></span><b>GiftsByRashii</b></Link><div className="checkout-progress" aria-label="Checkout progress"><span className="active"><i>1</i>Details</span><em></em><span><i>2</i>Payment</span></div><span className="checkout-secure"><LockKeyhole /> Secure checkout</span></header>
    <div className="checkout-page shell">
    <Link href="/cart" className="back-link">← Back to bag</Link>
    <div className="checkout-heading"><div><span className="eyebrow">ALMOST THERE</span><h1>Send a little joy</h1><p>Everything is packed with care. Add your details, then complete the secure payment step.</p></div><span><ShieldCheck /> Order protection on</span></div>
    <form className="checkout-layout" onSubmit={submit}>
      <section className="checkout-form">
        <div className="checkout-card"><span className="step-number">1</span><div><h2>Contact</h2><div className="form-grid"><label className="field"><span>Email</span><input name="email" type="email" required placeholder="you@example.com" autoComplete="email" /></label><label className="field"><span>Mobile</span><input name="mobile" required pattern="[0-9+ -]{10,15}" inputMode="tel" autoComplete="tel" /></label></div></div></div>
        <div className="checkout-card"><span className="step-number">2</span><div><h2>Delivery address</h2><div className="form-grid"><label className="field"><span>Full name</span><input name="name" required autoComplete="name" /></label><label className="field"><span>Address</span><input name="line1" required autoComplete="street-address" /></label><label className="field"><span>City</span><input name="city" required autoComplete="address-level2" /></label><label className="field"><span>State</span><input name="state" required autoComplete="address-level1" /></label><label className="field"><span>PIN code</span><input name="postalCode" required pattern="[0-9]{6}" inputMode="numeric" autoComplete="postal-code" /></label><label className="field"><span>Preferred date <small>Optional</small></span><input name="deliveryDate" type="date" /></label></div></div></div>
        <div className="checkout-card upi-checkout-card"><span className="step-number">3</span><div><span className="eyebrow">SECURE PAYMENT</span><h2>Ready to pay?</h2><div className="upi-checkout-preview"><span className="upi-preview-icon"><QrCode /></span><div><b>Your payment page is ready</b><p>After you confirm your details, a separate secure page will open with the exact total, QR code and UPI app buttons.</p><div className="upi-trust-row"><span><ShieldCheck /> Server-verified amount</span><span><LockKeyhole /> Secure handoff</span></div></div></div></div></div>
        {notice && <p className="form-notice" role="status">{notice}</p>}
      </section>
      <aside className="order-summary checkout-summary"><h2>Your gifts</h2>{items.map((item) => <div className="checkout-item" key={item.id}><span className="mini-art" style={{ background: item.color }}><Gift /></span><span>{item.name}<small>Qty {item.quantity}</small></span><b>₹{(item.price * item.quantity).toLocaleString('en-IN')}</b></div>)}<div><span>Subtotal</span><b>₹{totals.subtotal.toLocaleString('en-IN')}</b></div>{activeCoupon && <div><span>Coupon ({activeCoupon.code})</span><b className="saving">−₹{totals.couponDiscount.toLocaleString('en-IN')}</b></div>}<div><span>Shipping</span><b>{totals.shipping ? `₹${totals.shipping}` : 'Free'}</b></div><CouponBox key={`${couponCode || 'checkout-coupon'}-${method}`} items={couponItems} paymentMethod={method} initialCode={couponCode} applied={applied} onApplied={updateCoupon} /><div className="total"><span>Total<small>Final amount verified on server</small></span><b>₹{totals.total.toLocaleString('en-IN')}</b></div><button className="button button-primary checkout-pay-button" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <ArrowRight />}{busy ? 'Preparing payment…' : 'Continue to payment'}</button><p><CheckCircle2 /> No payment is taken until the next secure step.</p></aside>
    </form>
    </div>
  </main>;
}
