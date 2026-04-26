import mongoose from 'mongoose'

const sosAlertSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'HostingRequest' },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'resolved'],
      default: 'active',
    },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
)

sosAlertSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.models.SosAlert || mongoose.model('SosAlert', sosAlertSchema)
