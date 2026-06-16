import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import PromoCode from '@/models/PromoCode'

export async function POST(req) {
  try {
    const { code } = await req.json()
    if (!code?.trim()) {
      return NextResponse.json({ valid: false, error: 'Please enter a promo code' })
    }

    await connectDB()

    const promo = await PromoCode.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    })

    if (!promo) {
      return NextResponse.json({ valid: false, error: 'Invalid promo code' })
    }
    if (promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ valid: false, error: 'This promo code has reached its limit' })
    }

    // 'discount' type codes apply a price reduction but still require Dodo payment.
    // All other types (brand_ambassador, first_100) waive the fee entirely.
    return NextResponse.json({ valid: true, type: promo.type, isFree: promo.type !== 'discount' })
  } catch (error) {
    console.error('Promo validate error:', error)
    return NextResponse.json({ valid: false, error: 'Server error. Try again.' })
  }
}
