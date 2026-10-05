import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/api'
import { useSite } from '../context/SiteContext'
import { useTitle } from '../lib/useTitle'

export default function Faq() {
  const h = useSite().settings.faq_page ?? {}
  useTitle(h.title)
  const { data: faqs, loading } = useQuery(async () => (await supabase.from('faqs').select('*').order('sort_order')).data ?? [], [])
  const [open, setOpen] = useState(null)
  return (
    <div className="bg-bg min-h-screen text-body">
      <div className="border-b border-line py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <span className="text-accent font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">{h.eyebrow}</span>
          <h1 className="font-['Space_Grotesk'] text-4xl sm:text-6xl tracking-tighter text-ink">{h.title}</h1>
          <p className="text-ink3 text-sm mt-4">{h.subtitle}</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {loading && <p className="text-ink4 text-xs uppercase tracking-widest">Loading…</p>}
        <div className="space-y-px bg-line">
          {(faqs ?? []).map((f) => (
            <div key={f.id} className="bg-bg">
              <button onClick={() => setOpen(open === f.id ? null : f.id)} aria-expanded={open === f.id} className="w-full flex items-center justify-between gap-4 text-left p-5 sm:p-6 hover:bg-surface transition-colors">
                <span className="text-ink text-sm font-bold uppercase tracking-wider">{f.question}</span>
                <span className={`text-accent text-xl transition-transform ${open === f.id ? 'rotate-45' : ''}`}>+</span>
              </button>
              {open === f.id && <p className="px-5 sm:px-6 pb-6 text-sm text-ink2 leading-relaxed">{f.answer}</p>}
            </div>
          ))}
        </div>
        <p className="mt-12 text-xs text-ink3">Still stuck? <Link to="/contact" className="text-accent hover:text-ink">Contact us</Link> or <Link to="/track-order" className="text-accent hover:text-ink">track an order</Link>.</p>
      </div>
    </div>
  )
}
