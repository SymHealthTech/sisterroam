import mongoose from 'mongoose'

const recommendationAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecommendationQuestion', required: true },
    authorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    content:    { type: String, required: true, maxlength: 800, trim: true },

    upvotes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    upvoteCount: { type: Number, default: 0 },
    isAccepted:  { type: Boolean, default: false },
  },
  { timestamps: true }
)

recommendationAnswerSchema.index({ questionId: 1 })
recommendationAnswerSchema.index({ upvoteCount: -1 })
recommendationAnswerSchema.index({ isAccepted: 1 })

export default mongoose.models.RecommendationAnswer || mongoose.model('RecommendationAnswer', recommendationAnswerSchema)
