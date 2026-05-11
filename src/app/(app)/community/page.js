"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import AppLayout, { useAppUser } from "@/components/layout/AppLayout";
import PostCard from "@/components/community/PostCard";
import PostComposer from "@/components/community/PostComposer";
import Skeleton from "@/components/ui/Skeleton";
import VerificationGate from "@/components/ui/VerificationGate";
import { cn } from "@/lib/utils";

const TABS = ["Feed", "Circles", "Stories"];

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
function FeedTab() {
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
  const isVerified = tierKnown && user.verificationTier && user.verificationTier !== "basic";

  return (
    <div className="space-y-4">
      {!tierKnown ? (
        <Skeleton variant="card" className="h-16" />
      ) : isVerified ? (
        <PostComposer user={user} onPost={handleNewPost} />
      ) : (
        <VerificationGate mode="banner" action="Posting" />
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

/* ── Circles tab (inline summary + link) ──────────────────── */
const CIRCLES = [
  {
    id: "solo-backpackers",
    name: "Solo Backpackers",
    emoji: "🎒",
    desc: "Budget travel, hostels & backpacking tips",
    members: 1240,
  },
  {
    id: "cycling-sisters",
    name: "Cycling Sisters",
    emoji: "🚴",
    desc: "Bike touring, routes & gear",
    members: 890,
  },
  {
    id: "trail-runners",
    name: "Trail Runners",
    emoji: "🏃",
    desc: "Running routes and race meetups",
    members: 540,
  },
  {
    id: "digital-nomads",
    name: "Digital Nomads",
    emoji: "💻",
    desc: "Remote work, visas & co-working spaces",
    members: 2100,
  },
  {
    id: "culture-seekers",
    name: "Culture Seekers",
    emoji: "🌍",
    desc: "Local experiences, food & history",
    members: 1560,
  },
];

function CirclesTab() {
  const [joined, setJoined] = useState(new Set());

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {CIRCLES.map((c) => (
        <div
          key={c.id}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow"
        >
          <div className="h-16 bg-gradient-to-br from-brand-lighter to-pink/10 flex items-center justify-center text-3xl">
            {c.emoji}
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {c.members.toLocaleString()} members
              </span>
              <button
                onClick={() =>
                  setJoined((prev) => {
                    const next = new Set(prev);
                    next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                    return next;
                  })
                }
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  joined.has(c.id)
                    ? "bg-brand text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-brand-lighter hover:text-brand",
                )}
              >
                {joined.has(c.id) ? "Joined" : "Join"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Stories tab (quick preview + link) ──────────────────── */
function StoriesTabPreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Authentic stories from verified sisters
        </p>
        <Link
          href="/community/stories"
          className="text-sm text-brand font-medium hover:underline"
        >
          View all
        </Link>
      </div>
      <Link
        href="/community/stories"
        className="block bg-gradient-to-br from-brand-lighter to-pink/10 rounded-2xl p-6 text-center space-y-3 hover:shadow-sm transition-shadow"
      >
        <p className="text-4xl">✍️</p>
        <p className="text-base font-bold text-brand">Travel Stories</p>
        <p className="text-sm text-gray-600">
          Read and share stories from verified sisters around the world
        </p>
        <span className="inline-block px-4 py-2 bg-brand text-white text-sm rounded-full font-medium">
          Explore stories →
        </span>
      </Link>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("Feed");

  return (
    <AppLayout title="Community">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-10 space-y-4">
        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === tab
                  ? "bg-white text-brand shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Feed" && <FeedTab />}
        {activeTab === "Circles" && <CirclesTab />}
        {activeTab === "Stories" && <StoriesTabPreview />}
      </div>
    </AppLayout>
  );
}
