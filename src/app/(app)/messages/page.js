'use client'

import { useSession } from 'next-auth/react'
import { MessageCircle, Shield } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import ConversationList from '@/components/messages/ConversationList'
import VerificationGate from '@/components/ui/VerificationGate'

export default function MessagesPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const isVerified = session?.user?.verificationTier && session.user.verificationTier !== 'basic'

  if (session && !isVerified) {
    return (
      <AppLayout title="Messages" subtitle="Your trips & stay requests">
        <VerificationGate mode="page" />
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Messages" subtitle="Your trips & stay requests" scrollable={false}>
      <div className="flex flex-1 min-h-0">

        {/* Left panel: conversation list — full width on mobile, fixed 360px on desktop */}
        <div className="w-full lg:w-[360px] lg:max-w-[360px] shrink-0 h-full">
          <ConversationList
            currentUserId={userId}
            selectedRequestId={null}
          />
        </div>

        {/* Right panel: placeholder shown only on desktop */}
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-brand-lighter/30 to-gray-50 border-l border-gray-100 text-center px-6">
          <div className="w-20 h-20 rounded-full bg-white shadow-sm ring-1 ring-brand/10 flex items-center justify-center mb-5">
            <MessageCircle className="w-9 h-9 text-brand" />
          </div>
          <p className="text-lg font-semibold text-gray-800">Your conversations</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">
            Select a chat on the left, or message a sister from her profile to start a new conversation.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/70 ring-1 ring-teal/20">
            <Shield className="w-4 h-4 text-teal" />
            <span className="text-xs text-gray-500">Only verified sisters can start conversations</span>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
