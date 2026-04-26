'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import HostGrid from '@/components/host/HostGrid'
import HostSearchBar from '@/components/host/HostSearchBar'
import HostFilters from '@/components/host/HostFilters'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { SlidersHorizontal, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEFAULT_FILTERS = {
  q:                 '',
  country:           '',
  city:              '',
  accommodationType: '',
  femaleOnly:        false,
  verifiedOnly:      false,
  category:          '',
  sort:              'stays',
}

const LIMIT = 12

function filtersFromParams(params) {
  return {
    q:                 params.get('q')                 ?? '',
    country:           params.get('country')           ?? '',
    city:              params.get('city')              ?? '',
    accommodationType: params.get('accommodationType') ?? '',
    femaleOnly:        params.get('femaleOnly')        === 'true',
    verifiedOnly:      params.get('verifiedOnly')      === 'true',
    category:          params.get('category')          ?? '',
    sort:              params.get('sort')              ?? 'stays',
  }
}

function toQueryString(filters, page = 1) {
  const p = new URLSearchParams()
  if (filters.q)                 p.set('q',                 filters.q)
  if (filters.country)           p.set('country',           filters.country)
  if (filters.city)              p.set('city',              filters.city)
  if (filters.accommodationType) p.set('accommodationType', filters.accommodationType)
  if (filters.femaleOnly)        p.set('femaleOnly',        'true')
  if (filters.verifiedOnly)      p.set('verifiedOnly',      'true')
  if (filters.category)          p.set('category',          filters.category)
  if (filters.sort && filters.sort !== 'stays') p.set('sort', filters.sort)
  if (page > 1)                  p.set('page',              String(page))
  return p.toString()
}

function isActive(filters) {
  return !!(
    filters.q || filters.country || filters.accommodationType ||
    filters.femaleOnly || filters.verifiedOnly || filters.category ||
    (filters.sort && filters.sort !== 'stays')
  )
}

function activeCount(filters) {
  let n = 0
  if (filters.q)                 n++
  if (filters.country)           n++
  if (filters.accommodationType) n++
  if (filters.femaleOnly)        n++
  if (filters.verifiedOnly)      n++
  if (filters.category)          n++
  return n
}

function ExploreContent() {
  const router     = useRouter()
  const params     = useSearchParams()

  const [filters,        setFilters]        = useState(() => filtersFromParams(params))
  const [hosts,          setHosts]          = useState([])
  const [total,          setTotal]          = useState(0)
  const [page,           setPage]           = useState(1)
  const [isLoading,      setIsLoading]      = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [showFilters,    setShowFilters]    = useState(false)

  const debounceRef = useRef(null)

  const fetchHosts = useCallback(async (f, pg, append = false) => {
    const qs = toQueryString(f, pg) + `&limit=${LIMIT}`
    const res = await fetch(`/api/hosts?${qs}`)
    if (!res.ok) return
    const data = await res.json()
    const next  = data.data?.hosts ?? []
    const count = data.data?.total ?? 0
    setHosts((prev) => append ? [...prev, ...next] : next)
    setTotal(count)
  }, [])

  // Load on mount
  useEffect(() => {
    setIsLoading(true)
    fetchHosts(filters, 1, false).finally(() => setIsLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function applyFilters(newFilters, debounce = false) {
    setFilters(newFilters)
    const qs = toQueryString(newFilters)
    router.push('/explore' + (qs ? '?' + qs : ''), { scroll: false })

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      setPage(1)
      await fetchHosts(newFilters, 1, false)
      setIsLoading(false)
    }, debounce ? 300 : 0)
  }

  async function handleLoadMore() {
    const next = page + 1
    setPage(next)
    setIsFetchingMore(true)
    await fetchHosts(filters, next, true)
    setIsFetchingMore(false)
  }

  const hasMore  = hosts.length < total
  const active   = isActive(filters)
  const badgeNum = activeCount(filters)

  return (
    <AppLayout title="Explore hosts">
      <div className="flex min-h-full">

        {/* Desktop filter sidebar */}
        <div className="hidden lg:block w-[280px] shrink-0 border-r border-gray-100 bg-white sticky top-14 self-start overflow-y-auto max-h-[calc(100vh-3.5rem)] px-5 py-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Filters</h2>
          <HostFilters
            filters={filters}
            onChange={(f) => applyFilters(f)}
            onClear={() => applyFilters(DEFAULT_FILTERS)}
            hasActiveFilters={active}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 px-4 py-5 lg:px-6 space-y-5">

          {/* Search bar + mobile filter toggle */}
          <div className="flex items-center gap-3">
            <HostSearchBar
              value={filters.q}
              onChange={(q) => applyFilters({ ...filters, q }, true)}
              onSubmit={(q) => applyFilters({ ...filters, q })}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className={cn(
                'lg:hidden relative flex items-center gap-1.5 px-4 py-3 rounded-[10px] border text-sm font-medium transition-colors shrink-0',
                active
                  ? 'border-brand bg-brand-lighter text-brand'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {badgeNum > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand text-white text-[10px] flex items-center justify-center font-bold">
                  {badgeNum}
                </span>
              )}
            </button>
          </div>

          {/* Results count */}
          {!isLoading && (
            <p className="text-sm text-gray-500">
              {total === 0
                ? 'No hosts match your filters'
                : hosts.length < total
                  ? `Showing ${hosts.length} of ${total} verified hosts`
                  : `${total} host${total !== 1 ? 's' : ''} found`}
            </p>
          )}

          {/* Host grid */}
          <HostGrid hosts={hosts} isLoading={isLoading} skeletonCount={6} />

          {/* Empty state */}
          {!isLoading && hosts.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <Compass className="w-12 h-12 mx-auto text-gray-200" />
              <h3 className="text-base font-semibold text-gray-900">No verified hosts found</h3>
              <p className="text-sm text-gray-500">
                {filters.country
                  ? `Be the first to host in ${filters.country}!`
                  : 'Try adjusting your filters or searching in a different location.'}
              </p>
              {active && (
                <Button onClick={() => applyFilters(DEFAULT_FILTERS)} variant="ghost" size="sm">
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {/* Load more */}
          {!isLoading && hasMore && (
            <div className="flex justify-center pt-2 pb-6">
              <Button
                onClick={handleLoadMore}
                loading={isFetchingMore}
                variant="secondary"
                size="md"
              >
                Load {Math.min(LIMIT, total - hosts.length)} more hosts
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
      >
        <HostFilters
          filters={filters}
          onChange={(f) => applyFilters(f)}
          onClear={() => { applyFilters(DEFAULT_FILTERS); setShowFilters(false) }}
          hasActiveFilters={active}
        />
        <div className="mt-5 pt-4 border-t border-gray-100">
          <Button onClick={() => setShowFilters(false)} variant="primary" fullWidth>
            Apply filters
          </Button>
        </div>
      </Modal>
    </AppLayout>
  )
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreContent />
    </Suspense>
  )
}
