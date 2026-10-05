import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
  const { user, signIn } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/admin" replace />

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError(error.message)
    else nav('/admin')
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background dot grid */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--c-warm) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-warm rounded-full blur-[120px] opacity-20 pointer-events-none" />

      <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          <a href="/" className="font-['Space_Grotesk'] font-bold text-2xl tracking-tighter uppercase text-ink inline-block mb-2">
            Lovfoot<span className="text-[#78350f]">.</span>
          </a>
          <p className="text-[10px] text-ink4 uppercase tracking-[0.3em]">Admin Portal</p>
        </div>

        <form onSubmit={submit} className="bg-surface border border-line p-8 space-y-4">
          <h1 className="font-['Space_Grotesk'] text-xl text-ink tracking-tight mb-6">Sign In</h1>

          <div>
            <label className="block text-[10px] text-ink4 uppercase tracking-widest mb-2">Email</label>
            <input
              className="w-full bg-bg border border-line2 px-4 py-3 text-sm text-ink placeholder:text-ink5 focus:outline-none focus:border-[#d97706] transition-colors"
              type="email"
              placeholder="admin@lovfoot.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] text-ink4 uppercase tracking-widest mb-2">Password</label>
            <input
              className="w-full bg-bg border border-line2 px-4 py-3 text-sm text-ink placeholder:text-ink5 focus:outline-none focus:border-[#d97706] transition-colors"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-900/40 px-4 py-3">
              <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            disabled={loading}
            className="w-full bg-[#d97706] text-black py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-[10px] text-ink5 uppercase tracking-widest">
          <a href="/" className="hover:text-ink3 transition-colors">← Back to Store</a>
        </p>
      </div>
    </div>
  )
}
