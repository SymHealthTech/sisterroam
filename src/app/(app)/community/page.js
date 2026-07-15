"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AppLayout, { useAppUser } from "@/components/layout/AppLayout";
import PostCard from "@/components/community/PostCard";
import PostComposer from "@/components/community/PostComposer";
import WelcomeCard from "@/components/community/WelcomeCard";
import Skeleton from "@/components/ui/Skeleton";
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
// `welcome` — when true (the /feed home stream), a one-time welcome post is
// shown at the top for brand-new sisters. Never passed on the /community page.
export function FeedTab({ welcome = false }) {
  const user = useAppUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [welcomeInfo, setWelcomeInfo] = useState(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const composerRef = useRef(null);

  const dismissKey = user?.id ? `sr-welcome-dismissed-${user.id}` : null;

  // Personal (per-browser) dismissal — separate from an admin global delete.
  useEffect(() => {
    if (!dismissKey) return;
    try {
      setWelcomeDismissed(localStorage.getItem(dismissKey) === "1");
    } catch {}
  }, [dismissKey]);

  useEffect(() => {
    if (!welcome || !user?.id) return;
    let cancelled = false;
    fetch("/api/users/welcome-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.data) setWelcomeInfo(d.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [welcome, user?.id]);

  function dismissWelcome() {
    setWelcomeDismissed(true);
    if (dismissKey) {
      try {
        localStorage.setItem(dismissKey, "1");
      } catch {}
    }
  }

  function scrollToComposer() {
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Every newly signed-up sister sees her own private welcome post until she
  // dismisses it or it auto-retires (first post / 7 days, per the API).
  const showWelcome = welcome && !welcomeDismissed && welcomeInfo?.isNewcomer;

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
    // Auto-retire the welcome post the moment she publishes her first post.
    // (Admins keep seeing it via isAdmin — this only clears the newcomer flag.)
    setWelcomeInfo((w) => (w?.isNewcomer ? { ...w, isNewcomer: false } : w));
  }

  function handleDelete(id) {
    setPosts((prev) => prev.filter((p) => p._id !== id));
  }

  const tierKnown = user?.tierLoaded ?? false;

  return (
    <div className="space-y-4">
      {!tierKnown ? (
        <Skeleton variant="card" className="h-16" />
      ) : (
        <div ref={composerRef}>
          <PostComposer user={user} onPost={handleNewPost} />
        </div>
      )}

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

      {/* Welcome post — private to each newly signed-up sister, /feed only */}
      {showWelcome && (
        <WelcomeCard
          profile={welcomeInfo.profile}
          onIntroduce={scrollToComposer}
          onDismiss={dismissWelcome}
        />
      )}

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
