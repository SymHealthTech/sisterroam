import HostCard from './HostCard'

export default function HostGrid({ hosts = [], isLoading, loading, skeletonCount = 6 }) {
  const showSkeleton = isLoading ?? loading

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {showSkeleton
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <HostCard.Skeleton key={i} />
          ))
        : hosts.map((host) => (
            <HostCard key={host._id} host={host} />
          ))}
    </div>
  )
}
