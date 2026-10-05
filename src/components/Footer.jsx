import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useSite } from '../context/SiteContext'
import { supabase } from '../lib/supabase'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const { settings, categories } = useSite()

  async function subscribe(e) {
    e.preventDefault()
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim() })
    setMsg(!error ? "You're on the list." : error.code === '23505' ? "You're already subscribed." : 'Something went wrong. Try again.')
    if (!error) setEmail('')
  }

  return (
    <footer className="bg-bg border-t border-line pt-14 sm:pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 mb-16 sm:mb-20">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="font-['Space_Grotesk'] font-bold text-2xl tracking-tighter uppercase block text-ink mb-6">
              {settings.site_name}<span className="text-[#78350f]">.</span>
            </Link>
            <p className="text-ink4 text-xs leading-relaxed max-w-xs mb-8">{settings.footer_blurb}</p>
            <div className="flex gap-6">
              <a href={settings.social_instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-ink4 hover:text-ink transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8A4 4 0 0 1 16 11.37m1.5-4.87h.01" />
                </svg>
              </a>
              <a href={settings.social_x} target="_blank" rel="noreferrer" aria-label="X" className="text-ink4 hover:text-ink transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6c2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4c-.9-4.2 4-6.6 7-3.8c1.1 0 3-1.2 3-1.2" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-ink text-xs font-bold uppercase tracking-widest mb-6">Series</h4>
            <ul className="space-y-4 text-xs text-ink3">
              {categories.map((c) => (
                <li key={c.id}><Link to={`/collection?cat=${c.slug}`} className="hover:text-accent transition-colors">{c.name} Series</Link></li>
              ))}
              <li><Link to="/collection" className="hover:text-accent transition-colors">All Releases</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-ink text-xs font-bold uppercase tracking-widest mb-6">Atelier</h4>
            <ul className="space-y-4 text-xs text-ink3">
              <li><Link to="/atelier" className="hover:text-accent transition-colors">Our Materials</Link></li>
              <li><Link to="/journal" className="hover:text-accent transition-colors">Journal</Link></li>
              <li><Link to="/pages/about" className="hover:text-accent transition-colors">About</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-ink text-xs font-bold uppercase tracking-widest mb-6">Help</h4>
            <ul className="space-y-4 text-xs text-ink3">
              <li><Link to="/track-order" className="hover:text-accent transition-colors">Track Order</Link></li>
              <li><Link to="/pages/shipping-returns" className="hover:text-accent transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/faq" className="hover:text-accent transition-colors">FAQ</Link></li>
              <li><Link to="/wishlist" className="hover:text-accent transition-colors">Wishlist</Link></li>
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <h4 className="text-ink text-xs font-bold uppercase tracking-widest mb-6">Stay in the Loop</h4>
            <form onSubmit={subscribe} className="relative border-b border-ink6">
              <input
                type="email" required
                placeholder="EMAIL ADDRESS"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent py-2 text-xs text-ink placeholder:text-ink5 focus:outline-none focus:placeholder-transparent"
              />
              <button type="submit" aria-label="Subscribe" className="absolute right-0 top-2 text-ink3 hover:text-ink transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14m-7-7 7 7-7 7" />
                </svg>
              </button>
            </form>
            <p className="text-ink5 text-[10px] mt-3">{msg || 'Early access to drops & exclusive releases.'}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 text-center border-t border-line text-[10px] text-ink5 uppercase tracking-wider">
          <p>{settings.footer_text}</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link to="/pages/privacy" className="hover:text-ink3 transition-colors">Privacy</Link>
            <Link to="/pages/terms" className="hover:text-ink3 transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-ink3 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
