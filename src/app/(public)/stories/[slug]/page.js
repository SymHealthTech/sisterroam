import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Eye, Heart, Bookmark } from 'lucide-react'
import PublicNavbar from '@/components/layout/PublicNavbar'
import PublicFooter from '@/components/layout/PublicFooter'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import StoryCard from '@/components/stories/StoryCard'
import { formatDate } from '@/lib/utils'

const BASE = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

const CATEGORY_LABELS = {
  solo_travel: 'Solo Travel', cycling: 'Cycling', trekking: 'Trekking',
  running: 'Running', safety_experience: 'Safety', cultural_immersion: 'Culture',
  food_journey: 'Food & Drink', budget_travel: 'Budget Travel',
  tips_and_advice: 'Tips & Advice', co_traveller_experience: 'Co-traveller',
  hosting_experience: 'Hosting', destination_guide: 'Destination Guide',
}

async function fetchStory(slug) {
  try {
    const res = await fetch(`${BASE}/api/stories/${slug}`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    const d = await res.json()
    return d.data ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const data = await fetchStory(slug)
  if (!data) return { title: 'Story not found' }
  const { story } = data
  const author = story.authorId

  return {
    title:       `${story.title} — SisterRoam Travel Stories`,
    description: story.excerpt ?? story.title,
    openGraph: {
      type:        'article',
      title:       story.title,
      description: story.excerpt ?? '',
      images:      story.coverImageUrl ? [{ url: story.coverImageUrl, width: 1200, height: 630 }] : [],
      publishedTime: story.publishedAt,
      authors:     [author?.fullName ?? 'SisterRoam'],
      tags:        story.tags,
    },
    twitter: {
      card:        'summary_large_image',
      title:       story.title,
      description: story.excerpt ?? '',
      images:      story.coverImageUrl ? [story.coverImageUrl] : [],
    },
    alternates: {
      canonical: `https://sisterroam.com/stories/${slug}`,
    },
  }
}

function sanitizeHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
}

export default async function StoryPage({ params }) {
  const { slug } = await params
  const data = await fetchStory(slug)
  if (!data) notFound()

  const { story, related } = data
  const author = story.authorId
  const TIER_COLORS = { basic: 'gray', verified: 'teal', trusted: 'brand' }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: story.title,
    description: story.excerpt,
    image: story.coverImageUrl,
    author: { '@type': 'Person', name: author?.fullName },
    datePublished: story.publishedAt,
    publisher: { '@type': 'Organization', name: 'SisterRoam' },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicNavbar />
      <main className="min-h-screen bg-gray-50">
        {/* Short header */}
        <section className="bg-brand pt-[60px] pb-6 px-4">
          <div className="max-w-3xl mx-auto space-y-1">
            <Link href="/stories" className="text-white/70 hover:text-white text-sm transition-colors">
              ← Travel Stories
            </Link>
            <h2 className="text-white font-bold text-lg">
              {CATEGORY_LABELS[story.category] ?? 'Story'}
            </h2>
          </div>
        </section>

        <article className="max-w-3xl mx-auto px-4 py-10">

          {/* Category + meta */}
          <div className="flex gap-2 flex-wrap mb-4">
            {story.category && (
              <Badge variant="brand">{CATEGORY_LABELS[story.category] ?? story.category}</Badge>
            )}
            {story.readTimeMinutes && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" /> {story.readTimeMinutes} min read
              </span>
            )}
            {story.viewsCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Eye className="w-3 h-3" /> {story.viewsCount} views
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-5">
            {story.title}
          </h1>

          {/* Author card (inline) */}
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
                    {author.verificationTier === 'trusted' ? 'Trusted' : 'Verified'}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {formatDate(story.publishedAt)}
                {author?.city && ` · ${author.city}`}
              </div>
            </div>
          </div>

          {/* Cover image */}
          {story.coverImageUrl && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-8">
              <Image
                src={story.coverImageUrl}
                alt={story.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-gray prose-sm lg:prose-base max-w-none
              prose-headings:font-semibold prose-headings:text-gray-900
              prose-a:text-brand prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-l-brand prose-blockquote:italic prose-blockquote:text-gray-600
              prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.content) }}
          />

          {/* Tags */}
          {story.tags?.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-8 pt-8 border-t border-gray-100">
              {story.tags.map(t => (
                <span key={t} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Like / share */}
          <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-100">
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <Heart className="w-4 h-4" /> {story.likesCount} likes
            </span>
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <Bookmark className="w-4 h-4" /> {story.saveCount} saves
            </span>
          </div>

          {/* Author card (expanded) */}
          <div className="mt-10 p-5 bg-brand-lighter/20 rounded-2xl border border-brand/10 flex flex-col sm:flex-row items-start gap-4">
            <Avatar src={author?.profilePhotoUrl} name={author?.fullName} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{author?.fullName}</p>
              {author?.city && <p className="text-sm text-gray-500">{author.city}</p>}
              {author?.bio && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{author.bio}</p>}
            </div>
          </div>
        </article>

        {/* Related stories */}
        {related?.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 pb-16">
            <h2 className="text-xl font-bold text-gray-900 mb-5">More stories you might like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map(s => (
                <StoryCard key={s._id} story={{ ...s }} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {/* Join CTA */}
        <section className="bg-brand-lighter py-10 px-4">
          <div className="max-w-lg mx-auto text-center space-y-3">
            <p className="font-bold text-brand">Share your own travel story</p>
            <p className="text-sm text-brand-dark">Join SisterRoam — it&apos;s free</p>
            <Link
              href="/signup"
              className="inline-block px-6 py-3 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors"
            >
              Join SisterRoam — it&apos;s free
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  )
}
