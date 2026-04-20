import { cn } from '@/lib/utils'

const variants = {
  brand: 'bg-brand-lighter text-brand',
  pink: 'bg-pink-lighter text-pink-dark',
  teal: 'bg-teal-lighter text-teal-dark',
  amber: 'bg-amber-lighter text-amber-dark',
  danger: 'bg-danger-lighter text-danger-dark',
  gray: 'bg-gray-100 text-gray-600',
}

export default function Badge({ children, variant = 'brand', className }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
