import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'
import { fetchProducts, kes, useQuery } from '../lib/api'
import { supabase } from '../lib/supabase'
import { useSite } from '../context/SiteContext'
import { useTitle } from '../lib/useTitle'
import HeartButton from '../components/HeartButton'

const inputCls = 'w-full bg-surface border border-line2 px-4 py-3 text-sm text-ink placeholder:text-ink5 focus:outline-none focus:border-[#d97706] transition-colors'

function Reviews({ productId }) {
  const [tick, setTick] = useState(0)
  const { data: reviews } = useQuery(async () => (await supabase.from('reviews').select('id,rating,title,body,reviewer_name,created_at')
    .eq('product_id', productId).order('created_at', { ascending: false })).data ?? [], [productId, tick])
  const [form, setForm] = useState({ reviewer_name: '', rating: 5, title: '', body: '' })
  const [state, setState] = useState('')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    const { error } = await supabase.from('reviews').insert({ ...form, rating: Number(form.rating), product_id: productId })
    if (error) return setState('error')
    setState('sent'); setForm({ reviewer_name: '', rating: 5, title: '', body: '' }); setTick((t) => t + 1)
  }
  const avg = reviews?.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null

  return (
    <div className="mt-20 sm:mt-32 grid lg:grid-cols-2 gap-10 lg:gap-16">
      <div>
        <h2 className="font-['Space_Grotesk'] text-2xl text-ink tracking-tighter mb-2">Reviews</h2>
        <p className="text-[10px] text-ink4 uppercase tracking-widest mb-8">{avg ? `${avg} / 5 · ${reviews.length} review${reviews.length > 1 ? 's' : ''}` : 'No reviews yet'}</p>
        <div className="space-y-px">
          {(reviews ?? []).map((r) => (
            <div key={r.id} className="bg-surface border border-line p-6">
              <p className="text-accent text-xs tracking-widest mb-2">{'★'.repeat(r.rating)}<span className="text-ink5">{'★'.repeat(5 - r.rating)}</span></p>
              {r.title && <h3 className="text-ink text-sm font-medium mb-1">{r.title}</h3>}
              <p className="text-xs text-ink3 leading-relaxed">{r.body}</p>
              <p className="text-[10px] text-ink5 uppercase tracking-widest mt-3">{r.reviewer_name || 'Verified buyer'}</p>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={submit} className="space-y-3 self-start">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink mb-4">Write a review</h3>
        {state === 'sent' && <p className="text-xs text-accent">Thanks! Your review will appear once approved.</p>}
        {state === 'error' && <p className="text-xs text-red-700 dark:text-red-400">Couldn't submit your review. Try again.</p>}
        <div className="grid grid-cols-2 gap-3">
          <input className={inputCls} placeholder="Your name" value={form.reviewer_name} onChange={(e) => set('reviewer_name', e.target.value)} required />
          <select className={inputCls} value={form.rating} onChange={(e) => set('rating', e.target.value)}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>
        <input className={inputCls} placeholder="Title" value={form.title} onChange={(e) => set('title', e.target.value)} />
        <textarea className={inputCls} rows={4} placeholder="Your review" value={form.body} onChange={(e) => set('body', e.target.value)} required />
        <button className="bg-[#d97706] text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors">Submit Review</button>
      </form>
    </div>
  )
}

function SizeGuide({ onClose }) {
  const g = useSite().settings.size_guide ?? { rows: [] }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-6" onClick={onClose} role="dialog" aria-modal="true" aria-label="Size guide">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-surface border border-line2 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-['Space_Grotesk'] text-xl text-ink">Size guide</h2>
          <button onClick={onClose} aria-label="Close" className="text-ink3 hover:text-ink text-xl">✕</button>
        </div>
        <p className="text-xs text-ink3 mb-5 leading-relaxed">{g.note}</p>
        <table className="w-full text-sm text-center">
          <thead className="text-[10px] uppercase tracking-widest text-ink4"><tr><th className="py-2">US</th><th>EU</th><th>UK</th><th>Foot (cm)</th></tr></thead>
          <tbody className="text-soft">{g.rows.map((r) => <tr key={r.us} className="border-t border-line"><td className="py-2.5 text-ink">{r.us}</td><td>{r.eu}</td><td>{r.uk}</td><td>{r.cm}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { add } = useCart()
  const { data, loading } = useQuery(async () => {
    const [p] = await fetchProducts((q) => q.eq('slug', slug))
    if (!p) return { product: null, related: [] }
    const rel = await fetchProducts((q) => q.neq('id', p.id).limit(12))
    return { product: p, related: rel.filter((r) => r.categorySlug === p.categorySlug).slice(0, 4) }
  }, [slug])
  const [variantId, setVariantId] = useState(null)
  const [activeImg, setActiveImg] = useState(0)
  const [added, setAdded] = useState(false)
  const [guide, setGuide] = useState(false)

  useTitle(data?.product?.name)
  if (loading) return <div className="bg-bg min-h-screen" />
  const product = data?.product
  if (!product) return (
    <div className="bg-bg min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-ink4 text-sm uppercase tracking-widest mb-4">Product not found</p>
        <Link to="/collection" className="text-accent text-xs uppercase tracking-widest hover:text-ink transition-colors">Back to Collection</Link>
      </div>
    </div>
  )

  const variant = product.variants.find((v) => v.id === variantId)
  const label = (v) => v.color && v.color !== 'Default' ? `${v.size} · ${v.color}` : v.size
  const lowStock = variant && variant.stock > 0 && variant.stock <= 5

  function handleAdd(thenCheckout) {
    if (!variant) return
    add(product, variant)
    if (thenCheckout) navigate('/cart')
    else { setAdded(true); setTimeout(() => setAdded(false), 2000) }
  }

  return (
    <div className="bg-bg min-h-screen text-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink4 mb-12">
          <Link to="/" className="hover:text-accent transition-colors">Home</Link>
          <span>/</span>
          <Link to="/collection" className="hover:text-accent transition-colors">Collection</Link>
          <span>/</span>
          <span className="text-ink2">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div>
            <div className="bg-surface border border-line aspect-square relative overflow-hidden mb-4 group">
              <img src={product.images[activeImg]} alt={product.name} className="w-full h-full object-cover grayscale-[60%] sepia-[20%] group-hover:scale-105 transition-transform duration-700" />
              {product.badge && (
                <span className="absolute top-6 left-6 text-[#d97706] text-[9px] tracking-[0.2em] uppercase font-bold border border-[#d97706]/30 px-3 py-1.5 bg-black/40 backdrop-blur-sm">{product.badge}</span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`w-20 h-20 border overflow-hidden transition-colors ${activeImg === i ? 'border-[#d97706]' : 'border-line2 hover:border-line4'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover grayscale-[60%]" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-accent text-[10px] tracking-[0.3em] uppercase font-bold mb-3">{product.category}</span>
            <h1 className="font-['Space_Grotesk'] text-4xl md:text-5xl text-ink tracking-tighter mb-4">{product.name}</h1>
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-2xl font-medium text-accent">{kes(variant?.price ?? product.price)}</span>
              {product.compareAt && <span className="text-sm text-ink4 line-through">{kes(product.compareAt)}</span>}
            </div>
            <p className="text-ink2 text-sm leading-relaxed mb-10 border-l border-[#d97706]/40 pl-5">{product.description}</p>

            {Object.keys(product.specs).length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-10">
                {Object.entries(product.specs).map(([k, v]) => (
                  <div key={k} className="bg-surface border border-line p-4">
                    <p className="text-[10px] text-ink4 uppercase tracking-widest mb-1">{k}</p>
                    <p className="text-sm text-ink font-medium">{v}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-ink">Select Size <button type="button" onClick={() => setGuide(true)} className="ml-3 text-[10px] font-normal text-ink3 underline underline-offset-4 hover:text-accent">Size guide</button></span>
                {!variant && <span className="text-[10px] text-accent uppercase tracking-widest">Required</span>}
                {lowStock && <span className="text-[10px] text-accent uppercase tracking-widest">Only {variant.stock} left</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button key={v.id} disabled={v.stock < 1} onClick={() => setVariantId(v.id)}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border transition-all ${v.stock < 1 ? 'border-line text-ink5 line-through cursor-not-allowed' : variantId === v.id ? 'bg-[#d97706] text-black border-[#d97706]' : 'border-line2 text-ink2 hover:border-line4 hover:text-ink'}`}>
                    {label(v)}
                  </button>
                ))}
                {product.variants.length === 0 && <p className="text-xs text-ink4 uppercase tracking-widest">Currently unavailable</p>}
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <button onClick={() => handleAdd(false)} disabled={!variant}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${variant ? 'bg-btn text-btn-ink hover:bg-[#d97706]' : 'bg-surface2 text-ink4 cursor-not-allowed'}`}>
                {added ? '✓ Added to Cart' : 'Add to Cart'}
              </button>
              <HeartButton productId={product.id} className="!h-auto w-14 !rounded-none" />
              <button onClick={() => handleAdd(true)} disabled={!variant}
                className={`px-4 sm:px-6 py-4 text-xs font-bold uppercase tracking-widest border transition-all ${variant ? 'border-[#d97706] text-accent hover:bg-[#d97706] hover:text-black' : 'border-line2 text-ink4 cursor-not-allowed'}`}>
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {data.related.length > 0 && (
          <div className="mt-20 sm:mt-32">
            <h2 className="font-['Space_Grotesk'] text-2xl text-ink tracking-tighter mb-10">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
              {data.related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        <Reviews productId={product.id} />
        {guide && <SizeGuide onClose={() => setGuide(false)} />}
      </div>
    </div>
  )
}
