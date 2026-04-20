import mongoose from 'mongoose'

const blogPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, maxlength: 300 },
  content: { type: String, required: true },
  coverImage: { type: String },
  tags: [{ type: String }],

  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  publishedAt: { type: Date },

  viewCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  seo: {
    metaTitle: { type: String },
    metaDescription: { type: String },
  },
}, { timestamps: true })

export default mongoose.models.BlogPost || mongoose.model('BlogPost', blogPostSchema)
