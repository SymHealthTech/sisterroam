import mongoose from 'mongoose'

const coTravelInterestSchema = new mongoose.Schema(
  {
    postId:           { type: mongoose.Schema.Types.ObjectId, ref: 'CoTravelPost', required: true },
    interestedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    message: { type: String, required: true, maxlength: 500, trim: true },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },

    acceptedAt:    { type: Date },
    declinedAt:    { type: Date },
    chatRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'HostingRequest' },
  },
  { timestamps: true }
)

coTravelInterestSchema.index({ postId: 1, interestedUserId: 1 }, { unique: true })
coTravelInterestSchema.index({ postId: 1 })
coTravelInterestSchema.index({ interestedUserId: 1 })
coTravelInterestSchema.index({ status: 1 })

export default mongoose.models.CoTravelInterest || mongoose.model('CoTravelInterest', coTravelInterestSchema)
