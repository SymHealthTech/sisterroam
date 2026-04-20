import HostCard from './HostCard'
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function HostGrid({ hosts, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (!hosts?.length) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🌍</p>
        <p className="text-gray-500 font-medium">No hosts found</p>
        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {hosts.map(host => <HostCard key={host._id} host={host} />)}
    </div>
  )
}
