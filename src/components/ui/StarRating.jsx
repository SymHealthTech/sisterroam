'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function StarRating({ value = 0, onChange, readonly = false, size = 'md' }) {
  const sizes = { sm: 'w-3 h-3', md: 'w-5 h-5', lg: 'w-7 h-7' }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn('transition-transform', !readonly && 'hover:scale-110 active:scale-95')}
        >
          <Star
            className={cn(
              sizes[size],
              star <= value ? 'fill-amber text-amber' : 'fill-transparent text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  )
}
