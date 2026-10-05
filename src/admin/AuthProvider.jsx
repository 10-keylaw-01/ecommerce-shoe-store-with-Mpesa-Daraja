import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, role: null })

  useEffect(() => {
    let cancelled = false
    async function load(session) {
      const user = session?.user ?? null
      let role = null
      if (user) {
        const { data } = await supabase.from('admin_users').select('role').eq('id', user.id).maybeSingle()
        role = data?.role ?? null
      }
      if (!cancelled) setState({ loading: false, user, role })
    }
    supabase.auth.getSession().then(({ data }) => load(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      // defer: supabase calls inside this callback can deadlock
      setTimeout(() => load(session), 0)
    })
    return () => { cancelled = true; sub.subscription.unsubscribe() }
  }, [])

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signOut = () => supabase.auth.signOut()

  return <Ctx.Provider value={{ ...state, isAdmin: !!state.role, signIn, signOut }}>{children}</Ctx.Provider>
}
