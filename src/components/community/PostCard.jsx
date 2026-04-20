'use client'

import { useState } from 'react'
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'

export default function PostCard({ post, currentUserId }) {
  const [liked, setLiked] = useState(post.likes?.includes(currentUserId))
  const [likeCount, setLikeCount] = useState(post.likeCount || 0)

  async function toggleLike() {
    setLiked(!liked)
    setLikeCount(c => liked ? c - 1 : c + 1)
    await fetch(`/api/community/posts/${post._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like' }),
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={post.author?.avatar} name={post.author?.name} size="sm" />
          <div>
            <p className="text-sm font-semibold text-gray-900">{post.author?.name}</p>
            <p className="text-xs text-gray-400">{formatRelativeTime(post.createdAt)}</p>
          </div>
        </div>
        {post.circle && <Badge variant="brand">{post.circle}</Badge>}
      </div>

      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {post.images?.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {post.images.slice(0, 4).map((img, i) => (
            <img key={i} src={img} alt="" className="w-full h-32 object-cover rounded-xl" />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-1 border-t border-gray-50">
        <button
          onClick={toggleLike}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-pink transition-colors"
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-pink text-pink' : ''}`} />
          <span>{likeCount}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentCount || 0}</span>
        </button>
      </div>
    </div>
  )
}
