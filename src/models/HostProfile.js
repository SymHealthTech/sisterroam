import mongoose from 'mongoose'

const hostProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  title: { type: String, required: true },
  description: { type: String, required: true, maxlength: 2000 },
  photos: [{ type: String }],

  location: {
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },

  accommodation: {
    type: { type: String, enum: ['private_room', 'shared_room', 'entire_place', 'sofa'] },
    maxGuests: { type: Number, default: 1 },
    amenities: [{ type: String }],
    houseRules: [{ type: String }],
  },

  availability: {
    isActive: { type: Boolean, default: true },
    minStay: { type: Number, default: 1 },
    maxStay: { type: Number, default: 14 },
    advanceNotice: { type: Number, default: 1 },
  },

  safety: {
    femaleOnlyGuests: { type: Boolean, default: true },
    safetyFeatures: [{ type: String }],
  },

  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  totalHostings: { type: Number, default: 0 },

  isPublished: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.models.HostProfile || mongoose.model('HostProfile', hostProfileSchema)
