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

    // Per-user soft delete: users who removed this conversation from their own
    // message list. A new message clears this (thread reappears for everyone).
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Per-user "cleared" marker. When a user deletes a conversation we record the
    // time; that user then only ever sees messages sent AFTER this point — so a
    // deleted chat stays empty for her even if it later reappears from a new
    // message. The other participant's view is unaffected.
    clearedAt: [
      {
        _id: false,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date },
      },
    ],

    requestType: {
      type: String,
      enum: ['hosting', 'cotraveller', 'direct'],
      default: 'hosting',
    },
  },
  { timestamps: true }
)

hostingRequestSchema.index({ guestId: 1, createdAt: -1 })  // requests list for guest
hostingRequestSchema.index({ hostId: 1, createdAt: -1 })   // requests list for host
hostingRequestSchema.index({ requestType: 1, guestId: 1, hostId: 1 }) // direct conversation lookup
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
