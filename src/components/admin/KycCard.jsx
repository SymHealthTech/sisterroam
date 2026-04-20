'use client'

import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function KycCard({ verification, onUpdate }) {
  const [loading, setLoading] = useState(null)

  async function decide(status) {
    setLoading(status)
    const res = await fetch(`/api/verification/${verification._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(null)
    if (!res.ok) { toast.error('Update failed'); return }
    toast.success(`Verification ${status}`)
    onUpdate?.(verification._id, status)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={verification.user?.avatar} name={verification.user?.name} size="sm" />
          <div>
            <p className="font-semibold text-sm">{verification.user?.name}</p>
            <p className="text-xs text-gray-400">{verification.user?.email}</p>
          </div>
        </div>
        <Badge variant="amber">Tier {verification.tier}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {verification.documents?.map((doc, i) => (
          <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
            className="text-xs bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 hover:bg-brand-lighter hover:text-brand transition-colors">
            {doc.type?.replace('_', ' ')} ↗
          </a>
        ))}
      </div>

      <p className="text-xs text-gray-400">Submitted {formatDate(verification.createdAt)}</p>

      <div className="flex gap-2">
        <Button variant="danger" size="sm" className="flex-1"
          isLoading={loading === 'rejected'} onClick={() => decide('rejected')}>
          <XCircle className="w-4 h-4" /> Reject
        </Button>
        <Button variant="primary" size="sm" className="flex-1"
          isLoading={loading === 'approved'} onClick={() => decide('approved')}>
          <CheckCircle className="w-4 h-4" /> Approve
        </Button>
      </div>
    </div>
  )
}
