import { cn } from '@/lib/utils'
import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const selectBase =
  'w-full h-[44px] sm:h-[40px] pl-3 pr-9 rounded-lg border bg-white text-sm text-gray-900 ' +
  'appearance-none cursor-pointer ' +
  'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent ' +
  'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder, required, name, id, className, ...props },
  ref
) {
  const inputId = id ?? name

  return (
    <div className="flex flex-col">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-gray-600 mb-1">
          {label}
          {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          name={name}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(selectBase, error ? 'border-danger' : 'border-gray-200', className)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(({ value, label: optLabel }) => (
            <option key={value} value={value}>
              {optLabel}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})

export default Select
