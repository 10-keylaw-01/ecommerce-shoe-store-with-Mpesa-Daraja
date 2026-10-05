import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/api'
import { Badge, PageHeader, card, fmtDate, kes } from './ui'

const DAYS = 14
const PAID = ['paid', 'shipped', 'delivered']

async function load() {
  const count = (t, f = (q) => q) => f(supabase.from(t).select('*', { count: 'exact', head: true })).then((r) => r.count ?? 0)
  const [orders, recent, lowStock, products, customers, newContacts, newCustom, pendingReviews, kes] = await Promise.all([
    supabase.from('orders').select('status,total,created_at').order('created_at', { ascending: false }).limit(5000),
    supabase.from('orders').select('id,order_number,status,total,created_at,guest_name,customer:customers(full_name)').order('created_at', { ascending: false }).limit(6),
    supabase.from('product_variants').select('id,size,stock,product:products!inner(id,name,status)').eq('status', 'published').eq('product.status', 'published').lte('stock', 5).order('stock').limit(8),
    count('products', (q) => q.eq('status', 'published')),
    count('customers'),
    count('contact_requests', (q) => q.eq('status', 'new')),
    count('custom_requests', (q) => q.eq('status', 'new')),
    count('reviews', (q) => q.eq('status', 'draft')),
    supabase.from('payments').select('amount').eq('status', 'success'),
  ])
  return { orders: orders.data ?? [], recent: recent.data ?? [], lowStock: lowStock.data ?? [], products, customers, newContacts, newCustom, pendingReviews, kes: (kes.data ?? []).reduce((s, p) => s + Number(p.amount), 0) }
}

function RevenueChart({ orders }) {
  const [hover, setHover] = useState(null)
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (DAYS - 1 - i))
    return { d, key: d.toDateString(), total: 0, n: 0 }
  })
  for (const o of orders) {
    if (!PAID.includes(o.status)) continue
    const day = days.find((x) => x.key === new Date(o.created_at).toDateString())
    if (day) { day.total += Number(o.total); day.n += 1 }
  }
  const max = Math.max(...days.map((d) => d.total), 1)
  const sum = days.reduce((s, d) => s + d.total, 0)
  const H = 140
  return (
    <div className={`${card} p-6`}>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-ink4">Revenue · last {DAYS} days</p>
          <p className="font-['Space_Grotesk'] text-3xl tracking-tighter text-ink">{kes(sum)}</p>
        </div>
        <p className="h-4 text-xs text-ink2">{hover !== null && `${days[hover].d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} · ${kes(days[hover].total)} · ${days[hover].n} order${days[hover].n === 1 ? '' : 's'}`}</p>
      </div>
      <div className="flex items-end gap-1.5" style={{ height: H }} role="img" aria-label={`Daily revenue for the last ${DAYS} days, total ${kes(sum)}`}>
        {days.map((d, i) => (
          <div key={d.key} className="group flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div className={`w-full rounded-t-[4px] transition-colors ${hover === i ? 'bg-[#f59e0b]' : 'bg-[#d97706]'}`} style={{ height: Math.max(d.total ? (d.total / max) * H : 0, d.total ? 4 : 2), opacity: d.total ? 1 : 0.25 }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[9px] uppercase tracking-widest text-ink5">
        <span>{days[0].d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span><span>Today</span>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, to }) {
  const body = (
    <div className={`${card} p-5 h-full transition-colors hover:border-line2`}>
      <p className="mb-3 text-[10px] uppercase tracking-widest text-ink4">{label}</p>
      <p className="font-['Space_Grotesk'] text-3xl tracking-tighter text-ink">{value}</p>
      {sub && <p className="mt-1 text-[10px] uppercase tracking-widest text-ink3">{sub}</p>}
    </div>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

export default function Dashboard() {
  const { data, loading, error } = useQuery(load, [])
  if (loading) return <p className="text-ink4">Loading…</p>
  if (error) return <p className="text-red-700 dark:text-red-400">{error.message}</p>
  const paid = data.orders.filter((o) => PAID.includes(o.status))
  const revenue = paid.reduce((s, o) => s + Number(o.total), 0)
  const pending = data.orders.filter((o) => o.status === 'pending').length
  const inbox = data.newContacts + data.newCustom

  return (
    <div>
      <PageHeader title="Dashboard" sub="Store overview" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Revenue" value={kes(revenue)} sub="Paid, shipped & delivered" to="/admin/payments" />
        <Kpi label="Paid orders" value={paid.length} sub={`${pending} awaiting payment`} to="/admin/orders" />
        <Kpi label="Products live" value={data.products} to="/admin/products" />
        <Kpi label="Customers" value={data.customers} to="/admin/customers" />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><RevenueChart orders={data.orders} /></div>
        <div className={`${card} p-6`}>
          <p className="mb-4 text-[10px] uppercase tracking-widest text-ink4">Needs attention</p>
          <ul className="space-y-3 text-sm">
            {[['Unread messages', inbox, '/admin/contact_requests'], ['Reviews to approve', data.pendingReviews, '/admin/reviews'], ['Orders to ship', data.orders.filter((o) => o.status === 'paid').length, '/admin/orders'], ['Low-stock sizes', data.lowStock.length, '#low']].map(([l, n, to]) => (
              <li key={l} className="flex items-center justify-between border-b border-line pb-3 last:border-0">
                <Link to={to} className="text-ink2 hover:text-ink">{l}</Link>
                <span className={n ? 'font-bold text-accent' : 'text-ink5'}>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`${card} overflow-x-auto lg:col-span-2`}>
          <div className="flex items-center justify-between p-5 pb-2">
            <p className="text-[10px] uppercase tracking-widest text-ink4">Recent orders</p>
            <Link to="/admin/orders" className="text-[10px] uppercase tracking-widest text-accent hover:text-ink">View all →</Link>
          </div>
          <table className="w-full text-sm text-soft">
            <tbody>
              {data.recent.length === 0 && <tr><td className="p-5 text-ink4">No orders yet.</td></tr>}
              {data.recent.map((o) => (
                <tr key={o.id} className="border-t border-line hover:bg-hov">
                  <td className="px-5 py-3"><Link to={`/admin/orders/${o.id}`} className="text-ink hover:text-accent">{o.order_number}</Link></td>
                  <td className="px-2 py-3 text-ink2">{o.guest_name || o.customer?.full_name || '—'}</td>
                  <td className="px-2 py-3"><Badge value={o.status} /></td>
                  <td className="px-2 py-3 text-right">{kes(o.total)}</td>
                  <td className="px-5 py-3 text-right text-xs text-ink4">{fmtDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div id="low" className={`${card} p-5`}>
          <p className="mb-3 text-[10px] uppercase tracking-widest text-ink4">Low stock</p>
          {data.lowStock.length === 0 && <p className="text-sm text-ink4">All sizes are well stocked.</p>}
          <ul className="space-y-2 text-sm">
            {data.lowStock.map((v) => (
              <li key={v.id} className="flex justify-between">
                <Link to={`/admin/products/${v.product.id}`} className="text-ink2 hover:text-ink">{v.product.name} · {v.size}</Link>
                <span className={v.stock === 0 ? 'text-red-700 dark:text-red-400' : 'text-accent'}>{v.stock === 0 ? 'Out' : `${v.stock} left`}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
