import { Link } from 'react-router-dom'
import { useTitle } from '../lib/useTitle'

export default function NotFound() {
  useTitle('Page not found')
  return (
    <div className="bg-bg min-h-[70vh] flex items-center justify-center px-6 text-center">
      <div>
        <p className="font-mono text-[10px] tracking-[0.3em] text-accent uppercase mb-4">Error 404</p>
        <h1 className="font-['Space_Grotesk'] text-5xl sm:text-7xl tracking-tighter text-ink mb-4">Lost the trail.</h1>
        <p className="text-ink3 text-sm mb-8">That page doesn't exist or has moved.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/" className="bg-[#d97706] text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors">Home</Link>
          <Link to="/collection" className="border border-line3 text-ink px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-line transition-colors">Shop the Collection</Link>
        </div>
      </div>
    </div>
  )
}
