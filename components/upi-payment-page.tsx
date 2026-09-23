'use client';

import Link from 'next/link';
import { ArrowLeft, Check, CheckCircle2, Copy, Gift, IndianRupee, LoaderCircle, LockKeyhole, MessageCircle, QrCode, ShieldCheck, Smartphone } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from './cart-provider';

const PAYMENT_STORAGE_KEY = 'giftsbyrashii:upi-order';

type UpiOrder = {
  orderNumber: string;
  orderId: string;
  amount: number;
  upiId: string;
  payeeName: string;
  upiUri: string;
  qrDataUrl?: string;
};

export function UpiPaymentPage() {
  const { clear } = useCart();
  const [order, setOrder] = useState<UpiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [utr, setUtr] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.sessionStorage.getItem(PAYMENT_STORAGE_KEY);
        if (raw) setOrder(JSON.parse(raw) as UpiOrder);
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const upiQuery = useMemo(() => order?.upiUri.split('?')[1] ?? '', [order]);

  async function copyUpiId() {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.upiId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice('UPI ID copy failed. Please select and copy it manually.');
    }
  }

  async function submitUtr(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) return;
    const cleanUtr = utr.trim().toUpperCase();
    if (!/^[A-Z0-9]{6,24}$/.test(cleanUtr)) {
      setNotice('Enter the 6–24 character UTR / transaction reference from your UPI app.');
      return;
    }
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/payments/utr', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId: order.orderId, utr: cleanUtr }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) {
        setNotice(data.error ?? 'UTR could not be submitted.');
        return;
      }
      window.sessionStorage.removeItem(PAYMENT_STORAGE_KEY);
      clear();
      setSubmitted(true);
    } catch {
      setNotice('Payment details could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="upi-payment-page"><div className="upi-loading"><LoaderCircle className="spin" /><p>Preparing your secure payment page…</p></div></main>;

  if (!order) return <main className="upi-payment-page"><div className="upi-missing"><span className="upi-missing-icon"><QrCode /></span><span className="eyebrow">PAYMENT SESSION EXPIRED</span><h1>Let’s start that payment again.</h1><p>Your secure payment link is no longer available. Your cart is safe—return to checkout and we’ll create a fresh payment page.</p><Link href="/checkout" className="button button-primary"><ArrowLeft />Back to checkout</Link></div></main>;

  if (submitted) return <main className="upi-payment-page"><div className="upi-submitted"><span className="upi-success-icon"><Check /></span><span className="eyebrow">PAYMENT DETAILS RECEIVED</span><h1>Your payment is being verified.</h1><p>We’ve received the UTR for <strong>{order.orderNumber}</strong>. Our team will verify it shortly and then begin preparing your gift.</p><div className="upi-submitted-actions"><Link href={`/account/orders/${order.orderId}`} className="button button-primary"><CheckCircle2 />Track this order</Link><Link href="/shop" className="button button-soft">Continue shopping</Link></div></div></main>;

  return <main className="upi-payment-page">
    <header className="upi-payment-topbar"><Link href="/" className="upi-brand"><span><Gift /></span><b>GiftsByRashii</b></Link><span className="upi-secure-badge"><ShieldCheck /> Secure payment</span></header>
    <div className="upi-payment-shell">
      <div className="upi-payment-heading"><Link href="/checkout" className="upi-back"><ArrowLeft /> Checkout</Link><span className="eyebrow">PAYMENT STEP 2 OF 2</span><h1>Complete your payment</h1><p>Pay the exact amount below using any UPI app. Your order is reserved while you finish this step.</p></div>
      <div className="upi-payment-grid">
        <section className="upi-payment-card upi-main-card"><div className="upi-card-head"><div><span className="eyebrow">SCAN & PAY</span><h2>Pay with any UPI app</h2></div><span className="upi-order-pill">Order {order.orderNumber}</span></div><div className="upi-pay-content"><div className="upi-qr-stage">{order.qrDataUrl ? <img src={order.qrDataUrl} alt={`Scan QR code to pay ₹${order.amount.toLocaleString('en-IN')}`} /> : <QrCode aria-hidden="true" />}<span>Scan with PhonePe, GPay or Paytm</span></div><div className="upi-pay-details"><span className="upi-total-label">Amount to pay</span><strong className="upi-total"><IndianRupee />{order.amount.toLocaleString('en-IN')}</strong><span className="upi-payee">to <b>{order.payeeName}</b></span><a href={order.upiUri} className="upi-open-app"><Smartphone />Open any UPI app <ArrowLeft className="upi-open-arrow" /></a><div className="upi-id-box"><span><small>UPI ID</small><b>{order.upiId}</b></span><button type="button" onClick={copyUpiId} aria-label="Copy UPI ID" title="Copy UPI ID">{copied ? <Check /> : <Copy />}</button></div></div></div><div className="upi-app-links"><span>Quick open</span><a href={`phonepe://pay?${upiQuery}`}>PhonePe</a><a href={`tez://upi/pay?${upiQuery}`}>Google Pay</a><a href={`paytmmp://pay?${upiQuery}`}>Paytm</a></div></section>
        <aside className="upi-payment-card upi-submit-card"><div className="upi-submit-step"><span>1</span><div><b>Pay the exact amount</b><small>₹{order.amount.toLocaleString('en-IN')} via UPI</small></div></div><div className="upi-submit-line" /><div className="upi-submit-step"><span>2</span><div><b>Enter your UTR</b><small>Find it in your UPI app after payment</small></div></div><form onSubmit={submitUtr}><label className="field"><span>UTR / transaction reference</span><input value={utr} onChange={(event) => setUtr(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24))} required minLength={6} maxLength={24} autoCapitalize="characters" autoComplete="off" placeholder="e.g. 324567890123" /></label><button className="button button-primary" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <CheckCircle2 />}{busy ? 'Submitting…' : 'I have paid — submit UTR'}</button>{notice && <p className="form-notice" role="status">{notice}</p>}</form><div className="upi-help"><MessageCircle /><p>Payment will be checked by our team before the order is processed.</p></div></aside>
      </div>
      <div className="upi-payment-footer"><span><LockKeyhole /> Your payment details are encrypted and handled securely.</span><Link href="/contact">Need help?</Link></div>
    </div>
  </main>;
}
