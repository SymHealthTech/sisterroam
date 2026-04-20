import { cn } from '@/lib/utils'

export default function Card({ children, className, ...props }) {
  return (
    <div
      className={cn('bg-white rounded-2xl shadow-sm border border-gray-100', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }) {
  return <div className={cn('px-5 py-4 border-b border-gray-100', className)}>{children}</div>
}

export function CardBody({ children, className }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
}

export function CardFooter({ children, className }) {
  return <div className={cn('px-5 py-4 border-t border-gray-100', className)}>{children}</div>
}
