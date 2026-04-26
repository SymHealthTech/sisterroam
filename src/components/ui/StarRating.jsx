'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const SIZES = {
  sm: { icon: 'w-3.5 h-3.5', count: 'text-xs' },
  md: { icon: 'w-5 h-5',     count: 'text-sm' },
  lg: { icon: 'w-7 h-7',     count: 'text-base' },
}

export default function StarRating({
  value = 0,
  onChange,
  size = 'md',
  showCount = false,
  count = 0,
}) {
  const [hover, setHover] = useState(0)
  const isInteractive = typeof onChange === 'function'
  const display = isInteractive && hover ? hover : value
  const { icon, count: countCls } = SIZES[size]

  const stars = isInteractive ? (
    // Interactive: radio group for accessibility, styled stars on top
    <fieldset className="border-0 p-0 m-0">
      <legend className="sr-only">Star rating</legend>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <label
            key={star}
            className="relative cursor-pointer"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
          >
            <input
              type="radio"
              name="rating"
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              className="sr-only"
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            />
            <Star
              className={cn(
                icon,
                'transition-colors',
                star <= display ? 'fill-amber text-amber' : 'fill-transparent text-gray-300'
              )}
              aria-hidden="true"
            />
          </label>
        ))}
      </div>
    </fieldset>
  ) : (
    // Display-only
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`Rating: ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            icon,
            star <= display ? 'fill-amber text-amber' : 'fill-transparent text-gray-300'
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  )

  if (!showCount) return stars

  return (
    <div className="flex items-center gap-1.5">
      {stars}
      <span className={cn(countCls, 'text-gray-500')}>({count.toLocaleString()})</span>
    </div>
  )
}
