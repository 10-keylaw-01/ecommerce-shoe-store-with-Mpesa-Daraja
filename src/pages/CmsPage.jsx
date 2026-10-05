import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/api'
import { useTitle } from '../lib/useTitle'

// Minimal markdown: headings, bold, lists, paragraphs.
function inline(t) {
  return t.split(/(\*\*[^*]+\*\*)/g).map((x, i) => x.startsWith('**') ? <strong key={i} className="text-ink">{x.slice(2, -2)}</strong> : x)
}
export function Markdown({ text = '' }) {
  const out = []
  let list = []
  const flush = () => { if (list.length) { out.push(<ul key={out.length} className="list-disc pl-5 space-y-1 mb-5">{list}</ul>); list = [] } }
  text.split('\n').forEach((raw, i) => {
    const l = raw.trim()
    if (/^[-*] |^\d+\. /.test(l)) return list.push(<li key={i}>{inline(l.replace(/^([-*]|\d+\.) /, ''))}</li>)
    flush()
    if (!l) return
    if (l.startsWith('## ')) out.push(<h2 key={i} className="font-['Space_Grotesk'] text-xl text-ink mt-10 mb-3">{l.slice(3)}</h2>)
    else if (l.startsWith('# ')) out.push(<h1 key={i} className="font-['Space_Grotesk'] text-4xl text-ink tracking-tighter mb-6">{l.slice(2)}</h1>)
    else out.push(<p key={i} className="mb-4">{inline(l)}</p>)
  })
  flush()
  return <>{out}</>
}

export default function CmsPage() {
  const { slug } = useParams()
  const { data: page, loading } = useQuery(async () => (await supabase.from('pages').select('*').eq('slug', slug).maybeSingle()).data, [slug])
  useTitle(page?.title)
  if (loading) return <div className="min-h-[60vh]" />
  if (!page) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <p className="text-ink4 text-sm uppercase tracking-widest mb-4">Page not found</p>
      <Link to="/" className="text-accent text-xs uppercase tracking-widest hover:text-ink transition-colors">Back Home</Link>
    </div>
  )
  return (
    <div className="bg-bg min-h-[70vh] text-ink2 text-sm leading-relaxed">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20"><Markdown text={page.content_md} /></div>
    </div>
  )
}
