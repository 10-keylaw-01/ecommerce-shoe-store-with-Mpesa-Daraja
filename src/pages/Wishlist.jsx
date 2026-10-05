import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useWishlist } from '../context/WishlistContext'
import { fetchProducts, useQuery } from '../lib/api'
import { useTitle } from '../lib/useTitle'

export default function Wishlist() {
  useTitle('Wishlist')
  const { ids } = useWishlist()
  const { data, loading } = useQuery(() => ids.length ? fetchProducts((q) => q.in('id', ids)) : Promise.resolve([]), [ids.join(',')])
  const items = (data ?? []).filter((p) => ids.includes(p.id))
  return (
    <div className="bg-bg min-h-screen text-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="flex items-baseline justify-between mb-10">
          <h1 className="font-['Space_Grotesk'] text-4xl sm:text-5xl tracking-tighter text-ink">Wishlist</h1>
          {items.length > 0 && <span className="text-ink4 text-xs uppercase tracking-widest">{items.length} saved</span>}
        </div>
        {loading && ids.length > 0 ? <p className="text-center py-24 text-ink4 text-xs uppercase tracking-widest">Loading…</p>
          : items.length === 0 ? (
            <div className="text-center py-24 border border-line">
              <p className="text-ink4 text-sm uppercase tracking-widest mb-6">Nothing saved yet</p>
              <Link to="/collection" className="inline-block bg-[#d97706] text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors">Browse the Collection</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          )}
      </div>
    </div>
  )
}
