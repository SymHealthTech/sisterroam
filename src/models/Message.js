import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'HostingRequest', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 2000 },
  type: { type: String, enum: ['text', 'image', 'system'], default: 'text' },
  imageUrl: { type: String },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.models.Message || mongoose.model('Message', messageSchema)
