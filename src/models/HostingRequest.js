import mongoose from 'mongoose'

const hostingRequestSchema = new mongoose.Schema(
  {
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    checkInDate: { type: Date, required: function() { return this.requestType !== 'direct' } },
    checkOutDate: { type: Date, required: function() { return this.requestType !== 'direct' } },
    nights: { type: Number },

    message: { type: String, maxlength: 1000, required: function() { return this.requestType !== 'direct' } },

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
      enum: ['hosting', 'cotraveller', 'direct'],
      default: 'hosting',
    },
  },
  { timestamps: true }
)

hostingRequestSchema.index({ guestId: 1 })
hostingRequestSchema.index({ hostId: 1 })
hostingRequestSchema.index({ status: 1 })
hostingRequestSchema.index({ checkInDate: 1 })

hostingRequestSchema.pre('save', function () {
  if (this.checkInDate && this.checkOutDate) {
    const diff = this.checkOutDate - this.checkInDate
    this.nights = Math.round(diff / (1000 * 60 * 60 * 24))
  }
})

// Delete cached model so schema changes are picked up after hot-reload
delete mongoose.models['HostingRequest']
export default mongoose.model('HostingRequest', hostingRequestSchema)
