'use client'

import { useState } from 'react'
import { ThumbsUp, Shield, ExternalLink, MapPin, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { cn, formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'

const CATEGORY_CONFIG = {
  stay:      { label: 'Stay',      accent: 'border-l-brand',   chip: 'bg-brand-lighter text-brand'   },
  food:      { label: 'Food',      accent: 'border-l-amber',   chip: 'bg-amber-lighter text-amber'   },
  transport: { label: 'Transport', accent: 'border-l-teal',    chip: 'bg-teal-lighter text-teal'     },
  safety:    { label: 'Safety',    accent: 'border-l-danger',  chip: 'bg-danger-lighter text-danger' },
  activity:  { label: 'Activity',  accent: 'border-l-pink',    chip: 'bg-pink-50 text-pink'          },
  general:   { label: 'General',   accent: 'border-l-gray-300',chip: 'bg-gray-100 text-gray-600'     },
}

const PRICE_LABELS = {
  free:      { label: 'Free',      cls: 'bg-teal-lighter text-teal' },
  budget:    { label: 'Budget',    cls: 'bg-gray-100 text-gray-500' },
  mid_range: { label: 'Mid-range', cls: 'bg-amber-lighter text-amber-dark' },
  splurge:   { label: 'Splurge',   cls: 'bg-brand-lighter text-brand' },
}

export default function RecommendationCard({ rec, onUpvote, canEdit, onEdit, onDelete }) {
  const [expanded,     setExpanded]     = useState(false)
  const [upvoting,     setUpvoting]     = useState(false)
  const [localUpvoted, setLocalUpvoted] = useState(rec.hasUpvoted)
  const [localCount,   setLocalCount]   = useState(rec.upvoteCount ?? 0)
  const [deleting,     setDeleting]     = useState(false)

  const author = rec.authorId ?? {}
  const cat    = CATEGORY_CONFIG[rec.category] ?? CATEGORY_CONFIG.general
  const price  = PRICE_LABELS[rec.priceRange]

  const descShort = rec.description?.slice(0, 200)
  const isLong    = (rec.description?.length ?? 0) > 200

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

  async function handleDelete() {
    if (!confirm('Delete this recommendation?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/recommendations/${rec._id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to delete')
      } else {
        toast.success('Recommendation deleted')
        onDelete?.(rec._id)
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={cn(
      'group bg-white rounded-2xl border border-gray-100 overflow-hidden border-l-4 shadow-sm hover:shadow-md transition-shadow duration-200',
      cat.accent
    )}>
      <div className="p-5 space-y-3.5">

        {/* Header: category + verified + author */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className={cn('text-[11px] px-2.5 py-0.5 rounded-full font-semibold tracking-wide', cat.chip)}>
              {cat.label}
            </span>
            {rec.isVerifiedExperience && (
              <span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded-full bg-teal-lighter text-teal font-medium">
                <Shield className="w-3 h-3" />Verified
              </span>
            )}
            {rec.city && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-400">
                <MapPin className="w-3 h-3" />{rec.city}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Avatar src={author.profilePhotoUrl} name={author.fullName} size="xs" />
            <div className="text-right">
              <p className="text-xs font-medium text-gray-700 leading-none">{author.fullName}</p>
              {rec.createdAt && (
                <p className="text-[10px] text-gray-400 mt-0.5">{formatRelativeTime(rec.createdAt)}</p>
              )}
            </div>
            {['verified', 'trusted'].includes(author.verificationTier) && (
              <Badge variant="verified" size="sm">✓</Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-bold text-gray-900 leading-snug">{rec.title}</h3>

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
              className="text-xs text-brand hover:text-brand-dark font-medium mt-1.5 flex items-center gap-0.5"
            >
              {expanded ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>Read more <ChevronDown className="w-3 h-3" /></>}
            </button>
          )}
        </div>

        {/* Meta: price + address + website */}
        {(price || rec.approximatePrice || rec.address || rec.websiteUrl) && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {price && (
              <span className={cn('px-2.5 py-0.5 rounded-full font-medium', price.cls)}>{price.label}</span>
            )}
            {rec.approximatePrice && (
              <span className="text-gray-500 font-medium">~{rec.approximatePrice}</span>
            )}
            {rec.address && (
              <span className="flex items-center gap-0.5 text-gray-500">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[140px]">{rec.address}</span>
              </span>
            )}
            {rec.websiteUrl && (
              <a
                href={rec.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-brand hover:text-brand-dark font-medium"
              >
                <ExternalLink className="w-3 h-3" />Website
              </a>
            )}
          </div>
        )}

        {/* Photos */}
        {rec.imageUrls?.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {rec.imageUrls.slice(0, 3).map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`${rec.title} photo ${i + 1}`}
                className="w-24 h-24 object-cover rounded-xl shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(url, '_blank')}
              />
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-50" />

        {/* Action row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUpvote}
              disabled={upvoting}
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors',
                localUpvoted
                  ? 'bg-brand-lighter text-brand'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              )}
            >
              <ThumbsUp className={cn('w-3.5 h-3.5', localUpvoted && 'fill-brand')} />
              {localCount > 0 ? localCount : 'Helpful'}
            </button>
          </div>

          {canEdit && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit?.(rec)}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-gray-400 hover:bg-brand-lighter hover:text-brand transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-gray-400 hover:bg-danger-lighter hover:text-danger transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />{deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

RecommendationCard.Skeleton = function RecSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-gray-200 shadow-sm p-5 space-y-3.5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}
