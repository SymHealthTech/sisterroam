'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ThumbsUp, Share2, Shield, ExternalLink, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { cn, formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'

const CATEGORY_CONFIG = {
  stay:      { label: 'Stay',      color: 'bg-brand-lighter  border-l-brand  text-brand'  },
  food:      { label: 'Food',      color: 'bg-amber-lighter  border-l-amber  text-amber'  },
  transport: { label: 'Transport', color: 'bg-teal-lighter   border-l-teal   text-teal'   },
  safety:    { label: 'Safety',    color: 'bg-danger-lighter border-l-danger text-danger'  },
  activity:  { label: 'Activity',  color: 'bg-pink-50        border-l-pink   text-pink'   },
  general:   { label: 'General',   color: 'bg-gray-100       border-l-gray-400 text-gray-600' },
}

const PRICE_LABELS = {
  free:      { label: 'Free',      cls: 'bg-teal-lighter text-teal' },
  budget:    { label: 'Budget',    cls: 'bg-gray-100 text-gray-600' },
  mid_range: { label: 'Mid-range', cls: 'bg-amber-lighter text-amber-dark' },
  splurge:   { label: 'Splurge',   cls: 'bg-brand-lighter text-brand' },
}

export default function RecommendationCard({ rec, onUpvote, canEdit, onEdit, onDelete }) {
  const [expanded,     setExpanded]     = useState(false)
  const [upvoting,     setUpvoting]     = useState(false)
  const [localUpvoted, setLocalUpvoted] = useState(rec.hasUpvoted)
  const [localCount,   setLocalCount]   = useState(rec.upvoteCount ?? 0)

  const author = rec.authorId ?? {}
  const cat    = CATEGORY_CONFIG[rec.category] ?? CATEGORY_CONFIG.general
  const price  = PRICE_LABELS[rec.priceRange]

  const descShort = rec.description?.slice(0, 180)
  const isLong    = (rec.description?.length ?? 0) > 180

  async function handleUpvote() {
    if (upvoting) return
    setUpvoting(true)
    const wasUpvoted = localUpvoted
    setLocalUpvoted(!wasUpvoted)
    setLocalCount(c => wasUpvoted ? c - 1 : c + 1)
    try {
      const res = await fetch(`/api/recommendations/${rec._id}/upvote`, { method: 'POST' })
      if (!res.ok) {
        setLocalUpvoted(wasUpvoted)
        setLocalCount(c => wasUpvoted ? c + 1 : c - 1)
      } else {
        const data = await res.json()
        onUpvote?.(rec._id, data.data?.upvoted, data.data?.upvoteCount)
      }
    } finally {
      setUpvoting(false)
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/recommendations?city=${encodeURIComponent(rec.city)}`
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'))
  }

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 overflow-hidden border-l-4', cat.color.split(' ')[1] ?? '')}>
      <div className="p-4 space-y-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', cat.color.split(' ').slice(2).join(' ') || 'text-gray-600 bg-gray-100')}>
              {cat.label}
            </span>
            {rec.isVerifiedExperience && (
              <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-teal-lighter text-teal font-medium">
                <Shield className="w-3 h-3" />Verified experience
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Avatar src={author.profilePhotoUrl} name={author.fullName} size="xs" />
            <span className="text-xs text-gray-600 font-medium">{author.fullName}</span>
            {['verified', 'trusted'].includes(author.verificationTier) && <Badge variant="verified" size="sm">✓</Badge>}
          </div>
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-gray-900">{rec.title}</p>

        {/* Description */}
        <div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {expanded ? rec.description : descShort}
            {isLong && !expanded && '…'}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded(e => !e)}
              className="text-xs text-brand hover:text-brand-dark font-medium mt-1 flex items-center gap-0.5"
            >
              {expanded ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>Read more <ChevronDown className="w-3 h-3" /></>}
            </button>
          )}
        </div>

        {/* Info row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {price && (
            <span className={cn('px-2 py-0.5 rounded-full font-medium', price.cls)}>{price.label}</span>
          )}
          {rec.approximatePrice && (
            <span className="text-gray-500">~{rec.approximatePrice}</span>
          )}
          {rec.address && (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{rec.address}</span>
            </span>
          )}
          {rec.websiteUrl && (
            <a
              href={rec.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-brand hover:text-brand-dark"
            >
              <ExternalLink className="w-3 h-3" />Website
            </a>
          )}
        </div>

        {/* Photos */}
        {rec.imageUrls?.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {rec.imageUrls.slice(0, 3).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${rec.title} photo ${i + 1}`}
                className="w-20 h-20 object-cover rounded-xl shrink-0 cursor-pointer"
                onClick={() => window.open(url, '_blank')}
              />
            ))}
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleUpvote}
              disabled={upvoting}
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium transition-colors',
                localUpvoted ? 'text-brand' : 'text-gray-400 hover:text-brand'
              )}
            >
              <ThumbsUp className={cn('w-4 h-4', localUpvoted && 'fill-brand')} />
              {localCount > 0 && localCount}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <Share2 className="w-3.5 h-3.5" />Share
            </button>
          </div>

          <div className="flex items-center gap-2">
            {rec.createdAt && (
              <span className="text-[10px] text-gray-400">{formatRelativeTime(rec.createdAt)}</span>
            )}
            {canEdit && (
              <div className="flex gap-1">
                <button type="button" onClick={() => onEdit?.(rec)} className="text-xs text-gray-400 hover:text-brand">Edit</button>
                <button type="button" onClick={() => onDelete?.(rec._id)} className="text-xs text-gray-400 hover:text-danger">Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

RecommendationCard.Skeleton = function RecSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-gray-200 p-4 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}
