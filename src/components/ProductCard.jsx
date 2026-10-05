import { Link } from 'react-router-dom'
import { kes } from '../lib/api'
import HeartButton from './HeartButton'

export default function ProductCard({ product }) {
  const inStock = product.variants.some((v) => v.stock > 0)

  return (
    <div className="group relative">
      <Link to={`/product/${product.slug}`}>
        <div className="bg-surface border border-line mb-4 aspect-[3/4] relative overflow-hidden group-hover:border-warm transition-colors duration-500">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover grayscale-[80%] sepia-[10%] opacity-80 group-hover:scale-105 transition-transform duration-700"
          />
          <HeartButton productId={product.id} onImage className="absolute top-3 right-3 z-10" />
          {product.badge && (
            <span className="absolute top-3 left-3 sm:top-4 sm:left-4 max-w-[calc(100%-4.25rem)] truncate text-[#d97706] text-[8px] sm:text-[9px] tracking-[0.12em] sm:tracking-[0.2em] uppercase font-bold border border-[#d97706]/30 px-2 py-1 bg-black/40 backdrop-blur-sm">
              {product.badge}
            </span>
          )}
          <div className="force-dark absolute bottom-0 left-0 w-full bg-black/60 backdrop-blur-md p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <span className="w-full text-ink text-[10px] font-bold uppercase tracking-widest flex justify-between">
              <span>{inStock ? 'Select Size' : 'Sold Out'}</span>
              <span>{kes(product.price)}</span>
            </span>
          </div>
        </div>
      </Link>
      <div className="flex justify-between items-end gap-2">
        <div>
          <p className="text-[10px] text-ink3 uppercase tracking-widest mb-1">{product.category}</p>
          <Link to={`/product/${product.slug}`}>
            <h3 className="text-ink font-medium text-base hover:text-accent transition-colors">{product.name}</h3>
          </Link>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-accent">{kes(product.price)}</span>
          {product.compareAt && (
            <p className="text-[10px] text-ink4 line-through">{kes(product.compareAt)}</p>
          )}
        </div>
      </div>
    </div>
  )
}
