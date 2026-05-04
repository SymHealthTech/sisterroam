'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { Flag, Trash2, Eye } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

const TABS = ['Co-traveller posts', 'Recommendations', 'Questions & Answers']

function ContentRow({ item, type, onFlag, onDelete }) {
  const [loading, setLoading] = useState(false)

  async function handleFlag() {
    setLoading(true)
    try {
      if (type === 'recommendation') {
        await fetch(`/api/recommendations/${item._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isFlagged: !item.isFlagged }),
        })
        onFlag(item._id)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this content?')) return
    setLoading(true)
    try {
      if (type === 'recommendation') {
        await fetch(`/api/recommendations/${item._id}`, { method: 'DELETE' })
        onDelete(item._id)
      } else if (type === 'cotraveller') {
        await fetch(`/api/cotraveller/${item._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' }),
        })
        onDelete(item._id)
      }
    } finally {
      setLoading(false)
    }
  }

  const author = item.authorId ?? {}

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50">
      <td className="py-3 px-4">
        <div className="max-w-xs">
          <p className="text-sm font-medium text-gray-900 truncate">{item.title ?? item.question ?? '(no title)'}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {item.city ?? item.toCity ?? ''}{(item.city || item.toCity) && (item.country || item.toCountry) ? ', ' : ''}{item.country ?? item.toCountry ?? ''}
          </p>
        </div>
      </td>
      <td className="py-3 px-4 text-xs text-gray-500">{author.fullName ?? '—'}</td>
      <td className="py-3 px-4 text-xs text-gray-400">{formatRelativeTime(item.createdAt)}</td>
      <td className="py-3 px-4">
        {item.isFlagged && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-danger-lighter text-danger font-medium">Flagged</span>
        )}
        {item.status && (
          <span className={cn(
            'text-[10px] px-2 py-0.5 rounded-full font-medium',
            item.status === 'open' ? 'bg-teal-lighter text-teal' : 'bg-gray-100 text-gray-500'
          )}>
            {item.status}
          </span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {type === 'recommendation' && (
            <button
              type="button"
              onClick={handleFlag}
              disabled={loading}
              className={cn(
                'flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors',
                item.isFlagged
                  ? 'border-teal/30 text-teal hover:bg-teal-lighter'
                  : 'border-amber/30 text-amber hover:bg-amber-lighter'
              )}
            >
              <Flag className="w-3 h-3" />
              {item.isFlagged ? 'Unflag' : 'Flag'}
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-danger/30 text-danger hover:bg-danger-lighter transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Remove
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function AdminCommunityPage() {
  const [activeTab,  setActiveTab]  = useState(0)
  const [coTravelPosts, setCoPosts] = useState([])
  const [recs,          setRecs]    = useState([])
  const [questions,     setQs]      = useState([])
  const [loading,       setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [coRes, recRes, qRes] = await Promise.allSettled([
          fetch('/api/cotraveller?limit=50&status=open'),
          fetch('/api/recommendations?limit=50'),
          fetch('/api/recommendations/questions?limit=50'),
        ])

        if (coRes.status === 'fulfilled' && coRes.value.ok) {
          const d = await coRes.value.json()
          setCoPosts(d.data?.posts ?? [])
        }
        if (recRes.status === 'fulfilled' && recRes.value.ok) {
          const d = await recRes.value.json()
          setRecs(d.data?.recommendations ?? [])
        }
        if (qRes.status === 'fulfilled' && qRes.value.ok) {
          const d = await qRes.value.json()
          setQs(d.data?.questions ?? [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const tabData = [coTravelPosts, recs, questions]
  const tabTypes = ['cotraveller', 'recommendation', 'question']
  const currentItems = tabData[activeTab] ?? []
  const currentType  = tabTypes[activeTab]

  function handleFlag(id) {
    if (activeTab === 1) setRecs(prev => prev.map(r => r._id === id ? { ...r, isFlagged: !r.isFlagged } : r))
  }

  function handleDelete(id) {
    if (activeTab === 0) setCoPosts(prev => prev.filter(p => p._id !== id))
    if (activeTab === 1) setRecs(prev => prev.filter(r => r._id !== id))
    if (activeTab === 2) setQs(prev => prev.filter(q => q._id !== id))
  }

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community moderation</h1>
          <p className="text-sm text-gray-500 mt-1">Moderate co-traveller posts, recommendations, and questions</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {TABS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveTab(i)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === i ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {label}
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                {tabData[i]?.length ?? 0}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {currentItems.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No content to moderate</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 py-3 px-4">Content</th>
                    <th className="text-left text-xs font-semibold text-gray-500 py-3 px-4">Author</th>
                    <th className="text-left text-xs font-semibold text-gray-500 py-3 px-4">Posted</th>
                    <th className="text-left text-xs font-semibold text-gray-500 py-3 px-4">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(item => (
                    <ContentRow
                      key={item._id}
                      item={item}
                      type={currentType}
                      onFlag={handleFlag}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
