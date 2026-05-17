import CoTravelPost from '@/models/CoTravelPost'
import Notification from '@/models/Notification'
import User from '@/models/User'
import { ok, fail, connectAndAuth, requireVerified, handleError } from '@/lib/apiHelpers'
import { connectDB } from '@/lib/mongodb'
import { auth } from '@/lib/auth'
import mongoose from 'mongoose'

export async function GET(request) {
  try {
    await connectDB()
    const session = await auth()
    if (!session?.user?.id) return fail('Login required to browse co-traveller posts', 401)
    // basic-tier users can browse; write actions are blocked separately

    const { searchParams } = new URL(request.url)
    const toCountry   = searchParams.get('toCountry')
    const toCity      = searchParams.get('toCity')
    const fromCountry = searchParams.get('fromCountry')
    const travelStyle = searchParams.get('travelStyle')
    const status      = searchParams.get('status') || 'open'
    const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit       = Math.min(24, Math.max(1, parseInt(searchParams.get('limit') ?? '12')))
    const dateFrom    = searchParams.get('dateFrom')
    const dateTo      = searchParams.get('dateTo')
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true'

    const query = {
      status,
      departureDate: { $gte: new Date() },
    }

    if (toCountry) query.toCountry = { $regex: toCountry, $options: 'i' }
    if (toCity)    query.toCity    = { $regex: toCity,    $options: 'i' }
    if (fromCountry) query.fromCountry = { $regex: fromCountry, $options: 'i' }
    if (travelStyle) query.travelStyle = { $in: [travelStyle] }
    if (dateFrom || dateTo) {
      query.departureDate = {}
      if (dateFrom) query.departureDate.$gte = new Date(dateFrom)
      if (dateTo)   query.departureDate.$lte = new Date(dateTo)
      // Ensure we always enforce future dates
      if (!dateFrom) query.departureDate.$gte = new Date()
    }

    let posts
    let total

    if (verifiedOnly) {
      // distinct returns only the _id values — no document deserialization or JS map needed
      const verifiedIds = await User.distinct('_id', { verificationTier: { $in: ['verified', 'trusted'] } })
      query.authorId = { $in: verifiedIds }
    }

    ;[posts, total] = await Promise.all([
      CoTravelPost.find(query)
        .sort({ departureDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('authorId', 'fullName profilePhotoUrl verificationTier city country travellerCategories bio')
        .lean(),
      CoTravelPost.countDocuments(query),
    ])

    return ok({
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request) {
  try {
    const session = await connectAndAuth()
    requireVerified(session)
    const userId  = session.user.id
    const body    = await request.json()

    const {
      title, fromCity, fromCountry, fromCountryCode,
      toCity, toCountry, toCountryCode,
      departureDate, returnDate, isFlexibleDates, durationDays,
      tripType, description, travelStyle, lookingFor,
      maxCoTravellers, tags,
    } = body

    if (!title?.trim())        return fail('Title is required', 400)
    if (!fromCity?.trim())     return fail('Departure city is required', 400)
    if (!fromCountry?.trim())  return fail('Departure country is required', 400)
    if (!toCity?.trim())       return fail('Destination city is required', 400)
    if (!toCountry?.trim())    return fail('Destination country is required', 400)
    if (!departureDate)        return fail('Departure date is required', 400)
    if (!description?.trim())  return fail('Description is required', 400)

    const depDate = new Date(departureDate)
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 3)
    if (depDate < minDate) return fail('Departure date must be at least 3 days in the future', 400)

    const openPostsCount = await CoTravelPost.countDocuments({
      authorId: userId,
      status: 'open',
    })
    if (openPostsCount >= 3) {
      return fail('You can have maximum 3 open trip posts at a time', 400)
    }

    const post = await CoTravelPost.create({
      authorId: userId,
      title: title.trim(),
      fromCity: fromCity.trim(),
      fromCountry: fromCountry.trim(),
      fromCountryCode,
      toCity: toCity.trim(),
      toCountry: toCountry.trim(),
      toCountryCode,
      departureDate: depDate,
      returnDate: returnDate ? new Date(returnDate) : undefined,
      isFlexibleDates: !!isFlexibleDates,
      durationDays,
      tripType: tripType || 'one_way',
      description: description.trim(),
      travelStyle: Array.isArray(travelStyle) ? travelStyle : [],
      lookingFor: lookingFor || { verifiedOnly: true },
      maxCoTravellers: maxCoTravellers || 1,
      tags: Array.isArray(tags) ? tags : [],
    })

    await Notification.create({
      recipientId: userId,
      type: 'new_cotraveller_interest',
      title: 'Your co-traveller post is live!',
      body: `Your trip to ${toCity} has been posted. Sisters can now find and apply to join you.`,
      link: `/cotraveller/${post._id}`,
    })

    return ok(post)
  } catch (e) {
    return handleError(e)
  }
}
