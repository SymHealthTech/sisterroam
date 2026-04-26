import mongoose from 'mongoose'

const hostingRequestSchema = new mongoose.Schema(
  {
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    nights: { type: Number },

    message: { type: String, required: true, maxlength: 1000 },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'],
      default: 'pending',
    },

    declineReason: { type: String },

    guestEmergencyContactName: { type: String },
    guestEmergencyContactPhone: { type: String },
    guestEmergencyContactRelationship: { type: String },

    safetyAcknowledged: { type: Boolean, default: false },

    guestReviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
    hostReviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },

    lastMessageAt: { type: Date },
    lastMessagePreview: { type: String, maxlength: 100 },

    requestType: {
      type: String,
      enum: ['hosting', 'cotraveller'],
      default: 'hosting',
    },
  },
  { timestamps: true }
)

hostingRequestSchema.index({ guestId: 1 })
hostingRequestSchema.index({ hostId: 1 })
hostingRequestSchema.index({ status: 1 })
hostingRequestSchema.index({ checkInDate: 1 })

hostingRequestSchema.pre('save', function (next) {
  if (this.checkInDate && this.checkOutDate) {
    const diff = this.checkOutDate - this.checkInDate
    this.nights = Math.round(diff / (1000 * 60 * 60 * 24))
  }
  next()
})

export default mongoose.models.HostingRequest || mongoose.model('HostingRequest', hostingRequestSchema)
