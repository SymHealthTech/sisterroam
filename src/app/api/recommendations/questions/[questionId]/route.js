import RecommendationQuestion from '@/models/RecommendationQuestion'
import RecommendationAnswer from '@/models/RecommendationAnswer'
import Notification from '@/models/Notification'
import { ok, fail, connectAndAuth, handleError } from '@/lib/apiHelpers'
import { connectDB } from '@/lib/mongodb'
import { auth } from '@/lib/auth'
import { sendToUser } from '@/lib/sse'
import { sendNewAnswerEmail } from '@/lib/resend'
import User from '@/models/User'

export async function GET(request, { params }) {
  try {
    await connectDB()
    const session = await auth()
    if (!session?.user?.id) return fail('Login required', 401)

    const { questionId } = await params
    const userId = session.user.id

    const question = await RecommendationQuestion.findById(questionId)
      .populate('authorId', 'fullName profilePhotoUrl verificationTier city')
      .lean()

    if (!question) return fail('Question not found', 404)

    await RecommendationQuestion.findByIdAndUpdate(questionId, { $inc: { viewsCount: 1 } })

    const answers = await RecommendationAnswer.find({ questionId })
      .populate('authorId', 'fullName profilePhotoUrl verificationTier city')
      .lean()

    answers.sort((a, b) => {
      if (a.isAccepted && !b.isAccepted) return -1
      if (!a.isAccepted && b.isAccepted) return 1
      return b.upvoteCount - a.upvoteCount
    })

    const answersOut = answers.map(a => ({
      ...a,
      hasUpvoted: a.upvotes?.some(uid => uid.toString() === userId) ?? false,
    }))

    return ok({ question, answers: answersOut })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { questionId } = await params
    const userId = session.user.id
    const body = await request.json()
    const { content } = body

    if (!content?.trim()) return fail('Answer content is required', 400)

    const question = await RecommendationQuestion.findById(questionId)
      .populate('authorId', 'fullName email')
      .lean()
    if (!question) return fail('Question not found', 404)
    if (question.status === 'closed') return fail('This question is closed', 400)

    const answer = await RecommendationAnswer.create({
      questionId,
      authorId: userId,
      content: content.trim(),
    })

    await RecommendationQuestion.findByIdAndUpdate(questionId, { $inc: { answersCount: 1 } })

    const answerer = await User.findById(userId, 'fullName profilePhotoUrl').lean()
    const qAuthorId = question.authorId._id.toString()

    if (qAuthorId !== userId) {
      await Notification.create({
        recipientId: qAuthorId,
        type: 'new_recommendation_answer',
        title: `${answerer.fullName} answered your question about ${question.city}`,
        body: content.trim().slice(0, 100),
        link: `/recommendations/questions/${questionId}`,
      })

      sendToUser(qAuthorId, 'new_recommendation_answer', {
        questionId,
        city: question.city,
        answererName: answerer.fullName,
        preview: content.trim().slice(0, 100),
      })

      try {
        await sendNewAnswerEmail(question.authorId, answerer, question)
      } catch {}
    }

    const populated = await RecommendationAnswer.findById(answer._id)
      .populate('authorId', 'fullName profilePhotoUrl verificationTier city')
      .lean()

    return ok({ ...populated, hasUpvoted: false })
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await connectAndAuth()
    const { questionId } = await params
    const userId = session.user.id
    const body = await request.json()
    const { answerId } = body

    if (!answerId) return fail('answerId is required', 400)

    const question = await RecommendationQuestion.findById(questionId).lean()
    if (!question) return fail('Question not found', 404)
    if (question.authorId.toString() !== userId) return fail('Only the question author can mark best answer', 403)

    await RecommendationAnswer.updateMany({ questionId }, { isAccepted: false })

    const answer = await RecommendationAnswer.findByIdAndUpdate(
      answerId,
      { isAccepted: true },
      { new: true }
    ).populate('authorId', 'fullName profilePhotoUrl verificationTier city').lean()

    if (!answer) return fail('Answer not found', 404)

    await RecommendationQuestion.findByIdAndUpdate(questionId, {
      isResolved: true,
      status: 'resolved',
    })

    const answerAuthorId = answer.authorId._id.toString()
    if (answerAuthorId !== userId) {
      await Notification.create({
        recipientId: answerAuthorId,
        type: 'answer_accepted',
        title: `Your answer about ${question.city} was marked as the best answer!`,
        body: 'Great advice! The question has been resolved.',
        link: `/recommendations/questions/${questionId}`,
      })
    }

    return ok({ ...answer, hasUpvoted: answer.upvotes?.some(uid => uid.toString() === userId) ?? false })
  } catch (e) {
    return handleError(e)
  }
}
