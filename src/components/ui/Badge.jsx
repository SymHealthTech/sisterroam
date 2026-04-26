import { cn } from '@/lib/utils'

const variants = {
  verified: 'bg-brand-lighter text-brand-dark',
  trusted:  'bg-teal-lighter text-teal-dark',
  basic:    'bg-gray-100 text-gray-600',
  female:   'bg-pink-lighter text-pink-dark',
  pending:  'bg-amber-lighter text-amber-dark',
  danger:   'bg-danger-lighter text-danger-dark',
  success:  'bg-teal-lighter text-teal-dark',
  // Additional variants used across the app
  gray:     'bg-gray-100 text-gray-600',
  brand:    'bg-brand-lighter text-brand',
  teal:     'bg-teal-lighter text-teal-dark',
  amber:    'bg-amber-lighter text-amber-dark',
  pink:     'bg-pink-lighter text-pink-dark',
}

const sizes = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
}

export default function Badge({ variant = 'basic', size = 'md', children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}
