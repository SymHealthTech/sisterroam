import mongoose from 'mongoose'

const communityCommentSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 500 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.models.CommunityComment || mongoose.model('CommunityComment', communityCommentSchema)
