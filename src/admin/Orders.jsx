import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/api'
import { Badge, PageHeader, btnPrimary, card, errorBox, fmtDate, inputCls, kes } from './ui'

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded']

export default function OrdersList() {
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const { data, loading, error } = useQuery(async () => {
    const { data, error } = await supabase.from('orders').select('id,order_number,status,total,created_at,guest_name,guest_phone,customer:customers(full_name,phone)').order('created_at', { ascending: false })
    if (error) throw error
    return data
  }, [])
  const rows = (data ?? []).filter((o) => (filter === 'all' || o.status === filter) && (!q || JSON.stringify(o).toLowerCase().includes(q.toLowerCase())))
  const countOf = (s) => (data ?? []).filter((o) => s === 'all' || o.status === s).length

  return (
    <div>
      <PageHeader title="Orders" sub={`${rows.length} shown`}>
        <input className={inputCls + ' w-56'} placeholder="Search order, name, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
      </PageHeader>
      {errorBox(error?.message)}
      <div className="mb-4 flex flex-wrap gap-2">
        {['all', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${filter === s ? 'border-[#d97706] bg-[#d97706] text-black' : 'border-line2 text-ink2 hover:border-line4'}`}>{s} · {countOf(s)}</button>
        ))}
      </div>
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm text-soft">
          <thead className="text-left text-[10px] uppercase tracking-widest text-ink4"><tr><th className="px-4 py-3">Order</th><th>Customer</th><th>Phone</th><th>Status</th><th>Total</th><th>Placed</th></tr></thead>
          <tbody>
            {loading && <tr><td className="p-4 text-ink4" colSpan={6}>Loading…</td></tr>}
            {!loading && !rows.length && <tr><td className="p-4 text-ink4" colSpan={6}>No orders.</td></tr>}
            {rows.map((o) => (
              <tr key={o.id} className="border-t border-line hover:bg-hov">
                <td className="px-4 py-3"><Link to={`/admin/orders/${o.id}`} className="text-ink hover:text-accent">{o.order_number}</Link></td>
                <td>{o.guest_name || o.customer?.full_name || '—'}</td>
                <td className="text-ink2">{o.guest_phone || o.customer?.phone || '—'}</td>
                <td><Badge value={o.status} /></td>
                <td>{kes(o.total)}</td>
                <td className="text-xs text-ink4">{fmtDate(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function OrderDetail() {
  const { id } = useParams()
  const [tick, setTick] = useState(0)
  const { data, loading } = useQuery(async () => {
    const [o, items, pay, hist] = await Promise.all([
      supabase.from('orders').select('*, customer:customers(full_name,email,phone)').eq('id', id).maybeSingle(),
      supabase.from('order_items').select('*').eq('order_id', id),
      supabase.from('payments').select('*').eq('order_id', id).order('created_at'),
      supabase.from('order_status_history').select('*').eq('order_id', id).order('created_at'),
    ])
    return { order: o.data, items: items.data ?? [], payments: pay.data ?? [], history: hist.data ?? [] }
  }, [id, tick])
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [msg, setMsg] = useState('')
  useEffect(() => { if (data?.order) { setStatus(data.order.status); setNotes(data.order.notes) } }, [data])

  if (loading) return <p className="text-ink4">Loading…</p>
  const { order, items, payments, history } = data
  if (!order) return <p className="text-ink2">Order not found.</p>
  const addr = order.shipping_address ?? {}

  async function save() {
    setMsg('')
    const { error } = await supabase.from('orders').update({ status, notes }).eq('id', id)
    if (error) setMsg(error.message); else { setMsg('Saved.'); setTick((t) => t + 1) }
  }

  return (
    <div className="max-w-4xl">
      <Link to="/admin/orders" className="text-[10px] uppercase tracking-widest text-ink3 hover:text-ink">← Orders</Link>
      <PageHeader title={order.order_number} sub={`Placed ${fmtDate(order.created_at)}`}><Badge value={order.status} /></PageHeader>

      <div className="mb-6 grid gap-6 md:grid-cols-3">
        <div className={`${card} p-5`}>
          <p className="mb-3 text-[10px] uppercase tracking-widest text-ink4">Customer</p>
          <p className="text-ink">{order.guest_name || order.customer?.full_name || '—'}</p>
          <p className="text-sm text-ink2">{order.guest_phone || order.customer?.phone}</p>
          <p className="text-sm text-ink2">{order.guest_email || order.customer?.email}</p>
        </div>
        <div className={`${card} p-5`}>
          <p className="mb-3 text-[10px] uppercase tracking-widest text-ink4">Deliver to</p>
          <p className="text-sm text-soft">{[addr.line1, addr.line2, addr.city, addr.state, addr.country].filter(Boolean).join(', ') || '—'}</p>
        </div>
        <div className={`${card} p-5`}>
          <p className="mb-3 text-[10px] uppercase tracking-widest text-ink4">Update</p>
          <select className={inputCls + ' mb-2'} value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          <textarea className={inputCls + ' mb-2'} rows={2} placeholder="Internal notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button onClick={save} className={btnPrimary}>Save</button>
          {msg && <span className="ml-3 text-xs text-ink2">{msg}</span>}
        </div>
      </div>

      <div className={`${card} mb-6 overflow-x-auto`}>
        <table className="w-full text-sm text-soft">
          <thead className="text-left text-[10px] uppercase tracking-widest text-ink4"><tr><th className="px-4 py-3">Item</th><th>Variant</th><th>Qty</th><th>Unit</th><th className="pr-4 text-right">Line</th></tr></thead>
          <tbody>
            {items.map((i) => <tr key={i.id} className="border-t border-line"><td className="px-4 py-3 text-ink">{i.product_name_snapshot}</td><td>{i.variant_label_snapshot}</td><td>{i.qty}</td><td>{kes(i.unit_price)}</td><td className="pr-4 text-right">{kes(i.line_total)}</td></tr>)}
            <tr className="border-t border-line text-ink2"><td className="px-4 py-2" colSpan={4}>Shipping</td><td className="pr-4 text-right">{kes(order.shipping)}</td></tr>
            <tr className="font-bold text-ink"><td className="px-4 py-2" colSpan={4}>Total</td><td className="pr-4 text-right">{kes(order.total)}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className={`${card} p-5`}>
          <p className="mb-3 text-[10px] uppercase tracking-widest text-ink4">M-Pesa payments</p>
          {payments.length === 0 && <p className="text-sm text-ink4">No payment attempts.</p>}
          {payments.map((p) => (
            <div key={p.id} className="mb-3 border-b border-line pb-3 text-sm last:border-0">
              <div className="flex items-center justify-between"><span className="text-ink">KES {Number(p.amount).toLocaleString()}</span><Badge value={p.status} /></div>
              <p className="text-xs text-ink3">{p.phone} {p.mpesa_receipt && `· ${p.mpesa_receipt}`}</p>
              {p.result_desc && <p className="text-xs text-ink4">{p.result_desc}</p>}
            </div>
          ))}
        </div>
        <div className={`${card} p-5`}>
          <p className="mb-3 text-[10px] uppercase tracking-widest text-ink4">Status history</p>
          {history.map((h) => <p key={h.id} className="mb-2 text-sm text-ink2">{h.from_status ?? '—'} → <span className="text-ink">{h.to_status}</span> <span className="text-xs text-ink4">· {fmtDate(h.created_at)}</span></p>)}
        </div>
      </div>
    </div>
  )
}
