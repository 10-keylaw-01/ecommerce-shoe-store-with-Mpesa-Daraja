import { createContext, useContext, useEffect, useState } from 'react'

const Ctx = createContext(null)
export const useWishlist = () => useContext(Ctx)
const STORE = 'lovfoot-wishlist-v1'

function read() {
  try { return JSON.parse(localStorage.getItem(STORE)) ?? [] } catch { return [] }
}

// Stores product ids only; pages fetch fresh product data.
export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(read)
  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify(ids)) } catch { /* private mode */ } }, [ids])
  const toggle = (id) => setIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
  return <Ctx.Provider value={{ ids, toggle, has: (id) => ids.includes(id), count: ids.length }}>{children}</Ctx.Provider>
}
