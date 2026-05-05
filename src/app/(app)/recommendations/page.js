"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import AppLayout, { useAppUser } from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import VerificationGate from "@/components/ui/VerificationGate";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import RecommendationCard from "@/components/recommendations/RecommendationCard";
import AddRecommendationModal from "@/components/recommendations/AddRecommendationModal";
import AskQuestionModal from "@/components/recommendations/AskQuestionModal";
import {
  Search,
  MapPin,
  MessageSquare,
  CheckCircle,
  ThumbsUp,
  ChevronUp,
  ChevronDown,
  PlusCircle,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

const TABS = ["Recommendations", "Questions & Answers", "My contributions"];
const CATEGORIES = [
  { value: "", label: "All" },
  { value: "stay", label: "Stay" },
  { value: "food", label: "Food" },
  { value: "transport", label: "Transport" },
  { value: "safety", label: "Safety" },
  { value: "activity", label: "Activity" },
  { value: "general", label: "General" },
];
const SORT_OPTIONS = [
  { value: "upvotes", label: "Most helpful" },
  { value: "newest", label: "Newest" },
  { value: "verified_first", label: "Verified first" },
];

async function apiFetchRecs(page, { category, sort, search }) {
  const params = new URLSearchParams({ page: String(page), limit: "15", sort });
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  const res = await fetch(`/api/recommendations?${params}`);
  if (!res.ok) return null;
  return (await res.json()).data;
}

async function apiFetchQs(page, { search, category }) {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("city", search);
  if (category) params.set("category", category);
  const res = await fetch(`/api/recommendations/questions?${params}`);
  if (!res.ok) return null;
  return (await res.json()).data;
}

function QuestionCard({
  question,
  userId,
  isVerified,
  verifPending,
  verifApproved,
  onAnswered,
}) {
  const [expanded, setExpanded] = useState(false);
  const [answers, setAnswers] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const author = question.authorId ?? {};

  async function toggleExpand() {
    setExpanded((e) => !e);
    if (!expanded && answers === null) {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/recommendations/questions/${question._id}`,
        );
        if (res.ok) {
          const data = await res.json();
          setAnswers(data.data?.answers ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleAnswer(e) {
    e.preventDefault();
    if (answerText.trim().length < 30) {
      toast.error("Answer must be at least 30 characters");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/recommendations/questions/${question._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: answerText }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed");
        return;
      }
      setAnswers((a) => [data.data, ...(a ?? [])]);
      setAnswerText("");
      onAnswered?.();
      toast.success("Answer posted!");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkAccepted(answerId) {
    const res = await fetch(`/api/recommendations/questions/${question._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answerId }),
    });
    if (res.ok) {
      setAnswers((a) =>
        a?.map((ans) => ({ ...ans, isAccepted: ans._id === answerId })),
      );
      toast.success("Marked as best answer!");
    }
  }

  async function handleUpvoteAnswer(answerId) {
    const res = await fetch(
      `/api/recommendations/questions/${question._id}/answers/${answerId}/upvote`,
      { method: "POST" },
    );
    if (res.ok) {
      const data = await res.json();
      setAnswers((a) =>
        a?.map((ans) =>
          ans._id === answerId
            ? {
                ...ans,
                upvoteCount: data.data.upvoteCount,
                hasUpvoted: data.data.upvoted,
              }
            : ans,
        ),
      );
    }
  }

  const isMyQuestion =
    author._id?.toString() === userId || author.toString?.() === userId;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Question header */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Avatar
              src={author.profilePhotoUrl}
              name={author.fullName}
              size="xs"
            />
            <span className="text-xs text-gray-600 font-medium">
              {author.fullName}
            </span>
            {["verified", "trusted"].includes(author.verificationTier) && (
              <Badge variant="verified" size="sm">
                ✓
              </Badge>
            )}
            <span className="text-xs text-gray-400">
              {formatRelativeTime(question.createdAt)}
            </span>
          </div>
          {question.isResolved && (
            <span className="flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-teal-lighter text-teal font-medium shrink-0">
              <CheckCircle className="w-3 h-3" />
              Resolved
            </span>
          )}
        </div>

        <div className="flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
          <span className="text-xs text-gray-500">
            {question.city}, {question.country}
          </span>
          {question.category && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-1">
              {question.category}
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-gray-900">{question.question}</p>
        {question.context && (
          <p className="text-xs text-gray-400 italic">{question.context}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>
            {question.answersCount ?? 0} answer
            {question.answersCount !== 1 ? "s" : ""}
          </span>
          <span>{question.viewsCount ?? 0} views</span>
          <button
            type="button"
            onClick={toggleExpand}
            className="ml-auto flex items-center gap-0.5 text-brand hover:text-brand-dark font-medium"
          >
            {expanded ? (
              <>
                Hide answers <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Answer <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Answers */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50">
          {loading && (
            <p className="text-xs text-gray-400 text-center py-4">
              Loading answers...
            </p>
          )}

          {(answers ?? []).map((ans) => {
            const ansAuthor = ans.authorId ?? {};
            return (
              <div
                key={ans._id}
                className={cn(
                  "px-4 py-3 border-b border-gray-100 last:border-b-0",
                  ans.isAccepted && "bg-teal-lighter/30",
                )}
              >
                {ans.isAccepted && (
                  <div className="flex items-center gap-1 text-teal text-[10px] font-semibold mb-1.5">
                    <CheckCircle className="w-3 h-3" />
                    Best answer
                  </div>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <Avatar
                    src={ansAuthor.profilePhotoUrl}
                    name={ansAuthor.fullName}
                    size="xs"
                  />
                  <span className="text-xs font-medium text-gray-700">
                    {ansAuthor.fullName}
                  </span>
                  {["verified", "trusted"].includes(
                    ansAuthor.verificationTier,
                  ) && (
                    <Badge variant="verified" size="sm">
                      ✓
                    </Badge>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {formatRelativeTime(ans.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {ans.content}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => handleUpvoteAnswer(ans._id)}
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      ans.hasUpvoted
                        ? "text-brand"
                        : "text-gray-400 hover:text-brand",
                    )}
                  >
                    <ThumbsUp
                      className={cn(
                        "w-3.5 h-3.5",
                        ans.hasUpvoted && "fill-brand",
                      )}
                    />
                    {ans.upvoteCount > 0 && ans.upvoteCount}
                  </button>
                  {isMyQuestion && !ans.isAccepted && !question.isResolved && (
                    <button
                      type="button"
                      onClick={() => handleMarkAccepted(ans._id)}
                      className="text-xs text-teal hover:text-teal-dark font-medium"
                    >
                      Mark as best answer
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Answer input */}
          <div className="p-4">
            {isVerified ? (
              <form onSubmit={handleAnswer} className="space-y-2">
                <textarea
                  rows={3}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder={`Share what you know about ${question.city}...`}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-0/30 focus:border-brand resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {answerText.length}/800
                  </span>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={submitting}
                    disabled={answerText.trim().length < 30}
                  >
                    Post answer
                  </Button>
                </div>
              </form>
            ) : verifPending ? (
              <p className="text-xs text-brand/70 bg-brand-lighter rounded-xl px-3 py-2">
                Verification under review — you&apos;ll be able to answer once
                approved
              </p>
            ) : verifApproved ? (
              <p className="text-xs text-teal bg-teal-lighter rounded-xl px-3 py-2">
                Identity verified!{" "}
                <a
                  href="/profile/verification"
                  className="font-medium text-teal-dark hover:underline"
                >
                  Activate your badge
                </a>{" "}
                to post answers
              </p>
            ) : (
              <p className="text-xs text-brand/70 bg-brand-lighter rounded-xl px-3 py-2">
                <a
                  href="/profile/verification"
                  className="font-medium text-brand hover:underline"
                >
                  Get verified
                </a>{" "}
                to post answers
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  const { data: session } = useSession();
  const appUser = useAppUser();
  const userId = session?.user?.id;
  const isVerified =
    session?.user?.verificationTier &&
    session.user.verificationTier !== "basic";
  const verifPending = appUser?.verifPending ?? false;
  const verifApproved = appUser?.verifApproved ?? false;

  const [activeTab, setActiveTab] = useState(0);
  const [showRecModal, setRecModal] = useState(false);
  const [showQModal, setQModal] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("upvotes");

  const [recs, setRecs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [myRecs, setMyRecs] = useState([]);
  const [myQs, setMyQs] = useState([]);

  const [recTotal, setRecTotal] = useState(0);
  const [qTotal, setQTotal] = useState(0);
  const [recPage, setRecPage] = useState(1);
  const [qPage, setQPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        if (activeTab === 0) {
          const data = await apiFetchRecs(1, { category, sort, search });
          if (!cancelled && data) {
            setRecs(data.recommendations ?? []);
            setRecTotal(data.total ?? 0);
            setRecPage(1);
          }
        } else if (activeTab === 1) {
          const data = await apiFetchQs(1, { search, category });
          if (!cancelled && data) {
            setQuestions(data.questions ?? []);
            setQTotal(data.total ?? 0);
            setQPage(1);
          }
        } else if (activeTab === 2) {
          const [recsData, qsData] = await Promise.all([
            apiFetchRecs(1, { category: "", sort, search: "" }),
            apiFetchQs(1, { search: "", category: "" }),
          ]);
          if (!cancelled) {
            if (recsData) {
              setRecs(recsData.recommendations ?? []);
              setRecTotal(recsData.total ?? 0);
              setRecPage(1);
            }
            if (qsData) {
              setQuestions(qsData.questions ?? []);
              setQTotal(qsData.total ?? 0);
              setQPage(1);
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeTab, category, sort, search]);

  function handleSearch(e) {
    e.preventDefault();
  }

  async function loadMoreRecs() {
    setLoading(true);
    try {
      const data = await apiFetchRecs(recPage + 1, { category, sort, search });
      if (data) {
        setRecs((prev) => [...prev, ...(data.recommendations ?? [])]);
        setRecTotal(data.total ?? 0);
        setRecPage((p) => p + 1);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadMoreQs() {
    setLoading(true);
    try {
      const data = await apiFetchQs(qPage + 1, { search, category });
      if (data) {
        setQuestions((prev) => [...prev, ...(data.questions ?? [])]);
        setQTotal(data.total ?? 0);
        setQPage((p) => p + 1);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleUpvote(id, upvoted, count) {
    setRecs((prev) =>
      prev.map((r) =>
        r._id === id ? { ...r, hasUpvoted: upvoted, upvoteCount: count } : r,
      ),
    );
  }

  return (
    <AppLayout title="Place recommendations">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand" />
            Place recommendations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real experiences shared by verified sisters
          </p>
          {isVerified ? (
            <div className="flex gap-3 mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setRecModal(true)}
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Share a recommendation
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setQModal(true)}>
                <MessageSquare className="w-4 h-4 mr-1.5" />
                Ask a question
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <VerificationGate mode="banner" action="Adding recommendations" />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[52px] lg:top-14 z-10 bg-white border-b border-gray-100">
        <div className="flex max-w-3xl mx-auto">
          {TABS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveTab(i)}
              className={cn(
                "flex-1 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2",
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

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* Search + filters (shared) */}
        {activeTab !== 2 && (
          <div className="space-y-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search city or country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-0/30 focus:border-brand"
              />
            </form>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs border whitespace-nowrap shrink-0 transition-colors",
                    category === value
                      ? "bg-brand text-white border-brand"
                      : "border-gray-200 text-gray-600 hover:border-brand",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 0 && (
              <div className="flex gap-2">
                {SORT_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSort(value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs border transition-colors",
                      sort === value
                        ? "bg-gray-900 text-white border-gray-900"
                        : "border-gray-200 text-gray-600 hover:border-gray-400",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Recommendations tab ── */}
        {activeTab === 0 && (
          <>
            {!loading && (
              <p className="text-xs text-gray-500">
                {search
                  ? `${recTotal} recommendation${recTotal !== 1 ? "s" : ""} for "${search}"`
                  : `${recTotal} recommendation${recTotal !== 1 ? "s" : ""}`}
              </p>
            )}
            {loading && recs.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <RecommendationCard.Skeleton key={i} />
                ))}
              </div>
            ) : recs.length > 0 ? (
              <>
                <div className="space-y-3">
                  {recs.map((rec) => (
                    <RecommendationCard
                      key={rec._id}
                      rec={rec}
                      onUpvote={handleUpvote}
                      canEdit={
                        rec.authorId?._id === userId || rec.authorId === userId
                      }
                    />
                  ))}
                </div>
                {recs.length < recTotal && (
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={loading}
                      onClick={loadMoreRecs}
                    >
                      Load more
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 space-y-3">
                <MapPin className="w-10 h-10 text-gray-200 mx-auto" />
                <p className="text-sm text-gray-500">
                  {search
                    ? `No recommendations for "${search}"`
                    : "No recommendations yet"}
                </p>
                {isVerified && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setRecModal(true)}
                  >
                    Be the first to share
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Q&A tab ── */}
        {activeTab === 1 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {qTotal} question{qTotal !== 1 ? "s" : ""}
              </p>
              {isVerified && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setQModal(true)}
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  Ask a question
                </Button>
              )}
            </div>
            {loading && questions.length === 0 ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : questions.length > 0 ? (
              <>
                <div className="space-y-3">
                  {questions.map((q) => (
                    <QuestionCard
                      key={q._id}
                      question={q}
                      userId={userId}
                      isVerified={isVerified}
                      verifPending={verifPending}
                      verifApproved={verifApproved}
                      onAnswered={() =>
                        setQuestions((prev) =>
                          prev.map((pq) =>
                            pq._id === q._id
                              ? {
                                  ...pq,
                                  answersCount: (pq.answersCount ?? 0) + 1,
                                }
                              : pq,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
                {questions.length < qTotal && (
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={loading}
                      onClick={loadMoreQs}
                    >
                      Load more
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 space-y-3">
                <MessageSquare className="w-10 h-10 text-gray-200 mx-auto" />
                <p className="text-sm text-gray-500">No questions yet</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setQModal(true)}
                >
                  Ask the first question
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── My contributions tab ── */}
        {activeTab === 2 && (
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                My recommendations (
                {
                  recs.filter(
                    (r) => r.authorId?._id === userId || r.authorId === userId,
                  ).length
                }
                )
              </h3>
              <div className="space-y-3">
                {recs
                  .filter(
                    (r) => r.authorId?._id === userId || r.authorId === userId,
                  )
                  .map((rec) => (
                    <RecommendationCard
                      key={rec._id}
                      rec={rec}
                      onUpvote={handleUpvote}
                      canEdit
                    />
                  ))}
              </div>
              {recs.filter(
                (r) => r.authorId?._id === userId || r.authorId === userId,
              ).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No recommendations yet
                </p>
              )}
            </section>

            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                My questions (
                {
                  questions.filter(
                    (q) => q.authorId?._id === userId || q.authorId === userId,
                  ).length
                }
                )
              </h3>
              <div className="space-y-3">
                {questions
                  .filter(
                    (q) => q.authorId?._id === userId || q.authorId === userId,
                  )
                  .map((q) => (
                    <QuestionCard key={q._id} question={q} userId={userId} />
                  ))}
              </div>
              {questions.filter(
                (q) => q.authorId?._id === userId || q.authorId === userId,
              ).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No questions yet
                </p>
              )}
            </section>
          </div>
        )}
      </div>

      {showRecModal && isVerified && (
        <AddRecommendationModal
          onClose={() => setRecModal(false)}
          onCreated={(rec) => setRecs((prev) => [rec, ...prev])}
        />
      )}
      {showQModal && isVerified && (
        <AskQuestionModal
          onClose={() => setQModal(false)}
          onCreated={(q) => setQuestions((prev) => [q, ...prev])}
        />
      )}
    </AppLayout>
  );
}
