import Link from 'next/link'
import { LayoutDashboard, Shield, Users, FileCheck } from 'lucide-react'

const adminNav = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/kyc', icon: FileCheck, label: 'KYC Queue' },
  { href: '/admin/reports', icon: Shield, label: 'Reports' },
  { href: '/admin/users', icon: Users, label: 'Users' },
]

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-60 bg-gray-950 text-gray-300 flex flex-col p-4 gap-1">
        <div className="text-white font-bold text-lg px-3 py-4 mb-2">
          SisterRoam Admin
        </div>
        {adminNav.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-white/10 transition-colors">
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}
