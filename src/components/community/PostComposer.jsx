'use client'

import { useState } from 'react'
import { ImagePlus, Send } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function PostComposer({ user, onPost }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!content.trim()) return
    setLoading(true)
    const res = await fetch('/api/community/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Failed to post'); return }
    const post = await res.json()
    setContent('')
    onPost?.(post)
    toast.success('Posted!')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex gap-3">
        <Avatar src={user?.image} name={user?.name} size="sm" />
        <textarea
          className="flex-1 resize-none text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
          placeholder="Share your travel story or tip..."
          rows={3}
          value={content}
          onChange={e => setContent(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
        <button className="text-gray-400 hover:text-brand transition-colors p-1">
          <ImagePlus className="w-5 h-5" />
        </button>
        <Button size="sm" onClick={submit} isLoading={loading} disabled={!content.trim()}>
          <Send className="w-3.5 h-3.5" />
          Post
        </Button>
      </div>
    </div>
  )
}
