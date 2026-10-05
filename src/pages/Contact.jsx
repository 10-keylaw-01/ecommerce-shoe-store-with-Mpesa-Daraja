import { useState } from 'react'
import { useTitle } from '../lib/useTitle'
import { useSite } from '../context/SiteContext'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/api'

export default function Contact() {
  useTitle('Contact')
  const [tab, setTab] = useState('contact')
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [custom, setCustom] = useState({ name: '', email: '', description: '', size: '', budget: '', message: '' })
  const set = (s, k, v) => s === 'contact' ? setForm((f) => ({ ...f, [k]: v })) : setCustom((f) => ({ ...f, [k]: v }))

  const [err, setErr] = useState('')
  const c = useSite().settings.contact ?? {}
  const { data: faqs } = useQuery(async () => (await supabase.from('faqs').select('*').order('sort_order')).data ?? [], [])

  async function submit(e) {
    e.preventDefault()
    setErr('')
    const { error } = tab === 'contact'
      ? await supabase.from('contact_requests').insert({ name: form.name, email: form.email, subject: form.subject, message: form.message })
      : await supabase.from('custom_requests').insert({ name: custom.name, email: custom.email, product_description: custom.description, size: custom.size, budget_range: custom.budget, message: custom.message })
    if (error) return setErr('Something went wrong sending your message. Please try again.')
    setSent(true)
    setForm({ name: '', email: '', subject: '', message: '' })
    setCustom({ name: '', email: '', description: '', size: '', budget: '', message: '' })
  }

  const inputCls = 'w-full bg-surface border border-line2 px-4 py-3 text-sm text-ink placeholder:text-ink5 focus:outline-none focus:border-[#d97706] transition-colors'

  return (
    <div className="bg-bg min-h-screen text-body">
      {/* Header */}
      <div className="relative border-b border-line py-14 sm:py-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--c-warm) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <span className="text-accent font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">{c.eyebrow}</span>
          <h1 className="font-['Space_Grotesk'] text-4xl sm:text-5xl md:text-7xl tracking-tighter text-ink">{c.title}</h1>
          <p className="text-ink3 text-sm mt-4 max-w-md">{c.subtitle}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-3 gap-10 md:gap-16">
        {/* Info */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-ink mb-8">Reach Us</h2>
          <div className="space-y-8">
            {(c.info ?? []).map((i) => (
              <div key={i.label}>
                <p className="text-[10px] text-ink4 uppercase tracking-widest mb-2">{i.label}</p>
                <p className="text-sm text-ink2 whitespace-pre-line">{i.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-2">
          {/* Tabs */}
          <div className="flex border-b border-line mb-8 overflow-x-auto">
            {[['contact', 'General Inquiry'], ['custom', 'Custom Order']].map(([k, label]) => (
              <button
                key={k}
                onClick={() => { setTab(k); setSent(false) }}
                className={`pb-4 mr-6 sm:mr-8 whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-colors border-b-2 ${tab === k ? 'text-accent border-[#d97706]' : 'text-ink4 border-transparent hover:text-ink2'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {err && <p className="mb-4 text-xs text-red-700 dark:text-red-400">{err}</p>}
          {sent ? (
            <div className="bg-surface border border-[#d97706]/30 p-8 sm:p-12 text-center">
              <div className="w-12 h-12 border border-[#d97706] flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h3 className="font-['Space_Grotesk'] text-2xl text-ink mb-3">Message Sent</h3>
              <p className="text-ink3 text-sm mb-8">We'll get back to you within 24 hours.</p>
              <button onClick={() => setSent(false)} className="text-xs font-bold uppercase tracking-widest text-accent hover:text-ink transition-colors">
                Send Another
              </button>
            </div>
          ) : tab === 'contact' ? (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input className={inputCls} placeholder="Your name" value={form.name} onChange={(e) => set('contact', 'name', e.target.value)} required />
                <input className={inputCls} placeholder="Email address" type="email" value={form.email} onChange={(e) => set('contact', 'email', e.target.value)} required />
              </div>
              <input className={inputCls} placeholder="Subject" value={form.subject} onChange={(e) => set('contact', 'subject', e.target.value)} required />
              <textarea className={inputCls} placeholder="Your message" rows={6} value={form.message} onChange={(e) => set('contact', 'message', e.target.value)} required />
              <button type="submit" className="bg-[#d97706] text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors">
                Send Message
              </button>
            </form>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="bg-surface2 border border-line p-4 mb-2">
                <p className="text-[10px] text-ink3 uppercase tracking-widest">{c.custom_note}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input className={inputCls} placeholder="Your name" value={custom.name} onChange={(e) => set('custom', 'name', e.target.value)} required />
                <input className={inputCls} placeholder="Email address" type="email" value={custom.email} onChange={(e) => set('custom', 'email', e.target.value)} required />
              </div>
              <textarea className={inputCls} placeholder="Describe your custom shoe (style, materials, colors...)" rows={4} value={custom.description} onChange={(e) => set('custom', 'description', e.target.value)} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input className={inputCls} placeholder="Your size (e.g. US 10)" value={custom.size} onChange={(e) => set('custom', 'size', e.target.value)} required />
                <select className={inputCls} value={custom.budget} onChange={(e) => set('custom', 'budget', e.target.value)} required>
                  <option value="">Budget range</option>
                  {(c.budget_ranges ?? []).map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <textarea className={inputCls} placeholder="Any additional notes or references" rows={3} value={custom.message} onChange={(e) => set('custom', 'message', e.target.value)} />
              <button type="submit" className="bg-[#d97706] text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors">
                Submit Custom Request
              </button>
            </form>
          )}
        </div>
      </div>

      {(faqs ?? []).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
          <h2 className="font-['Space_Grotesk'] text-2xl text-ink tracking-tighter mb-8">Frequently Asked</h2>
          <div className="grid md:grid-cols-2 gap-px bg-line">
            {faqs.map((f) => (
              <div key={f.id} className="bg-bg p-8">
                <h3 className="text-ink text-sm font-bold uppercase tracking-wider mb-3">{f.question}</h3>
                <p className="text-xs text-ink3 leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
