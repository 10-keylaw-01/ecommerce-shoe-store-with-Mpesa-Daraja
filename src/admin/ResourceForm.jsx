import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resources } from './resources'
import { FieldInput, toForm, toPayload } from './fields'
import { btnPrimary, card, errorBox, show } from './ui'

function Related({ rel, id }) {
  const [rows, setRows] = useState([])
  useEffect(() => {
    supabase.from(rel.table).select('*').eq(rel.fk, id).order('created_at').then(({ data }) => setRows(data ?? []))
  }, [rel, id])
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink">{rel.title}</h2>
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm text-soft">
          <thead className="text-left text-[10px] uppercase tracking-widest text-ink4"><tr>{rel.columns.map((c) => <th key={c} className="px-4 py-3 font-medium">{c.replace(/_/g, ' ')}</th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-line">{rel.columns.map((c) => <td key={c} className="px-4 py-3">{show(row[c])}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </section>
  )
}

export default function ResourceForm({ table: tableProp }) {
  const params = useParams()
  const table = tableProp ?? params.table
  const id = params.id
  const r = resources[table]
  const pk = r?.pk ?? 'id'
  const isNew = id === 'new'
  const nav = useNavigate()
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!r) return
    if (isNew) { setForm(toForm(r.fields, null)); return }
    supabase.from(table).select('*').eq(pk, id).maybeSingle().then(({ data, error }) => {
      if (error || !data) setError(error?.message ?? 'Not found')
      else setForm(toForm(r.fields, data))
    })
  }, [r, table, id, isNew, pk])

  if (!r) return <p className="text-ink2">Unknown section.</p>
  if (!form) return <p className="text-ink4">{error || 'Loading…'}</p>

  const set = (name, v) => setForm((f) => ({ ...f, [name]: v }))

  async function save(e) {
    e.preventDefault()
    setError('')
    let payload
    try { payload = toPayload(r.fields, form, isNew) } catch (err) { return setError(`Invalid JSON: ${err.message}`) }
    setSaving(true)
    const { error } = await (isNew ? supabase.from(table).insert(payload) : supabase.from(table).update(payload).eq(pk, id))
    setSaving(false)
    if (error) setError(error.message); else nav(`/admin/${table}`)
  }

  return (
    <div className="max-w-2xl">
      <Link to={`/admin/${table}`} className="text-[10px] uppercase tracking-widest text-ink3 hover:text-ink">← {r.label}</Link>
      <h1 className="font-['Space_Grotesk'] text-3xl text-ink tracking-tighter mt-2 mb-6">{isNew ? 'New' : 'Edit'} {r.label.toLowerCase()}</h1>
      <form onSubmit={save} className={`${card} space-y-5 p-6`}>
        {r.fields.map((fd) => <FieldInput key={fd.name} fd={fd} value={form[fd.name]} form={form} set={set} isNew={isNew} />)}
        {errorBox(error)}
        {!r.readOnly && <button disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : 'Save'}</button>}
      </form>
      {!isNew && r.related?.map((rel) => <Related key={rel.table} rel={rel} id={id} />)}
    </div>
  )
}
