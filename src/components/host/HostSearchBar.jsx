'use client'

import { useState, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HostSearchBar({
  value = '',
  onChange,
  onSubmit,
  className,
  placeholder,
}) {
  const [localValue, setLocalValue] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  const timerRef = useRef(null)

  if (value !== prevValue) {
    setPrevValue(value)
    setLocalValue(value)
  }

  function handleChange(e) {
    const v = e.target.value
    setLocalValue(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange?.(v), 300)
  }

  function handleClear() {
    setLocalValue('')
    onChange?.('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    clearTimeout(timerRef.current)
    onSubmit?.(localValue)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="search"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder ?? 'Search for a host in any city...'}
        className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-[10px] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  )
}
