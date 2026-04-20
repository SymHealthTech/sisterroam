import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, select: false },
  avatar: { type: String, default: '' },
  authProvider: { type: String, enum: ['email', 'google'], default: 'email' },
  googleId: { type: String },

  role: { type: String, enum: ['traveller', 'host', 'both', 'admin'], default: 'traveller' },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  verificationTier: { type: Number, enum: [0, 1, 2, 3], default: 0 },

  onboardingComplete: { type: Boolean, default: false },

  phone: { type: String },
  dateOfBirth: { type: Date },
  nationality: { type: String },
  languages: [{ type: String }],
  bio: { type: String, maxlength: 500 },

  isBanned: { type: Boolean, default: false },
  banReason: { type: String },

  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

export default mongoose.models.User || mongoose.model('User', userSchema)
