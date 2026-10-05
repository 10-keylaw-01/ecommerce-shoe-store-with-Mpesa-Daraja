// Shared admin look: dark Lovfoot theme.
export const inputCls = 'w-full bg-bg border border-line2 px-3 py-2.5 text-sm text-ink placeholder:text-ink5 focus:outline-none focus:border-[#d97706] transition-colors disabled:opacity-50'
export const btnPrimary = 'bg-[#d97706] text-black px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest hover:bg-[#b45309] transition-colors disabled:opacity-50 inline-block'
export const btnGhost = 'border border-line2 text-ink2 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest hover:border-line4 hover:text-ink transition-colors inline-block disabled:opacity-50'
export const card = 'bg-surface border border-line'
export const labelCls = 'block text-[10px] text-ink3 uppercase tracking-widest mb-2'

export function PageHeader({ title, sub, children }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-['Space_Grotesk'] text-3xl text-ink tracking-tighter">{title}</h1>
        {sub && <p className="text-xs text-ink4 mt-1 uppercase tracking-widest">{sub}</p>}
      </div>
      <div className="flex flex-wrap gap-2 items-center">{children}</div>
    </div>
  )
}

const TONES = {
  good: 'text-emerald-700 dark:text-emerald-400 border-emerald-600/40 dark:border-emerald-400/30', warn: 'text-accent border-[#d97706]/30',
  bad: 'text-red-700 dark:text-red-400 border-red-600/40 dark:border-red-400/30', mute: 'text-ink2 border-line2', info: 'text-sky-700 dark:text-sky-400 border-sky-600/40 dark:border-sky-400/30',
}
const STATUS_TONE = {
  published: 'good', paid: 'good', delivered: 'good', success: 'good', active: 'good', resolved: 'good', completed: 'good', quoted: 'info',
  pending: 'warn', draft: 'warn', new: 'warn', in_progress: 'info', shipped: 'info',
  cancelled: 'bad', failed: 'bad', refunded: 'bad', spam: 'bad', declined: 'bad', timeout: 'bad', archived: 'mute', unsubscribed: 'mute',
}
export function Badge({ value }) {
  return <span className={`inline-block border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${TONES[STATUS_TONE[value] ?? 'mute']}`}>{String(value).replace('_', ' ')}</span>
}

export const show = (v) => (v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v))
export const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
export const fmtDate = (d) => d ? new Date(d).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : ''
export const kes = (n) => `KSh ${Number(n ?? 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`
export const errorBox = (m) => m ? <p className="mb-4 border border-red-300 dark:border-red-900/40 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs text-red-700 dark:text-red-400">{m}</p> : null
