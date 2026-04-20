import mongoose from 'mongoose'

const safetyReportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'HostingRequest' },

  type: {
    type: String,
    enum: ['harassment', 'safety_concern', 'fake_profile', 'inappropriate_content', 'scam', 'other'],
    required: true,
  },
  description: { type: String, required: true, maxlength: 2000 },
  evidence: [{ type: String }],

  status: { type: String, enum: ['open', 'investigating', 'resolved', 'dismissed'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolution: { type: String },
  resolvedAt: { type: Date },
}, { timestamps: true })

export default mongoose.models.SafetyReport || mongoose.model('SafetyReport', safetyReportSchema)
