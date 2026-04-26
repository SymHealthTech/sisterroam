import mongoose from 'mongoose'
import { slugify } from '@/lib/utils'

const blogPostSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true, maxlength: 200 },
    slug: { type: String, unique: true, required: true },
    excerpt: { type: String, maxlength: 300 },
    content: { type: String, required: true },

    coverImageUrl: { type: String },
    coverImagePublicId: { type: String },

    category: {
      type: String,
      enum: ['solo_travel', 'cycling', 'trekking', 'running', 'safety', 'culture', 'food', 'tips'],
    },
    tags: [{ type: String }],

    isPublished: { type: Boolean, default: false },
    viewsCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    readTimeMinutes: { type: Number },
    publishedAt: { type: Date },
  },
  { timestamps: true }
)

blogPostSchema.index({ slug: 1 })
blogPostSchema.index({ authorId: 1 })
blogPostSchema.index({ isPublished: 1 })
blogPostSchema.index({ category: 1 })
blogPostSchema.index({ publishedAt: -1 })

blogPostSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title) + '-' + Date.now()
  }
  next()
})

export default mongoose.models.BlogPost || mongoose.model('BlogPost', blogPostSchema)
