import { cn } from '@/lib/utils'

export default function Card({ children, onClick, hover = false, padding = true, className }) {
  const interactive = onClick || hover

  return (
    <div
      className={cn(
        'bg-white border border-gray-100 rounded-[14px] overflow-hidden transition-colors',
        interactive && 'cursor-pointer hover:border-gray-200',
        padding && 'p-4',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick(e) : undefined}
    >
      {children}
    </div>
  )
}
