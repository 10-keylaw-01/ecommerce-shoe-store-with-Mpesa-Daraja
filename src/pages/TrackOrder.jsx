import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { kes } from '../lib/api'
import { useTitle } from '../lib/useTitle'

const STEPS = ['pending', 'paid', 'shipped', 'delivered']
const LABEL = { pending: 'Awaiting payment', paid: 'Paid', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded' }
const inputCls = 'w-full bg-surface border border-line2 px-4 py-3 text-sm text-ink placeholder:text-ink5 focus:outline-none focus:border-[#d97706] transition-colors'

export default function TrackOrder() {
  useTitle('Track Order')
  const [params] = useSearchParams()
  const [order, setOrder] = useState(params.get('order') ?? '')
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError(''); setResult(null); setBusy(true)
    try {
      const res = await fetch(`/api/orders/track?order=${encodeURIComponent(order)}&phone=${encodeURIComponent(phone)}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not look up your order.')
      setResult(data)
    } catch (err) { setError(err.message) }
    setBusy(false)
  }

  const idx = result ? STEPS.indexOf(result.status) : -1
  const dead = result && (result.status === 'cancelled' || result.status === 'refunded')

  return (
    <div className="bg-bg min-h-screen text-body">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <span className="text-accent font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">Orders</span>
        <h1 className="font-['Space_Grotesk'] text-4xl sm:text-5xl tracking-tighter text-ink mb-3">Track your order</h1>
        <p className="text-ink3 text-sm mb-10">Enter your order number and the phone number you paid with.</p>
        <form onSubmit={submit} className="space-y-3 mb-10">
          <input className={inputCls} placeholder="Order number (e.g. ORD-261002-01001)" value={order} onChange={(e) => setOrder(e.target.value)} required />
          <input className={inputCls} placeholder="M-Pesa phone number (07XX XXX XXX)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          {error && <p className="border border-red-300 dark:border-red-900/40 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs text-red-700 dark:text-red-400">{error}</p>}
          <button disabled={busy} className="w-full bg-[#d97706] text-black py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors disabled:opacity-50">{busy ? 'Looking up…' : 'Track order'}</button>
        </form>

        {result && (
          <div className="bg-surface border border-line p-5 sm:p-8">
            <p className="text-[10px] uppercase tracking-widest text-ink4">Order {result.orderNumber}</p>
            <h2 className="font-['Space_Grotesk'] text-2xl text-ink mt-1 mb-6">{LABEL[result.status]}{result.name && <span className="text-ink4"> · Hi {result.name}</span>}</h2>
            {!dead ? (
              <ol className="flex mb-8">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex-1 text-center">
                    <div className={`mx-auto mb-2 h-3 w-3 rounded-full ${i <= idx ? 'bg-[#d97706]' : 'bg-line2'}`} />
                    <span className={`text-[9px] sm:text-[10px] uppercase tracking-widest ${i <= idx ? 'text-ink' : 'text-ink5'}`}>{LABEL[s].replace('Awaiting payment', 'Pending')}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="text-sm text-ink2 mb-6">This order was {result.status}. <Link to="/contact" className="text-accent">Contact us</Link> if you have questions.</p>}
            <ul className="divide-y divide-line text-sm mb-4">
              {result.items.map((i, k) => (
                <li key={k} className="flex justify-between gap-4 py-3">
                  <span className="text-soft">{i.product_name_snapshot} <span className="text-ink4">· {i.variant_label_snapshot} × {i.qty}</span></span>
                  <span>{kes(i.line_total)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-line2 pt-4 text-sm font-bold uppercase tracking-widest text-ink"><span>Total</span><span>{kes(result.total)}</span></div>
          </div>
        )}
      </div>
    </div>
  )
}
