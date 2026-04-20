import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'HostingRequest', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewerRole: { type: String, enum: ['guest', 'host'], required: true },

  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 1000 },

  categories: {
    cleanliness: { type: Number, min: 1, max: 5 },
    safety: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    accuracy: { type: Number, min: 1, max: 5 },
  },

  isPublic: { type: Boolean, default: true },
}, { timestamps: true })

reviewSchema.index({ request: 1, reviewer: 1 }, { unique: true })

export default mongoose.models.Review || mongoose.model('Review', reviewSchema)
