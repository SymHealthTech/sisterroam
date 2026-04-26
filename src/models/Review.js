import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'HostingRequest', required: true },

    overallRating: { type: Number, min: 1, max: 5, required: true },
    safetyRating: { type: Number, min: 1, max: 5 },
    cleanlinessRating: { type: Number, min: 1, max: 5 },
    communicationRating: { type: Number, min: 1, max: 5 },
    accuracyRating: { type: Number, min: 1, max: 5 },

    wouldRecommend: { type: String, enum: ['yes', 'with_reservations', 'no'] },

    content: { type: String, minlength: 50, maxlength: 1000 },

    isPublished: { type: Boolean, default: false },
    reviewerSubmittedAt: { type: Date },
    revieweeSubmittedAt: { type: Date },
    publishedAt: { type: Date },
  },
  { timestamps: true }
)

reviewSchema.index({ reviewerId: 1 })
reviewSchema.index({ revieweeId: 1 })
reviewSchema.index({ requestId: 1 })
reviewSchema.index({ isPublished: 1 })

export default mongoose.models.Review || mongoose.model('Review', reviewSchema)
