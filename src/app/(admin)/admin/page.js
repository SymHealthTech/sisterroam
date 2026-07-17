'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import Skeleton from '@/components/ui/Skeleton'
import AddSisterCard from '@/components/admin/AddSisterCard'
import {
  Users, ShieldCheck, FileCheck, Home, Flag, BookOpen,
  UserPlus, MapPin, MessageSquare, ArrowRight, Activity, Sparkles,
} from 'lucide-react'

/* Literal class maps — Tailwind v4 only generates classes it can see as
   complete strings, so every colour variant is spelled out in full. */
const COLOR = {
  brand:  { chip: 'bg-brand-lighter text-brand',      value: 'text-brand',      bar: 'bg-brand',  glow: 'from-brand/10' },
  teal:   { chip: 'bg-teal-lighter text-teal-dark',   value: 'text-teal-dark',  bar: 'bg-teal',   glow: 'from-teal/10' },
  amber:  { chip: 'bg-amber-lighter text-amber-dark', value: 'text-amber-dark', bar: 'bg-amber',  glow: 'from-amber/10' },
  danger: { chip: 'bg-danger-lighter text-danger-dark', value: 'text-danger-dark', bar: 'bg-danger', glow: 'from-danger/10' },
  pink:   { chip: 'bg-pink-lighter text-pink-dark',   value: 'text-pink-dark',  bar: 'bg-pink',   glow: 'from-pink/10' },
}

const STAT_META = [
  { key: 'totalMembers',         icon: Users,         label: 'Total Members',   color: 'brand'  },
  { key: 'verifiedMembers',      icon: ShieldCheck,   label: 'Verified',        color: 'teal'   },
  { key: 'pendingKyc',           icon: FileCheck,     label: 'KYC Pending',     color: 'amber'  },
  { key: 'activeStays',          icon: Home,          label: 'Active Stays',    color: 'pink'   },
  { key: 'openReports',          icon: Flag,          label: 'Open Reports',    color: 'danger' },
  { key: 'blogPosts',            icon: BookOpen,      label: 'Stories',         color: 'brand'  },
  { key: 'openCoTravelPosts',    icon: UserPlus,      label: 'Open Co-travel',  color: 'teal'   },
  { key: 'totalRecommendations', icon: MapPin,        label: 'Recommendations', color: 'pink'   },
  { key: 'openQuestions',        icon: MessageSquare, label: 'Open Questions',  color: 'amber'  },
]

const QUICK_ACTIONS = [
  { label: 'Review KYC',        desc: 'Approve or reject IDs',   href: '/admin/kyc',       icon: FileCheck,     grad: 'from-amber to-amber-light'   },
  { label: 'Safety Reports',    desc: 'Handle open incidents',   href: '/admin/reports',   icon: Flag,          grad: 'from-danger to-danger-light' },
  { label: 'Manage Users',      desc: 'Members & payments',      href: '/admin/users',     icon: Users,         grad: 'from-brand to-brand-light'   },
  { label: 'Community',         desc: 'Moderate content',        href: '/admin/community', icon: MessageSquare, grad: 'from-teal to-teal-light'     },
]

export default function AdminDashboardPage() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data) })
      .finally(() => setLoading(false))
  }, [])

  const verifyRate = stats
    ? Math.round((stats.verifiedMembers / Math.max(1, stats.totalMembers)) * 100)
    : 0

  return (
    <AdminLayout>
      <div className="min-h-full bg-gradient-to-b from-gray-50 to-white">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-6xl mx-auto">

          {/* ── Header ──────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand to-pink flex items-center justify-center text-white shadow-sm shadow-brand/20 shrink-0">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Platform overview and quick actions</p>
            </div>
          </div>

          {/* ── Stats grid ──────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} variant="card" className="h-28" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {STAT_META.map(({ key, icon: Icon, label, color }) => {
                const c = COLOR[color]
                return (
                  <div
                    key={key}
                    className={`group relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${c.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} aria-hidden="true" />
                    <div className="relative flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
                        <p className={`text-3xl font-bold ${c.value}`}>
                          {(stats?.[key] ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.chip}`}>
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Quick actions ───────────────────────────── */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-brand" aria-hidden="true" />
              Quick actions
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {QUICK_ACTIONS.map(a => (
                <a
                  key={a.href}
                  href={a.href}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${a.grad} p-5 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all`}
                >
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/10 group-hover:scale-125 transition-transform" aria-hidden="true" />
                  <a.icon className="w-6 h-6 mb-3 relative" aria-hidden="true" />
                  <p className="font-semibold text-sm relative">{a.label}</p>
                  <p className="text-white/75 text-xs mt-0.5 relative">{a.desc}</p>
                </a>
              ))}
            </div>
          </div>

          {/* ── Add a new sister ────────────────────────── */}
          <AddSisterCard />

          {/* ── Platform health ─────────────────────────── */}
          {stats && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal" aria-hidden="true" />
                Platform health
              </h2>

              <div className="space-y-5">
                {/* Verification rate */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-600">Verification rate</span>
                    <span className="text-sm font-bold text-teal-dark">{verifyRate}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal to-teal-light rounded-full transition-all duration-700"
                      style={{ width: `${verifyRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {stats.verifiedMembers.toLocaleString()} of {stats.totalMembers.toLocaleString()} members verified
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between rounded-xl bg-pink-lighter/60 px-4 py-3">
                    <span className="text-sm text-pink-dark font-medium">Active stays</span>
                    <span className="text-lg font-bold text-pink-dark">{stats.activeStays}</span>
                  </div>
                  <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${stats.openReports > 0 ? 'bg-danger-lighter/60' : 'bg-teal-lighter/60'}`}>
                    <span className={`text-sm font-medium ${stats.openReports > 0 ? 'text-danger-dark' : 'text-teal-dark'}`}>
                      Safety reports
                    </span>
                    <span className={`text-sm font-bold ${stats.openReports > 0 ? 'text-danger-dark' : 'text-teal-dark'}`}>
                      {stats.openReports > 0 ? `${stats.openReports} open` : 'All clear ✓'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
