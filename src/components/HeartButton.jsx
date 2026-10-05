import { useWishlist } from '../context/WishlistContext'

// onImage: sits on top of a product photo (dark glass circle); otherwise it follows the theme.
export default function HeartButton({ productId, className = '', onImage = false }) {
  const { has, toggle } = useWishlist()
  const on = has(productId)
  const look = onImage ? 'border-white/10 bg-black/50 backdrop-blur-sm text-[#e5e5e5]' : 'border-line3 bg-transparent text-ink2'
  return (
    <button
      type="button"
      aria-label={on ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={on}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(productId) }}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:border-[#d97706] ${look} ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={on ? '#d97706' : 'none'} stroke={on ? '#d97706' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  )
}
