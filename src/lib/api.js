import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Prices are stored and shown in Kenyan shillings.
export const kes = (n) => `KSh ${Number(n ?? 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`

export const PRODUCT_SELECT =
  '*, category:categories(name,slug), images:product_images(url,sort_order), variants:product_variants(id,size,color,price_override,stock,status,sort_order)'

// DB row -> the shape the storefront components use.
export function normalizeProduct(p) {
  const price = Number(p.price)
  return {
    id: p.id, name: p.name, slug: p.slug, description: p.description, shortDescription: p.short_description,
    price, compareAt: p.compare_at_price ? Number(p.compare_at_price) : null,
    badge: p.badge, specs: p.specs ?? {}, gender: p.gender, featured: p.is_featured,
    category: p.category?.name ?? '', categorySlug: p.category?.slug ?? '',
    createdAt: p.created_at,
    images: [...(p.images ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((i) => i.url),
    variants: [...(p.variants ?? [])].filter((v) => v.status === 'published').sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock, price: Number(v.price_override ?? price) })),
  }
}

export async function fetchProducts(build = (q) => q) {
  const { data, error } = await build(supabase.from('products').select(PRODUCT_SELECT).order('sort_order'))
  if (error) throw error
  return data.map(normalizeProduct)
}

// Tiny data hook: { data, loading, error }. Re-runs when deps change.
export function useQuery(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  useEffect(() => {
    let live = true
    setState((s) => ({ ...s, loading: true }))
    fn().then((data) => live && setState({ data, loading: false, error: null }))
      .catch((error) => live && setState({ data: null, loading: false, error }))
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}

export const lines = (s = '') => String(s).split('\n')
