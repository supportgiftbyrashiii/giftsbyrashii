'use client';

import Link from 'next/link';
import { CheckCircle2, CircleX, Copy, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type AdminPaymentQueueRow = {
  id: string;
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  amount: number;
  utr: string;
  submittedAt: string;
  customerName: string;
  email: string;
  mobile: string;
};

export function AdminPaymentQueue({ rows }: { rows: AdminPaymentQueueRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string>('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  async function decide(row: AdminPaymentQueueRow, action: 'capture' | 'reject') {
    if (action === 'reject' && !notes[row.id]?.trim()) {
      setNotice(`Add a reason before rejecting ${row.orderNumber}.`);
      return;
    }
    if (action === 'capture' && !window.confirm(`Capture ₹${row.amount.toLocaleString('en-IN')} for ${row.orderNumber}?`)) return;
    setBusy(`${row.id}:${action}`); setNotice('');
    try {
      const response = await fetch('/api/admin/payments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ paymentId: row.id, action, note: notes[row.id] ?? '' }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) { setNotice(data.error ?? 'Payment update failed.'); return; }
      setNotice(action === 'capture' ? `${row.orderNumber} captured. Revenue is updated.` : `${row.orderNumber} rejected and returned to payment pending.`);
      router.refresh();
    } catch { setNotice('The request could not reach the server.'); }
    finally { setBusy(''); }
  }

  function copyUtr(utr: string) {
    navigator.clipboard?.writeText(utr).then(() => setNotice(`UTR ${utr} copied.`));
  }

  return <section className="admin-payment-queue">
    {notice && <p className="form-notice" role="status">{notice}</p>}
    {rows.length ? rows.map((row) => {
      const pending = row.paymentStatus === 'authorized';
      return <article className={`admin-payment-row ${pending ? 'is-pending' : ''}`} key={row.id}>
        <div className="admin-payment-main"><span className={`payment-state payment-state-${row.paymentStatus}`}><ShieldCheck />{pending ? 'UTR submitted' : row.paymentStatus}</span><Link href={`/admin/orders/${row.orderId}`}><b>{row.orderNumber}</b></Link><small>{new Date(row.submittedAt).toLocaleString('en-IN')}</small></div>
        <div><small>Customer</small><b>{row.customerName}</b><span>{row.email} · {row.mobile}</span></div>
        <div><small>Amount</small><strong>₹{row.amount.toLocaleString('en-IN')}</strong><span className="utr-value">UTR {row.utr}<button type="button" title="Copy UTR" aria-label="Copy UTR" onClick={() => copyUtr(row.utr)}><Copy /></button></span></div>
        <div className="admin-payment-actions">{pending ? <><label><span>Verification note</span><input value={notes[row.id] ?? ''} onChange={(event) => setNotes((old) => ({ ...old, [row.id]: event.target.value }))} placeholder="Optional for capture; required for reject" /></label><div><button className="button button-primary" disabled={Boolean(busy)} onClick={() => decide(row, 'capture')}>{busy === `${row.id}:capture` ? <LoaderCircle className="spin" /> : <CheckCircle2 />}Verify & capture</button><button className="button button-danger" disabled={Boolean(busy)} onClick={() => decide(row, 'reject')}>{busy === `${row.id}:reject` ? <LoaderCircle className="spin" /> : <CircleX />}Reject</button></div></> : <span className="payment-resolved">Reviewed · {row.paymentStatus}</span>}</div>
      </article>;
    }) : <div className="admin-empty admin-empty-panel"><ShieldCheck /><b>No UTR payments waiting</b><span>Submitted manual UPI payments will appear here for verification.</span></div>}
  </section>;
}
