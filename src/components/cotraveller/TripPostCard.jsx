'use client'

import Link from 'next/link'
import { Calendar, Heart, ArrowRight, Clock } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useAppUser } from '@/components/layout/AppLayout'

const CATEGORY_LABELS = {
  solo_traveller: 'Solo traveller',
  backpacker: 'Backpacker',
  cyclist: 'Cyclist',
  trekker: 'Trekker',
  runner: 'Runner',
  ultramarathon: 'Ultra runner',
  road_tripper: 'Road tripper',
  family_tourist: 'Family traveller',
}

const TRIP_TYPE_LABELS = {
  one_way: 'One way',
  round_trip: 'Round trip',
  open_ended: 'Open ended',
}

function formatDate(dateStr, flexible) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const formatted = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return flexible ? `Around ${formatted} (flexible)` : formatted
}

function isSoon(dateStr) {
  if (!dateStr) return false
  const diff = new Date(dateStr) - new Date()
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
}

function SpotDots({ max, filled }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'w-2.5 h-2.5 rounded-full border',
            i < filled
              ? 'bg-brand border-brand'
              : 'bg-white border-gray-300'
          )}
        />
      ))}
    </div>
  )
}

export default function TripPostCard({ post, currentUserTier, currentUserId, compact = false }) {
  const appUser = useAppUser()
  const verifPending  = appUser?.verifPending  ?? false
  const verifApproved = appUser?.verifApproved ?? false
  const author = post.authorId ?? post.author ?? {}
  const authorId = author._id ?? author.id ?? post.authorId
  const isOwnPost = currentUserId && authorId && authorId.toString() === currentUserId.toString()
  const spotsLeft = (post.maxCoTravellers ?? 1) - (post.currentCoTravellers ?? 0)
  const isFull    = spotsLeft <= 0
  const soon      = isSoon(post.departureDate)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Color band */}
      <div className="h-12 bg-gradient-to-r from-brand-lighter to-brand/20 flex items-center px-4 gap-2">
        <span className="text-brand font-semibold text-sm truncate flex-1">
          {post.toCity || 'Destination'}
        </span>
        {post.status === 'filled' && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand text-white font-medium shrink-0">Filled</span>
        )}
        {post.status === 'open' && soon && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber text-white font-medium shrink-0">Soon</span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Route */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">
            {post.fromCity}
            {post.fromCountryCode && ` ${getFlagEmoji(post.fromCountryCode)}`}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-sm font-semibold text-gray-900 truncate">
            {post.toCity}
            {post.toCountryCode && ` ${getFlagEmoji(post.toCountryCode)}`}
          </span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{formatDate(post.departureDate, post.isFlexibleDates)}</span>
        </div>

        {/* Author */}
        <div className="flex items-center gap-2">
          <Avatar src={author.profilePhotoUrl} name={author.fullName} size="xs" />
          <span className="text-xs text-gray-700 font-medium truncate">{author.fullName}</span>
          {author.verificationTier && author.verificationTier !== 'basic' && (
            <Badge variant="verified" size="sm">✓</Badge>
          )}
          {author.city && (
            <span className="text-xs text-gray-400 truncate">{author.city}</span>
          )}
        </div>

        {/* Travel style + spots */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {(post.travelStyle ?? []).slice(0, 2).map(s => (
              <span key={s} className="text-[10px] bg-brand-lighter text-brand px-2 py-0.5 rounded-full">
                {CATEGORY_LABELS[s] ?? s}
              </span>
            ))}
            {post.durationDays && (
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {post.durationDays}d
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <SpotDots max={post.maxCoTravellers ?? 1} filled={post.currentCoTravellers ?? 0} />
            <span className="text-[10px] text-gray-500">
              {isFull ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {/* Description preview */}
        {!compact && post.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {post.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {post.interestedCount ?? 0}
            </span>
            {post.createdAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(post.createdAt)}
              </span>
            )}
          </div>

          {!compact && (
            <div className="flex items-center gap-2">
              <Button href={`/cotraveller/${post._id}`} variant="ghost" size="sm">
                View trip
              </Button>
              {post.status === 'open' && !isFull && !isOwnPost && (
                currentUserTier === 'basic' ? (
                  verifPending ? (
                    <Button variant="ghost" size="sm" disabled className="text-brand/50">
                      Verification under review
                    </Button>
                  ) : verifApproved ? (
                    <Button href="/profile/verification" variant="ghost" size="sm" className="text-teal">
                      Activate badge to apply
                    </Button>
                  ) : (
                    <Button href="/profile/verification" variant="ghost" size="sm" className="text-brand">
                      Verify to apply
                    </Button>
                  )
                ) : currentUserTier ? (
                  <Button href={`/cotraveller/${post._id}`} variant="primary" size="sm">
                    Express interest
                  </Button>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return ''
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(c => 127397 + c.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

TripPostCard.Skeleton = function TripPostCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="h-12 bg-gray-100" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}
