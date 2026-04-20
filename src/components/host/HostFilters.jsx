'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import Button from '@/components/ui/Button'
import Toggle from '@/components/ui/Toggle'

export default function HostFilters({ onFilter }) {
  const [query, setQuery] = useState('')
  const [femaleOnly, setFemaleOnly] = useState(true)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  function apply() {
    onFilter?.({ query, femaleOnly, verifiedOnly })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="City, country..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && apply()}
          />
        </div>
        <Button variant="ghost" size="md" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
        <Button onClick={apply}>Search</Button>
      </div>

      {showFilters && (
        <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
          <Toggle checked={femaleOnly} onChange={setFemaleOnly} label="Female guests only" />
          <Toggle checked={verifiedOnly} onChange={setVerifiedOnly} label="Verified hosts only" />
        </div>
      )}
    </div>
  )
}
