import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useSite } from '../context/SiteContext'
import SearchOverlay from './SearchOverlay'
import ThemeToggle from './ThemeToggle'

const links = [['/collection', 'Collection'], ['/atelier', 'Atelier'], ['/performance', 'Performance'], ['/journal', 'Journal'], ['/contact', 'Contact']]

export default function Navbar() {
  const { count } = useCart()
  const wish = useWishlist()
  const { settings } = useSite()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const { pathname } = useLocation()

  // Close the mobile menu on navigation; lock scroll while it's open.
  useEffect(() => { setMobileOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const navLink = ({ isActive }) =>
    `text-xs font-medium uppercase tracking-widest transition-colors ${isActive ? 'text-ink' : 'text-ink2 hover:text-ink'}`
  const icon = 'text-ink2 hover:text-ink transition-transform hover:scale-105 relative p-1'
  const badge = 'absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-[#d97706] rounded-full text-[9px] font-bold text-black flex items-center justify-center'

  return (
    <>
      {settings.announcement_bar && (
        <div className="bg-surface2 text-ink2 py-2 px-4 text-[9px] sm:text-[10px] uppercase text-center tracking-[0.15em] sm:tracking-[0.2em] font-medium border-b border-line">
          {settings.announcement_bar}
        </div>
      )}

      <nav className="sticky top-0 z-40 w-full backdrop-blur-xl bg-bg/80 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <button className="lg:hidden p-2 -ml-2 text-ink2 hover:text-ink transition-colors" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {mobileOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 5h16M4 12h16M4 19h16" />}
            </svg>
          </button>

          <Link to="/" className="font-['Space_Grotesk'] font-bold text-xl sm:text-2xl tracking-tighter uppercase text-ink max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2">
            {settings.site_name}<span className="text-[#78350f]">.</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 xl:gap-10 absolute left-1/2 -translate-x-1/2">
            {links.map(([to, label]) => <NavLink key={to} to={to} className={navLink}>{label}</NavLink>)}
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button onClick={() => setSearching(true)} className={icon} aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>
            </button>
            <ThemeToggle className="hover:scale-105" />
            <Link to="/wishlist" className={icon + ' hidden sm:block'} aria-label={`Wishlist (${wish.count})`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
              {wish.count > 0 && <span className={badge}>{wish.count}</span>}
            </Link>
            <Link to="/cart" className={icon} aria-label={`Cart (${count})`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 10a4 4 0 0 1-8 0M3.103 6.034h17.794" />
                <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
              </svg>
              {count > 0 && <span className={badge}>{count}</span>}
            </Link>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden absolute inset-x-0 top-full border-t border-line bg-bg px-6 py-6 flex flex-col gap-5 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {links.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => `text-sm font-medium uppercase tracking-widest ${isActive ? 'text-ink' : 'text-ink2'}`}>{label}</NavLink>)}
            <div className="border-t border-line pt-5 flex flex-col gap-5">
              {[['/wishlist', `Wishlist${wish.count ? ` (${wish.count})` : ''}`], ['/track-order', 'Track Order'], ['/faq', 'FAQ']].map(([to, label]) => (
                <NavLink key={to} to={to} className="text-xs uppercase tracking-widest text-ink3 hover:text-ink">{label}</NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>
      {searching && <SearchOverlay onClose={() => setSearching(false)} />}
    </>
  )
}
