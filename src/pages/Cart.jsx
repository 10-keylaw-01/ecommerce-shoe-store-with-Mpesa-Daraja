import { useEffect, useState } from 'react'
import { useTitle } from '../lib/useTitle'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useSite } from '../context/SiteContext'
import { kes } from '../lib/api'

const inputCls = 'w-full bg-surface border border-line2 px-4 py-3 text-sm text-ink placeholder:text-ink5 focus:outline-none focus:border-[#d97706] transition-colors'

function Spinner() {
  return <div className="w-10 h-10 border-2 border-line2 border-t-[#d97706] rounded-full animate-spin mx-auto" />
}

function CheckoutPanel({ items, total, onClose }) {
  const { settings } = useSite()
  const { clear } = useCart()
  const flat = Number(settings.flat_shipping_rate) || 0
  const threshold = Number(settings.free_shipping_threshold) || 0
  const shipping = threshold > 0 && total >= threshold ? 0 : flat
  const grand = total + shipping

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: '' })
  const [phase, setPhase] = useState('form') // form | waiting | success | failed
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [order, setOrder] = useState(null) // { checkoutRequestId, orderNumber, amountKes }
  const [result, setResult] = useState({})
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function pay(e) {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map((i) => ({ variantId: i.key, qty: i.qty })), customer: form }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not start payment.')
      setOrder(data); setPhase('waiting')
    } catch (err) { setError(err.message) }
    setBusy(false)
  }

  // Poll the server until the payment settles.
  useEffect(() => {
    if (phase !== 'waiting' || !order) return
    let stop = false
    const tick = async () => {
      try {
        const r = await fetch(`/api/checkout/status/${order.checkoutRequestId}`)
        const d = await r.json()
        if (stop || !d.status || d.status === 'pending') return
        setResult(d)
        if (d.status === 'success') { clear(); setPhase('success') } else setPhase('failed')
      } catch { /* transient; keep polling */ }
    }
    const id = setInterval(tick, 3000)
    return () => { stop = true; clearInterval(id) }
  }, [phase, order, clear])

  const failMsg = { cancelled: 'You cancelled the M-Pesa request.', timeout: "We didn't receive a response from your phone.", failed: result.message || 'The payment was not completed.' }[result.status]

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={phase === 'waiting' ? undefined : onClose} />
      <div className="w-full max-w-lg bg-surface border-l border-line flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-line">
          <div>
            <h2 className="font-['Space_Grotesk'] text-xl text-ink tracking-tight">Quick Checkout</h2>
            <p className="text-[10px] text-ink4 uppercase tracking-widest mt-1">Pay with M-Pesa</p>
          </div>
          {phase !== 'waiting' && (
            <button onClick={onClose} aria-label="Close" className="text-ink4 hover:text-ink transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {phase === 'form' && (
          <form onSubmit={pay} className="flex-1 flex flex-col">
            <div className="flex-1 p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink2">Your details</h3>
              <input className={inputCls} placeholder="Full name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              <input className={inputCls} placeholder="Email (for your receipt)" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              <input className={inputCls} placeholder="Delivery address" value={form.address} onChange={(e) => set('address', e.target.value)} required />
              <input className={inputCls} placeholder="Town / City" value={form.city} onChange={(e) => set('city', e.target.value)} required />
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink2 pt-4">M-Pesa number</h3>
              <input className={inputCls} placeholder="07XX XXX XXX" inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
              <p className="text-[10px] text-ink4 leading-relaxed">You'll get a prompt on this number to enter your M-Pesa PIN. We never see your PIN.</p>
              {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-900/40 px-4 py-3 text-xs text-red-700 dark:text-red-400">{error}</div>}
            </div>
            <div className="border-t border-line p-6 space-y-3">
              <div className="flex justify-between text-xs text-ink3 uppercase tracking-widest"><span>Subtotal</span><span>{kes(total)}</span></div>
              <div className="flex justify-between text-xs text-ink3 uppercase tracking-widest"><span>Shipping</span><span className="text-accent">{shipping ? kes(shipping) : 'Free'}</span></div>
              <div className="flex justify-between text-sm font-bold text-ink uppercase tracking-widest border-t border-line pt-3"><span>Total</span><span>{kes(grand)}</span></div>
              <button disabled={busy} className="w-full bg-[#d97706] text-black py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors mt-2 disabled:opacity-50">
                {busy ? 'Sending request…' : `Pay ${kes(grand)} with M-Pesa`}
              </button>
            </div>
          </form>
        )}

        {phase === 'waiting' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <Spinner />
            <h3 className="font-['Space_Grotesk'] text-2xl text-ink mt-8 mb-3">Check your phone</h3>
            <p className="text-sm text-ink2 max-w-xs leading-relaxed">We sent an M-Pesa prompt for <span className="text-ink">{kes(order.amountKes)}</span> to {form.phone}. Enter your PIN to complete the payment.</p>
            <p className="text-[10px] text-ink4 uppercase tracking-widest mt-6">Order {order.orderNumber} · waiting for confirmation</p>
          </div>
        )}

        {phase === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="w-14 h-14 border border-[#d97706] flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <h3 className="font-['Space_Grotesk'] text-2xl text-ink mb-3">Payment received</h3>
            <p className="text-sm text-ink2 mb-2">Thank you, {form.name.split(' ')[0]}. Your order is confirmed.</p>
            <p className="text-[10px] text-ink4 uppercase tracking-widest">Order {result.orderNumber}{result.receipt && ` · M-Pesa ${result.receipt}`}</p>
            <Link to="/collection" onClick={onClose} className="mt-10 inline-block bg-[#d97706] text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors">Continue Shopping</Link>
          </div>
        )}

        {phase === 'failed' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <h3 className="font-['Space_Grotesk'] text-2xl text-ink mb-3">Payment not completed</h3>
            <p className="text-sm text-ink2 mb-8 max-w-xs">{failMsg} You have not been charged for this attempt.</p>
            <button onClick={() => { setPhase('form'); setOrder(null) }} className="bg-[#d97706] text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors">Try Again</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Cart() {
  useTitle('Cart')
  const { items, remove, update, total, count, refresh, notice, dismissNotice } = useCart()
  const [checkout, setCheckout] = useState(false)
  useEffect(() => { refresh() }, [refresh]) // never show stale prices

  return (
    <div className="bg-bg min-h-screen text-body">
      {checkout && <CheckoutPanel items={items} total={total} onClose={() => setCheckout(false)} />}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-baseline justify-between mb-12">
          <h1 className="font-['Space_Grotesk'] text-3xl sm:text-4xl text-ink tracking-tighter">Your Cart</h1>
          {count > 0 && <span className="text-ink4 text-xs uppercase tracking-widest">{count} item{count !== 1 ? 's' : ''}</span>}
        </div>

        {notice && (
          <div role="status" className="mb-6 flex items-start justify-between gap-4 border border-[#d97706]/30 bg-surface px-4 py-3 text-xs text-ink2">
            <span>{notice}</span>
            <button onClick={dismissNotice} aria-label="Dismiss" className="text-ink4 hover:text-ink">✕</button>
          </div>
        )}
        {items.length === 0 ? (
          <div className="text-center py-20 sm:py-32 border border-line">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-6 text-ink5">
              <path d="M16 10a4 4 0 0 1-8 0M3.103 6.034h17.794" />
              <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
            </svg>
            <p className="text-ink4 text-sm uppercase tracking-widest mb-6">Your cart is empty</p>
            <Link to="/collection" className="inline-block bg-[#d97706] text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors">
              Shop the Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Items */}
            <div className="lg:col-span-2 space-y-px">
              {items.map((item) => (
                <div key={item.key} className="bg-surface border border-line p-4 sm:p-6 flex gap-4 sm:gap-6 hover:border-line2 transition-colors">
                  <Link to={`/product/${item.product.slug}`} className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden bg-surface2">
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover grayscale-[60%]" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <Link to={`/product/${item.product.slug}`}>
                        <h3 className="text-ink font-medium hover:text-accent transition-colors">{item.product.name}</h3>
                      </Link>
                      <button onClick={() => remove(item.key)} className="text-ink5 hover:text-ink transition-colors ml-4 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-[10px] text-ink4 uppercase tracking-widest mb-4">Size: {item.variant.size}{item.variant.color && item.variant.color !== 'Default' ? ` · ${item.variant.color}` : ''}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-line2">
                        <button onClick={() => update(item.key, item.qty - 1)} className="w-8 h-8 flex items-center justify-center text-ink2 hover:text-ink hover:bg-line transition-colors text-lg">−</button>
                        <span className="w-8 text-center text-sm text-ink">{item.qty}</span>
                        <button onClick={() => update(item.key, item.qty + 1)} className="w-8 h-8 flex items-center justify-center text-ink2 hover:text-ink hover:bg-line transition-colors text-lg">+</button>
                      </div>
                      <span className="text-accent font-medium">{kes(item.variant.price * item.qty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-surface border border-line p-6 lg:sticky lg:top-28">
                <h2 className="text-xs font-bold uppercase tracking-widest text-ink mb-6">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-xs text-ink3 uppercase tracking-widest">
                    <span>Subtotal</span><span>{kes(total)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-ink3 uppercase tracking-widest">
                    <span>Shipping</span><span className="text-accent">Free</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-ink uppercase tracking-widest border-t border-line pt-3">
                    <span>Total</span><span>{kes(total)}</span>
                  </div>
                </div>
                <button
                  onClick={async () => { await refresh(); setCheckout(true) }}
                  className="w-full bg-[#d97706] text-black py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors mb-3"
                >
                  Quick Checkout
                </button>
                <Link to="/collection" className="block w-full text-center py-4 text-xs font-bold uppercase tracking-widest text-ink2 border border-line2 hover:border-line4 hover:text-ink transition-all">
                  Continue Shopping
                </Link>
                <div className="mt-6 flex items-center gap-2 justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink4">
                    <rect width="11" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <p className="text-[10px] text-ink5 uppercase tracking-widest">Secure checkout</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
