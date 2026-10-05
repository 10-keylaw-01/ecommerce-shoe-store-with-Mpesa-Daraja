import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const CartCtx = createContext(null)
export const useCart = () => useContext(CartCtx)
const STORE = 'lovfoot-cart-v2'

function read() {
  try { return JSON.parse(localStorage.getItem(STORE)) ?? [] } catch { return [] }
}

// Items are keyed by variant id (a specific size). The cart is saved in the browser, so prices and
// stock saved there can go stale; refresh() re-prices every line from the database. The checkout
// server re-prices again, so what is shown here always matches what is charged.
export function CartProvider({ children }) {
  const [items, setItems] = useState(read)
  const [notice, setNotice] = useState('')
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
    try { localStorage.setItem(STORE, JSON.stringify(items)) } catch { /* private mode */ }
  }, [items])

  const refresh = useCallback(async () => {
    const current = itemsRef.current
    if (!current.length) return
    const { data, error } = await supabase.from('product_variants')
      .select('id,price_override,stock,status,product:products(price,status)')
      .in('id', current.map((i) => i.key))
    if (error || !data) return // offline / transient: keep what we have; the server re-prices at checkout
    let changed = false
    const next = current.flatMap((i) => {
      const v = data.find((x) => x.id === i.key)
      // RLS hides unpublished rows, so a missing row means the item is no longer sold.
      if (!v || v.status !== 'published' || v.product?.status !== 'published' || v.stock < 1) { changed = true; return [] }
      const price = Number(v.price_override ?? v.product.price)
      const qty = Math.min(i.qty, v.stock)
      if (price !== i.variant.price || qty !== i.qty || v.stock !== i.variant.stock) changed = true
      return [{ ...i, qty, variant: { ...i.variant, price, stock: v.stock } }]
    })
    if (changed) {
      setItems(next)
      setNotice('Some items in your cart changed (price, stock or availability). Totals are now up to date.')
    }
  }, [])
  useEffect(() => { refresh() }, [refresh])

  const add = (product, variant, qty = 1) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.key === variant.id)
      const max = variant.stock
      if (ex) return prev.map((i) => i.key === variant.id ? { ...i, qty: Math.min(i.qty + qty, max) } : i)
      return [...prev, { key: variant.id, qty: Math.min(qty, max), product: { id: product.id, name: product.name, slug: product.slug, image: product.images[0] }, variant }]
    })
  }
  const remove = (key) => setItems((prev) => prev.filter((i) => i.key !== key))
  const update = (key, qty) => {
    if (qty < 1) return remove(key)
    setItems((prev) => prev.map((i) => i.key === key ? { ...i, qty: Math.min(qty, i.variant.stock) } : i))
  }
  const clear = () => setItems([])
  const total = items.reduce((s, i) => s + i.variant.price * i.qty, 0)
  const count = items.reduce((s, i) => s + i.qty, 0)

  return <CartCtx.Provider value={{ items, add, remove, update, clear, total, count, refresh, notice, dismissNotice: () => setNotice('') }}>{children}</CartCtx.Provider>
}
