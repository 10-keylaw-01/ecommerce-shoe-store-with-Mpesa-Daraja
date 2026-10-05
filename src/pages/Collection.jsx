import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useSite } from '../context/SiteContext'
import { fetchProducts, lines, useQuery } from '../lib/api'
import { useTitle } from '../lib/useTitle'

export default function Collection() {
  const [params, setParams] = useSearchParams()
  const { categories: cats, banner } = useSite()
  const head = banner('category_top')
  useTitle('Collection')
  const { data: products, loading } = useQuery(() => fetchProducts(), [])
  const categories = [{ slug: 'All', name: 'All' }, ...cats]
  const genders = ['All', ...new Set((products ?? []).map((p) => p.gender))]
  const cat = params.get('cat') || 'All'
  const gender = params.get('gender') || 'All'
  const sort = params.get('sort') || 'default'
  const q = params.get('q') || ''
  const inStock = params.get('stock') === '1'
  const [filtersOpen, setFiltersOpen] = useState(false)

  const setParam = (k, v, empty = ['All', 'default', '']) =>
    setParams((p) => { const n = new URLSearchParams(p); if (empty.includes(v)) n.delete(k); else n.set(k, v); return n }, { replace: true })

  useEffect(() => { window.scrollTo({ top: 0 }) }, [q])

  let filtered = products ?? []
  if (q) { const t = q.toLowerCase(); filtered = filtered.filter((p) => `${p.name} ${p.shortDescription} ${p.description} ${p.category}`.toLowerCase().includes(t)) }
  if (cat !== 'All') filtered = filtered.filter((p) => p.categorySlug === cat)
  if (gender !== 'All') filtered = filtered.filter((p) => p.gender === gender || p.gender === 'unisex')
  if (inStock) filtered = filtered.filter((p) => p.variants.some((v) => v.stock > 0))
  if (sort === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price)
  if (sort === 'newest') filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const activeCount = [cat !== 'All', gender !== 'All', inStock].filter(Boolean).length

  const filterBtn = (active) =>
    `px-3 sm:px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all border ${active ? 'bg-[#d97706] text-black border-[#d97706]' : 'border-line2 text-ink2 hover:border-line4 hover:text-ink'}`
  const clear = () => setParams(q ? { q } : {}, { replace: true })

  return (
    <div className="bg-bg min-h-screen text-body">
      <div className="relative border-b border-line py-14 sm:py-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--c-warm) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <span className="text-accent font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">Catalog</span>
          <h1 className="font-['Space_Grotesk'] text-4xl sm:text-5xl md:text-7xl tracking-tighter text-ink">{q ? `Results for “${q}”` : lines(head?.title ?? 'The Collection')[0]}</h1>
          <p className="text-ink3 text-sm mt-4 max-w-md">{head?.subtitle}</p>
        </div>
      </div>

      <div className="sticky top-16 sm:top-20 z-30 bg-bg/95 backdrop-blur-xl border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen} className="lg:hidden border border-line2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-ink2">
              Filters{activeCount > 0 && <span className="ml-2 text-accent">({activeCount})</span>}
            </button>
            <div className="hidden lg:flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-ink4 uppercase tracking-widest mr-2">Category</span>
              {categories.map((c) => <button key={c.slug} onClick={() => setParam('cat', c.slug)} className={filterBtn(cat === c.slug)}>{c.name}</button>)}
              <span className="text-[10px] text-ink4 uppercase tracking-widest mx-2">Gender</span>
              {genders.map((g) => <button key={g} onClick={() => setParam('gender', g)} className={filterBtn(gender === g)}>{g}</button>)}
              <label className="ml-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink2 cursor-pointer">
                <input type="checkbox" className="accent-[#d97706]" checked={inStock} onChange={(e) => setParam('stock', e.target.checked ? '1' : '')} /> In stock
              </label>
            </div>
            <select value={sort} onChange={(e) => setParam('sort', e.target.value)} aria-label="Sort" className="bg-bg border border-line2 text-ink2 text-[10px] uppercase tracking-widest px-3 py-2 focus:outline-none focus:border-[#d97706]">
              <option value="default">Sort: Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
          {filtersOpen && (
            <div className="lg:hidden pt-4 space-y-4">
              <div><p className="text-[10px] text-ink4 uppercase tracking-widest mb-2">Category</p><div className="flex flex-wrap gap-2">{categories.map((c) => <button key={c.slug} onClick={() => setParam('cat', c.slug)} className={filterBtn(cat === c.slug)}>{c.name}</button>)}</div></div>
              <div><p className="text-[10px] text-ink4 uppercase tracking-widest mb-2">Gender</p><div className="flex flex-wrap gap-2">{genders.map((g) => <button key={g} onClick={() => setParam('gender', g)} className={filterBtn(gender === g)}>{g}</button>)}</div></div>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink2"><input type="checkbox" className="accent-[#d97706]" checked={inStock} onChange={(e) => setParam('stock', e.target.checked ? '1' : '')} /> In stock only</label>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {!loading && <p className="text-[10px] uppercase tracking-widest text-ink4 mb-6">{filtered.length} model{filtered.length === 1 ? '' : 's'}</p>}
        {loading ? (
          <p className="text-center py-32 text-ink4 text-xs uppercase tracking-widest">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-ink4 text-sm uppercase tracking-widest">No products found</p>
            <button onClick={clear} className="mt-6 text-accent text-xs uppercase tracking-widest hover:text-ink transition-colors">Clear Filters</button>
            <div className="mt-4"><Link to="/contact" className="text-ink3 text-xs hover:text-ink">Can't find your pair? Ask for a custom order →</Link></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-8 sm:gap-8">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
