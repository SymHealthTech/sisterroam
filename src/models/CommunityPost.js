import mongoose from 'mongoose'

const communityPostSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    content: { type: String, required: true },

    category: {
      type: String,
      enum: ['general', 'safety_tips', 'trip_planning', 'looking_for_host', 'hosting_offer', 'achievements', 'questions'],
      default: 'general',
    },

    imageUrls: { type: [String], validate: [v => v.length <= 7, 'Max 7 images'] },
    imagePublicIds: [{ type: String }],

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },

    isPublished: { type: Boolean, default: true },
    isPinned: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

communityPostSchema.index({ authorId: 1 })
communityPostSchema.index({ category: 1 })
communityPostSchema.index({ createdAt: -1 })
communityPostSchema.index({ likesCount: -1 })

export default mongoose.models.CommunityPost || mongoose.model('CommunityPost', communityPostSchema)
