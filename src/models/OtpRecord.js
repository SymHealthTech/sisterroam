import mongoose from 'mongoose'

const otpRecordSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  purpose: { type: String, enum: ['signup', 'reset_password', 'email_change'], default: 'signup' },
  isUsed: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
}, { timestamps: true })

otpRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.OtpRecord || mongoose.model('OtpRecord', otpRecordSchema)
