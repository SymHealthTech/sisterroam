import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'HostingRequest', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 2000 },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  // Set when the recipient's app first received it (✓✓ grey); isRead = ✓✓ blue.
  deliveredAt: { type: Date },
  // Members who removed this message from their own view ("Delete for me").
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messageType: { type: String, enum: ['text', 'system'], default: 'text' },
  createdAt: { type: Date, default: Date.now },
})

messageSchema.index({ requestId: 1, createdAt: 1 })          // load conversation (filter + sort)
messageSchema.index({ requestId: 1, isRead: 1, senderId: 1 }) // unread-count + mark-as-read
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 })

export default mongoose.models.Message || mongoose.model('Message', messageSchema)
