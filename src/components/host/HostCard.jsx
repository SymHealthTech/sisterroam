import Link from 'next/link'
import { MapPin, Home, Star } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

const ROOM_LABELS = {
  private_room: 'Private room',
  shared_room:  'Shared room',
  couch:        'Couch',
  floor_space:  'Floor space',
  tent_space:   'Tent space',
}

const CATEGORY_LABELS = {
  solo_traveller: 'Solo traveller',
  backpacker:     'Backpacker',
  cyclist:        'Cyclist',
  trekker:        'Trekker',
  runner:         'Runner',
  ultramarathon:  'Ultra runner',
  road_tripper:   'Road tripper',
  family_tourist: 'Family traveller',
}

function HostCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="h-20 shimmer" />
      <div className="pt-9 pb-4 px-4 space-y-3">
        <div className="flex flex-col items-center gap-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3.5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-32 mx-auto" />
        <div className="flex gap-1.5 justify-center">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex gap-0.5 justify-center">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="w-3.5 h-3.5 rounded-sm" />)}
        </div>
        <Skeleton className="h-9 w-full rounded-[10px] mt-1" />
      </div>
    </div>
  )
}

export default function HostCard({ host, variant = 'full' }) {
  const { user, accommodationType, femaleOnly } = host
  const rating  = user?.averageRating ?? 0
  const reviews = user?.totalReviews  ?? 0
  const categories = user?.travellerCategories ?? []

  if (variant === 'compact') {
    return (
      <Link
        href={`/explore/${host._id}`}
        className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow"
      >
        <Avatar src={user?.profilePhotoUrl} name={user?.fullName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 truncate">{user?.fullName}</span>
            {user?.verificationTier === 'verified' && (
              <Badge variant="verified" size="sm">Verified</Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">
            {[user?.city, user?.country].filter(Boolean).join(', ')}
          </p>
          {rating > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 fill-amber text-amber" />
              <span className="text-xs text-gray-600">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/explore/${host._id}`}
      className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Colored header — 80px, avatar overlapping */}
      <div className="h-20 bg-brand-lighter relative flex items-center justify-center">
        {femaleOnly && (
          <span className="absolute top-2 left-3">
            <Badge variant="female" size="sm">♀ Women only</Badge>
          </span>
        )}
        <div className="absolute -bottom-7">
          <Avatar
            src={user?.profilePhotoUrl}
            name={user?.fullName}
            size="lg"
            className="ring-[3px] ring-white"
          />
        </div>
      </div>

      {/* Body */}
      <div className="pt-9 pb-4 px-4 space-y-2.5">
        {/* Name + verification badges */}
        <div className="text-center space-y-1.5">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">
            {user?.fullName ?? 'Sister Host'}
          </h3>
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {user?.verificationTier === 'trusted' && (
              <Badge variant="trusted" size="sm">Trusted</Badge>
            )}
            {(user?.verificationTier === 'verified' || user?.verificationTier === 'trusted') && (
              <Badge variant="verified" size="sm">✓ Verified</Badge>
            )}
          </div>
        </div>

        {/* Location */}
        {(user?.city || user?.country) && (
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3 shrink-0" />
            <span>{[user.city, user.country].filter(Boolean).join(', ')}</span>
          </div>
        )}

        {/* Accommodation type */}
        {accommodationType && (
          <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
            <Home className="w-3 h-3 shrink-0" />
            {ROOM_LABELS[accommodationType] ?? accommodationType}
          </p>
        )}

        {/* Languages */}
        {user?.languages?.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center">
            {user.languages.slice(0, 3).map((lang) => (
              <span key={lang} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {lang}
              </span>
            ))}
          </div>
        )}

        {/* Traveller categories (max 2, +N more) */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center">
            {categories.slice(0, 2).map((cat) => (
              <span key={cat} className="text-[11px] bg-brand-lighter text-brand px-2 py-0.5 rounded-full">
                {CATEGORY_LABELS[cat] ?? cat}
              </span>
            ))}
            {categories.length > 2 && (
              <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                +{categories.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Star rating */}
        <div
          className="flex items-center justify-center gap-0.5"
          role="img"
          aria-label={`Rating: ${rating.toFixed(1)} out of 5`}
        >
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={cn(
                'w-3.5 h-3.5',
                s <= Math.round(rating) ? 'fill-amber text-amber' : 'fill-transparent text-gray-200'
              )}
            />
          ))}
          <span className="text-xs text-gray-500 ml-1">
            {reviews > 0 ? `(${reviews})` : 'New host'}
          </span>
        </div>

        {/* CTA */}
        <div className="pt-0.5">
          <span className="block w-full text-center py-2 text-sm font-medium text-brand border border-brand rounded-[10px] group-hover:bg-brand group-hover:text-white transition-colors">
            View profile
          </span>
        </div>
      </div>
    </Link>
  )
}

HostCard.Skeleton = HostCardSkeleton
