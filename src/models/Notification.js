import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  type: {
    type: String,
    enum: [
      'new_request',
      'request_accepted',
      'request_declined',
      'new_message',
      'review_received',
      'verification_approved',
      'verification_rejected',
      'checkin_reminder',
      'safety_alert',
      'new_cotraveller_interest',
      'cotraveller_accepted',
      'cotraveller_declined',
      'cotraveller_filled',
      'new_recommendation_answer',
      'answer_accepted',
    ],
    required: true,
  },

  title: { type: String, required: true },
  body: { type: String, required: true },
  link: { type: String },
  isRead: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
})

notificationSchema.index({ recipientId: 1 })
notificationSchema.index({ isRead: 1 })
notificationSchema.index({ createdAt: -1 })

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema)
