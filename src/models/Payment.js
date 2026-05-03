import mongoose from 'mongoose'

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  dodoPaymentId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  dodoPaymentLinkId: { type: String },
  checkoutUrl: { type: String },
  amount: { type: Number, required: true },
  currency: {
    type: String,
    enum: ['INR', 'USD'],
    required: true,
  },
  purpose: {
    type: String,
    default: 'verified_badge',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
    index: true,
  },
  paidAt: { type: Date },
  webhookPayload: { type: mongoose.Schema.Types.Mixed },
  promoCode: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: true })

PaymentSchema.index({ userId: 1, purpose: 1, status: 1 })

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)
