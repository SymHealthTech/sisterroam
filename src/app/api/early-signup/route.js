import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { ok, fail, handleError } from '@/lib/apiHelpers'
import { isValidEmail } from '@/lib/utils'

// Inline schema — lightweight collection just for early access leads
const earlySignupSchema = new mongoose.Schema({
  email:     { type: String, required: true, unique: true, lowercase: true },
  createdAt: { type: Date, default: Date.now },
})

const EarlySignup =
  mongoose.models.EarlySignup || mongoose.model('EarlySignup', earlySignupSchema)

export async function POST(request) {
  try {
    await connectDB()
    const { email } = await request.json()

    if (!email || !isValidEmail(email)) return fail('A valid email is required', 400)

    await EarlySignup.findOneAndUpdate(
      { email: email.toLowerCase() },
      { email: email.toLowerCase() },
      { upsert: true, new: true },
    )

    const count = await EarlySignup.countDocuments()
    return ok({ count })
  } catch (e) {
    return handleError(e)
  }
}

export async function GET() {
  try {
    await connectDB()
    const count = await EarlySignup.countDocuments()
    return ok({ count })
  } catch (e) {
    return handleError(e)
  }
}
