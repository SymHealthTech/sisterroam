import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Clock, Eye } from 'lucide-react'
import PublicNavbar from '@/components/layout/PublicNavbar'
import PublicFooter from '@/components/layout/PublicFooter'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import BlogCard from '@/components/community/BlogCard'
import { formatDate } from '@/lib/utils'

const BASE = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

async function fetchPost(slug) {
  try {
    const res = await fetch(`${BASE}/api/blog/${slug}`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    const d = await res.json()
    return d.data ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const data = await fetchPost(slug)
  if (!data) return { title: 'Post not found' }
  const { post } = data

  return {
    title:       `${post.title} | SisterRoam Blog`,
    description: post.excerpt ?? post.title,
    openGraph: {
      title:       post.title,
      description: post.excerpt ?? '',
      type:        'article',
      publishedTime: post.publishedAt,
      authors:     [post.authorId?.fullName ?? 'SisterRoam'],
      images:      post.coverImageUrl ? [{ url: post.coverImageUrl, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card:        'summary_large_image',
      title:       post.title,
      description: post.excerpt ?? '',
      images:      post.coverImageUrl ? [post.coverImageUrl] : [],
    },
  }
}

/* ── Basic HTML sanitisation (strip script/event attrs) ──── */
function sanitizeHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params
  const data = await fetchPost(slug)
  if (!data) notFound()

  const { post, related } = data
  const author = post.authorId

  const TIER_COLORS = { basic: 'gray', verified: 'teal', trusted: 'brand' }

  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-gray-50">
        <article className="max-w-3xl mx-auto px-4 py-10">
          {/* Category + tags */}
          <div className="flex gap-2 flex-wrap mb-4">
            {post.category && (
              <Badge variant="brand">{post.category.replace('_', ' ')}</Badge>
            )}
            {post.tags?.map(t => (
              <Badge key={t} variant="gray">{t}</Badge>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-5">
            {post.title}
          </h1>

          {/* Author card */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <Avatar src={author?.profilePhotoUrl} name={author?.fullName} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/host/${author?.username ?? author?._id}`}
                  className="font-semibold text-gray-900 hover:text-brand transition-colors"
                >
                  {author?.fullName}
                </Link>
                {author?.verificationTier && author.verificationTier !== 'basic' && (
                  <Badge variant={TIER_COLORS[author.verificationTier]} size="xs">
                    {author.verificationTier}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                <span>{formatDate(post.publishedAt)}</span>
                {post.readTimeMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {post.readTimeMinutes} min read
                  </span>
                )}
                {post.viewsCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {post.viewsCount} views
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cover image */}
          {post.coverImageUrl && (
            <div className="relative w-full h-72 lg:h-96 rounded-2xl overflow-hidden mb-8">
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-gray prose-sm lg:prose-base max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-a:text-brand prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-brand prose-blockquote:bg-brand-lighter/20 prose-blockquote:rounded-r-xl prose-blockquote:py-1
              prose-img:rounded-xl prose-img:shadow-sm"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
          />

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-8 pt-8 border-t border-gray-100">
              {post.tags.map(t => (
                <span key={t} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Author card (bottom) */}
          <div className="mt-10 p-5 bg-brand-lighter/20 rounded-2xl border border-brand/10 flex flex-col sm:flex-row items-start gap-4">
            <Avatar src={author?.profilePhotoUrl} name={author?.fullName} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{author?.fullName}</p>
              {author?.city && (
                <p className="text-sm text-gray-500">{author.city}</p>
              )}
              {author?.bio && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{author.bio}</p>
              )}
              <div className="flex gap-2 mt-3 flex-wrap">
                <Link
                  href={`/host/${author?.username ?? author?._id}`}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-xl hover:border-brand/30 hover:text-brand transition-colors"
                >
                  View profile
                </Link>
                {author?.role !== 'guest' && (
                  <Link
                    href={`/explore/${author?._id}`}
                    className="px-3 py-1.5 bg-brand text-white text-sm rounded-xl hover:bg-brand-dark transition-colors"
                  >
                    Stay with {author?.fullName?.split(' ')[0]}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </article>

        {/* Related posts */}
        {related?.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 pb-16">
            <h2 className="text-xl font-bold text-gray-900 mb-5">More stories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map(p => (
                <BlogCard
                  key={p._id}
                  post={{ ...p, coverImage: p.coverImageUrl, author: p.authorId }}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      <PublicFooter />
    </>
  )
}
