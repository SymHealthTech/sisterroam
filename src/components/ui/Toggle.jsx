import { cn } from '@/lib/utils'

export default function Toggle({ checked, onChange, label, description, disabled = false, className }) {
  return (
    <label
      className={cn(
        'flex items-center justify-between gap-4',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className
      )}
    >
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <p className="text-sm font-medium text-gray-900 leading-snug">{label}</p>
          )}
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* Hidden native checkbox for accessibility */}
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => !disabled && onChange?.(e.target.checked)}
        disabled={disabled}
        aria-label={label}
      />

      {/* Visual track + knob */}
      <div
        className={cn(
          'relative shrink-0 w-10 h-[22px] rounded-full transition-colors duration-200',
          checked ? 'bg-brand' : 'bg-gray-200'
        )}
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200',
            checked && 'translate-x-[18px]'
          )}
        />
      </div>
    </label>
  )
}
