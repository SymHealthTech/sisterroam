'use client'

import { useSession } from 'next-auth/react'
import AppLayout from '@/components/layout/AppLayout'
import ConversationList from '@/components/messages/ConversationList'
import VerificationGate from '@/components/ui/VerificationGate'

export default function MessagesPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const isVerified = session?.user?.verificationTier && session.user.verificationTier !== 'basic'

  if (session && !isVerified) {
    return (
      <AppLayout title="Messages">
        <VerificationGate mode="page" />
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Messages" scrollable={false}>
      <div className="flex h-full">

        {/* Left panel: conversation list — full width on mobile, fixed 360px on desktop */}
        <div className="w-full lg:w-[360px] lg:max-w-[360px] shrink-0 h-full">
          <ConversationList
            currentUserId={userId}
            selectedRequestId={null}
          />
        </div>

        {/* Right panel: placeholder shown only on desktop */}
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gray-50 border-l border-gray-100 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-brand-lighter flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-base font-medium text-gray-700">Select a conversation</p>
          <p className="text-sm text-gray-400 mt-1">Choose from your messages on the left</p>
        </div>

      </div>
    </AppLayout>
  )
}
