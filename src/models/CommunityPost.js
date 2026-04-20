import mongoose from 'mongoose'

const communityPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 5000 },
  images: [{ type: String }],
  circle: { type: String, enum: ['general', 'safety_tips', 'travel_stories', 'advice', 'meetups'] },

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },

  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
  }],

  isDeleted: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.models.CommunityPost || mongoose.model('CommunityPost', communityPostSchema)
