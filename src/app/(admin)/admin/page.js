'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import StatsGrid from '@/components/admin/StatsGrid'
import Skeleton from '@/components/ui/Skeleton'
import { formatRelativeTime } from '@/lib/utils'
import {
  Users, ShieldCheck, FileCheck, Home, Flag, BookOpen,
  UserPlus, MapPin, MessageSquare,
} from 'lucide-react'

const STAT_ICONS = {
  totalMembers:        { icon: Users,          label: 'Total Members',      color: 'brand'  },
  verifiedMembers:     { icon: ShieldCheck,     label: 'Verified',           color: 'teal'   },
  pendingKyc:          { icon: FileCheck,       label: 'KYC Pending',        color: 'amber'  },
  activeStays:         { icon: Home,            label: 'Active Stays',       color: 'teal'   },
  openReports:         { icon: Flag,            label: 'Open Reports',       color: 'danger' },
  blogPosts:           { icon: BookOpen,        label: 'Stories',            color: 'brand'  },
  openCoTravelPosts:   { icon: UserPlus,        label: 'Open Co-travel',     color: 'brand'  },
  totalRecommendations:{ icon: MapPin,          label: 'Recommendations',    color: 'teal'   },
  openQuestions:       { icon: MessageSquare,   label: 'Open Questions',     color: 'amber'  },
}

export default function AdminDashboardPage() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data) })
      .finally(() => setLoading(false))
  }, [])

  const statCards = stats
    ? Object.entries(STAT_ICONS).map(([key, meta]) => ({
        label: meta.label,
        value: stats[key] ?? 0,
        color: meta.color,
      }))
    : null

  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Platform overview and quick actions</p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6,7,8,9].map(i => <Skeleton key={i} variant="card" className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {(statCards ?? []).map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-sm text-gray-500 mb-1">{label}</p>
                <p className={`text-3xl font-bold text-${color}`}>{value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Review KYC',       href: '/admin/kyc',         color: 'amber'  },
              { label: 'Safety reports',   href: '/admin/reports',     color: 'danger' },
              { label: 'Manage users',     href: '/admin/users',       color: 'brand'  },
              { label: 'Community content',href: '/admin/community',   color: 'teal'   },
            ].map(a => (
              <a
                key={a.href}
                href={a.href}
                className={`flex items-center justify-center px-4 py-3 rounded-xl text-sm font-medium bg-${a.color}-lighter/30 text-${a.color} hover:bg-${a.color}-lighter transition-colors`}
              >
                {a.label}
              </a>
            ))}
          </div>
        </div>

        {/* Platform health */}
        {stats && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Platform health</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Verification rate</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal rounded-full"
                      style={{ width: `${Math.round((stats.verifiedMembers / Math.max(1, stats.totalMembers)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-teal w-10 text-right">
                    {Math.round((stats.verifiedMembers / Math.max(1, stats.totalMembers)) * 100)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active stays</span>
                <span className="text-sm font-semibold text-gray-900">{stats.activeStays}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Unresolved safety reports</span>
                <span className={`text-sm font-semibold ${stats.openReports > 0 ? 'text-danger' : 'text-teal'}`}>
                  {stats.openReports > 0 ? `${stats.openReports} open` : 'All clear ✓'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
