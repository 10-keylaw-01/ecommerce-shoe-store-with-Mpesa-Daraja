import { createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/api'

const Ctx = createContext({ settings: {}, categories: [], banners: [], ready: false })
export const useSite = () => useContext(Ctx)

async function load() {
  const [s, c, b] = await Promise.all([
    supabase.from('site_settings').select('key,value'),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('banners').select('*').order('sort_order'),
  ])
  const err = s.error || c.error || b.error
  if (err) throw err
  return {
    settings: Object.fromEntries(s.data.map((r) => [r.key, r.value])),
    categories: c.data,
    banners: b.data,
  }
}

export function SiteProvider({ children }) {
  const { data, error } = useQuery(load, [])
  if (error) return <div className="min-h-screen bg-bg flex items-center justify-center text-ink2 text-xs uppercase tracking-widest px-6 text-center">Couldn't load the store. Please refresh.</div>
  if (!data) return <div className="min-h-screen bg-bg flex items-center justify-center text-ink4 text-xs uppercase tracking-[0.3em]">Loading…</div>
  return <Ctx.Provider value={{ ...data, ready: true, banner: (placement) => data.banners.find((b) => b.placement === placement) }}>{children}</Ctx.Provider>
}
