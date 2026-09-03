'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { MessageCircle, Lock, Shield } from 'lucide-react'
import { useAppUser } from '@/components/layout/AppLayout'
import { UnderReviewModal, VerificationRequiredModal } from '@/components/ui/VerificationGate'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

/**
 * "Message" / chat button shown on a sister's profile.
 *
 * - Visible to everyone (with a note that only verified sisters can chat).
 * - Clickable only for verified/trusted sisters; other tiers open the relevant
 *   verification gate modal instead.
 * - Opens (or reuses) a direct conversation and navigates to the chat, where the
 *   first message triggers an email to the recipient.
 */
export default function MessageButton({ recipientId, recipientName, className }) {
  const router = useRouter()
  const { data: session } = useSession()
  const appUser = useAppUser()
  const tier = appUser?.verificationTier ?? session?.user?.verificationTier
  const isVerified = tier === 'verified' || tier === 'trusted'
  const isUnderReview = tier === 'paid'

  const [loading, setLoading] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  // Never show on your own profile
  const isOwnProfile =
    session?.user?.id && recipientId && String(session.user.id) === String(recipientId)
  if (isOwnProfile) return null

  const firstName = recipientName?.split(' ')[0] || 'her'

  async function startConversation() {
    if (!isVerified) {
      if (isUnderReview) setShowReviewModal(true)
      else setShowVerifyModal(true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/messages/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId }),
      })
      const json = await res.json()
      if (json.success && json.data?.requestId) {
        router.push(`/messages/${json.data.requestId}`)
      } else {
        toast.error(json.error ?? 'Could not start conversation')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {showReviewModal && <UnderReviewModal onClose={() => setShowReviewModal(false)} />}
      {showVerifyModal && <VerificationRequiredModal onClose={() => setShowVerifyModal(false)} />}

      {isVerified ? (
        <Button
          onClick={startConversation}
          loading={loading}
          fullWidth
          variant="secondary"
        >
          <MessageCircle className="w-4 h-4" />
          Message {firstName}
        </Button>
      ) : (
        <button
          type="button"
          onClick={startConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200
                     rounded-[10px] text-sm font-medium text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <Lock className="w-4 h-4 text-brand/40" />
          Message {firstName}
        </button>
      )}

      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 text-center">
        <Shield className="w-3.5 h-3.5 text-teal shrink-0" />
        Only verified sisters can chat with other sisters.
      </p>
    </div>
  )
}
