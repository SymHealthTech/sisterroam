import mongoose from 'mongoose'
import { slugify } from '@/lib/utils'

const travelStorySchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title:   { type: String, required: true, maxlength: 200 },
    slug:    { type: String, unique: true, required: true },
    excerpt: { type: String, maxlength: 300 },
    content: { type: String, required: true },

    coverImageUrl:     { type: String },
    coverImagePublicId:{ type: String },

    category: {
      type: String,
      enum: [
        'solo_travel', 'cycling', 'trekking', 'running',
        'safety_experience', 'cultural_immersion', 'food_journey',
        'budget_travel', 'tips_and_advice', 'co_traveller_experience',
        'hosting_experience', 'destination_guide',
      ],
    },
    tags: [{ type: String }],

    isPublished:     { type: Boolean, default: false },
    isFeatured:      { type: Boolean, default: false },
    viewsCount:      { type: Number, default: 0 },
    likesCount:      { type: Number, default: 0 },
    readCount:       { type: Number, default: 0 },
    readTimeMinutes: { type: Number },
    publishedAt:     { type: Date },

    saves:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    saveCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'travelstories' }
)

travelStorySchema.index({ authorId: 1 })
travelStorySchema.index({ isPublished: 1 })
travelStorySchema.index({ isFeatured: 1 })
travelStorySchema.index({ category: 1 })
travelStorySchema.index({ publishedAt: -1 })

travelStorySchema.pre('save', function () {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title) + '-' + Date.now()
  }
  if (this.isModified('content')) {
    const wordCount = this.content.trim().split(/\s+/).filter(Boolean).length
    this.readTimeMinutes = Math.ceil(wordCount / 200)
  }
})

export default mongoose.models.TravelStory || mongoose.model('TravelStory', travelStorySchema)
