import mongoose from 'mongoose'

const safetyCheckinSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'HostingRequest', required: true },

  status: { type: String, enum: ['scheduled', 'completed', 'missed', 'sos'], default: 'scheduled' },
  scheduledAt: { type: Date, required: true },
  completedAt: { type: Date },

  note: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String },
  },

  isSos: { type: Boolean, default: false },
  sosAlertSentAt: { type: Date },
  emergencyContactNotified: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.models.SafetyCheckin || mongoose.model('SafetyCheckin', safetyCheckinSchema)
