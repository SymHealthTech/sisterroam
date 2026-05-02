import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'HostingRequest', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 2000 },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  messageType: { type: String, enum: ['text', 'system'], default: 'text' },
  createdAt: { type: Date, default: Date.now },
})

messageSchema.index({ requestId: 1 })
messageSchema.index({ senderId: 1 })
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }) // auto-delete after 30 days

export default mongoose.models.Message || mongoose.model('Message', messageSchema)
