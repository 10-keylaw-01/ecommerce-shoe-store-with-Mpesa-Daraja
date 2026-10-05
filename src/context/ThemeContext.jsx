import { createContext, useContext, useEffect, useState } from 'react'

const Ctx = createContext({ theme: 'light', toggle: () => {} })
export const useTheme = () => useContext(Ctx)
const STORE = 'lovfoot-theme'

// Light (white) is the default; the visitor's choice is remembered.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem(STORE, theme) } catch { /* private mode */ }
  }, [theme])
  return <Ctx.Provider value={{ theme, toggle: () => setTheme((t) => t === 'dark' ? 'light' : 'dark') }}>{children}</Ctx.Provider>
}
