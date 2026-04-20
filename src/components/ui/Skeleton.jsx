import { cn } from '@/lib/utils'

export default function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse bg-gray-100 rounded-xl', className)} />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}
