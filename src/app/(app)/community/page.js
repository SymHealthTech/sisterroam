"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AppLayout, { useAppUser } from "@/components/layout/AppLayout";
import PostCard from "@/components/community/PostCard";
import PostComposer from "@/components/community/PostComposer";
import Skeleton from "@/components/ui/Skeleton";
import { UnderReviewModal } from "@/components/ui/VerificationGate";
import Avatar from "@/components/ui/Avatar";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "safety_tips", label: "Safety" },
  { value: "trip_planning", label: "Trip Planning" },
  { value: "looking_for_host", label: "Host Search" },
  { value: "hosting_offer", label: "Hosting" },
  { value: "achievements", label: "Wins" },
  { value: "questions", label: "Questions" },
];

/* ── Feed tab ─────────────────────────────────────────────── */
export function FeedTab() {
  const user = useAppUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = useCallback(async (cat, pg) => {
    const params = new URLSearchParams({ page: pg, limit: 10 });
    if (cat) params.set("category", cat);
    const res = await fetch(`/api/community/posts?${params}`);
    if (!res.ok) return null;
    return await res.json();
  }, []);

  useEffect(() => {
    fetchPosts(category, 1).then((d) => {
      const list = d?.data?.posts ?? [];
      setPosts(list);
      setHasMore(1 < (d?.data?.totalPages ?? 1));
      setLoading(false);
    });
  }, [category, fetchPosts]);

  function selectCategory(value) {
    pageRef.current = 1;
    setLoading(true);
    setCategory(value);
  }

  function loadMore() {
    const next = pageRef.current + 1;
    pageRef.current = next;
    setLoadingMore(true);
    fetchPosts(category, next).then((d) => {
      const list = d?.data?.posts ?? [];
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => String(p._id)));
        return [...prev, ...list.filter((p) => !seen.has(String(p._id)))];
      });
      setHasMore(next < (d?.data?.totalPages ?? 1));
      setLoadingMore(false);
    });
  }

  function handleNewPost(post) {
    setPosts((prev) => [post, ...prev]);
  }

  function handleDelete(id) {
    setPosts((prev) => prev.filter((p) => p._id !== id));
  }

  const tierKnown = user?.tierLoaded ?? false;
  const isVerified = tierKnown && (user.verificationTier === "verified" || user.verificationTier === "trusted");
  const isUnderReview = tierKnown && user.verificationTier === "paid";
  const [showReviewModal, setShowReviewModal] = useState(false);

  return (
    <div className="space-y-4">
      {showReviewModal && <UnderReviewModal onClose={() => setShowReviewModal(false)} />}
      {!tierKnown ? (
        <Skeleton variant="card" className="h-16" />
      ) : isVerified ? (
        <PostComposer user={user} onPost={handleNewPost} />
      ) : isUnderReview ? (
        <button
          type="button"
          onClick={() => setShowReviewModal(true)}
          className="w-full flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        >
          <Avatar src={user.profilePhotoUrl} name={user.fullName} size="sm" />
          <span className="text-sm text-gray-400 flex-1">Share something with the community...</span>
          <Lock className="w-4 h-4 text-brand/40 shrink-0" />
        </button>
      ) : null}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => selectCategory(c.value)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0",
              category === c.value
                ? "bg-brand text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-brand/30",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="card" className="h-40" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-base font-medium">No posts yet</p>
          <p className="text-sm mt-1">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p, idx) => (
            <PostCard
              key={p._id}
              post={p}
              currentUserId={user?.id}
              currentUserTier={user?.verificationTier}
              onDelete={handleDelete}
              priority={idx === 0}
            />
          ))}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-3 text-sm text-brand font-medium border border-brand/20 rounded-2xl hover:bg-brand-lighter/30 transition-colors disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function CommunityPage() {
  return (
    <AppLayout title="Community">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-10 space-y-4">
        <FeedTab />
      </div>
    </AppLayout>
  );
}
