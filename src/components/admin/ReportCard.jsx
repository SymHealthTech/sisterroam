'use client'

import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'

const priorityVariant = { low: 'gray', medium: 'amber', high: 'danger', critical: 'danger' }

export default function ReportCard({ report, onResolve }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm capitalize">{report.type?.replace('_', ' ')}</p>
          <p className="text-xs text-gray-400">{formatDate(report.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={priorityVariant[report.priority]}>{report.priority}</Badge>
          <Badge variant="gray">{report.status}</Badge>
        </div>
      </div>

      <p className="text-sm text-gray-600 line-clamp-3">{report.description}</p>

      <div className="flex gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span>Reporter:</span>
          <Avatar src={report.reporter?.avatar} name={report.reporter?.name} size="xs" />
          <span>{report.reporter?.name}</span>
        </div>
        {report.reportedUser && (
          <div className="flex items-center gap-1.5">
            <span>Against:</span>
            <Avatar src={report.reportedUser?.avatar} name={report.reportedUser?.name} size="xs" />
            <span>{report.reportedUser?.name}</span>
          </div>
        )}
      </div>

      {report.status === 'open' && (
        <Button size="sm" variant="outline" onClick={() => onResolve?.(report._id)}>
          Mark Resolved
        </Button>
      )}
    </div>
  )
}
