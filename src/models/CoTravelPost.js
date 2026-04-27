import mongoose from 'mongoose'

const TRAVELLER_CATEGORIES = [
  'solo_traveller', 'backpacker', 'cyclist', 'trekker',
  'runner', 'ultramarathon', 'road_tripper', 'family_tourist',
]

const coTravelPostSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true, maxlength: 200, trim: true },

    fromCity:        { type: String, required: true, trim: true },
    fromCountry:     { type: String, required: true, trim: true },
    fromCountryCode: { type: String, trim: true },

    toCity:        { type: String, required: true, trim: true },
    toCountry:     { type: String, required: true, trim: true },
    toCountryCode: { type: String, trim: true },

    departureDate:    { type: Date, required: true },
    returnDate:       { type: Date },
    isFlexibleDates:  { type: Boolean, default: false },
    durationDays:     { type: Number },

    tripType: {
      type: String,
      enum: ['one_way', 'round_trip', 'open_ended'],
      default: 'one_way',
    },

    description: { type: String, required: true, maxlength: 1500, trim: true },

    travelStyle: [{
      type: String,
      enum: TRAVELLER_CATEGORIES,
    }],

    lookingFor: {
      minAge:       { type: Number },
      maxAge:       { type: Number },
      languages:    [{ type: String }],
      verifiedOnly: { type: Boolean, default: true },
    },

    maxCoTravellers:     { type: Number, default: 1, min: 1, max: 4 },
    currentCoTravellers: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['open', 'filled', 'cancelled', 'expired'],
      default: 'open',
    },

    interestedCount: { type: Number, default: 0 },
    viewsCount:      { type: Number, default: 0 },
    isFeatured:      { type: Boolean, default: false },
    tags:            [{ type: String, trim: true }],
  },
  { timestamps: true }
)

coTravelPostSchema.index({ authorId: 1 })
coTravelPostSchema.index({ toCountry: 1 })
coTravelPostSchema.index({ toCity: 1 })
coTravelPostSchema.index({ departureDate: 1 })
coTravelPostSchema.index({ status: 1 })
coTravelPostSchema.index({ travelStyle: 1 })
coTravelPostSchema.index({ createdAt: -1 })
// TTL: auto-remove documents 7 days after departureDate
coTravelPostSchema.index({ departureDate: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60, name: 'ttl_departure' })

coTravelPostSchema.pre('save', function () {
  if (this.departureDate && this.departureDate < new Date()) {
    if (this.status === 'open') this.status = 'expired'
  }
})

export default mongoose.models.CoTravelPost || mongoose.model('CoTravelPost', coTravelPostSchema)
