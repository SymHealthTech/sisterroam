import mongoose from 'mongoose'

const PromoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['brand_ambassador', 'first_100', 'discount'],
      required: true,
    },
    maxUses: { type: Number, required: true, default: 100 },
    usedCount: { type: Number, default: 0 },
    usedBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: { type: String },
        userEmail: { type: String },
        usedAt: { type: Date, default: Date.now },
      },
    ],
    isActive: { type: Boolean, default: true },
    notes: { type: String },
  },
  { timestamps: true },
)

export default mongoose.models.PromoCode || mongoose.model('PromoCode', PromoCodeSchema)
