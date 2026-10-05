import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchProducts, kes } from '../lib/api'

export default function SearchOverlay({ onClose }) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const ref = useRef(null)

  useEffect(() => { ref.current?.focus() }, [])
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  // Debounced live search over name / short description.
  useEffect(() => {
    const term = q.trim().replace(/[%,()]/g, ' ')
    if (term.length < 2) return
    let live = true
    const t = setTimeout(() => {
      fetchProducts((x) => x.or(`name.ilike.%${term}%,short_description.ilike.%${term}%,description.ilike.%${term}%`).limit(6))
        .then((r) => live && setResults(r)).catch(() => live && setResults([]))
    }, 250)
    return () => { live = false; clearTimeout(t) }
  }, [q])

  const shown = q.trim().length < 2 ? null : results

  function submit(e) {
    e.preventDefault()
    if (q.trim()) { nav(`/collection?q=${encodeURIComponent(q.trim())}`); onClose() }
  }

  return (
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-xl overflow-y-auto" role="dialog" aria-modal="true" aria-label="Search">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 pt-8 sm:pt-16 pb-16">
        <div className="flex items-center justify-between mb-8">
          <span className="text-[10px] uppercase tracking-[0.3em] text-ink4">Search</span>
          <button onClick={onClose} aria-label="Close search" className="text-ink3 hover:text-ink p-2 -mr-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={submit}>
          <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shoes…" className="w-full bg-transparent border-b border-line3 pb-4 text-2xl sm:text-4xl font-['Space_Grotesk'] tracking-tighter text-ink placeholder:text-ink5 focus:outline-none focus:border-[#d97706]" />
        </form>
        <div className="mt-8 space-y-px">
          {shown?.length === 0 && <p className="text-sm text-ink4 py-6">No shoes match “{q}”.</p>}
          {shown?.map((p) => (
            <Link key={p.id} to={`/product/${p.slug}`} onClick={onClose} className="flex items-center gap-4 bg-surface border border-line p-3 hover:border-warm transition-colors">
              <img src={p.images[0]} alt="" className="h-16 w-16 object-cover grayscale-[60%] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate">{p.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-ink3">{p.category}</p>
              </div>
              <span className="text-sm text-accent">{kes(p.price)}</span>
            </Link>
          ))}
          {shown?.length > 0 && (
            <button onClick={submit} className="pt-6 text-xs font-bold uppercase tracking-widest text-accent hover:text-ink">See all results →</button>
          )}
        </div>
      </div>
    </div>
  )
}
