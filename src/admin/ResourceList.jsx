import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resources } from './resources'
import { Badge, PageHeader, btnPrimary, card, errorBox, fmtDate, inputCls, show } from './ui'

const isImg = (c) => /(^|_)(url|image_url|logo_url|cover_image_url)$/.test(c)
const isDate = (c) => /_at$/.test(c)

function Cell({ c, v }) {
  if (c === 'status' && v) return <Badge value={v} />
  if (isImg(c) && v) return <img src={v} alt="" className="h-10 w-10 border border-line2 object-cover" />
  if (isDate(c)) return fmtDate(v)
  if (typeof v === 'boolean') return v ? 'Yes' : '—'
  return show(v)
}

export default function ResourceList() {
  const { table } = useParams()
  const r = resources[table]
  const pk = r?.pk ?? 'id'
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from(table).select('*').order(r.order, { ascending: !r.desc })
    setError(error?.message ?? ''); setRows(data ?? []); setLoading(false)
  }, [table, r])
  useEffect(() => { if (r) { setLoading(true); load() } }, [r, load])

  if (!r) return <p className="text-ink2">Unknown section.</p>
  const filtered = q ? rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q.toLowerCase())) : rows

  async function remove(row) {
    if (!confirm('Delete this record? This cannot be undone.')) return
    const { error } = await supabase.from(table).delete().eq(pk, row[pk])
    if (error) setError(error.message); else load()
  }

  return (
    <div>
      <PageHeader title={r.label} sub={`${filtered.length} record${filtered.length === 1 ? '' : 's'}`}>
        <input className={inputCls + ' w-56'} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        {r.canCreate !== false && <Link to={`/admin/${table}/new`} className={btnPrimary}>+ New</Link>}
      </PageHeader>
      {errorBox(error)}
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-widest text-ink4">
            <tr>{r.columns.map((c) => <th key={c} className="px-4 py-3 font-medium">{c.replace(/_/g, ' ')}</th>)}<th /></tr>
          </thead>
          <tbody className="text-soft">
            {loading && <tr><td className="p-4 text-ink4" colSpan={r.columns.length + 1}>Loading…</td></tr>}
            {!loading && !filtered.length && <tr><td className="p-4 text-ink4" colSpan={r.columns.length + 1}>No records.</td></tr>}
            {filtered.map((row) => (
              <tr key={row[pk]} className="border-t border-line hover:bg-hov">
                {r.columns.map((c) => <td key={c} className="max-w-xs truncate px-4 py-3"><Cell c={c} v={row[c]} /></td>)}
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs">
                  <Link to={`/admin/${table}/${encodeURIComponent(row[pk])}`} className="mr-4 uppercase tracking-widest text-accent hover:text-ink">{r.readOnly ? 'View' : 'Edit'}</Link>
                  {r.canDelete !== false && <button onClick={() => remove(row)} className="uppercase tracking-widest text-ink3 hover:text-red-700 dark:text-red-400">Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
