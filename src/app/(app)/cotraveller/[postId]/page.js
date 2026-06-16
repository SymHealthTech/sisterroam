"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import AppLayout, { useAppUser } from "@/components/layout/AppLayout";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Users,
  Clock,
  MapPin,
  Globe,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Lock,
} from "lucide-react";
import { UnderReviewModal, VerificationRequiredModal } from "@/components/ui/VerificationGate";
import { cn, formatRelativeTime } from "@/lib/utils";

const CATEGORY_LABELS = {
  solo_traveller: "Solo traveller",
  backpacker: "Backpacker",
  cyclist: "Cyclist",
  trekker: "Trekker",
  runner: "Runner",
  ultramarathon: "Ultra runner",
  road_tripper: "Road tripper",
  family_tourist: "Family traveller",
};

const STATUS_CONFIG = {
  open: { label: "Open", cls: "bg-teal-lighter text-teal" },
  filled: { label: "Filled", cls: "bg-brand-lighter text-brand" },
  cancelled: { label: "Cancelled", cls: "bg-gray-100 text-gray-500" },
  expired: { label: "Expired", cls: "bg-gray-100 text-gray-500" },
};

function formatDate(dateStr, flexible) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const fmt = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return flexible ? `Around ${fmt} (flexible)` : fmt;
}

function getFlagEmoji(code) {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => 127397 + c.charCodeAt(0)),
  );
}

function SpotDots({ max, filled }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-3 h-3 rounded-full border-2",
            i < filled ? "bg-brand border-brand" : "bg-white border-gray-300",
          )}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">
        {max - filled} spot{max - filled !== 1 ? "s" : ""} remaining
      </span>
    </div>
  );
}

export default function TripDetailPage({ params }) {
  const { postId } = use(params);
  const { data: session } = useSession();
  const appUser = useAppUser();
  const router = useRouter();
  const userId = session?.user?.id;
  const userTier = appUser?.verificationTier ?? session?.user?.verificationTier;
  const isUnderReview = userTier === 'paid';
  const isBasic = userTier === 'basic';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  function openGate() {
    if (isUnderReview) setShowReviewModal(true);
    else setShowVerifyModal(true);
  }

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/cotraveller/${postId}`);
      if (!res.ok) {
        router.replace("/cotraveller");
        return;
      }
      const json = await res.json();
      setData(json.data);
      setLoading(false);
    }
    if (postId) load();
  }, [postId, router]);

  async function handleApply(e) {
    e.preventDefault();
    if (message.trim().length < 50) {
      toast.error("Message must be at least 50 characters");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/cotraveller/${postId}/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to send interest");
        return;
      }
      setSubmitted(true);
      setData((d) =>
        d
          ? { ...d, hasExpressedInterest: true, userInterestStatus: "pending" }
          : d,
      );
      toast.success("Interest sent!");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AppLayout title="Trip details">
        <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton variant="card" className="h-40" />
          <Skeleton variant="card" className="h-60" />
        </div>
      </AppLayout>
    );
  }

  if (!data) return null;

  const {
    post,
    authorProfile,
    hasExpressedInterest,
    userInterestStatus,
    chatRequestId,
  } = data;
  const author = post.authorId ?? authorProfile ?? {};
  const isOwn =
    author._id?.toString() === userId ||
    post.authorId?._id?.toString() === userId ||
    post.authorId?.toString() === userId;
  const isOpen = post.status === "open";
  const isFull = (post.currentCoTravellers ?? 0) >= (post.maxCoTravellers ?? 1);
  const status = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.expired;

  return (
    <AppLayout title="Trip details">
      {showReviewModal && <UnderReviewModal onClose={() => setShowReviewModal(false)} />}
      {showVerifyModal && <VerificationRequiredModal onClose={() => setShowVerifyModal(false)} />}
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {/* Back */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to trips
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900 flex-wrap">
                <span>
                  {post.fromCity}
                  {post.fromCountryCode &&
                    ` ${getFlagEmoji(post.fromCountryCode)}`}
                </span>
                <span className="text-gray-400 text-base">→</span>
                <span>
                  {post.toCity}
                  {post.toCountryCode && ` ${getFlagEmoji(post.toCountryCode)}`}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{post.title}</p>
            </div>
            <span
              className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium shrink-0",
                status.cls,
              )}
            >
              {status.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand" />
              {formatDate(post.departureDate, post.isFlexibleDates)}
            </div>
            {post.durationDays && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand" />
                {post.durationDays} days
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-gray-400" />
              {post.viewsCount ?? 0} views
            </div>
          </div>

          {(post.travelStyle ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.travelStyle.map((s) => (
                <span
                  key={s}
                  className="text-xs bg-brand-lighter text-brand px-2.5 py-0.5 rounded-full"
                >
                  {CATEGORY_LABELS[s] ?? s}
                </span>
              ))}
            </div>
          )}

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-5 items-start flex-col lg:flex-row">
          {/* Main */}
          <div className="flex-1 space-y-5 w-full">
            {/* Author */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-4">
              <Avatar
                src={author.profilePhotoUrl}
                name={author.fullName}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">
                    {author.fullName}
                  </p>
                  {(author.verificationTier === "verified" || author.verificationTier === "trusted") && (
                    <Badge variant="verified">✓ Verified</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {[author.city, author.country].filter(Boolean).join(", ")}
                  {author.createdAt &&
                    ` · Member since ${new Date(author.createdAt).getFullYear()}`}
                </p>
                {author.languages?.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    <Globe className="w-3 h-3 inline mr-1" />
                    {author.languages.join(", ")}
                  </p>
                )}
                {(author.averageRating > 0 || author.totalStays > 0) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {author.averageRating > 0 &&
                      `★ ${author.averageRating.toFixed(1)} · `}
                    {author.totalStays ?? 0} stay
                    {author.totalStays !== 1 ? "s" : ""}
                  </p>
                )}
                <Link
                  href={`/user/${post.authorId?._id ?? post.authorId}`}
                  className="text-xs text-brand hover:text-brand-dark font-medium mt-1 inline-block"
                >
                  View full profile →
                </Link>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">
                About this trip
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {post.description}
              </p>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Looking for
                </h4>
                <ul className="space-y-1.5 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal shrink-0" />
                    {post.lookingFor?.verifiedOnly
                      ? "Verified members preferred"
                      : "All members welcome"}
                  </li>
                  {(post.lookingFor?.minAge || post.lookingFor?.maxAge) && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal shrink-0" />
                      Age: {post.lookingFor.minAge ?? "18"} –{" "}
                      {post.lookingFor.maxAge ?? "any"}
                    </li>
                  )}
                  {post.lookingFor?.languages?.length > 0 && (
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal shrink-0" />
                      Languages: {post.lookingFor.languages.join(", ")}
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-brand" />
                <SpotDots
                  max={post.maxCoTravellers ?? 1}
                  filled={post.currentCoTravellers ?? 0}
                />
              </div>

              <p className="text-xs text-gray-400">
                <Users className="w-3.5 h-3.5 inline mr-1" />
                {post.interestedCount ?? 0} sisters have expressed interest
              </p>
            </div>
          </div>

          {/* Apply sidebar */}
          <div className="w-full lg:w-80 shrink-0">
            {isOwn ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Your trip post
                </p>
                <Button
                  href={`/cotraveller/${postId}/interests`}
                  variant="primary"
                  fullWidth
                >
                  View interests ({post.interestedCount ?? 0})
                </Button>
                <Button
                  href={`/cotraveller/${postId}/interests`}
                  variant="ghost"
                  fullWidth
                  size="sm"
                >
                  Manage trip
                </Button>
              </div>
            ) : !isOpen || isFull ? (
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                <p className="text-sm font-medium text-gray-500 text-center">
                  This trip is no longer accepting co-travellers
                </p>
              </div>
            ) : hasExpressedInterest ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <p className="text-sm font-semibold text-gray-800">
                  Your application
                </p>
                {userInterestStatus === "pending" && (
                  <div className="flex items-center gap-2 p-3 bg-amber-lighter rounded-xl">
                    <Clock className="w-4 h-4 text-amber shrink-0" />
                    <p className="text-sm text-amber-dark">
                      Your interest is pending review
                    </p>
                  </div>
                )}
                {userInterestStatus === "accepted" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-teal-lighter rounded-xl">
                      <CheckCircle className="w-4 h-4 text-teal shrink-0" />
                      <p className="text-sm text-teal-dark font-medium">
                        You are matched!
                      </p>
                    </div>
                    {chatRequestId && (
                      <Button
                        href={`/messages/${chatRequestId}`}
                        variant="primary"
                        fullWidth
                      >
                        Open chat
                      </Button>
                    )}
                  </div>
                )}
                {userInterestStatus === "declined" && (
                  <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
                    <p className="text-sm text-gray-500">
                      Not matched this time — keep exploring!
                    </p>
                  </div>
                )}
              </div>
            ) : (isUnderReview || isBasic) ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-800">
                  Join this trip
                </h3>
                <button
                  type="button"
                  onClick={openGate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <Lock className="w-4 h-4 text-brand/40" />
                  Express interest
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-800">
                  Join this trip
                </h3>
                <form onSubmit={handleApply} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Introduce yourself and why you want to join this trip
                    </label>
                    <textarea
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={500}
                      placeholder={`Tell ${author.fullName?.split(" ")[0] ?? "her"} about yourself, your travel experience, and what you are hoping to experience on this journey...`}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-0/30 transition resize-none"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        Min 50 characters
                      </span>
                      <span className="text-xs text-gray-400">
                        {message.length}/500
                      </span>
                    </div>
                  </div>
                  {submitted ? (
                    <div className="flex items-center gap-2 p-3 bg-teal-lighter rounded-xl">
                      <CheckCircle className="w-4 h-4 text-teal" />
                      <p className="text-sm text-teal-dark">
                        Interest sent! {author.fullName?.split(" ")[0]} will be
                        in touch.
                      </p>
                    </div>
                  ) : (
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      loading={submitting}
                      disabled={message.trim().length < 50}
                    >
                      <MessageSquare className="w-4 h-4 mr-1.5" />
                      Express interest
                    </Button>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
