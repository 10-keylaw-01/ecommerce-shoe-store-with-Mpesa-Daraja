import express from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { stkPush, stkQuery } from './mpesa.js'

const env = process.env
for (const k of ['VITE_SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_SHORTCODE', 'MPESA_PASSKEY', 'MPESA_CALLBACK_BASE', 'MPESA_CALLBACK_SECRET']) {
  if (!env[k]) { console.error(`Missing env ${k} (see .env.example)`); process.exit(1) }
}

// Service-role client: bypasses RLS. Never expose to the browser.
const db = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })
const app = express()
app.use(express.json({ limit: '100kb' }))

const PENDING_TIMEOUT_MS = 3 * 60 * 1000
const lastQuery = new Map() // checkoutRequestId -> ts, throttles Daraja status queries

// --- helpers ---------------------------------------------------------------
function normalizePhone(raw) {
  const d = String(raw ?? '').replace(/[\s\-()+]/g, '')
  const m = d.match(/^(?:254|0)?([17]\d{8})$/)
  return m ? `254${m[1]}` : null
}

async function settings() {
  const { data } = await db.from('site_settings').select('key,value').in('key', ['flat_shipping_rate', 'free_shipping_threshold'])
  const s = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
  return { flat: Number(s.flat_shipping_rate) || 0, threshold: Number(s.free_shipping_threshold) || 0 }
}

const money = (n) => Math.round(n * 100) / 100

async function settle(payment, state, { code, desc, receipt, raw } = {}) {
  // A pending payment can settle to anything. A late *success* callback may also rescue an attempt that was
  // wrongly closed as failed/timeout/cancelled (the customer really paid), so the order is never lost.
  const from = state === 'success' ? ['pending', 'failed', 'timeout', 'cancelled'] : ['pending']
  const { data: updated } = await db.from('payments')
    .update({ status: state, result_code: code ?? null, result_desc: desc ?? '', mpesa_receipt: receipt ?? '', ...(raw ? { raw_callback: raw } : {}) })
    .eq('id', payment.id).in('status', from).select('id')
  if (!updated?.length) return // already settled by the other path (callback vs. poll)
  if (state === 'success') {
    // Re-open an order that was cancelled while the payment was still in flight, then mark it paid.
    await db.from('orders').update({ status: 'pending' }).eq('id', payment.order_id).eq('status', 'cancelled')
    await db.rpc('mark_order_paid', { p_order: payment.order_id, p_method: 'mpesa' })
  } else {
    await db.from('orders').update({ status: 'cancelled' }).eq('id', payment.order_id).eq('status', 'pending')
  }
}

// --- POST /api/checkout ----------------------------------------------------
app.post('/api/checkout', async (req, res) => {
  try {
    const { items, customer = {} } = req.body ?? {}
    const phone = normalizePhone(customer.phone)
    const name = String(customer.name ?? '').trim().slice(0, 120)
    const email = String(customer.email ?? '').trim().slice(0, 160)
    if (!name) return res.status(400).json({ error: 'Please enter your name.' })
    if (!phone) return res.status(400).json({ error: 'Enter a valid Safaricom number, e.g. 0712345678.' })
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' })
    if (!Array.isArray(items) || !items.length || items.length > 50) return res.status(400).json({ error: 'Your cart is empty.' })

    const wanted = new Map()
    for (const i of items) {
      const qty = Number.parseInt(i?.qty, 10)
      if (!i?.variantId || !(qty > 0 && qty <= 20)) return res.status(400).json({ error: 'Invalid cart item.' })
      wanted.set(i.variantId, (wanted.get(i.variantId) ?? 0) + qty)
    }

    // Prices and stock always come from the database, never from the browser.
    const { data: variants, error: vErr } = await db.from('product_variants')
      .select('id,size,color,price_override,stock,status,product:products(name,price,status)')
      .in('id', [...wanted.keys()])
    if (vErr) throw vErr

    const lines = []
    for (const [id, qty] of wanted) {
      const v = variants?.find((x) => x.id === id)
      if (!v || v.status !== 'published' || v.product?.status !== 'published') return res.status(409).json({ error: 'An item in your cart is no longer available.' })
      if (v.stock < qty) return res.status(409).json({ error: `Only ${v.stock} left of ${v.product.name} (${v.size}).` })
      const unit = Number(v.price_override ?? v.product.price)
      lines.push({ variant_id: id, product_name_snapshot: v.product.name, variant_label_snapshot: `Size ${v.size}${v.color && v.color !== 'Default' ? ` / ${v.color}` : ''}`, qty, unit_price: unit, line_total: money(unit * qty) })
    }

    const cfg = await settings()
    const subtotal = money(lines.reduce((s, l) => s + l.line_total, 0))
    const shipping = cfg.threshold > 0 && subtotal >= cfg.threshold ? 0 : cfg.flat
    const total = money(subtotal + shipping)
    // Prices are already KES; M-Pesa takes whole shillings.
    const amountKes = Math.max(1, Math.round(total))

    const { data: order, error: oErr } = await db.from('orders').insert({
      customer_id: null, guest_name: name, guest_email: email, guest_phone: phone, payment_method: 'mpesa',
      subtotal, shipping, total, currency: 'KES',
      shipping_address: { line1: String(customer.address ?? '').slice(0, 200), city: String(customer.city ?? '').slice(0, 80), country: 'KE' },
    }).select('id,order_number').single()
    if (oErr) throw oErr
    const { error: iErr } = await db.from('order_items').insert(lines.map((l) => ({ ...l, order_id: order.id })))
    if (iErr) { await db.from('orders').delete().eq('id', order.id); throw iErr }

    let stk
    try {
      stk = await stkPush({ phone, amount: amountKes, reference: order.order_number, description: 'Lovfoot order' })
    } catch (e) {
      await db.from('orders').update({ status: 'cancelled', notes: `STK push failed: ${e.message}` }).eq('id', order.id)
      console.error('STK push failed:', e.message)
      return res.status(502).json({ error: 'Could not start the M-Pesa prompt. Please try again in a moment.' })
    }

    const { error: pErr } = await db.from('payments').insert({
      order_id: order.id, phone, amount: amountKes, merchant_request_id: stk.merchantRequestId, checkout_request_id: stk.checkoutRequestId,
    })
    if (pErr) throw pErr

    res.json({ orderNumber: order.order_number, checkoutRequestId: stk.checkoutRequestId, amountKes, total, currency: 'KES' })
  } catch (e) {
    console.error('checkout error:', e)
    res.status(500).json({ error: 'Something went wrong placing your order.' })
  }
})

// --- GET /api/checkout/status/:id (polled by the browser) -------------------
app.get('/api/checkout/status/:id', async (req, res) => {
  try {
    const { data: p } = await db.from('payments').select('*, order:orders(order_number,total)').eq('checkout_request_id', req.params.id).maybeSingle()
    if (!p) return res.status(404).json({ error: 'Payment not found.' })

    let status = p.status
    if (status === 'pending') {
      const age = Date.now() - new Date(p.created_at).getTime()
      const last = lastQuery.get(p.checkout_request_id) ?? 0
      // The callback is the primary signal; query Daraja as a fallback (e.g. callback URL not reachable).
      if (age > 8000 && Date.now() - last > 6000) {
        lastQuery.set(p.checkout_request_id, Date.now())
        try {
          const q = await stkQuery(p.checkout_request_id)
          if (q.state !== 'pending') { await settle(p, q.state, { code: q.code, desc: q.desc }); status = q.state }
        } catch (e) { console.warn('stk query failed:', e.message) }
      }
      if (status === 'pending' && age > PENDING_TIMEOUT_MS) { await settle(p, 'timeout', { desc: 'No response from customer' }); status = 'timeout' }
    }
    const fresh = status === p.status ? p : (await db.from('payments').select('*').eq('id', p.id).single()).data
    res.json({ status: fresh.status, receipt: fresh.mpesa_receipt, message: fresh.result_desc, orderNumber: p.order?.order_number })
  } catch (e) {
    console.error('status error:', e)
    res.status(500).json({ error: 'Could not check payment status.' })
  }
})

// --- POST /api/mpesa/callback/:secret (called by Safaricom) ------------------
app.post('/api/mpesa/callback/:secret', async (req, res) => {
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' }) // always ack quickly
  if (req.params.secret !== env.MPESA_CALLBACK_SECRET) return
  try {
    const cb = req.body?.Body?.stkCallback
    if (!cb?.CheckoutRequestID) return
    const { data: p } = await db.from('payments').select('*').eq('checkout_request_id', cb.CheckoutRequestID).maybeSingle()
    if (!p) return
    const meta = Object.fromEntries((cb.CallbackMetadata?.Item ?? []).map((i) => [i.Name, i.Value]))
    const code = Number(cb.ResultCode)
    if (code === 0) {
      if (Number(meta.Amount) !== Number(p.amount)) { // paid amount must match what we asked for
        console.error('Callback amount mismatch', meta.Amount, p.amount)
        return settle(p, 'failed', { code, desc: 'Amount mismatch', raw: req.body })
      }
      return settle(p, 'success', { code, desc: cb.ResultDesc, receipt: String(meta.MpesaReceiptNumber ?? ''), raw: req.body })
    }
    return settle(p, code === 1032 ? 'cancelled' : 'failed', { code, desc: cb.ResultDesc, raw: req.body })
  } catch (e) { console.error('callback error:', e) }
})

// --- GET /api/orders/track?order=ORD-...&phone=07... (guest order lookup) -----
const hits = new Map() // ip -> [timestamps]; crude brute-force guard
app.get('/api/orders/track', async (req, res) => {
  try {
    const now = Date.now()
    const recent = (hits.get(req.ip) ?? []).filter((t) => now - t < 60_000)
    if (recent.length >= 15) return res.status(429).json({ error: 'Too many attempts. Please wait a minute.' })
    hits.set(req.ip, [...recent, now])

    const number = String(req.query.order ?? '').trim().toUpperCase()
    const phone = normalizePhone(req.query.phone)
    if (!number || !phone) return res.status(400).json({ error: 'Enter your order number and the phone number you paid with.' })
    const { data: o } = await db.from('orders')
      .select('id,order_number,status,subtotal,shipping,total,currency,created_at,paid_at,guest_name,guest_phone')
      .eq('order_number', number).eq('guest_phone', phone).maybeSingle()
    // Same message for "no such order" and "wrong phone" so order numbers can't be probed.
    if (!o) return res.status(404).json({ error: "We couldn't find an order with those details." })
    const [items, history] = await Promise.all([
      db.from('order_items').select('product_name_snapshot,variant_label_snapshot,qty,line_total').eq('order_id', o.id),
      db.from('order_status_history').select('to_status,created_at').eq('order_id', o.id).order('created_at'),
    ])
    res.json({
      orderNumber: o.order_number, status: o.status, total: o.total, currency: o.currency, placedAt: o.created_at, name: o.guest_name.split(' ')[0],
      items: items.data ?? [], history: history.data ?? [],
    })
  } catch (e) {
    console.error('track error:', e)
    res.status(500).json({ error: 'Could not look up your order.' })
  }
})

// --- production: serve the built SPA -----------------------------------------
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

const port = Number(env.PORT) || 8787
app.listen(port, () => console.log(`Lovfoot server on :${port} (M-Pesa ${env.MPESA_ENV || 'sandbox'})`))
