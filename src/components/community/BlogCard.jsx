import Link from 'next/link'
import Image from 'next/image'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { formatDate, truncate } from '@/lib/utils'

export default function BlogCard({ post }) {
  return (
    <Link href={`/community/blog/${post.slug}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {post.coverImage && (
        <div className="relative h-48">
          <Image src={post.coverImage} alt={post.title} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {post.tags?.slice(0, 2).map(tag => <Badge key={tag} variant="brand">{tag}</Badge>)}
        </div>
        <h3 className="font-bold text-gray-900 group-hover:text-brand transition-colors leading-snug">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-gray-500 leading-relaxed">{truncate(post.excerpt, 120)}</p>
        )}
        <div className="flex items-center gap-2">
          <Avatar src={post.author?.avatar} name={post.author?.name} size="xs" />
          <span className="text-xs text-gray-400">{post.author?.name} · {formatDate(post.publishedAt)}</span>
        </div>
      </div>
    </Link>
  )
}
