import mongoose from 'mongoose'

const recommendationQuestionSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    city:        { type: String, required: true, trim: true },
    country:     { type: String, required: true, trim: true },
    countryCode: { type: String, trim: true },

    question: { type: String, required: true, maxlength: 500, trim: true },
    context:  { type: String, maxlength: 300, trim: true },

    category: {
      type: String,
      enum: ['stay', 'food', 'transport', 'safety', 'activity', 'general'],
    },

    answersCount: { type: Number, default: 0 },
    viewsCount:   { type: Number, default: 0 },
    isResolved:   { type: Boolean, default: false },

    status: {
      type: String,
      enum: ['open', 'resolved', 'closed'],
      default: 'open',
    },
  },
  { timestamps: true }
)

recommendationQuestionSchema.index({ city: 1 })
recommendationQuestionSchema.index({ country: 1 })
recommendationQuestionSchema.index({ category: 1 })
recommendationQuestionSchema.index({ createdAt: -1 })
recommendationQuestionSchema.index({ isResolved: 1 })

export default mongoose.models.RecommendationQuestion || mongoose.model('RecommendationQuestion', recommendationQuestionSchema)
