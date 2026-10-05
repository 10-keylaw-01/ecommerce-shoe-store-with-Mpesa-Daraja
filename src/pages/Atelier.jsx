import { Link } from 'react-router-dom'
import { useTitle } from '../lib/useTitle'
import { useSite } from '../context/SiteContext'

export default function Atelier() {
  useTitle('Atelier')
  const a = useSite().settings.atelier ?? {}
  const materials = a.materials ?? []
  const values = a.values ?? []
  return (
    <div className="bg-bg min-h-screen text-body">
      {/* Hero */}
      <div className="force-dark relative h-[50vh] sm:h-[60vh] overflow-hidden flex items-end">
        <img
          src={a.hero_image}
          alt="Atelier"
          className="absolute inset-0 w-full h-full object-cover grayscale-[70%] sepia-[30%] brightness-[0.5]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16 w-full">
          <span className="text-accent font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">{a.eyebrow}</span>
          <h1 className="font-['Space_Grotesk'] text-4xl sm:text-5xl md:text-7xl tracking-tighter text-ink leading-none">
            {a.title1} <br />{a.title2}
          </h1>
        </div>
      </div>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div>
          <span className="text-accent font-mono text-[10px] tracking-[0.3em] uppercase mb-6 block">{a.story_eyebrow}</span>
          <h2 className="font-['Space_Grotesk'] text-3xl md:text-5xl text-ink tracking-tighter mb-8">
            {a.story_title1} <br /><span className="text-ink5">{a.story_title2}</span>
          </h2>
          <p className="text-ink2 text-sm leading-relaxed mb-6">
            {a.story_p1}
          </p>
          <p className="text-ink2 text-sm leading-relaxed mb-10">
            {a.story_p2}
          </p>
          <Link to="/collection" className="inline-block bg-[#d97706] text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors">
            Shop the Collection
          </Link>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-warm to-transparent opacity-30 blur-3xl rounded-full" />
          <img
            src={a.story_image}
            alt="Craftsmanship"
            className="relative w-full aspect-square object-cover grayscale-[60%] sepia-[20%] border border-line"
          />
        </div>
      </section>

      {/* Materials */}
      <section className="border-y border-line py-16 sm:py-24 relative">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--c-warm) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="mb-16">
            <span className="text-accent font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">Materials</span>
            <h2 className="font-['Space_Grotesk'] text-3xl md:text-5xl text-ink tracking-tighter">{a.materials_title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-line">
            {materials.map((m) => (
              <div key={m.name} className="bg-bg p-6 sm:p-8 hover:bg-surface transition-colors group">
                <span className="text-[9px] text-accent uppercase tracking-[0.3em] font-bold border border-[#d97706]/30 px-2 py-1 mb-4 inline-block">{m.tag}</span>
                <h3 className="font-['Space_Grotesk'] text-xl text-ink mb-3 group-hover:text-accent transition-colors">{m.name}</h3>
                <p className="text-xs text-ink3 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sustainability */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="mb-16">
          <span className="text-accent font-mono text-[10px] tracking-[0.3em] uppercase mb-4 block">Sustainability</span>
          <h2 className="font-['Space_Grotesk'] text-3xl md:text-5xl text-ink tracking-tighter">{a.values_title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((v) => (
            <div key={v.title} className="bg-surface border border-line p-6 sm:p-8 hover:border-warm transition-colors">
              <div className="w-8 h-px bg-[#d97706] mb-6" />
              <h3 className="text-ink font-bold text-sm uppercase tracking-wider mb-4">{v.title}</h3>
              <p className="text-xs text-ink3 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
