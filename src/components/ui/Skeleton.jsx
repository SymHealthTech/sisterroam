import { cn } from '@/lib/utils'

const variantClass = {
  text:   'h-4 w-full rounded-md',
  line:   'h-1 w-full rounded-full',
  avatar: 'rounded-full',
  card:   'rounded-[14px]',
}

export default function Skeleton({ variant = 'text', className }) {
  return (
    <div
      className={cn('shimmer', variantClass[variant], className)}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-[14px] p-4 space-y-3">
      <Skeleton variant="card" className="h-40 w-full" />
      <div className="flex gap-3 items-center">
        <Skeleton variant="avatar" className="w-11 h-11 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}
