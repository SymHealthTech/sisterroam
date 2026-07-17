'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Search, ChevronLeft, ChevronRight, Trash2, AlertTriangle,
  ShieldAlert, Users as UsersIcon, MapPin,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import AdminLayout from '@/components/layout/AdminLayout'
import Modal from '@/components/ui/Modal'
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
        <span className="text-xs text-teal-dark font-semibold">
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

function DeleteUserModal({ user, onClose, onDeleted }) {
  const hasPaid = user?.payment?.status === 'completed'
  const [confirmText, setConfirmText] = useState('')
  const [deleting,    setDeleting]    = useState(false)
  const [error,       setError]       = useState('')

  const canDelete = !hasPaid || confirmText.trim().toUpperCase() === 'DELETE'

  async function handleDelete() {
    if (!canDelete || deleting) return
    setDeleting(true)
    setError('')
    try {
      const params = new URLSearchParams({ id: user._id })
      if (hasPaid) params.set('confirmPaid', 'true')
      const res  = await fetch(`/api/admin/users?${params}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to delete user')
        setDeleting(false)
        return
      }
      onDeleted(user._id)
    } catch {
      setError('Something went wrong. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={hasPaid ? 'Delete paid member' : 'Delete member'}>
      <div className="space-y-4">
        {/* Who */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <Avatar name={user.fullName} src={user.profilePhotoUrl} size="md" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{user.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>

        {hasPaid ? (
          <div className="rounded-xl border border-danger/30 bg-danger-lighter/60 p-4">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-danger shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm text-danger-dark">
                <p className="font-semibold">This member paid the verification fee.</p>
                <p className="mt-1 text-danger-dark/90">
                  Deleting her removes the account <strong>and</strong> her payment record
                  ({user.payment.currency} {user.payment.amount}). This cannot be undone.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber/30 bg-amber-lighter/60 p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-dark shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-amber-dark">
                This permanently deletes the account. This action cannot be undone.
              </p>
            </div>
          </div>
        )}

        {/* Double confirmation for paid members */}
        {hasPaid && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Type <span className="font-mono font-bold text-danger">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoFocus
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-danger"
            />
          </div>
        )}

        {error && <p className="text-sm text-danger font-medium">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!canDelete || deleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-danger hover:bg-danger-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            {deleting ? 'Deleting…' : hasPaid ? 'Permanently delete' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function UserManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [users,      setUsers]      = useState([])
  const [total,      setTotal]      = useState(0)
  const [pages,      setPages]      = useState(1)
  const [page,       setPage]       = useState(1)
  const [inputValue, setInputValue] = useState('')
  const [query,      setQuery]      = useState('')
  const [loading,    setLoading]    = useState(true)
  const [toDelete,   setToDelete]   = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    else if (status === 'authenticated' && !session?.user?.isAdmin) router.push('/feed')
  }, [status, session, router])

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.isAdmin) return
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page, ...(query ? { q: query } : {}) })
        const res  = await fetch(`/api/admin/users?${params}`)
        const data = await res.json()
        if (active && data.success) {
          setUsers(data.data.users)
          setTotal(data.data.total)
          setPages(data.data.pages)
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [status, session?.user?.isAdmin, query, page])

  function handleSearch(e) {
    e.preventDefault()
    setQuery(inputValue)
    setPage(1)
  }

  function handleDeleted(id) {
    setUsers(prev => prev.filter(u => u._id !== id))
    setTotal(t => Math.max(0, t - 1))
    setToDelete(null)
  }

  const COLS = 'grid-cols-[1.7fr_1.7fr_0.5fr_1.2fr_0.8fr_1.5fr_auto]'

  return (
    <AdminLayout>
      <div className="min-h-full bg-gradient-to-b from-gray-50 to-white">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand to-pink flex items-center justify-center text-white shadow-sm shadow-brand/20 shrink-0">
                <UsersIcon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">User Management</h1>
                <p className="text-sm text-gray-500">Members, verification & payments</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-brand">{total.toLocaleString()}</p>
              <p className="text-gray-400 text-xs">total members</p>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative mb-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Search by name, email, city or country…"
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm shadow-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </form>

          {/* Table */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className={`hidden md:grid ${COLS} gap-4 px-5 py-3 bg-gradient-to-r from-brand-lighter/50 to-pink-lighter/40 text-[11px] font-bold text-brand-dark uppercase tracking-wide border-b border-gray-100`}>
              <span>Member</span>
              <span>Email</span>
              <span>Age</span>
              <span>Location</span>
              <span>Tier</span>
              <span>Verified payment</span>
              <span className="text-right">Action</span>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : users.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">No users found</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {users.map(user => {
                  const paid = user.payment?.status === 'completed'
                  return (
                    <div
                      key={user._id}
                      className={`md:grid ${COLS} gap-4 px-5 py-3.5 md:items-center hover:bg-brand-lighter/20 transition-colors`}
                    >
                      {/* Member */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={user.fullName} src={user.profilePhotoUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
                          <p className="text-[11px] text-gray-400">Joined {formatDate(user.createdAt)}</p>
                        </div>
                      </div>

                      {/* Email */}
                      <p className="text-xs text-gray-600 truncate md:mt-0 mt-1">{user.email}</p>

                      {/* Age */}
                      <p className="text-sm text-gray-700">
                        {user.age ? user.age : <span className="text-gray-300">—</span>}
                      </p>

                      {/* Location */}
                      <div className="min-w-0">
                        {user.city || user.country ? (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-700 min-w-0">
                            <MapPin className="w-3 h-3 text-pink shrink-0" aria-hidden="true" />
                            <span className="truncate">
                              {[user.city, user.country].filter(Boolean).join(', ')}
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </div>

                      {/* Tier */}
                      <div className="md:mt-0 mt-1">
                        <Badge variant={user.verificationTier === 'verified' ? 'verified' : user.verificationTier === 'trusted' ? 'trusted' : user.verificationTier === 'paid' ? 'pending' : 'basic'} size="xs">
                          {user.verificationTier ?? 'basic'}
                        </Badge>
                      </div>

                      {/* Payment */}
                      <div className="min-w-0 md:mt-0 mt-1">
                        <PaymentInfo payment={user.payment} />
                      </div>

                      {/* Action */}
                      <div className="flex md:justify-end md:mt-0 mt-2">
                        {user.isAdmin ? (
                          <span className="text-[10px] text-gray-400 px-2">Admin</span>
                        ) : (
                          <button
                            onClick={() => setToDelete(user)}
                            title={paid ? 'Delete paid member (double confirm)' : 'Delete member'}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-danger hover:text-white hover:bg-danger border border-danger/30 hover:border-danger transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="hidden lg:inline">Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-600 bg-white border border-gray-200 shadow-sm disabled:opacity-40 hover:border-brand transition-colors"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Prev
              </button>
              <span className="text-sm text-gray-500">Page {page} of {pages}</span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-600 bg-white border border-gray-200 shadow-sm disabled:opacity-40 hover:border-brand transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>

      {toDelete && (
        <DeleteUserModal
          user={toDelete}
          onClose={() => setToDelete(null)}
          onDeleted={handleDeleted}
        />
      )}
    </AdminLayout>
  )
}
