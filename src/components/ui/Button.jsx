'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

const variants = {
  primary:   'bg-brand text-white hover:bg-brand-dark',
  secondary: 'border-2 border-brand text-brand hover:bg-brand-lighter',
  ghost:     'border border-gray-200 text-gray-600 hover:bg-gray-50',
  danger:    'bg-danger text-white hover:bg-danger-dark',
  white:     'bg-white text-brand hover:bg-brand-lighter',
}

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-5 py-3 text-sm',
  lg: 'px-6 py-3.5 text-base',
}

const base =
  'relative inline-flex items-center justify-center font-medium rounded-[10px] ' +
  'transition-colors active:scale-[0.98] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled = false,
  children,
  onClick,
  type = 'button',
  href,
  className,
  ...props
}) {
  const classes = cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)

  const inner = (
    <>
      <span className={cn('inline-flex items-center gap-2', loading && 'invisible')}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </span>
      )}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={cn(classes, (disabled || loading) && 'pointer-events-none opacity-50')}
        aria-disabled={disabled || loading}
        {...props}
      >
        {inner}
      </Link>
    )
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {inner}
    </button>
  )
}
