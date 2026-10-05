import { Link } from 'react-router-dom'
import { useTitle } from '../lib/useTitle'
import ProductCard from '../components/ProductCard'
import { useSite } from '../context/SiteContext'
import { fetchProducts, useQuery } from '../lib/api'

export default function Performance() {
  useTitle('Performance')
  const c = useSite().settings.performance ?? {}
  const stats = c.stats ?? []
  const { data: perfProducts } = useQuery(async () => {
    const all = await fetchProducts()
    return all.filter((p) => (c.category_slugs ?? []).includes(p.categorySlug))
  }, [])
  return (
    <div className="bg-bg min-h-screen text-body">
      {/* Hero */}
      <div className="force-dark relative min-h-[60vh] sm:h-[70vh] py-16 sm:py-0 overflow-hidden flex items-center">
        <img
          src={c.hero_image}
          alt="Performance"
          className="absolute inset-0 w-full h-full object-cover grayscale-[60%] sepia-[30%] brightness-[0.5] contrast-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <span className="text-accent font-mono text-[10px] tracking-[0.3em] uppercase mb-6 block">{c.eyebrow}</span>
          <h1 className="font-['Space_Grotesk'] text-5xl sm:text-6xl md:text-8xl tracking-tighter text-ink leading-none mb-6">
            {c.title1} <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d97706] to-[#78350f]">{c.title2}</span>
          </h1>
          <p className="text-ink2 text-sm max-w-md leading-relaxed mb-10">
            {c.body}
          </p>
          <Link to={c.cta_link || '/collection'} className="inline-block bg-[#d97706] text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors">
            {c.cta_text}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="border-y border-line bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 divide-x divide-line">
          {stats.map((s) => (
            <div key={s.label} className="py-8 px-4 sm:py-10 sm:px-8 text-center">
              <p className="font-['Space_Grotesk'] text-3xl md:text-4xl text-ink font-bold mb-2">{s.value}</p>
              <p className="text-[10px] text-ink4 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Technology */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="mb-16">
          <span className="text-accent font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">Technology</span>
          <h2 className="font-['Space_Grotesk'] text-3xl md:text-5xl text-ink tracking-tighter">{c.tech_title}</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {(c.tech ?? []).map((t) => (
            <div key={t.title} className="group relative bg-surface border border-line overflow-hidden hover:border-warm transition-colors">
              <div className="aspect-video overflow-hidden">
                <img src={t.image} alt={t.title} className="w-full h-full object-cover grayscale-[80%] sepia-[20%] group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-5 sm:p-8">
                <h3 className="font-['Space_Grotesk'] text-xl text-ink mb-3">{t.title}</h3>
                <p className="text-xs text-ink3 leading-relaxed">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-accent font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">Shop</span>
            <h2 className="font-['Space_Grotesk'] text-3xl text-ink tracking-tighter">{c.models_title}</h2>
          </div>
          <Link to="/collection" className="text-xs font-bold uppercase tracking-widest text-accent hover:text-ink transition-colors">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {(perfProducts ?? []).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  )
}
