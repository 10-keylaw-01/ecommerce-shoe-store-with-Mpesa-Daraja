import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { tabs } from './content'
import { ImageInput } from './fields'
import { PageHeader, btnGhost, btnPrimary, card, errorBox, inputCls, labelCls } from './ui'

function Node({ def, value, onChange }) {
  const label = <span className={labelCls}>{def.label}</span>
  switch (def.type) {
    case 'textarea': return <label className="block">{label}<textarea className={inputCls} rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>
    case 'number': return <label className="block">{label}<input type="number" step="any" className={inputCls + ' max-w-xs'} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))} /></label>
    case 'image': return <div>{label}<ImageInput bucket="site-assets" value={value ?? ''} onChange={onChange} /></div>
    case 'strings': {
      const list = value ?? []
      return (
        <div>{label}
          <div className="space-y-2">
            {list.map((v, i) => (
              <div key={i} className="flex gap-2">
                <input className={inputCls} value={v} onChange={(e) => onChange(list.map((x, j) => j === i ? e.target.value : x))} />
                <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="px-3 text-ink3 hover:text-red-700 dark:text-red-400" aria-label="Remove">✕</button>
              </div>
            ))}
            <button type="button" onClick={() => onChange([...list, ''])} className="text-[10px] font-bold uppercase tracking-widest text-accent hover:text-ink">+ Add</button>
          </div>
        </div>
      )
    }
    case 'list': {
      const list = value ?? []
      return (
        <div>{label}
          <div className="space-y-3">
            {list.map((item, i) => (
              <div key={i} className="space-y-3 border border-line bg-bg-alt p-4">
                {def.fields.map((f) => <Node key={f.name} def={f} value={item[f.name]} onChange={(v) => onChange(list.map((x, j) => j === i ? { ...x, [f.name]: v } : x))} />)}
                <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="text-[10px] uppercase tracking-widest text-ink3 hover:text-red-700 dark:text-red-400">Remove item</button>
              </div>
            ))}
            <button type="button" onClick={() => onChange([...list, { ...def.blank }])} className={btnGhost}>+ Add item</button>
          </div>
        </div>
      )
    }
    case 'object': {
      const obj = value ?? {}
      return <div className="space-y-4">{def.fields.map((f) => <Node key={f.name} def={f} value={obj[f.name]} onChange={(v) => onChange({ ...obj, [f.name]: v })} />)}</div>
    }
    default: return <label className="block">{label}<input className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>
  }
}

export default function ContentEditor() {
  const [tab, setTab] = useState('general')
  const [values, setValues] = useState(null)
  const [original, setOriginal] = useState({})
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('site_settings').select('key,value').then(({ data, error }) => {
      if (error) return setError(error.message)
      const v = Object.fromEntries(data.map((r) => [r.key, r.value]))
      setValues(v); setOriginal(JSON.parse(JSON.stringify(v)))
    })
  }, [])

  if (!values) return <p className="text-ink4">{error || 'Loading…'}</p>
  const current = tabs.find((t) => t.id === tab)
  const dirty = current.items.filter((it) => JSON.stringify(values[it.key]) !== JSON.stringify(original[it.key]))

  async function save() {
    setSaving(true); setMsg(''); setError('')
    const { error } = await supabase.from('site_settings').upsert(dirty.map((it) => ({ key: it.key, value: values[it.key] ?? null })))
    setSaving(false)
    if (error) return setError(error.message)
    setOriginal((o) => ({ ...o, ...Object.fromEntries(dirty.map((it) => [it.key, JSON.parse(JSON.stringify(values[it.key]))])) }))
    setMsg('Saved — live on the website now.')
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Site content" sub="Edit the words and images across the storefront" />
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setMsg('') }} className={`border px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${tab === t.id ? 'border-[#d97706] bg-[#d97706] text-black' : 'border-line2 text-ink2 hover:border-line4'}`}>{t.label}</button>
        ))}
      </div>
      {current.note && <p className="mb-4 border border-line bg-surface p-4 text-xs text-ink2">{current.note}</p>}
      {errorBox(error)}
      <div className="space-y-6">
        {current.items.map((it) => (
          <section key={it.key} className={`${card} p-6`}>
            {it.type === 'object' && <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-ink">{it.label}</h2>}
            {it.type === 'strings' && <h2 className="sr-only">{it.label}</h2>}
            <Node def={it.type === 'object' ? it : it} value={values[it.key]} onChange={(v) => setValues((s) => ({ ...s, [it.key]: v }))} />
          </section>
        ))}
      </div>
      <div className="sticky bottom-0 mt-6 flex items-center gap-4 border-t border-line bg-bg-alt/95 py-4 backdrop-blur">
        <button onClick={save} disabled={saving || !dirty.length} className={btnPrimary}>{saving ? 'Saving…' : 'Save changes'}</button>
        <span className="text-xs text-ink3">{msg || (dirty.length ? `${dirty.length} unsaved section${dirty.length > 1 ? 's' : ''}` : 'No changes')}</span>
      </div>
    </div>
  )
}
