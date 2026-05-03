import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import PromoCode from '@/models/PromoCode'

// GET /api/admin/promo-codes — list all codes with usage details
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 })
    }

    await connectDB()
    const codes = await PromoCode.find({}).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ success: true, data: codes })
  } catch (error) {
    console.error('Admin promo codes GET error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

// POST /api/admin/promo-codes — create a new promo code
// Body: { code, type: 'brand_ambassador' | 'first_100', maxUses?, notes? }
export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 })
    }

    const { code, type, maxUses, notes } = await req.json()
    if (!code?.trim() || !type) {
      return NextResponse.json({ success: false, error: 'code and type are required' }, { status: 400 })
    }
    if (!['brand_ambassador', 'first_100'].includes(type)) {
      return NextResponse.json({ success: false, error: 'type must be brand_ambassador or first_100' }, { status: 400 })
    }

    await connectDB()
    const promo = await PromoCode.create({
      code: code.trim().toUpperCase(),
      type,
      maxUses: maxUses ?? 100,
      notes: notes ?? '',
    })
    return NextResponse.json({ success: true, data: promo }, { status: 201 })
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'A code with that name already exists' }, { status: 409 })
    }
    console.error('Admin promo codes POST error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
