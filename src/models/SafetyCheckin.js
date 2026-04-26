import mongoose from 'mongoose'

const safetyCheckinSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'HostingRequest', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  checkinType: { type: String, enum: ['arrival', 'morning', 'departure'], required: true },

  scheduledAt: { type: Date, required: true },
  sentAt: { type: Date },
  confirmedAt: { type: Date },

  isMissed: { type: Boolean, default: false },
  alertSent: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.SafetyCheckin || mongoose.model('SafetyCheckin', safetyCheckinSchema)
