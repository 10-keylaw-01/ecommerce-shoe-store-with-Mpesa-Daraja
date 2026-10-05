import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resources } from './resources'
import { FieldInput, ImageInput, toForm, toPayload } from './fields'
import { PageHeader, btnGhost, btnPrimary, card, errorBox, inputCls } from './ui'

const fields = resources.products.fields

function Variants({ product }) {
  const [rows, setRows] = useState(null)
  const [msg, setMsg] = useState('')
  const load = useCallback(async () => {
    const { data } = await supabase.from('product_variants').select('*').eq('product_id', product.id).order('sort_order')
    setRows(data ?? [])
  }, [product.id])
  useEffect(() => { load() }, [load])
  if (!rows) return null

  const patch = (i, p) => setRows(rows.map((r, j) => j === i ? { ...r, ...p } : r))
  const add = () => setRows([...rows, { id: null, size: '', color: 'Default', sku: '', stock: 0, price_override: '', status: 'published', sort_order: rows.length + 1 }])

  async function save() {
    setMsg('')
    const payload = rows.map((r, i) => ({
      ...(r.id ? { id: r.id } : {}), product_id: product.id, size: r.size.trim(), color: r.color.trim() || 'Default',
      sku: (r.sku.trim() || `${product.slug.slice(0, 3).toUpperCase()}-${r.size.trim().replace(/\s+/g, '')}`).toUpperCase(),
      stock: Math.max(0, Number(r.stock) || 0), price_override: r.price_override === '' || r.price_override == null ? null : Number(r.price_override),
      status: r.status, sort_order: i + 1,
    }))
    if (payload.some((r) => !r.size)) return setMsg('Every row needs a size.')
    const { error } = await supabase.from('product_variants').upsert(payload)
    if (error) return setMsg(error.message)
    setMsg('Saved.'); load()
  }
  async function remove(i) {
    const r = rows[i]
    if (r.id) {
      if (!confirm(`Remove size ${r.size}?`)) return
      const { error } = await supabase.from('product_variants').delete().eq('id', r.id)
      if (error) return setMsg(error.message)
    }
    setRows(rows.filter((_, j) => j !== i))
  }

  return (
    <section className={`${card} mt-6 p-6`}>
      <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-ink">Sizes & stock</h2>
      <p className="mb-4 text-xs text-ink4">One row per size (and colour). Stock drops automatically when an order is paid.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left"><tr>{['Size', 'Colour', 'SKU', 'Stock', 'Price override (KSh)', 'Status', ''].map((h) => <th key={h} className="pr-2 pb-2 text-[10px] font-medium uppercase tracking-widest text-ink3">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? `new-${i}`}>
                <td className="pr-2 pb-2"><input className={inputCls + ' w-24'} value={r.size} onChange={(e) => patch(i, { size: e.target.value })} placeholder="US 9" /></td>
                <td className="pr-2 pb-2"><input className={inputCls + ' w-28'} value={r.color} onChange={(e) => patch(i, { color: e.target.value })} /></td>
                <td className="pr-2 pb-2"><input className={inputCls + ' w-32'} value={r.sku} onChange={(e) => patch(i, { sku: e.target.value })} placeholder="auto" /></td>
                <td className="pr-2 pb-2"><input type="number" min="0" className={inputCls + ' w-20'} value={r.stock} onChange={(e) => patch(i, { stock: e.target.value })} /></td>
                <td className="pr-2 pb-2"><input type="number" step="0.01" className={inputCls + ' w-28'} value={r.price_override ?? ''} onChange={(e) => patch(i, { price_override: e.target.value })} placeholder="—" /></td>
                <td className="pr-2 pb-2"><select className={inputCls + ' min-w-[8.5rem]'} value={r.status} onChange={(e) => patch(i, { status: e.target.value })}><option>published</option><option>draft</option><option>archived</option></select></td>
                <td className="pb-2"><button onClick={() => remove(i)} className="px-2 text-ink3 hover:text-red-700 dark:text-red-400" aria-label="Remove size">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={add} className={btnGhost}>+ Add size</button>
        <button onClick={save} className={btnPrimary}>Save sizes</button>
        {msg && <span className="text-xs text-ink2">{msg}</span>}
      </div>
    </section>
  )
}

function Images({ product }) {
  const [rows, setRows] = useState([])
  const [url, setUrl] = useState('')
  const [err, setErr] = useState('')
  const load = useCallback(async () => {
    const { data } = await supabase.from('product_images').select('*').eq('product_id', product.id).order('sort_order')
    setRows(data ?? [])
  }, [product.id])
  useEffect(() => { load() }, [load])

  async function add(u) {
    if (!u) return
    const { error } = await supabase.from('product_images').insert({ product_id: product.id, url: u, alt_text: product.name, sort_order: rows.length + 1 })
    if (error) setErr(error.message); else { setUrl(''); load() }
  }
  async function remove(r) {
    if (!confirm('Remove this image?')) return
    await supabase.from('product_images').delete().eq('id', r.id); load()
  }
  async function move(i, d) {
    const j = i + d
    if (j < 0 || j >= rows.length) return
    const a = rows[i], b = rows[j]
    await Promise.all([
      supabase.from('product_images').update({ sort_order: j + 1 }).eq('id', a.id),
      supabase.from('product_images').update({ sort_order: i + 1 }).eq('id', b.id),
    ])
    load()
  }

  return (
    <section className={`${card} mt-6 p-6`}>
      <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-ink">Images</h2>
      <p className="mb-4 text-xs text-ink4">The first image is the cover shown on cards.</p>
      {errorBox(err)}
      <div className="mb-5 flex flex-wrap gap-4">
        {rows.map((r, i) => (
          <div key={r.id} className="w-32">
            <img src={r.url} alt="" className="mb-2 aspect-square w-full border border-line2 object-cover" />
            <div className="flex justify-between text-xs text-ink3">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="hover:text-ink disabled:opacity-30" aria-label="Move earlier">←</button>
              <button onClick={() => remove(r)} className="hover:text-red-700 dark:text-red-400">Remove</button>
              <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="hover:text-ink disabled:opacity-30" aria-label="Move later">→</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-ink4">No images yet.</p>}
      </div>
      <div className="max-w-md space-y-3">
        <div className="flex gap-2">
          <input className={inputCls} placeholder="Paste image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button onClick={() => add(url)} className={btnGhost}>Add</button>
        </div>
        <ImageInput bucket="product-images" value="" onChange={add} />
      </div>
    </section>
  )
}

export default function ProductEditor() {
  const { id } = useParams()
  const isNew = id === 'new'
  const nav = useNavigate()
  const [product, setProduct] = useState(null)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isNew) { setForm(toForm(fields, null)); return }
    supabase.from('products').select('*').eq('id', id).maybeSingle().then(({ data, error }) => {
      if (error || !data) setError(error?.message ?? 'Not found')
      else { setProduct(data); setForm(toForm(fields, data)) }
    })
  }, [id, isNew])

  if (!form) return <p className="text-ink4">{error || 'Loading…'}</p>
  const set = (n, v) => setForm((f) => ({ ...f, [n]: v }))

  async function save(e) {
    e.preventDefault()
    setError(''); setSaved(false); setSaving(true)
    const payload = toPayload(fields, form, isNew)
    const q = isNew ? supabase.from('products').insert(payload).select('id').single() : supabase.from('products').update(payload).eq('id', id).select('*').single()
    const { data, error } = await q
    setSaving(false)
    if (error) return setError(error.message)
    if (isNew) nav(`/admin/products/${data.id}`, { replace: true })
    else { setProduct(data); setSaved(true) }
  }

  return (
    <div className="max-w-3xl">
      <Link to="/admin/products" className="text-[10px] uppercase tracking-widest text-ink3 hover:text-ink">← Products</Link>
      <PageHeader title={isNew ? 'New product' : form.name || 'Edit product'} sub={isNew ? 'Save details first, then add sizes and images' : 'Product details'}>
        {!isNew && <a href={`/product/${product?.slug}`} target="_blank" rel="noreferrer" className={btnGhost}>View on site ↗</a>}
      </PageHeader>
      <form onSubmit={save} className={`${card} space-y-5 p-6`}>
        <div className="grid gap-5 md:grid-cols-2">
          {fields.filter((f) => !['description', 'short_description', 'specs', 'tags'].includes(f.name)).map((fd) => <FieldInput key={fd.name} fd={fd} value={form[fd.name]} form={form} set={set} isNew={isNew} />)}
        </div>
        {fields.filter((f) => ['short_description', 'description', 'specs', 'tags'].includes(f.name)).map((fd) => <FieldInput key={fd.name} fd={fd} value={form[fd.name]} form={form} set={set} isNew={isNew} />)}
        {errorBox(error)}
        <div className="flex items-center gap-3">
          <button disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}</button>
          {saved && <span className="text-xs text-emerald-700 dark:text-emerald-400">Saved.</span>}
        </div>
      </form>
      {product && <><Variants product={product} /><Images product={product} /></>}
    </div>
  )
}
