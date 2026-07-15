"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import AppLayout, { useAppUser } from "@/components/layout/AppLayout";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import NotificationPanel from "@/components/ui/NotificationPanel";
import {
  ShieldCheck,
  Copy,
  ArrowLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { FeedTab } from "@/app/(app)/community/page";
import { formatDateRange } from "@/lib/utils";

const QUICK_ACTIONS = [
  { label: "All sisters", href: "/sisters" },
  { label: "Travel Stories", href: "/community/stories" },
  { label: "Browse all hosts", href: "/explore" },
  { label: "Find co-traveller", href: "/cotraveller" },
  { label: "Place recommendations", href: "/recommendations" },
  { label: "Messeges", href: "/messeges" },
  { label: "Profile", href: "/profile" },
  { label: "Safety SoS", href: "/safety" },
];

function SistersStrip({ sisters, loading }) {
  if (!loading && sisters.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-brand" />
          Sisters on SisterRoam
        </h2>
        <Link
          href="/sisters"
          className="text-xs font-medium text-brand hover:text-brand-dark flex items-center gap-0.5"
        >
          See all
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shrink-0 w-16 flex flex-col items-center gap-1.5">
                <Skeleton variant="avatar" className="w-14 h-14" />
                <Skeleton className="h-2.5 w-12" />
              </div>
            ))
          : sisters.map((s) => (
              <Link
                key={s._id}
                href={`/user/${s._id}`}
                className="shrink-0 w-16 flex flex-col items-center gap-1.5 group"
              >
                <Avatar
                  src={s.profilePhotoUrl}
                  name={s.fullName}
                  size="lg"
                  className="ring-2 ring-brand-lighter group-hover:ring-brand transition-all"
                />
                <span className="text-[11px] font-medium text-gray-900 text-center leading-tight truncate w-full">
                  {(s.fullName ?? "").split(" ")[0]}
                </span>
                {s.country && (
                  <span className="text-[10px] text-gray-400 text-center leading-tight truncate w-full -mt-1">
                    {s.country}
                  </span>
                )}
              </Link>
            ))}

        {!loading && (
          <Link
            href="/sisters"
            className="shrink-0 w-16 flex flex-col items-center gap-1.5 group"
          >
            <span className="w-14 h-14 rounded-full bg-brand-lighter text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
              <ChevronRight className="w-6 h-6" />
            </span>
            <span className="text-[11px] font-medium text-brand text-center leading-tight">
              All
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getProfileCompleteness(profile) {
  if (!profile) return { checks: [], pct: 0 };
  const checks = [
    { label: "Profile photo", done: !!profile.profilePhotoUrl },
    { label: "About you (bio)", done: !!profile.bio },
    { label: "Location", done: !!profile.country },
    { label: "Languages", done: (profile.languages?.length ?? 0) > 0 },
    {
      label: "Travel style",
      done: (profile.travellerCategories?.length ?? 0) > 0,
    },
    { label: "Emergency contact", done: !!profile.emergencyContactName },
  ];
  const done = checks.filter((c) => c.done).length;
  return { checks, pct: Math.round((done / checks.length) * 100) };
}

function ProfileCompletenessCard({ profile }) {
  const { checks, pct } = getProfileCompleteness(profile);
  const missing = checks.filter((c) => !c.done);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Profile strength
        </h3>
        <span className="text-sm font-bold text-brand">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {missing.length > 0 && (
        <ul className="space-y-1.5">
          {missing.slice(0, 3).map(({ label }) => (
            <li
              key={label}
              className="flex items-center gap-2 text-xs text-gray-500"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber shrink-0" />
              {label}
            </li>
          ))}
        </ul>
      )}
      <Button href="/profile/edit" variant="secondary" size="sm" fullWidth>
        Complete profile
      </Button>
    </div>
  );
}

function QuickStatsCard({ profile }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Your stats</h3>
      <div className="space-y-2">
        {[
          { label: "Total stays", value: profile?.totalStays ?? 0 },
          { label: "Reviews", value: profile?.totalReviews ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-sm font-semibold text-gray-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShortcutsCard() {
  function copyInviteLink() {
    const url = `${window.location.origin}?ref=sisterroam`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Invite link copied!"));
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Shortcuts</h3>
      <Link
        href="/safety"
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
      >
        <ShieldCheck className="w-4 h-4 text-teal shrink-0" />
        <div>
          <p className="text-sm font-medium text-gray-900">Safety centre</p>
          <p className="text-[11px] text-gray-400">SOS &amp; check-ins</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={copyInviteLink}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
      >
        <Copy className="w-4 h-4 text-brand shrink-0" />
        <span className="text-sm font-medium text-gray-900">
          Invite a sister
        </span>
      </button>
    </div>
  );
}

export default function FeedPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const freshUser = useAppUser();
  const sessionUser = freshUser ?? session?.user;

  const [userProfile, setUserProfile] = useState(null);
  const [activeStay, setActiveStay] = useState(null);
  const [sisters, setSisters] = useState([]);
  const [sistersLoading, setSistersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  async function loadFeedData() {
    try {
      const userRes = await fetch("/api/users");
      if (userRes.ok) {
        const userData = await userRes.json();
        const profile = userData.data ?? {};
        setUserProfile(profile);

        const requestsRes = await fetch("/api/requests").catch(() => null);
        if (requestsRes?.ok) {
          const d = await requestsRes.json();
          const today = new Date();
          const requests = Array.isArray(d.data) ? d.data : [];
          const active = requests.find(
            (r) =>
              r.status === "accepted" &&
              new Date(r.checkInDate) <= today &&
              new Date(r.checkOutDate) >= today,
          );
          setActiveStay(active ?? null);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadSisters() {
    try {
      const res = await fetch("/api/users/sisters?limit=10");
      if (res.ok) {
        const d = await res.json();
        setSisters(d.data?.sisters ?? []);
      }
    } finally {
      setSistersLoading(false);
    }
  }

  useEffect(() => {
    if (!sessionUser?.id) return;
    loadFeedData();
    loadSisters();
  }, [sessionUser?.id]);

  const firstName =
    (userProfile?.fullName ?? sessionUser?.fullName ?? "").split(" ")[0] ||
    "there";
  const hostName = activeStay?.hostId?.fullName ?? "your host";
  const hostCity = activeStay?.hostId?.city ?? "";

  return (
    <AppLayout title={`${getGreeting()}, ${firstName}`} noTopBar>
      {/* ── Custom mobile header ── */}
      <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-100 flex items-center gap-2 min-h-[52px] py-2 px-4 shrink-0">
        <button
          onClick={() => router.back()}
          className="p-1.5 text-gray-600 hover:text-gray-900 -ml-1.5 shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Link href="/profile" className="shrink-0">
          <Avatar
            src={userProfile?.profilePhotoUrl ?? sessionUser?.profilePhotoUrl}
            name={userProfile?.fullName ?? sessionUser?.fullName}
            size="sm"
          />
        </Link>
        <div className="flex flex-col min-w-0">
          <p className="text-[11px] text-gray-400 leading-none">
            {getGreeting()},
          </p>
          <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
            {firstName}!
          </p>
        </div>
        <div className="ml-auto shrink-0">
          <NotificationPanel userId={sessionUser?.id} />
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="lg:flex lg:gap-0 max-w-5xl mx-auto">
        {/* Main feed */}
        <div className="flex-1 min-w-0 px-4 py-5 lg:px-8 space-y-6">
          {/* Quick actions */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap scrollbar-hide">
            {QUICK_ACTIONS.map(({ label, href }) => (
              <Button
                key={label}
                href={href}
                variant="ghost"
                size="sm"
                className="shrink-0 whitespace-nowrap"
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Sisters horizontal strip */}
          <SistersStrip sisters={sisters} loading={sistersLoading} />

          {/* Active stay card */}
          {activeStay && (
            <div className="border-2 border-teal bg-teal-lighter rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-teal-dark">
                  Active stay with {hostName}
                </p>
                <p className="text-xs text-teal mt-0.5">
                  {[
                    hostCity,
                    formatDateRange(
                      activeStay.checkInDate,
                      activeStay.checkOutDate,
                    ),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    href="/safety"
                    variant="ghost"
                    size="sm"
                    className="border-teal/40 text-teal-dark hover:bg-teal/10"
                  >
                    Safety centre
                  </Button>
                  <Button
                    href={`/messages/${activeStay._id}`}
                    variant="primary"
                    size="sm"
                  >
                    View chat
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Community feed */}
          <section className="pb-6">
            <FeedTab />
          </section>
        </div>

        {/* ── Right sidebar (desktop only) ── */}
        <aside className="hidden lg:block w-72 shrink-0 py-5 pr-6 space-y-4 self-start sticky top-14">
          {loading ? (
            <>
              <Skeleton variant="card" className="h-44 w-full" />
              <Skeleton variant="card" className="h-28 w-full" />
              <Skeleton variant="card" className="h-32 w-full" />
            </>
          ) : (
            <>
              <ProfileCompletenessCard profile={userProfile} />
              <QuickStatsCard profile={userProfile} />
              <ShortcutsCard />
            </>
          )}
        </aside>
      </div>
    </AppLayout>
  );
}
