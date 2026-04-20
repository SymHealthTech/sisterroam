import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const Select = forwardRef(function Select({ label, error, options = [], className, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900',
          'text-sm appearance-none',
          'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
          error && 'border-danger focus:ring-danger',
          className
        )}
        {...props}
      >
        {options.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
})

export default Select
