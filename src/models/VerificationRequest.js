import mongoose from 'mongoose'

const verificationRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  tier: { type: Number, enum: [1, 2, 3], required: true },

  documents: [{
    type: { type: String, enum: ['govt_id', 'selfie', 'video_intro', 'address_proof'] },
    url: { type: String },
    publicId: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  }],

  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending',
  },

  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  rejectionReason: { type: String },
  adminNotes: { type: String },
}, { timestamps: true })

export default mongoose.models.VerificationRequest || mongoose.model('VerificationRequest', verificationRequestSchema)
