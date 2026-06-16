"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import AppLayout from "@/components/layout/AppLayout";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import StarRating from "@/components/ui/StarRating";
import Toggle from "@/components/ui/Toggle";
import ImageUpload from "@/components/ui/ImageUpload";
import StoryCard from "@/components/stories/StoryCard";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import {
  Camera,
  Edit2,
  MapPin,
  Globe,
  Shield,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  BedDouble,
  Users,
  BookOpen,
  PenSquare,
  MessageSquare,
  Star,
  Award,
  Plane,
  Clock,
  Lock,
} from "lucide-react";
import { VerificationRequiredModal } from "@/components/ui/VerificationGate";

/* ── Completeness ─────────────────────────────────────────── */

function getCompleteness(user, verifData) {
  const verif = verifData?.verification;
  const checks = [
    {
      label: "Add a profile photo",
      done: !!user.profilePhotoUrl,
      href: "/profile/edit",
    },
    {
      label: "Write a bio (50+ chars)",
      done: (user.bio?.length ?? 0) >= 50,
      href: "/profile/edit",
    },
    {
      label: "Add countries visited",
      done: (user.countriesVisited?.length ?? 0) > 0,
      href: "/profile/edit",
    },
    {
      label: "Set your traveller style",
      done: (user.travellerCategories?.length ?? 0) > 0,
      href: "/profile/edit",
    },
    {
      label: "Add emergency contact",
      done: !!user.emergencyContactName,
      href: "/profile/edit",
    },
    {
      label: "Verify government ID",
      done: verif?.status === "approved" || verif?.status === "pending",
      href: "/onboarding/verify",
    },
    {
      label: "Record video intro",
      done:
        !!verif?.selfieVideoUrl ||
        verif?.status === "approved" ||
        user.verificationTier !== "basic",
      href: "/onboarding/verify",
    },
  ];
  const done = checks.filter((c) => c.done).length;
  return { checks, pct: Math.round((done / checks.length) * 100) };
}

/* ── Tier helpers ─────────────────────────────────────────── */

const TIER_LABEL = {
  basic: "Basic",
  verified: "Verified",
  trusted: "Trusted Sister",
};
const TIER_BADGE = { basic: "basic", verified: "verified", trusted: "trusted" };
const ROLE_LABEL = {
  guest: "Traveller",
  host: "Host",
  both: "Host & Traveller",
};

/* ── Sub-components ──────────────────────────────────────── */

function ReviewCard({ review }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Avatar
          src={review.reviewerId?.profilePhotoUrl}
          name={review.reviewerId?.fullName}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 leading-snug">
            {review.reviewerId?.fullName ?? "Anonymous"}
          </p>
          <p className="text-xs text-gray-400">
            {formatDate(review.publishedAt)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Star className="w-3.5 h-3.5 fill-amber text-amber" />
          <span className="text-sm font-semibold text-gray-900">
            {review.overallRating}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4 p-4 lg:p-6">
      <Skeleton variant="card" className="h-40 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton variant="card" className="h-48 w-full" />
      <Skeleton variant="card" className="h-32 w-full" />
    </div>
  );
}

/* ── Hosting summary card (in Hosting tab) ───────────────── */

function HostingTab({ host, onToggle, onCreateListing }) {
  if (!host)
    return (
      <div className="text-center py-12">
        <BedDouble className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 mb-4">
          You haven&apos;t set up a host listing yet.
        </p>
        {onCreateListing ? (
          <Button onClick={onCreateListing}>Create host listing</Button>
        ) : (
          <Button href="/profile/host-listing">Create host listing</Button>
        )}
      </div>
    );

  const TYPE_LABELS = {
    private_room: "Private room",
    shared_room: "Shared room",
    couch: "Couch",
    floor_space: "Floor space",
    tent_space: "Tent space",
  };
  const OFFERING_LABELS = {
    bed: "Bed",
    breakfast: "Breakfast",
    dinner: "Home dinner",
    city_guide: "City tour",
    airport_pickup: "Airport pickup",
    laundry: "Laundry",
    wifi: "Wi-Fi",
    bicycle: "Bicycle",
  };

  return (
    <div className="space-y-4">
      {/* Status toggles */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4">
        <Toggle
          checked={host.isAcceptingGuests}
          onChange={(v) => onToggle("isAcceptingGuests", v)}
          label="Currently accepting guests"
          description="Turn off to temporarily pause requests"
        />
        <div className="border-t border-gray-100" />
        <Toggle
          checked={host.isListingActive}
          onChange={(v) => onToggle("isListingActive", v)}
          label="Show in search results"
          description="Hide your listing from browse entirely"
        />
      </div>

      {/* Listing summary */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Listing details
          </h3>
          <Link
            href="/profile/host-listing"
            className="text-xs text-brand font-medium hover:underline flex items-center gap-0.5"
          >
            Edit <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Accommodation</p>
            <p className="font-medium text-gray-900">
              {TYPE_LABELS[host.accommodationType] ?? host.accommodationType}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Max guests</p>
            <p className="font-medium text-gray-900">{host.maxGuests}</p>
          </div>
          {host.femaleOnly && (
            <div className="col-span-2">
              <Badge variant="female">Female guests only</Badge>
            </div>
          )}
        </div>
        {host.freeOfferings?.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Free offerings</p>
            <div className="flex flex-wrap gap-1.5">
              {host.freeOfferings.map((o) => (
                <span
                  key={o}
                  className="px-2 py-0.5 bg-teal-lighter text-teal text-xs rounded-full font-medium"
                >
                  {OFFERING_LABELS[o] ?? o}
                </span>
              ))}
            </div>
          </div>
        )}
        {host.houseRules && (
          <div>
            <p className="text-xs text-gray-400 mb-1">House rules</p>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {host.houseRules}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────── */

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [host, setHost] = useState(null);
  const [verifData, setVerifData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myStories, setMyStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");
  const [photoModal, setPhotoModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/hosts/mine").then((r) => r.json()),
      fetch("/api/verification/status").then((r) => r.json()),
    ])
      .then(([userRes, hostRes, verifRes]) => {
        if (userRes.success) setUser(userRes.data);
        if (hostRes.success) setHost(hostRes.data);
        if (verifRes.success) setVerifData(verifRes.data);
      })
      .finally(() => setLoading(false));
  }, [session]);

  const fetchReviews = useCallback(
    async (page = 1) => {
      if (!user?._id) return;
      setReviewsLoading(true);
      try {
        const res = await fetch(
          `/api/reviews?revieweeId=${user._id}&page=${page}&limit=5`,
        );
        const data = await res.json();
        if (data.success) {
          setReviews((prev) =>
            page === 1 ? data.data.reviews : [...prev, ...data.data.reviews],
          );
          setReviewsTotal(data.data.total);
          setReviewPage(page);
        }
      } finally {
        setReviewsLoading(false);
      }
    },
    [user?._id],
  );

  function handleTabChange(tabId) {
    setActiveTab(tabId);
    if (tabId === "reviews" && user?._id && reviews.length === 0) {
      fetchReviews(1);
    }
    if (tabId === "blog" && myStories.length === 0) {
      fetch("/api/stories/my-stories")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setMyStories(d.data?.stories ?? []);
        });
    }
  }

  async function handleHostToggle(field, value) {
    if (!host?._id) return;
    const prev = { ...host };
    setHost((h) => ({ ...h, [field]: value }));
    try {
      const res = await fetch(`/api/hosts/${host._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        setHost(prev);
        toast.error("Failed to update");
      }
    } catch {
      setHost(prev);
      toast.error("Network error");
    }
  }

  async function handlePhotoUpdate({ url, publicId }) {
    setUser((u) => ({ ...u, profilePhotoUrl: url }));
    setPhotoModal(false);
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profilePhotoUrl: url,
        profilePhotoPublicId: publicId,
      }),
    });
  }

  if (loading)
    return (
      <AppLayout title="Profile">
        <ProfileSkeleton />
      </AppLayout>
    );
  if (!user) return null;

  const isBasic = user.verificationTier === "basic";
  const { checks, pct } = getCompleteness(user, verifData);
  const missing = checks.filter((c) => !c.done);
  const verif = verifData?.verification;
  const isHost = user.role === "host" || user.role === "both";
  const TABS = [
    { id: "about", label: "About" },
    ...(isHost ? [{ id: "hosting", label: "Hosting" }] : []),
    { id: "reviews", label: `Reviews (${user.totalReviews ?? 0})` },
    { id: "blog", label: "Stories" },
  ];
  const memberSince = formatDate(user.createdAt);

  return (
    <AppLayout title="My Profile">
      <div className="max-w-5xl mx-auto px-4 py-6 lg:px-6">
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6">
          {/* ── Left column ───────────────────────────────── */}
          <div className="space-y-4">
            {/* Profile header card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              {/* Desktop: row; Mobile: centered column */}
              <div className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:text-left lg:gap-5">
                {/* Avatar with edit overlay */}
                <div className="relative shrink-0 mb-4 lg:mb-0">
                  <div className="relative">
                    <Avatar
                      src={user.profilePhotoUrl}
                      name={user.fullName}
                      size="xl"
                    />
                    <button
                      onClick={() => setPhotoModal(true)}
                      className="absolute bottom-0 right-0 w-7 h-7 bg-brand rounded-full flex items-center justify-center shadow-md hover:bg-brand-dark transition-colors"
                      aria-label="Change photo"
                    >
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-gray-900">
                    {user.fullName}
                  </h1>
                  {user.age && (
                    <p className="text-sm text-gray-500">Age {user.age}</p>
                  )}

                  {(user.city || user.country) && (
                    <div className="flex items-center justify-center lg:justify-start gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-600">
                        {[user.city, user.country].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-2">
                    <Badge
                      variant={TIER_BADGE[user.verificationTier ?? "basic"]}
                    >
                      <Shield className="w-3 h-3" />
                      {TIER_LABEL[user.verificationTier ?? "basic"]}
                    </Badge>
                    {!isBasic && (
                      <Badge variant="basic">
                        {ROLE_LABEL[user.role ?? "guest"]}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-2 flex items-center justify-center lg:justify-start gap-1">
                    <Clock className="w-3 h-3" /> Member since {memberSince}
                  </p>

                  {/* Social links */}
                  {(user.instagramUrl ||
                    user.linkedinUrl ||
                    user.facebookUrl) && (
                    <div className="flex items-center justify-center lg:justify-start gap-3 mt-3">
                      {user.instagramUrl && (
                        <a
                          href={user.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-pink transition-colors"
                          aria-label="Instagram"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                      {user.linkedinUrl && (
                        <a
                          href={user.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-brand transition-colors"
                          aria-label="LinkedIn"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                      {user.facebookUrl && (
                        <a
                          href={user.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-brand transition-colors"
                          aria-label="Facebook"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Stats (right-aligned desktop, centered mobile) */}
                <div className="flex items-center justify-center gap-6 mt-4 lg:mt-0 lg:shrink-0 lg:flex-col lg:items-end lg:gap-3">
                  <div className="text-center lg:text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {user.totalStays ?? 0}
                    </p>
                    <p className="text-xs text-gray-400">Stays</p>
                  </div>
                  <div className="text-center lg:text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {user.totalReviews ?? 0}
                    </p>
                    <p className="text-xs text-gray-400">Reviews</p>
                  </div>
                  <div className="text-center lg:text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {myStories.length}
                    </p>
                    <p className="text-xs text-gray-400">Posts</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification alert */}
            {user.verificationTier === "basic" &&
              verif?.status !== "approved" &&
              (verif?.status === "pending" ? (
                <div className="bg-teal-lighter/40 border border-teal/20 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-teal shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-teal-dark">
                        Verification under review
                      </p>
                      <p className="text-xs text-teal-dark/80 mt-0.5">
                        Our team is reviewing your documents. We&apos;ll notify
                        you within 24 to 48 hours.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-lighter border border-amber/20 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-dark">
                        Get verified to unlock full access
                      </p>
                      <p className="text-xs text-amber-dark/80 mt-0.5">
                        Verification unlocks hosting requests and full community
                        access
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                        {[
                          {
                            label: "Email",
                            done: verifData?.user?.emailVerified,
                          },
                          {
                            label: "Phone",
                            done: verifData?.user?.phoneVerified,
                          },
                          { label: "ID", done: verif?.idDocumentUrl },
                          { label: "Video", done: verif?.selfieVideoUrl },
                        ].map((step) => (
                          <div
                            key={step.label}
                            className="flex items-center gap-1 text-xs"
                          >
                            {step.done ? (
                              <Check className="w-3 h-3 text-teal" />
                            ) : (
                              <div className="w-3 h-3 rounded-full border border-amber/50" />
                            )}
                            <span
                              className={cn(
                                step.done
                                  ? "text-teal font-medium"
                                  : "text-amber-dark/70",
                              )}
                            >
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                      <Link
                        href="/onboarding/verify"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-dark underline-offset-2 hover:underline mt-3"
                      >
                        Continue verification{" "}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

            {/* Tabs */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "flex-1 min-w-max px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                      activeTab === tab.id
                        ? "border-brand text-brand"
                        : "border-transparent text-gray-500 hover:text-gray-700",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {/* About tab */}
                {activeTab === "about" && (
                  <div className="space-y-5">
                    {user.bio ? (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          About
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {user.bio}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        No bio added yet.
                      </p>
                    )}

                    {user.languages?.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Languages
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {user.languages.map((l) => (
                            <span
                              key={l}
                              className="px-2.5 py-1 bg-brand-lighter text-brand text-xs rounded-full font-medium"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {user.countriesVisited?.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Countries visited ({user.countriesVisited.length})
                        </h3>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                          {user.countriesVisited.map((c) => (
                            <span
                              key={c}
                              className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 text-xs text-gray-700 rounded-full"
                            >
                              <Globe className="w-3 h-3 text-gray-400" /> {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {user.travellerCategories?.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Travel style
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {user.travellerCategories.map((c) => (
                            <span
                              key={c}
                              className="px-2.5 py-1 bg-pink-lighter text-pink-dark text-xs rounded-full font-medium capitalize"
                            >
                              {c.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {user.hobbies?.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Hobbies & interests
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {user.hobbies.map((h) => (
                            <span
                              key={h}
                              className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button variant="secondary" href="/profile/edit" size="sm">
                      <Edit2 className="w-3.5 h-3.5" /> Edit profile
                    </Button>
                  </div>
                )}

                {/* Hosting tab */}
                {activeTab === "hosting" && (
                  <HostingTab
                    host={host}
                    onToggle={handleHostToggle}
                    onCreateListing={isBasic ? () => setShowVerifyModal(true) : undefined}
                  />
                )}

                {/* Reviews tab */}
                {activeTab === "reviews" && (
                  <div className="space-y-4">
                    {user.averageRating > 0 && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-gray-900">
                            {user.averageRating.toFixed(1)}
                          </p>
                          <div className="flex items-center justify-center gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={cn(
                                  "w-3.5 h-3.5",
                                  s <= Math.round(user.averageRating)
                                    ? "fill-amber text-amber"
                                    : "text-gray-200",
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {user.totalReviews} review
                            {user.totalReviews !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    )}
                    {reviewsLoading && reviews.length === 0 ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <Skeleton key={i} variant="card" className="h-28" />
                        ))}
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-10">
                        <Star className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No reviews yet</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {reviews.map((r) => (
                            <ReviewCard key={r._id} review={r} />
                          ))}
                        </div>
                        {reviews.length < reviewsTotal && (
                          <Button
                            variant="ghost"
                            fullWidth
                            loading={reviewsLoading}
                            onClick={() => fetchReviews(reviewPage + 1)}
                          >
                            Load more reviews
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Stories tab */}
                {activeTab === "blog" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">
                        My stories
                      </h3>
                      {["verified", "trusted"].includes(
                        session?.user?.verificationTier,
                      ) && (
                        <Button
                          href="/community/stories/new"
                          size="sm"
                          variant="secondary"
                        >
                          <PenSquare className="w-3.5 h-3.5" /> Share story
                        </Button>
                      )}
                    </div>
                    {!["verified", "trusted"].includes(
                      session?.user?.verificationTier,
                    ) && (
                      <div className="p-3 bg-amber-lighter/40 border border-amber/20 rounded-xl text-xs text-amber-dark">
                        Get verified to share travel stories with the community.{" "}
                        <Link
                          href="/profile/verification"
                          className="underline font-medium"
                        >
                          Get verified →
                        </Link>
                      </div>
                    )}
                    {myStories.length === 0 ? (
                      <div className="text-center py-10">
                        <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No stories yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Share your travel experiences with the community
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {myStories.map((s) => (
                          <div key={s._id} className="relative">
                            <StoryCard story={s} variant="compact" />
                            {!s.isPublished && (
                              <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber text-white text-[10px] font-bold rounded-full">
                                Draft
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right sidebar (desktop only) ───────────────── */}
          <div className="hidden lg:flex flex-col gap-4 mt-0">
            {/* Completeness card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Profile strength
                </h3>
                <span className="text-sm font-bold text-brand">{pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {missing.length > 0 ? (
                <ul className="space-y-2">
                  {missing.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="flex items-center gap-2 text-xs text-gray-600 hover:text-brand transition-colors group"
                      >
                        <div className="w-4 h-4 rounded-full border-2 border-gray-200 group-hover:border-brand transition-colors shrink-0" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-teal font-medium flex items-center gap-1">
                  <Check className="w-4 h-4" /> Profile complete!
                </p>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Quick actions
              </h3>
              {[
                { label: "Edit profile", href: "/profile/edit", icon: Edit2 },
                {
                  label: "Verification",
                  href: isBasic ? "/onboarding/verify" : "/profile/verification",
                  icon: Shield,
                },
                {
                  label: isHost ? "Host listing" : "Become a host",
                  href: isBasic ? null : "/profile/host-listing",
                  onClick: isBasic ? () => setShowVerifyModal(true) : null,
                  icon: BedDouble,
                },
                { label: "Settings", href: "/profile/settings", icon: null },
              ].map(({ label, href, icon: Icon, onClick }) => {
                const cls = "flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700 w-full text-left"
                return onClick ? (
                  <button key={label} type="button" onClick={onClick} className={cls}>
                    {Icon && <Icon className="w-4 h-4 text-gray-400" />}
                    {label}
                    <Lock className="w-3.5 h-3.5 text-gray-300 ml-auto" />
                  </button>
                ) : (
                  <Link key={href} href={href} className={cls}>
                    {Icon && <Icon className="w-4 h-4 text-gray-400" />}
                    {label}
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto" />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Mobile completeness card (below tabs) */}
        <div className="lg:hidden mt-4 bg-white border border-gray-100 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Complete your profile
            </h3>
            <span className="text-sm font-bold text-brand">{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-brand rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          {missing.slice(0, 3).map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-2 text-xs text-gray-500 py-1.5 hover:text-brand"
            >
              <div className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {showVerifyModal && <VerificationRequiredModal onClose={() => setShowVerifyModal(false)} />}

      {/* Photo modal */}
      {photoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setPhotoModal(false)}
          />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h2 className="font-semibold text-gray-900">
              Update profile photo
            </h2>
            <ImageUpload
              currentImageUrl={user.profilePhotoUrl}
              name={user.fullName}
              onUploadComplete={handlePhotoUpdate}
            />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
