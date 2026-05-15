"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import AppLayout, { useAppUser } from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import TripPostCard from "@/components/cotraveller/TripPostCard";
import PostTripModal from "@/components/cotraveller/PostTripModal";
import { UnderReviewModal } from "@/components/ui/VerificationGate";
import {
  Search,
  SlidersHorizontal,
  UserPlus,
  Users,
  Heart,
  X,
  Check,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Browse trips", "My posts", "My interests"];

const TRAVELLER_FILTERS = [
  { value: "backpacker", label: "Backpacker" },
  { value: "cyclist", label: "Cyclist" },
  { value: "trekker", label: "Trekker" },
  { value: "runner", label: "Runner" },
  { value: "solo_traveller", label: "Solo traveller" },
  { value: "road_tripper", label: "Road tripper" },
];

const STATUS_COLORS = {
  open: "bg-teal-lighter text-teal",
  filled: "bg-brand-lighter text-brand",
  cancelled: "bg-gray-100 text-gray-500",
  expired: "bg-gray-100 text-gray-500",
};

function MyPostCard({ post, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleDelete() {
    setMenuOpen(false);
    if (!window.confirm("Delete this trip post? This cannot be undone."))
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/cotraveller/${post._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to delete trip");
        return;
      }
      toast.success("Trip deleted");
      onDelete?.(post._id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {post.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {post.fromCity} → {post.toCity} ·{" "}
          {post.departureDate
            ? new Date(post.departureDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })
            : ""}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-medium",
              STATUS_COLORS[post.status] ?? STATUS_COLORS.expired,
            )}
          >
            {post.status?.charAt(0).toUpperCase() + post.status?.slice(1)}
          </span>
          <span className="text-xs text-gray-400">
            <Heart className="w-3 h-3 inline mr-0.5" />
            {post.interestedCount ?? 0} interested
          </span>
        </div>
      </div>
      <div className="relative shrink-0 mt-1" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          disabled={deleting}
          className="flex items-center gap-1 text-xs text-brand font-medium hover:text-brand-dark"
        >
          Manage trip
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform",
              menuOpen && "rotate-180",
            )}
          />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 w-40 overflow-hidden">
            <Link
              href={`/cotraveller/${post._id}/interests`}
              onClick={() => setMenuOpen(false)}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Users className="w-3.5 h-3.5" />
              View interests
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEdit?.(post);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit trip
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete trip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EditTripModal({ post, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: post.title ?? "",
    description: post.description ?? "",
    departureDate: post.departureDate
      ? post.departureDate.split("T")[0]
      : "",
    isFlexibleDates: post.isFlexibleDates ?? false,
    status: post.status ?? "open",
  });
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cotraveller/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update trip");
        return;
      }
      toast.success("Trip updated!");
      onSaved?.();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Edit trip</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title
            </label>
            <input
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Departure date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
              value={form.departureDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, departureDate: e.target.value }))
              }
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFlexibleDates}
              onChange={(e) =>
                setForm((f) => ({ ...f, isFlexibleDates: e.target.checked }))
              }
              className="w-4 h-4 rounded accent-brand"
            />
            <span className="text-sm text-gray-700">Flexible dates</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Status
            </label>
            <div className="flex gap-2">
              {["open", "filled", "cancelled"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, status: s }))}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm border capitalize transition-colors",
                    form.status === s
                      ? "bg-brand text-white border-brand"
                      : "border-gray-200 text-gray-600 hover:border-brand",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <span className="text-xs text-gray-400">
                {form.description.length}/1500
              </span>
            </div>
            <textarea
              rows={5}
              maxLength={1500}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition resize-none"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={loading}
            onClick={handleSave}
          >
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function InterestCard({ item }) {
  const post = item.postId ?? {};
  const author = post.authorId ?? {};

  const statusConfig = {
    pending: { label: "Pending", cls: "bg-amber-lighter text-amber-dark" },
    accepted: { label: "Matched!", cls: "bg-teal-lighter text-teal" },
    declined: { label: "Not matched", cls: "bg-gray-100 text-gray-500" },
  }[item.status] ?? { label: item.status, cls: "bg-gray-100 text-gray-500" };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {post.fromCity} → {post.toCity}
          </p>
          <p className="text-xs text-gray-500">
            by {author.fullName} ·{" "}
            {post.departureDate
              ? new Date(post.departureDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })
              : ""}
          </p>
        </div>
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0",
            statusConfig.cls,
          )}
        >
          {statusConfig.label}
        </span>
      </div>
      <p className="text-xs text-gray-500 italic line-clamp-2">
        &quot;{item.message}&quot;
      </p>
      {item.status === "accepted" && item.chatRequestId && (
        <Link
          href={`/messages/${item.chatRequestId}`}
          className="text-xs text-brand font-medium hover:text-brand-dark"
        >
          Open chat →
        </Link>
      )}
    </div>
  );
}

export default function CoTravellerPage() {
  const { data: session } = useSession();
  const appUser = useAppUser();
  const userTier = (appUser ?? session?.user)?.verificationTier;

  const isVerified = userTier === "verified" || userTier === "trusted";
  const isUnderReview = userTier === "paid";
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [activeTab, setActiveTab] = useState(0);
  const swipeStart = useRef(null);

  const [showModal, setModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const [posts, setPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [myInterests, setMyInterests] = useState({
    pending: [],
    accepted: [],
    declined: [],
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: "",
    travelStyle: "",
    verifiedOnly: true,
  });

  const fetchPosts = useCallback(
    async (p = 1, f = filters) => {
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: "12",
          status: "open",
        });
        if (f.search) params.set("toCity", f.search);
        if (f.travelStyle) params.set("travelStyle", f.travelStyle);
        if (f.verifiedOnly) params.set("verifiedOnly", "true");

        const res = await fetch(`/api/cotraveller?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        if (p === 1) setPosts(data.data?.posts ?? []);
        else setPosts((prev) => [...prev, ...(data.data?.posts ?? [])]);
        setTotal(data.data?.total ?? 0);
        setPage(p);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  const fetchMyPosts = useCallback(async () => {
    const res = await fetch("/api/cotraveller/my-posts");
    if (res.ok) {
      const data = await res.json();
      setMyPosts(data.data ?? []);
    }
  }, []);

  const fetchMyInterests = useCallback(async () => {
    const res = await fetch("/api/cotraveller/my-interests");
    if (res.ok) {
      const data = await res.json();
      setMyInterests(data.data ?? { pending: [], accepted: [], declined: [] });
    }
  }, []);

  // Initial mount: load tab-0 data inline so the linter can see setState only fires after real awaits
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "12",
          status: "open",
          verifiedOnly: "true",
        });
        const res = await fetch(`/api/cotraveller?${params}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) {
          setPosts(data.data?.posts ?? []);
          setTotal(data.data?.total ?? 0);
          setPage(1);
          setLoading(false);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSwipeTouchStart(e) {
    swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleSwipeTouchEnd(e) {
    if (!swipeStart.current) return;
    const dx = e.changedTouches[0].clientX - swipeStart.current.x;
    const dy = e.changedTouches[0].clientY - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) * 0.5) return;
    if (dx < 0) handleTabChange(Math.min(activeTab + 1, TABS.length - 1));
    else handleTabChange(Math.max(activeTab - 1, 0));
  }

  function handleTabChange(i) {
    setActiveTab(i);
    if (i === 0) {
      setLoading(true);
      fetchPosts(1, filters);
    } else if (i === 1) fetchMyPosts();
    else if (i === 2) fetchMyInterests();
  }

  function applyFilters() {
    setShowFilters(false);
    setLoading(true);
    fetchPosts(1, filters);
  }

  function clearFilters() {
    const f = { search: "", travelStyle: "", verifiedOnly: true };
    setFilters(f);
    setLoading(true);
    fetchPosts(1, f);
  }

  const hasFilters = filters.search || filters.travelStyle;

  return (
    <AppLayout title="Find a co-traveller">
      {/* Hero */}
      <div className="bg-gradient-to-r from-brand-lighter to-brand/10 px-5 py-8 text-center">
        <UserPlus className="w-8 h-8 text-brand mx-auto mb-2" />
        <h1 className="text-xl font-bold text-gray-900">
          Find your travel companion
        </h1>
        <p className="text-sm text-gray-600 mt-1 max-w-sm mx-auto">
          Connect with verified sisters who share your destination. Travel
          together, explore fearlessly.
        </p>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex overflow-x-auto scrollbar-hide max-w-3xl mx-auto">
          {TABS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => handleTabChange(i)}
              className={cn(
                "shrink-0 sm:flex-1 px-5 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                activeTab === i
                  ? "border-brand text-brand"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="max-w-3xl mx-auto px-4 py-5 space-y-4"
        onTouchStart={handleSwipeTouchStart}
        onTouchEnd={handleSwipeTouchEnd}
      >
        {/* ── Browse trips tab ── */}
        {activeTab === 0 && (
          <>
            {/* Search + filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by destination city..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, search: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && fetchPosts(1, filters)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-0/30 "
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((f) => !f)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors",
                  showFilters || hasFilters
                    ? "bg-brand text-white border-brand"
                    : "border-gray-200 text-gray-600 hover:border-brand",
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Travel style
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TRAVELLER_FILTERS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setFilters((f) => ({
                            ...f,
                            travelStyle: f.travelStyle === value ? "" : value,
                          }))
                        }
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs border transition-colors",
                          filters.travelStyle === value
                            ? "bg-brand text-white border-brand"
                            : "border-gray-200 text-gray-600 hover:border-brand",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-teal flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-sm text-gray-700">
                    Verified members only
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={applyFilters}>
                    Apply filters
                  </Button>
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="w-3.5 h-3.5 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Results count */}
            {!loading && (
              <p className="text-xs text-gray-500">
                {total} open trip{total !== 1 ? "s" : ""} found
              </p>
            )}

            {/* Trip cards */}
            {loading && page === 1 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <TripPostCard.Skeleton key={i} />
                ))}
              </div>
            ) : posts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {posts.map((post) => (
                    <TripPostCard
                      key={post._id}
                      post={post}
                      currentUserTier={userTier}
                      currentUserId={session?.user?.id}
                      onEdit={(p) => setEditingPost(p)}
                      onDelete={(id) =>
                        setPosts((prev) => prev.filter((p) => p._id !== id))
                      }
                    />
                  ))}
                </div>
                {posts.length < total && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={loading}
                      onClick={() => {
                        setLoading(true);
                        fetchPosts(page + 1, filters);
                      }}
                    >
                      Load more trips
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 space-y-3">
                <Users className="w-10 h-10 text-gray-200 mx-auto" />
                <p className="text-sm font-medium text-gray-500">
                  No trips posted yet for this destination
                </p>
                <p className="text-xs text-gray-400">
                  Be the first to post your trip plan
                </p>
                {isVerified ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setModal(true)}
                  >
                    Post a trip
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReviewModal(true)}
                  >
                    Post a trip
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* ── My posts tab ── */}
        {activeTab === 1 && (
          <div className="space-y-4" id="my-activity">
            {(isVerified || isUnderReview) && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    {myPosts.length} trip{myPosts.length !== 1 ? "s" : ""}{" "}
                    posted
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => isVerified ? setModal(true) : setShowReviewModal(true)}
                  >
                    + Post a new trip
                  </Button>
                </div>
                {myPosts.length > 0 ? (
                  <div className="space-y-3">
                    {myPosts.map((post) => (
                      <MyPostCard
                        key={post._id}
                        post={post}
                        onEdit={(p) => setEditingPost(p)}
                        onDelete={(id) =>
                          setMyPosts((prev) =>
                            prev.filter((p) => p._id !== id),
                          )
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <UserPlus className="w-10 h-10 text-gray-200 mx-auto" />
                    <p className="text-sm text-gray-500">
                      You haven&apos;t posted any trips yet
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => isVerified ? setModal(true) : setShowReviewModal(true)}
                    >
                      Post your first trip
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── My interests tab ── */}
        {activeTab === 2 && (
          <div className="space-y-6">
            {["pending", "accepted", "declined"].map((status) => {
              const items = myInterests[status] ?? [];
              if (items.length === 0) return null;
              const label = {
                pending: "Pending",
                accepted: "Accepted",
                declined: "Not matched",
              }[status];
              return (
                <section key={status}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {label} ({items.length})
                  </h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <InterestCard key={item._id} item={item} />
                    ))}
                  </div>
                </section>
              );
            })}
            {Object.values(myInterests).every((a) => a.length === 0) && (
              <div className="text-center py-12 space-y-3">
                <Heart className="w-10 h-10 text-gray-200 mx-auto" />
                <p className="text-sm text-gray-500">
                  You haven&apos;t expressed interest in any trips yet
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab(0)}
                >
                  Browse trips →
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {showReviewModal && <UnderReviewModal onClose={() => setShowReviewModal(false)} />}
      {showModal && isVerified && (
        <PostTripModal
          onClose={() => setModal(false)}
          onCreated={() => {
            setLoading(true);
            fetchPosts(1, filters);
            fetchMyPosts();
          }}
        />
      )}
      {editingPost && (
        <EditTripModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSaved={() => {
            fetchMyPosts();
            setEditingPost(null);
          }}
        />
      )}
    </AppLayout>
  );
}
