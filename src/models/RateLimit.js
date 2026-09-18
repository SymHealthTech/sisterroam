import mongoose from 'mongoose'

// Fixed-window counter used to throttle abusable actions (e.g. upload-signature
// requests) per user. Docs auto-expire a day after their window starts so the
// collection stays small.
const rateLimitSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    count: { type: Number, default: 0 },
    windowStart: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

rateLimitSchema.index({ windowStart: 1 }, { expireAfterSeconds: 86400 })

export default mongoose.models.RateLimit || mongoose.model('RateLimit', rateLimitSchema)
