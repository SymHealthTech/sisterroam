import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    googleId: { type: String, sparse: true, unique: true },

    phone: { type: String, sparse: true, unique: true },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },

    fullName: { type: String, required: true, trim: true },
    username: { type: String, unique: true, lowercase: true },

    age: { type: Number, min: 18, max: 99 },
    gender: { type: String, enum: ['female', 'non-binary', 'other'] },

    city: { type: String, trim: true },
    country: { type: String, trim: true },
    countryCode: { type: String },
    languages: [{ type: String }],

    education: {
      type: String,
      enum: ['high_school', 'undergraduate', 'postgraduate', 'doctorate', 'other', 'prefer_not_to_say'],
    },
    occupation: { type: String },
    bio: { type: String, maxlength: 1000 },

    profilePhotoUrl: { type: String },
    profilePhotoPublicId: { type: String },
    coverPhotoUrl: { type: String },

    travellerCategories: {
      type: [String],
      enum: ['solo_traveller', 'backpacker', 'cyclist', 'trekker', 'runner', 'ultramarathon', 'road_tripper', 'family_tourist'],
    },
    countriesVisited: [{ type: String }],
    hobbies: [{ type: String }],

    instagramUrl: { type: String },
    linkedinUrl: { type: String },
    facebookUrl: { type: String },

    emergencyContactName: { type: String },
    emergencyContactPhone: { type: String },
    emergencyContactRelationship: { type: String },
    emergencyContactEmail: { type: String },

    verificationTier: {
      type: String,
      enum: ['basic', 'verified', 'trusted'],
      default: 'basic',
    },
    role: { type: String, enum: ['guest', 'host', 'both'], default: 'guest' },
    isAdmin: { type: Boolean, default: false },

    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspendedUntil: { type: Date },
    isPermanentlyBanned: { type: Boolean, default: false },

    onboardingStep: { type: Number, default: 1 },
    onboardingCompleted: { type: Boolean, default: false },

    emailNotifications: {
      newRequest: { type: Boolean, default: true },
      requestAccepted: { type: Boolean, default: true },
      requestDeclined: { type: Boolean, default: true },
      newMessage: { type: Boolean, default: true },
      checkinReminder: { type: Boolean, default: true },
      reviewReceived: { type: Boolean, default: true },
      verificationUpdate: { type: Boolean, default: true },
    },

    totalStays: { type: Number, default: 0 },
    totalHostings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },

    lastActive: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password
        return ret
      },
    },
  }
)

userSchema.index({ country: 1 })
userSchema.index({ city: 1 })
userSchema.index({ verificationTier: 1 })
userSchema.index({ travellerCategories: 1 })

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return
  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.pre('save', function () {
  if (this.isNew && !this.username) {
    this.username = this.generateUsername()
  }
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.generateUsername = function () {
  const base = this.fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12)
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${base}${suffix}`
}

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() })
}

export default mongoose.models.User || mongoose.model('User', userSchema)
