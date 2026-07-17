import mongoose from 'mongoose'

const otpRecordSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0, max: 3 },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },

  // Pending signup payload — present only for account-creation OTPs. The User
  // row is created from these fields once the OTP is verified, so nothing lands
  // in the User collection before verification. Auto-purged by the TTL index.
  fullName: { type: String },
  passwordHash: { type: String },
  phone: { type: String },
})

// MongoDB TTL index — auto-deletes documents after expiresAt
otpRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
otpRecordSchema.index({ email: 1 })

export default mongoose.models.OtpRecord || mongoose.model('OtpRecord', otpRecordSchema)
