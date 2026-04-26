import mongoose from 'mongoose'

const safetyReportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'HostingRequest' },

    reason: {
      type: String,
      enum: ['harassment', 'fake_profile', 'safety_incident', 'unwanted_contact', 'discrimination', 'other'],
      required: true,
    },
    details: { type: String, required: true },

    evidenceUrl: { type: String },
    evidencePublicId: { type: String },
    contactReporter: { type: Boolean, default: true },

    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'dismissed'],
      default: 'open',
    },
    adminNotes: { type: String },
    actionTaken: {
      type: String,
      enum: ['warning', 'suspension_7', 'suspension_30', 'permanent_ban', 'no_action'],
    },

    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

export default mongoose.models.SafetyReport || mongoose.model('SafetyReport', safetyReportSchema)
