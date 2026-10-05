import { useState } from 'react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { groups, resources } from './resources'
import ThemeToggle from '../components/ThemeToggle'

export default function AdminLayout() {
  const { loading, user, isAdmin, role, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-ink4 text-xs uppercase tracking-widest">Loading…</p>
    </div>
  )

  if (!user) return <Navigate to="/admin/login" replace />

  if (!isAdmin) return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="bg-surface border border-line p-10 max-w-sm w-full text-center">
        <h1 className="font-['Space_Grotesk'] text-xl text-ink mb-3">No Access</h1>
        <p className="text-xs text-ink4 mb-6">{user.email} is not in <span className="text-accent">admin_users</span>.</p>
        <button onClick={signOut} className="text-xs font-bold uppercase tracking-widest text-black bg-[#d97706] px-6 py-3 hover:bg-[#b45309] transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  )

  const link = ({ isActive }) =>
    `block px-4 py-2 text-xs uppercase tracking-widest transition-colors ${isActive ? 'bg-surface2 text-ink border-l-2 border-[#d97706]' : 'text-ink3 hover:text-ink hover:bg-surface'}`

  return (
    <div className="flex min-h-screen bg-bg">
      {open && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 shrink-0 border-r border-line bg-bg flex flex-col transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-line">
          <a href="/" target="_blank" rel="noreferrer" className="font-['Space_Grotesk'] font-bold text-xl tracking-tighter uppercase text-ink block">
            Lovfoot<span className="text-[#78350f]">.</span>
          </a>
          <p className="text-[9px] text-ink5 uppercase tracking-[0.2em] mt-1">Admin</p>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <NavLink to="/admin" end className={link} onClick={() => setOpen(false)}>Dashboard</NavLink>
          {groups.map((g) => (
            <div key={g.label} className="mt-4">
              <p className="px-4 mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-ink5">{g.label}</p>
              {g.items.map((k) => {
                const to = typeof k === 'string' ? k : k.to
                return <NavLink key={to} to={`/admin/${to}`} className={link} onClick={() => setOpen(false)}>{typeof k === 'string' ? resources[k].label : k.label}</NavLink>
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-line">
          <p className="text-[10px] text-ink5 truncate mb-2">{user.email}</p>
          <p className="text-[9px] text-ink5 uppercase tracking-widest mb-3">{role}</p>
          <div className="flex items-center justify-between">
            <button onClick={signOut} className="text-[10px] font-bold uppercase tracking-widest text-ink3 hover:text-ink transition-colors">
              Sign Out →
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-bg-alt">
        <div className="md:hidden flex items-center justify-between border-b border-line px-4 py-3">
          <button onClick={() => setOpen(true)} aria-label="Menu" className="text-ink2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 5h16M4 12h16M4 19h16" /></svg>
          </button>
          <span className="font-['Space_Grotesk'] font-bold uppercase tracking-tighter text-ink">Lovfoot<span className="text-[#78350f]">.</span> <span className="text-[9px] text-ink4 tracking-[0.2em]">Admin</span></span>
          <ThemeToggle />
        </div>
        <div className="p-4 md:p-8"><Outlet /></div>
      </main>
    </div>
  )
}
