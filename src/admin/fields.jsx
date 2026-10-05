import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { inputCls, labelCls, slugify } from './ui'

const toLocal = (iso) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')

// DB row <-> editable form state
export function toForm(fields, row) {
  const f = {}
  for (const fd of fields) {
    const v = row?.[fd.name] ?? fd.default ?? (fd.type === 'checkbox' ? false : fd.type === 'tags' ? [] : fd.type === 'kv' ? {} : fd.type === 'json' ? null : '')
    f[fd.name] = fd.type === 'datetime' ? toLocal(v) : fd.type === 'tags' ? v.join(', ') : fd.type === 'json' ? JSON.stringify(v, null, 2)
      : fd.type === 'kv' ? Object.entries(v).map(([k, val]) => ({ k, v: String(val) })) : v
  }
  return f
}
export function toPayload(fields, form, isNew) {
  const p = {}
  for (const fd of fields) {
    if (fd.readOnly || (fd.lockOnEdit && !isNew)) continue
    let v = form[fd.name]
    if (fd.type === 'number') v = v === '' ? (fd.nullable ? null : 0) : Number(v)
    else if (fd.type === 'tags') v = v.split(',').map((t) => t.trim()).filter(Boolean)
    else if (fd.type === 'kv') v = Object.fromEntries(v.filter((r) => r.k.trim()).map((r) => [r.k.trim(), r.v]))
    else if (fd.type === 'datetime') v = v ? new Date(v).toISOString() : fd.nullable ? null : undefined
    else if (fd.type === 'json') v = JSON.parse(v || 'null')
    else if (fd.nullable && v === '') v = null
    if (v !== undefined) p[fd.name] = v
  }
  return p
}

export async function uploadImage(bucket, file) {
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`
  const { error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export function ImageInput({ bucket, value, onChange }) {
  const [busy, setBusy] = useState(false)
  async function upload(e) {
    const file = e.target.files[0]
    if (!file) return
    setBusy(true)
    try { onChange(await uploadImage(bucket, file)) } catch (err) { alert(err.message) }
    setBusy(false)
  }
  return (
    <div className="space-y-2">
      {value && <img src={value} alt="" className="h-24 border border-line2 object-cover" />}
      <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Image URL, or upload below" />
      <input type="file" accept="image/*" onChange={upload} disabled={busy} className="text-xs text-ink3 file:mr-3 file:border file:border-line2 file:bg-transparent file:px-3 file:py-1.5 file:text-[10px] file:uppercase file:tracking-widest file:text-ink2" />
      {busy && <span className="text-xs text-ink3"> Uploading…</span>}
    </div>
  )
}

function RefField({ fd, value, onChange }) {
  const [opts, setOpts] = useState([])
  useEffect(() => {
    supabase.from(fd.table).select('*').order('created_at').then(({ data }) => setOpts(data ?? []))
  }, [fd.table])
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} required={fd.required}>
      <option value="">{fd.nullable ? '— none —' : 'Select…'}</option>
      {opts.map((o) => <option key={o.id} value={o.id}>{o.name ?? o.title}</option>)}
    </select>
  )
}

function KvField({ value, onChange }) {
  const set = (i, patch) => onChange(value.map((r, j) => j === i ? { ...r, ...patch } : r))
  return (
    <div className="space-y-2">
      {value.map((r, i) => (
        <div key={i} className="flex gap-2">
          <input className={inputCls} placeholder="e.g. weight" value={r.k} onChange={(e) => set(i, { k: e.target.value })} />
          <input className={inputCls} placeholder="e.g. 198g" value={r.v} onChange={(e) => set(i, { v: e.target.value })} />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="px-3 text-ink3 hover:text-red-700 dark:text-red-400" aria-label="Remove">✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { k: '', v: '' }])} className="text-[10px] font-bold uppercase tracking-widest text-accent hover:text-ink">+ Add spec</button>
    </div>
  )
}

// One form control for a field definition from resources.js
export function FieldInput({ fd, value: v, form, set, isNew }) {
  const disabled = fd.readOnly || (fd.lockOnEdit && !isNew)
  const common = { className: inputCls, disabled, required: fd.required }
  const on = (e) => set(fd.name, e.target.value)
  return (
    <label className="block">
      <span className={labelCls}>{(fd.label ?? fd.name).replace(/_/g, ' ')}</span>
      {fd.type === 'text' && <input {...common} value={v} onChange={on} onBlur={() => { if (fd.slugFrom && !form[fd.name] && form[fd.slugFrom]) set(fd.name, slugify(form[fd.slugFrom])) }} />}
      {fd.type === 'textarea' && <textarea {...common} rows={fd.rows ?? 4} value={v} onChange={on} />}
      {fd.type === 'json' && <textarea {...common} rows={5} className={common.className + ' font-mono text-xs'} value={v} onChange={on} />}
      {fd.type === 'number' && <input {...common} type="number" step={fd.step ?? '1'} value={v} onChange={on} />}
      {fd.type === 'datetime' && <input {...common} type="datetime-local" value={v} onChange={on} />}
      {fd.type === 'tags' && <input {...common} placeholder="comma, separated" value={v} onChange={on} />}
      {fd.type === 'checkbox' && <input type="checkbox" className="h-4 w-4 accent-[#d97706]" checked={!!v} disabled={disabled} onChange={(e) => set(fd.name, e.target.checked)} />}
      {fd.type === 'select' && <select {...common} value={v} onChange={on}>{fd.options.map((o) => <option key={o} value={o}>{o}</option>)}</select>}
      {fd.type === 'image' && <ImageInput bucket={fd.bucket} value={v} onChange={(x) => set(fd.name, x)} />}
      {fd.type === 'ref' && <RefField fd={fd} value={v} onChange={(x) => set(fd.name, x)} />}
      {fd.type === 'kv' && <KvField value={v} onChange={(x) => set(fd.name, x)} />}
    </label>
  )
}
