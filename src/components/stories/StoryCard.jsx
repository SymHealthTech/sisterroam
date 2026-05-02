import Link from 'next/link'
import Image from 'next/image'
import {
  Heart, Bookmark, Clock, ArrowRight,
  Globe, Bike, Mountain, Activity, Shield,
  Globe2, UtensilsCrossed, Wallet, Lightbulb, Users, Home, Map,
} from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'

const CATEGORY_LABELS = {
  solo_travel:             'Solo Travel',
  cycling:                 'Cycling',
  trekking:                'Trekking',
  running:                 'Running',
  safety_experience:       'Safety',
  cultural_immersion:      'Culture',
  food_journey:            'Food',
  budget_travel:           'Budget',
  tips_and_advice:         'Tips',
  co_traveller_experience: 'Co-traveller',
  hosting_experience:      'Hosting',
  destination_guide:       'Destination Guide',
}

const CATEGORY_ICONS = {
  solo_travel:             Globe,
  cycling:                 Bike,
  trekking:                Mountain,
  running:                 Activity,
  safety_experience:       Shield,
  cultural_immersion:      Globe2,
  food_journey:            UtensilsCrossed,
  budget_travel:           Wallet,
  tips_and_advice:         Lightbulb,
  co_traveller_experience: Users,
  hosting_experience:      Home,
  destination_guide:       Map,
}

const CATEGORY_COLORS = {
  solo_travel:             'bg-brand-lighter',
  cycling:                 'bg-teal-lighter',
  trekking:                'bg-amber-lighter',
  running:                 'bg-pink-lighter',
  safety_experience:       'bg-danger-lighter',
  cultural_immersion:      'bg-brand-lighter',
  food_journey:            'bg-amber-lighter',
  budget_travel:           'bg-teal-lighter',
  tips_and_advice:         'bg-brand-lighter',
  co_traveller_experience: 'bg-pink-lighter',
  hosting_experience:      'bg-teal-lighter',
  destination_guide:       'bg-brand-lighter',
}

const TIER_COLORS = { basic: 'gray', verified: 'teal', trusted: 'brand' }

/* ── Full variant (grid card) ──────────────────────────────── */
function FullCard({ story, basePath }) {
  const CategoryIcon = CATEGORY_ICONS[story.category] ?? Globe
  const catColor     = CATEGORY_COLORS[story.category] ?? 'bg-brand-lighter'
  const author       = story.authorId

  return (
    <Link
      href={`${basePath}/${story.slug}`}
      className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-brand-light hover:shadow-sm transition-all cursor-pointer"
    >
      {/* Image or placeholder */}
      {story.coverImageUrl ? (
        <div className="relative h-44 overflow-hidden">
          <Image
            src={story.coverImageUrl}
            alt={story.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className={`h-44 ${catColor} flex items-center justify-center`}>
          <CategoryIcon className="w-12 h-12 text-brand/40" />
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-2">
          {story.category && (
            <Badge variant="brand" size="xs">{CATEGORY_LABELS[story.category] ?? story.category}</Badge>
          )}
          {story.readTimeMinutes && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock className="w-3 h-3" /> {story.readTimeMinutes} min
            </span>
          )}
        </div>

        <p className="font-medium text-gray-900 line-clamp-2 text-sm leading-snug">{story.title}</p>
        {story.excerpt && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 flex-1">{story.excerpt}</p>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Avatar src={author?.profilePhotoUrl} name={author?.fullName} size="xs" />
            <span className="text-xs text-gray-500 truncate max-w-[100px]">{author?.fullName}</span>
            {author?.verificationTier && author.verificationTier !== 'basic' && (
              <Badge variant={TIER_COLORS[author.verificationTier]} size="xs">✓</Badge>
            )}
          </div>
          <div className="flex items-center gap-2.5 text-xs text-gray-400">
            <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {story.likesCount ?? 0}</span>
            <span className="flex items-center gap-0.5"><Bookmark className="w-3 h-3" /> {story.saveCount ?? 0}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── Compact variant (sidebar / related) ────────────────────── */
function CompactCard({ story, basePath }) {
  const CategoryIcon = CATEGORY_ICONS[story.category] ?? Globe
  const catColor     = CATEGORY_COLORS[story.category] ?? 'bg-brand-lighter'
  const author       = story.authorId

  return (
    <Link
      href={`${basePath}/${story.slug}`}
      className="flex gap-3 hover:bg-gray-50 rounded-xl p-2 transition-colors"
    >
      {story.coverImageUrl ? (
        <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
          <Image src={story.coverImageUrl} alt={story.title} fill className="object-cover" />
        </div>
      ) : (
        <div className={`w-20 h-20 rounded-lg ${catColor} flex items-center justify-center shrink-0`}>
          <CategoryIcon className="w-7 h-7 text-brand/40" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 line-clamp-1">{story.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{author?.fullName}</p>
        {story.category && (
          <Badge variant="gray" size="xs" className="mt-1">{CATEGORY_LABELS[story.category]}</Badge>
        )}
      </div>
    </Link>
  )
}

/* ── Feed variant (home feed) ──────────────────────────────── */
function FeedCard({ story, basePath }) {
  const CategoryIcon = CATEGORY_ICONS[story.category] ?? Globe
  const catColor     = CATEGORY_COLORS[story.category] ?? 'bg-brand-lighter'
  const author       = story.authorId

  return (
    <Link
      href={`${basePath}/${story.slug}`}
      className="flex gap-3 bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-sm transition-shadow"
    >
      {/* Left icon area */}
      <div className={`w-[100px] shrink-0 ${catColor} flex items-center justify-center`}>
        <CategoryIcon className="w-8 h-8 text-brand/50" />
      </div>

      {/* Right content */}
      <div className="flex-1 min-w-0 py-3 pr-3 flex flex-col justify-between">
        <div>
          {story.category && (
            <Badge variant="brand" size="xs" className="mb-1">{CATEGORY_LABELS[story.category]}</Badge>
          )}
          <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{story.title}</p>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <Avatar src={author?.profilePhotoUrl} name={author?.fullName} size="xs" />
            <span className="text-[11px] text-gray-400">{author?.fullName}</span>
            {story.publishedAt && (
              <span className="text-[11px] text-gray-300">· {formatRelativeTime(story.publishedAt)}</span>
            )}
          </div>
          <span className="text-xs text-brand font-medium flex items-center gap-0.5 shrink-0">
            Read <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ── Featured variant (homepage / stories page) ─────────────── */
function FeaturedCard({ story, basePath }) {
  const author = story.authorId

  return (
    <Link
      href={`${basePath}/${story.slug}`}
      className="group block bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col lg:flex-row">
        {story.coverImageUrl ? (
          <div className="relative lg:w-1/2 h-56 lg:h-72 overflow-hidden">
            <Image
              src={story.coverImageUrl}
              alt={story.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="lg:w-1/2 h-56 lg:h-72 bg-brand-lighter flex items-center justify-center">
            <Globe className="w-16 h-16 text-brand/30" />
          </div>
        )}

        <div className="flex-1 p-6 flex flex-col justify-center gap-3">
          {story.isFeatured && (
            <span className="inline-block px-2.5 py-1 bg-brand text-white text-xs rounded-full font-medium w-fit">
              Featured
            </span>
          )}
          {story.category && (
            <Badge variant="brand">{CATEGORY_LABELS[story.category] ?? story.category}</Badge>
          )}
          <h2 className="text-xl font-bold text-gray-900 leading-snug group-hover:text-brand transition-colors">
            {story.title}
          </h2>
          {story.excerpt && (
            <p className="text-sm text-gray-500 line-clamp-3">{story.excerpt}</p>
          )}
          <div className="flex items-center gap-2 mt-auto pt-2">
            <Avatar src={author?.profilePhotoUrl} name={author?.fullName} size="sm" />
            <div>
              <p className="text-sm font-medium text-gray-900">{author?.fullName}</p>
              {story.readTimeMinutes && (
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {story.readTimeMinutes} min read
                </p>
              )}
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand mt-1">
            Read story <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ── Main export ────────────────────────────────────────────── */
export default function StoryCard({ story, variant = 'full', showAuthor = true, currentUserId, basePath = '/stories' }) {
  if (!story) return null

  switch (variant) {
    case 'featured': return <FeaturedCard story={story} basePath={basePath} />
    case 'compact':  return <CompactCard  story={story} basePath={basePath} />
    case 'feed':     return <FeedCard     story={story} basePath={basePath} />
    default:         return <FullCard     story={story} basePath={basePath} />
  }
}
