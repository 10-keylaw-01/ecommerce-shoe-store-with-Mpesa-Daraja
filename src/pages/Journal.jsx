import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/api'
import { useSite } from '../context/SiteContext'
import { useTitle } from '../lib/useTitle'

export const fmtDay = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export default function Journal() {
  const j = useSite().settings.journal ?? {}
  useTitle(j.title)
  const [cat, setCat] = useState('all')
  const { data, loading } = useQuery(async () => {
    const [posts, cats] = await Promise.all([
      supabase.from('blogs').select('id,title,slug,excerpt,cover_image_url,published_at,category:blog_categories(name,slug)').lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }),
      supabase.from('blog_categories').select('name,slug').order('sort_order'),
    ])
    return { posts: posts.data ?? [], cats: cats.data ?? [] }
  }, [])
  const posts = (data?.posts ?? []).filter((p) => cat === 'all' || p.category?.slug === cat)
  const pill = (on) => `px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${on ? 'bg-[#d97706] text-black border-[#d97706]' : 'border-line2 text-ink2 hover:border-line4 hover:text-ink'}`

  return (
    <div className="bg-bg min-h-screen text-body">
      <div className="relative border-b border-line py-14 sm:py-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--c-warm) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <span className="text-accent font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">{j.eyebrow}</span>
          <h1 className="font-['Space_Grotesk'] text-4xl sm:text-5xl md:text-7xl tracking-tighter text-ink">{j.title}</h1>
          <p className="text-ink3 text-sm mt-4 max-w-md">{j.subtitle}</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="flex flex-wrap gap-2 mb-10">
          <button onClick={() => setCat('all')} className={pill(cat === 'all')}>All</button>
          {(data?.cats ?? []).map((c) => <button key={c.slug} onClick={() => setCat(c.slug)} className={pill(cat === c.slug)}>{c.name}</button>)}
        </div>
        {loading ? <p className="text-center py-24 text-ink4 text-xs uppercase tracking-widest">Loading…</p>
          : posts.length === 0 ? <p className="text-center py-24 text-ink4 text-sm uppercase tracking-widest">No posts yet</p>
          : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {posts.map((p) => (
                <Link key={p.id} to={`/journal/${p.slug}`} className="group block">
                  <div className="aspect-[16/10] bg-surface border border-line overflow-hidden mb-5 group-hover:border-warm transition-colors">
                    {p.cover_image_url && <img src={p.cover_image_url} alt="" loading="lazy" className="w-full h-full object-cover grayscale-[70%] sepia-[15%] group-hover:scale-105 transition-transform duration-700" />}
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-accent mb-2">{p.category?.name} · {fmtDay(p.published_at)}</p>
                  <h2 className="font-['Space_Grotesk'] text-xl text-ink mb-2 group-hover:text-accent transition-colors">{p.title}</h2>
                  <p className="text-xs text-ink3 leading-relaxed">{p.excerpt}</p>
                </Link>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
