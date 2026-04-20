import mongoose from 'mongoose'

const hostingRequestSchema = new mongoose.Schema({
  guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hostProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'HostProfile', required: true },

  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: { type: Number, default: 1 },
  message: { type: String, maxlength: 1000 },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled', 'completed'],
    default: 'pending',
  },

  declineReason: { type: String },
  cancelReason: { type: String },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  checkInConfirmed: { type: Boolean, default: false },
  checkOutConfirmed: { type: Boolean, default: false },

  lastCheckin: { type: Date },
  nextCheckinDue: { type: Date },
}, { timestamps: true })

export default mongoose.models.HostingRequest || mongoose.model('HostingRequest', hostingRequestSchema)
