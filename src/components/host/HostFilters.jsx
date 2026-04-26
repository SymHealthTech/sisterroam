'use client'

import Toggle from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'

const ACCOMMODATION_OPTIONS = [
  { value: '',             label: 'All types' },
  { value: 'private_room', label: 'Private room' },
  { value: 'shared_room',  label: 'Shared room' },
  { value: 'couch',        label: 'Couch' },
  { value: 'floor_space',  label: 'Floor space' },
  { value: 'tent_space',   label: 'Tent space' },
]

const CATEGORY_OPTIONS = [
  { value: '',               label: 'All' },
  { value: 'solo_traveller', label: 'Solo traveller' },
  { value: 'backpacker',     label: 'Backpacker' },
  { value: 'cyclist',        label: 'Cyclist' },
  { value: 'trekker',        label: 'Trekker' },
  { value: 'runner',         label: 'Runner' },
  { value: 'road_tripper',   label: 'Road tripper' },
]

const SORT_OPTIONS = [
  { value: 'stays',  label: 'Most reviewed' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'newest', label: 'Newest members' },
]

const COUNTRIES = [
  'India', 'Nepal', 'Sri Lanka', 'Thailand', 'Vietnam', 'Indonesia', 'Malaysia',
  'Philippines', 'Japan', 'South Korea', 'Germany', 'France', 'Spain', 'Italy',
  'Portugal', 'United Kingdom', 'United States', 'Canada', 'Australia',
  'New Zealand', 'Brazil', 'Argentina', 'Mexico', 'Colombia', 'Peru',
  'South Africa', 'Kenya', 'Morocco', 'Egypt', 'Turkey',
]

function Section({ title, children }) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}

export default function HostFilters({ filters, onChange, onClear, hasActiveFilters }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="space-y-5">
      <Section title="Location">
        <select
          value={filters.country ?? ''}
          onChange={(e) => onChange({ ...filters, country: e.target.value, city: '' })}
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-[10px] text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        >
          <option value="">All countries</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {filters.country && (
          <input
            type="text"
            value={filters.city ?? ''}
            onChange={(e) => set('city', e.target.value)}
            placeholder="City (optional)"
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-[10px] text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand mt-2"
          />
        )}
      </Section>

      <div className="h-px bg-gray-100" />

      <Section title="Accommodation type">
        <div className="space-y-2">
          {ACCOMMODATION_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="accommodationType"
                value={value}
                checked={(filters.accommodationType ?? '') === value}
                onChange={() => set('accommodationType', value)}
                className="w-4 h-4 accent-brand"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </Section>

      <div className="h-px bg-gray-100" />

      <Section title="Preferences">
        <div className="space-y-3">
          <Toggle
            checked={filters.femaleOnly ?? false}
            onChange={(v) => set('femaleOnly', v)}
            label="Female hosts only"
          />
          <Toggle
            checked={filters.verifiedOnly ?? false}
            onChange={(v) => set('verifiedOnly', v)}
            label="Verified members only"
          />
        </div>
      </Section>

      <div className="h-px bg-gray-100" />

      <Section title="Traveller community">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => set('category', value)}
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                (filters.category ?? '') === value
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <div className="h-px bg-gray-100" />

      <Section title="Sort by">
        <div className="space-y-2">
          {SORT_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="sort"
                value={value}
                checked={(filters.sort ?? 'stays') === value}
                onChange={() => set('sort', value)}
                className="w-4 h-4 accent-brand"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </Section>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-brand hover:text-brand-dark font-medium"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
