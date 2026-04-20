import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['request_received', 'request_accepted', 'request_declined', 'new_message',
      'review_received', 'checkin_reminder', 'sos_alert', 'verification_update',
      'community_like', 'community_comment'],
    required: true,
  },
  title: { type: String, required: true },
  body: { type: String },
  link: { type: String },
  isRead: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })

notificationSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema)
