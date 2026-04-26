import mongoose from 'mongoose'

const recommendationSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    city:        { type: String, required: true, trim: true },
    country:     { type: String, required: true, trim: true },
    countryCode: { type: String, trim: true },

    category: {
      type: String,
      required: true,
      enum: ['stay', 'food', 'transport', 'safety', 'activity', 'general'],
    },

    title:       { type: String, required: true, maxlength: 150, trim: true },
    description: { type: String, required: true, maxlength: 1000, trim: true },

    priceRange: {
      type: String,
      enum: ['free', 'budget', 'mid_range', 'splurge'],
    },
    currency:         { type: String },
    approximatePrice: { type: String, maxlength: 50 },

    address:    { type: String, maxlength: 300 },
    websiteUrl: { type: String },

    imageUrls:       [{ type: String }],
    imagePublicIds:  [{ type: String }],

    upvotes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    upvoteCount: { type: Number, default: 0 },

    isVerifiedExperience: { type: Boolean, default: false },
    isFlagged:            { type: Boolean, default: false },
    helpfulCount:         { type: Number, default: 0 },
  },
  { timestamps: true }
)

recommendationSchema.index({ city: 1 })
recommendationSchema.index({ country: 1 })
recommendationSchema.index({ category: 1 })
recommendationSchema.index({ upvoteCount: -1 })
recommendationSchema.index({ authorId: 1 })
recommendationSchema.index({ createdAt: -1 })
recommendationSchema.index({ isVerifiedExperience: 1 })

export default mongoose.models.Recommendation || mongoose.model('Recommendation', recommendationSchema)
