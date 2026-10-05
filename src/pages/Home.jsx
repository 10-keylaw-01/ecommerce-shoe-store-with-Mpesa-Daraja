import { Link } from 'react-router-dom'
import { useTitle } from '../lib/useTitle'
import ProductCard from '../components/ProductCard'
import { useSite } from '../context/SiteContext'
import { fetchProducts, lines, kes, useQuery } from '../lib/api'

export default function Home() {
  useTitle(null)
  const { settings: st, banner } = useSite()
  const hero = banner('home_hero')
  const mid = banner('home_mid')
  const extras = st.home_hero_extras ?? {}
  const palette = st.home_palette ?? {}
  const specs = st.home_specs ?? {}
  const { data } = useQuery(async () => {
    const [featured, latest] = await Promise.all([
      fetchProducts((q) => q.eq('is_featured', true).limit(3)),
      fetchProducts((q) => q.order('created_at', { ascending: false }).limit(4)),
    ])
    return { featured, latest }
  }, [])
  const featured = data?.featured ?? []
  const newArrivals = data?.latest ?? []

  return (
    <div className="bg-bg text-body overflow-x-hidden">
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
      />

      {/* Hero */}
      <header className="force-dark relative w-full min-h-[80vh] sm:h-[90vh] py-24 sm:py-0 overflow-hidden flex flex-col justify-center items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={hero?.image_url}
            alt={st.site_name}
            className="w-full h-full object-cover object-center grayscale-[50%] sepia-[40%] brightness-[0.7] contrast-[1.2]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg/80 via-transparent to-bg/80" />
          <div className="absolute inset-0 bg-[#291e15] mix-blend-overlay opacity-40" />
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto" style={{ animation: 'fadeIn 0.8s cubic-bezier(0.2,0.8,0.2,1) forwards' }}>
          <span className="inline-block py-1.5 px-4 border border-[#d97706]/30 text-accent rounded-full text-[10px] font-bold tracking-[0.2em] uppercase backdrop-blur-md mb-8 bg-black/20">
            {extras.badge}
          </span>
          <h1 className="font-['Space_Grotesk'] text-5xl sm:text-6xl md:text-7xl lg:text-9xl tracking-tighter leading-[0.9] mb-8 text-transparent bg-clip-text bg-gradient-to-b from-ink to-ink3">
            {lines(hero?.title).map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}
          </h1>
          <p className="text-ink2 text-sm md:text-lg max-w-lg mx-auto mb-12 leading-relaxed font-light tracking-wide">
            {hero?.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {hero?.cta_text && <Link to={hero.cta_link || '/collection'} className="group relative px-8 py-4 bg-btn text-btn-ink text-xs font-bold uppercase tracking-widest overflow-hidden">
              <span className="relative z-10 group-hover:text-ink transition-colors duration-300">{hero.cta_text}</span>
              <div className="absolute inset-0 bg-warm scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out" />
            </Link>}
            {extras.cta2_text && <Link to={extras.cta2_link || '/collection'} className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-ink border border-line3 hover:bg-line transition-all">
              {extras.cta2_text}
            </Link>}
          </div>
        </div>

        {/* Ticker */}
        <div className="absolute bottom-0 w-full border-t border-line bg-black/40 backdrop-blur-md py-5 overflow-hidden flex whitespace-nowrap z-20">
          <div className="inline-block px-4 text-[10px] font-bold text-ink3 tracking-[0.3em] uppercase" style={{ animation: 'marquee 30s linear infinite' }}>
            {[0, 1].map((n) => <span key={n}>{(st.home_ticker ?? []).map((t) => `• ${t} `).join('')}•&nbsp;</span>)}
          </div>
        </div>
      </header>

      {/* Curated Collection */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 max-w-7xl mx-auto relative">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-warm rounded-full blur-[120px] opacity-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-end mb-16 relative z-10">
          <div>
            <h2 className="font-['Space_Grotesk'] text-3xl md:text-5xl tracking-tighter text-ink mb-3">{palette.title}</h2>
            <p className="text-ink3 text-sm tracking-wide">{palette.subtitle}</p>
          </div>
          <Link to="/collection" className="hidden md:flex items-center text-xs font-bold uppercase tracking-widest text-accent hover:text-ink transition-colors mt-4 md:mt-0">
            View All Models
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
              <path d="M7 7h10v10M7 17 17 7" />
            </svg>
          </Link>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {/* Hero Card */}
          {featured[0] && <div className="force-dark md:col-span-2 md:row-span-2 group relative bg-surface border border-line overflow-hidden aspect-[16/9] md:aspect-auto min-h-[400px]">
            <img
              src={featured[0]?.images[0]}
              alt={featured[0]?.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-60 grayscale-[80%] sepia-[20%] group-hover:grayscale-[40%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 sm:p-8 md:p-12 w-full">
              <span className="text-accent text-[10px] tracking-[0.2em] uppercase font-bold mb-2 block">{featured[0]?.badge}</span>
              <h3 className="font-['Space_Grotesk'] text-3xl text-ink mb-2">{featured[0]?.name}</h3>
              <p className="text-sm text-ink2 mb-6 max-w-sm opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                {featured[0]?.description}
              </p>
              <Link to={`/product/${featured[0]?.slug}`} className="text-ink text-xs font-bold uppercase tracking-widest border-b border-ink pb-1 hover:text-accent hover:border-[#d97706] transition-colors">
                Shop Now
              </Link>
            </div>
          </div>}

          {/* Product Cards */}
          {featured.slice(1, 3).map((p) => (
            <div key={p.id} className="group relative bg-surface border border-line p-8 flex flex-col justify-between hover:border-warm transition-colors duration-500">
              <div className="relative w-full aspect-square mb-8 flex items-center justify-center">
                <div className="absolute w-32 h-32 bg-warm rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                <img
                  src={p.images[0]}
                  alt={p.name}
                  className="w-full h-full object-contain grayscale-[100%] brightness-[1.2] sepia-[0.3] group-hover:-translate-y-4 transition-transform duration-700 ease-out"
                />
              </div>
              <div className="flex justify-between items-end border-t border-line2 pt-4">
                <div>
                  <p className="text-[10px] text-ink3 uppercase tracking-widest mb-1">{p.category}</p>
                  <Link to={`/product/${p.slug}`}>
                    <h3 className="font-['Space_Grotesk'] text-lg text-ink hover:text-accent transition-colors">{p.name}</h3>
                  </Link>
                </div>
                <span className="text-sm font-medium text-accent">{kes(p.price)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Specs */}
      <section className="bg-bg py-20 sm:py-32 overflow-hidden relative border-y border-line">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--c-warm) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-12 md:gap-20 items-center relative z-10">
          <div className="order-2 md:order-1">
            <span className="text-accent font-mono text-[10px] tracking-[0.3em] uppercase mb-6 block">{specs.eyebrow}</span>
            <h2 className="font-['Space_Grotesk'] text-4xl md:text-6xl text-ink tracking-tighter mb-8 leading-[1]">
              {specs.title1} <br /><span className="text-ink5">{specs.title2}</span>
            </h2>
            <p className="text-ink2 text-sm leading-relaxed mb-10 max-w-md">
              {specs.body}
            </p>
            <div className="space-y-px bg-line2">
              {(specs.features ?? []).map((s) => (
                <div key={s.title} className="group bg-bg p-6 hover:bg-surface2 transition-colors cursor-pointer border-l-2 border-transparent hover:border-[#d97706]">
                  <h4 className="text-ink text-sm font-bold uppercase tracking-wider mb-2 flex justify-between items-center">
                    {s.title}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink5 group-hover:text-ink transition-colors">
                      <path d="M12 5v14m-7-7h14" />
                    </svg>
                  </h4>
                  <p className="text-xs text-ink3">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative order-1 md:order-2 flex justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-warm to-transparent opacity-30 blur-3xl rounded-full" />
            <div className="force-dark relative w-full aspect-square max-w-md bg-surface rounded-full border border-line flex items-center justify-center shadow-2xl shadow-black">
              <img
                src={specs.image}
                alt="Sole"
                className="absolute w-[115%] max-w-none grayscale-[100%] sepia-[50%] brightness-[0.8] mix-blend-screen rotate-12 hover:rotate-0 transition-transform duration-[1.5s] ease-in-out"
              />
            </div>
            <div className="absolute top-0 right-2 sm:right-10 bg-surface2/80 backdrop-blur-md p-4 border border-line2">
              <p className="text-[10px] text-ink3 uppercase tracking-widest mb-1">Weight</p>
              <p className="text-xl text-ink font-mono">{specs.weight_value}<span className="text-xs text-ink4">{specs.weight_unit}</span></p>
            </div>
            <div className="absolute bottom-6 sm:bottom-10 left-0 bg-surface2/80 backdrop-blur-md p-4 border border-line2">
              <p className="text-[10px] text-ink3 uppercase tracking-widest mb-1">Drop</p>
              <p className="text-xl text-ink font-mono">{specs.drop_value}<span className="text-xs text-ink4">{specs.drop_unit}</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Lifestyle Visual */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="force-dark relative h-[480px] sm:h-[700px] w-full group overflow-hidden">
          <img
            src={mid?.image_url}
            alt="Lifestyle"
            className="absolute inset-0 w-full h-full object-cover grayscale-[100%] sepia-[20%] brightness-[0.6] transition-transform duration-[2s] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
          <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 md:p-20 flex flex-col md:flex-row justify-between items-end">
            <div className="max-w-2xl">
              <h2 className="font-['Space_Grotesk'] text-4xl sm:text-5xl md:text-7xl text-body mb-6 tracking-tighter leading-none">
                {lines(mid?.title).map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}
              </h2>
              <p className="text-ink2 text-sm md:text-base leading-relaxed mb-10 max-w-md border-l border-[#d97706] pl-6">
                {mid?.subtitle}
              </p>
              {mid?.cta_text && <Link to={mid.cta_link || '/collection'} className="inline-block bg-[#d97706] text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors">
                {mid.cta_text}
              </Link>}
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals Carousel */}
      <section className="mb-16 sm:mb-32 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-2xl font-['Space_Grotesk'] text-ink tracking-tight">{(st.home_arrivals ?? {}).title}</h2>
          <Link to="/collection" className="text-xs font-bold uppercase tracking-widest text-accent hover:text-ink transition-colors">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {newArrivals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  )
}
