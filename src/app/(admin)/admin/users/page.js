'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'

function PaymentInfo({ payment }) {
  if (!payment) {
    return <span className="text-xs text-gray-400">Not purchased</span>
  }
  if (payment.status === 'completed') {
    return (
      <div>
        <span className="text-xs text-teal font-medium">
          Purchased {formatDate(payment.paidAt ?? payment.createdAt)} · {payment.currency} {payment.amount}
        </span>
        {payment.dodoPaymentId && (
          <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-[200px]">
            Dodo ID: {payment.dodoPaymentId}
          </p>
        )}
      </div>
    )
  }
  if (payment.status === 'pending') {
    return <span className="text-xs text-amber-dark font-medium">Payment in progress</span>
  }
  if (payment.status === 'failed') {
    return (
      <div>
        <span className="text-xs text-danger font-medium">
          Payment failed {formatDate(payment.createdAt)}
        </span>
        {payment.dodoPaymentId && (
          <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-[200px]">
            Dodo ID: {payment.dodoPaymentId}
          </p>
        )}
      </div>
    )
  }
  return <span className="text-xs text-gray-400">{payment.status}</span>
}

export default function UserManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [users,   setUsers]   = useState([])
  const [total,   setTotal]   = useState(0)
  const [pages,   setPages]   = useState(1)
  const [page,    setPage]    = useState(1)
  const [query,   setQuery]   = useState('')
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async (q, p) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, ...(q ? { q } : {}) })
      const res  = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (data.success) {
        setUsers(data.data.users)
        setTotal(data.data.total)
        setPages(data.data.pages)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated' && !session?.user?.isAdmin) { router.push('/feed'); return }
    if (status === 'authenticated') fetchUsers(query, page)
  }, [status, session, query, page, fetchUsers, router])

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    fetchUsers(query, 1)
  }

  if (status === 'loading') {
    return (
      <main className="p-6 max-w-5xl mx-auto space-y-4">
        {[1,2,3].map(i => <Skeleton key={i} variant="card" className="h-16" />)}
      </main>
    )
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">User Management</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </form>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[2fr_2fr_1fr_2fr] gap-4 px-4 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
          <span>Member</span>
          <span>Email</span>
          <span>Tier</span>
          <span>Verified badge payment</span>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No users found</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map(user => (
              <div key={user._id} className="grid grid-cols-[2fr_2fr_1fr_2fr] gap-4 px-4 py-3 items-center hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={user.fullName} src={user.profilePhotoUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
                    <p className="text-[11px] text-gray-400">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 truncate">{user.email}</p>
                <Badge variant={user.verificationTier === 'verified' ? 'verified' : user.verificationTier === 'trusted' ? 'trusted' : 'basic'} size="xs">
                  {user.verificationTier ?? 'basic'}
                </Badge>
                <PaymentInfo payment={user.payment} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </main>
  )
}
