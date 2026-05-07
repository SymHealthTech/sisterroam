"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AppLayout from "@/components/layout/AppLayout";
import ConversationList from "@/components/messages/ConversationList";
import ChatWindow from "@/components/messages/ChatWindow";
import VerificationGate from "@/components/ui/VerificationGate";

export default function ConversationPage({ params }) {
  const { requestId } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;
  const isVerified =
    session?.user?.verificationTier &&
    session.user.verificationTier !== "basic";

  if (session && !isVerified) {
    return (
      <AppLayout title="Messages">
        <VerificationGate mode="page" />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="" scrollable={false} noTopBar>
      <div className="flex flex-1 min-h-0">
        {/* Left panel: hidden on mobile, shown on desktop */}
        <div className="hidden lg:block lg:w-[360px] lg:max-w-[360px] shrink-0 h-full">
          <ConversationList
            currentUserId={userId}
            selectedRequestId={requestId}
            onSelect={(id) => router.push(`/messages/${id}`)}
          />
        </div>

        {/* Right panel: full width on mobile, flex-1 on desktop */}
        <div className="flex-1 flex flex-col min-h-0 pb-16 lg:pb-0">
          <ChatWindow requestId={requestId} currentUserId={userId} />
        </div>
      </div>
    </AppLayout>
  );
}
