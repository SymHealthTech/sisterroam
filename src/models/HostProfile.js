import mongoose from 'mongoose'

const paidServiceSchema = new mongoose.Schema(
  {
    name: { type: String },
    description: { type: String },
    price: { type: Number },
    currency: { type: String, default: 'INR' },
    duration: { type: String },
  },
  { _id: false }
)

const hostProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    accommodationType: {
      type: String,
      enum: ['private_room', 'shared_room', 'couch', 'floor_space', 'tent_space'],
      required: true,
    },

    maxGuests: { type: Number, default: 1, min: 1, max: 6 },

    freeOfferings: {
      type: [String],
      enum: ['bed', 'breakfast', 'dinner', 'city_guide', 'airport_pickup', 'laundry', 'wifi', 'bicycle'],
    },

    houseRules: { type: String, maxlength: 1000 },
    languagesForGuests: [{ type: String }],

    femaleOnly: { type: Boolean, default: false },
    isAcceptingGuests: { type: Boolean, default: true },
    isListingActive: { type: Boolean, default: true },

    responseRate: { type: Number, default: 100 },
    responseTimeHours: { type: Number, default: 24 },
    totalStays: { type: Number, default: 0 },

    paidServices: [paidServiceSchema],

    addressLine: { type: String },
    addressCity: { type: String },
    addressCountry: { type: String },
    addressVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
)

hostProfileSchema.index({ addressCountry: 1 })
hostProfileSchema.index({ addressCity: 1 })
hostProfileSchema.index({ femaleOnly: 1 })
hostProfileSchema.index({ isAcceptingGuests: 1 })
hostProfileSchema.index({ isListingActive: 1 })

export default mongoose.models.HostProfile || mongoose.model('HostProfile', hostProfileSchema)
