import mongoose from 'mongoose'

const otpRecordSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0, max: 3 },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

// MongoDB TTL index — auto-deletes documents after expiresAt
otpRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
otpRecordSchema.index({ email: 1 })

export default mongoose.models.OtpRecord || mongoose.model('OtpRecord', otpRecordSchema)
