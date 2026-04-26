import mongoose from 'mongoose'

const verificationRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    idDocumentUrl:       { type: String },
    idDocumentPublicId:  { type: String },
    idDocumentBackUrl:   { type: String },
    selfieVideoUrl:      { type: String },
    selfieVideoPublicId: { type: String },
    socialMediaUrl:      { type: String },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    reviewerNotes: { type: String },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.models.VerificationRequest || mongoose.model('VerificationRequest', verificationRequestSchema)
