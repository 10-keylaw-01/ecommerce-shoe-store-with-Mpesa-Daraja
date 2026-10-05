import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/api'
import { Markdown } from './CmsPage'
import { fmtDay } from './Journal'
import { useTitle } from '../lib/useTitle'
import NotFound from './NotFound'

export default function JournalPost() {
  const { slug } = useParams()
  const { data: post, loading } = useQuery(async () => (await supabase.from('blogs').select('*, category:blog_categories(name)').eq('slug', slug).maybeSingle()).data, [slug])
  useTitle(post?.title)
  if (loading) return <div className="min-h-[60vh]" />
  if (!post) return <NotFound />
  return (
    <article className="bg-bg text-ink2 text-sm leading-relaxed">
      {post.cover_image_url && (
        <div className="relative h-[40vh] sm:h-[50vh] overflow-hidden">
          <img src={post.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover grayscale-[70%] sepia-[25%] brightness-[0.55]" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg to-transparent" />
        </div>
      )}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20 -mt-16 relative z-10">
        <Link to="/journal" className="text-[10px] uppercase tracking-widest text-ink3 hover:text-ink">← Journal</Link>
        <p className="text-[10px] uppercase tracking-widest text-accent mt-6 mb-3">{post.category?.name} · {fmtDay(post.published_at)} · {post.author_name}</p>
        <Markdown text={post.content_md} />
      </div>
    </article>
  )
}
