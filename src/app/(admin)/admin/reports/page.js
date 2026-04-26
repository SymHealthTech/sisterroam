'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import Skeleton from '@/components/ui/Skeleton'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import {
  ShieldAlert, CheckCircle, Eye, ExternalLink,
  ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_TABS = ['open', 'under_review', 'resolved', 'dismissed']

const REASON_VARIANTS = {
  harassment:       'danger',
  fake_profile:     'amber',
  safety_incident:  'danger',
  unwanted_contact: 'amber',
  discrimination:   'amber',
  other:            'gray',
}

const ACTION_OPTIONS = [
  { value: 'warning',         label: 'Issue warning' },
  { value: 'suspension_7',    label: '7-day suspension' },
  { value: 'suspension_30',   label: '30-day suspension' },
  { value: 'permanent_ban',   label: 'Permanent ban' },
  { value: 'no_action',       label: 'No action taken' },
]

function ReportCardFull({ report, onUpdate }) {
  const [resolving,     setResolving]     = useState(false)
  const [showActions,   setShowActions]   = useState(false)
  const [actionTaken,   setActionTaken]   = useState(report.actionTaken ?? '')
  const [adminNotes,    setAdminNotes]    = useState(report.adminNotes ?? '')
  const [updating,      setUpdating]      = useState(null)

  async function updateStatus(status) {
    setUpdating(status)
    const res = await fetch(`/api/safety/reports/${report._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        actionTaken: status === 'resolved' ? (actionTaken || 'no_action') : undefined,
        adminNotes:  adminNotes || undefined,
      }),
    })
    setUpdating(null)
    if (!res.ok) { toast.error('Update failed'); return }
    toast.success(`Report ${status.replace('_', ' ')}`)
    onUpdate(report._id, status)
  }

  const reporter = typeof report.reporterId === 'object' ? report.reporterId : null
  const reported = typeof report.reportedUserId === 'object' ? report.reportedUserId : null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={REASON_VARIANTS[report.reason] ?? 'gray'}>
              {report.reason.replace(/_/g, ' ')}
            </Badge>
            <Badge variant={
              report.status === 'open' ? 'danger' :
              report.status === 'under_review' ? 'amber' :
              report.status === 'resolved' ? 'teal' : 'gray'
            }>
              {report.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-xs text-gray-400">Submitted {formatDate(report.createdAt)}</p>
        </div>
        {report.evidenceUrl && (
          <a
            href={report.evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-brand hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> Evidence
          </a>
        )}
      </div>

      {/* Reporter / Reported */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Reporter</p>
          <div className="flex items-center gap-2">
            <Avatar src={reporter?.profilePhotoUrl} name={reporter?.fullName} size="xs" />
            <div>
              <p className="text-xs font-semibold text-gray-900">{reporter?.fullName ?? '—'}</p>
              {report.contactReporter && (
                <p className="text-[11px] text-gray-400">{reporter?.email}</p>
              )}
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Reported user</p>
          <div className="flex items-center gap-2">
            <Avatar src={reported?.profilePhotoUrl} name={reported?.fullName} size="xs" />
            <p className="text-xs font-semibold text-gray-900">{reported?.fullName ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-3 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-700 leading-relaxed">{report.details}</p>
      </div>

      {/* Actions */}
      {report.status === 'open' && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => updateStatus('under_review')}
          loading={updating === 'under_review'}
        >
          <Eye className="w-3.5 h-3.5" /> Mark under review
        </Button>
      )}

      {(report.status === 'open' || report.status === 'under_review') && (
        <div className="space-y-3">
          <button
            onClick={() => setShowActions(o => !o)}
            className="flex items-center gap-1.5 text-sm text-gray-700 font-medium"
          >
            Resolve report
            <ChevronDown className={cn('w-4 h-4 transition-transform', showActions && 'rotate-180')} />
          </button>

          {showActions && (
            <div className="space-y-3 p-3 border border-gray-100 rounded-xl bg-gray-50">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Action taken</label>
                <select
                  value={actionTaken}
                  onChange={e => setActionTaken(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  <option value="">Select action…</option>
                  {ACTION_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Admin notes</label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={2}
                  placeholder="Internal notes…"
                  className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  loading={updating === 'resolved'}
                  onClick={() => updateStatus('resolved')}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Resolve
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={updating === 'dismissed'}
                  onClick={() => updateStatus('dismissed')}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resolved info */}
      {(report.status === 'resolved' || report.status === 'dismissed') && report.adminNotes && (
        <div className="p-3 bg-teal-lighter/20 rounded-xl">
          <p className="text-xs text-gray-600"><strong>Notes:</strong> {report.adminNotes}</p>
          {report.actionTaken && (
            <p className="text-xs text-gray-500 mt-0.5">
              Action: {ACTION_OPTIONS.find(a => a.value === report.actionTaken)?.label ?? report.actionTaken}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function ReportsPage() {
  const [tab,     setTab]     = useState('open')
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchReports = useCallback(async (status) => {
    setLoading(true)
    const res = await fetch(`/api/safety/reports?status=${status}&limit=50`)
    if (res.ok) {
      const d = await res.json()
      setReports(d.data?.reports ?? d.data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchReports(tab) }, [tab, fetchReports])

  function handleUpdate(id, status) {
    if (tab !== status) setReports(prev => prev.filter(r => r._id !== id))
    else setReports(prev => prev.map(r => r._id === id ? { ...r, status } : r))
  }

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Safety Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage safety reports from members</p>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {STATUS_TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors',
                tab === t ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2].map(i => <Skeleton key={i} variant="card" className="h-56" />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <ShieldAlert className="w-12 h-12 mx-auto text-teal mb-3" />
            <p className="font-medium">No {tab.replace('_', ' ')} reports</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {reports.map(r => (
              <ReportCardFull key={r._id} report={r} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
