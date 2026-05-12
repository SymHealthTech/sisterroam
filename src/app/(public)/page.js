import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle,
  UserPlus,
  Search,
  Home,
  Lock,
  AlertCircle,
  Shield,
  Star,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Bike,
  Mountain,
  Activity,
  Car,
  Globe,
  Smartphone,
  Bell,
  Users,
  MessageCircle,
  MoreHorizontal,
  BookOpen,
} from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import HostProfile from "@/models/HostProfile";
import HostingRequest from "@/models/HostingRequest";
import TravelStory from "@/models/TravelStory";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import HostCard from "@/components/host/HostCard";
import PWAInstallButtons from "@/components/ui/PWAInstallButtons";
import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";
import { HeroCta, HowItWorksCta, FinalCta } from "@/components/home/HomeCtas";

export const revalidate = 3600;

export const metadata = {
  title: "SisterRoam — Safe Hosting Community for Female Solo Travellers",
  description:
    "Join 1,200+ verified women hosting and travelling fearlessly. The verified hospitality exchange community for female solo travellers worldwide.",
  openGraph: {
    type: "website",
    url: "https://sisterroam.com",
    title: "SisterRoam — Safe Hosting Community for Female Solo Travellers",
    description:
      "Join 1,200+ verified women hosting and travelling fearlessly. The verified hospitality exchange community for female solo travellers worldwide.",
    images: [{ url: "/og-image.png" }],
  },
};

// ── Static content ─────────────────────────────────────────────────────────

const HERO_HOSTS = [
  {
    name: "Ananya K.",
    city: "Bengaluru",
    country: "India",
    tier: "verified",
    femaleOnly: true,
    rating: 4.9,
    type: "Private room",
  },
  {
    name: "Maria H.",
    city: "Barcelona",
    country: "Spain",
    tier: "trusted",
    femaleOnly: false,
    rating: 5.0,
    type: "Couch",
  },
  {
    name: "Soo-Jin K.",
    city: "Seoul",
    country: "South Korea",
    tier: "verified",
    femaleOnly: false,
    rating: 4.8,
    type: "Shared room",
    cyclingNote: true,
  },
];

const HOW_IT_WORKS = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create your verified profile",
    desc: "Sign up, complete ID verification, and record a short intro video. Your identity is confirmed within 48 hours.",
  },
  {
    icon: Search,
    step: "02",
    title: "Find your sister host",
    desc: "Browse verified female hosts by city, dates, and traveller type. Filter for female-only homes and preferred languages.",
  },
  {
    icon: Home,
    step: "03",
    title: "Stay safe and connected",
    desc: "Use the in-app SOS button, daily check-ins, and our safety team throughout your stay. Community keeps you safe.",
  },
];

const SAFETY_CARDS = [
  {
    icon: Lock,
    bg: "bg-brand-lighter",
    color: "text-brand",
    title: "ID-verified hosts",
    desc: "Every host completes government ID verification and a video introduction before their first guest.",
  },
  {
    icon: AlertCircle,
    bg: "bg-danger-lighter",
    color: "text-danger",
    title: "One-tap SOS button",
    desc: "Your emergency contacts and our safety team are notified instantly if you trigger the SOS in-app.",
  },
  {
    icon: CheckCircle,
    bg: "bg-teal-lighter",
    color: "text-teal",
    title: "Daily safety check-ins",
    desc: "Optional automated check-ins during your stay. No response triggers an alert to your emergency contact.",
  },
  {
    icon: Shield,
    bg: "bg-pink-lighter",
    color: "text-pink",
    title: "Female-only filter",
    desc: "Filter exclusively for hosts who open their homes only to women. Over 60% of listings are female-only.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I was nervous about solo travel in Southeast Asia until I found SisterRoam. My host Priya in Chennai felt like family within hours. The verification system genuinely made me feel safe.",
    name: "Valentina R.",
    location: "Buenos Aires, Argentina",
  },
  {
    quote:
      "Three countries, six hosts, zero bad experiences. The SOS button and check-in reminders meant my parents stopped worrying too. This community is something truly special.",
    name: "Keiko T.",
    location: "Osaka, Japan",
  },
  {
    quote:
      "As a host, the verification process gave me complete confidence in who I welcomed. Every guest has been wonderful. This is exactly what solo travel should look like.",
    name: "Amara O.",
    location: "Accra, Ghana",
  },
];

const CATEGORIES = [
  { icon: Globe, name: "Solo Travel", members: "2,300+" },
  { icon: Bike, name: "Cycling", members: "890+" },
  { icon: Mountain, name: "Trekking", members: "1,100+" },
  { icon: Activity, name: "Running", members: "650+" },
  { icon: Car, name: "Road Trip", members: "420+" },
];

// ── Data fetching ───────────────────────────────────────────────────────────

async function getPageData() {
  try {
    await connectDB();

    const [
      memberCount,
      countriesList,
      staysCount,
      activeHostCount,
      rawHosts,
      // blog posts fetched per spec; available for future sections
      recentPosts,
    ] = await Promise.all([
      User.countDocuments({
        verificationTier: { $in: ["verified", "trusted"] },
      }),
      User.distinct("country", {
        country: { $exists: true, $nin: [null, ""] },
      }),
      HostingRequest.countDocuments({ status: "completed" }),
      HostProfile.countDocuments({
        isAcceptingGuests: true,
        isListingActive: true,
      }),
      HostProfile.find({ isAcceptingGuests: true, isListingActive: true })
        .populate({
          path: "userId",
          match: { verificationTier: { $in: ["verified", "trusted"] } },
          select:
            "fullName profilePhotoUrl verificationTier city country languages travellerCategories averageRating totalReviews",
        })
        .limit(20)
        .lean(),
      TravelStory.find({ isPublished: true })
        .sort({ publishedAt: -1 })
        .limit(3)
        .populate("authorId", "fullName profilePhotoUrl")
        .lean(),
    ]);

    const featuredHosts = rawHosts
      .filter((h) => h.userId !== null)
      .sort(
        (a, b) =>
          (b.userId?.averageRating ?? 0) - (a.userId?.averageRating ?? 0),
      )
      .slice(0, 3)
      .map((h) => ({
        _id: h._id.toString(),
        accommodationType: h.accommodationType,
        femaleOnly: h.femaleOnly,
        isAcceptingGuests: h.isAcceptingGuests,
        user: {
          fullName: h.userId.fullName,
          profilePhotoUrl: h.userId.profilePhotoUrl ?? null,
          verificationTier: h.userId.verificationTier,
          city: h.userId.city ?? null,
          country: h.userId.country ?? null,
          languages: h.userId.languages ?? [],
          travellerCategories: h.userId.travellerCategories ?? [],
          averageRating: h.userId.averageRating ?? 0,
          totalReviews: h.userId.totalReviews ?? 0,
        },
      }));

    return {
      stats: {
        memberCount,
        countriesCount: countriesList.length,
        staysCount,
        activeHostCount,
      },
      featuredHosts,
    };
  } catch {
    // Graceful fallback — page renders with zero stats if DB is unreachable
    return {
      stats: {
        memberCount: 0,
        countriesCount: 0,
        staysCount: 0,
        activeHostCount: 0,
      },
      featuredHosts: [],
    };
  }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { stats, featuredHosts } = await getPageData();

  return (
    <>
      <PublicNavbar />

      <main>
        {/* ── S1: Hero ─────────────────────────────────────────────────── */}
        <section
          className="relative min-h-screen lg:min-h-[600px] flex items-center overflow-hidden bg-cover bg-[60%_center] lg:bg-[60%_75%]"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1723764881665-5b40cea01c9b?w=1920&q=80)",
          }}
          aria-label="Hero"
        >
          {/* Mobile overlay — full coverage gradient */}
          <div
            className="absolute inset-0 lg:hidden bg-gradient-to-r from-brand/95 via-brand/80 to-brand/55"
            aria-hidden="true"
          />
          {/* Desktop overlay — fades to clear after ~60% so the woman is visible */}
          <div
            className="absolute inset-0 hidden lg:block"
            style={{
              background:
                "linear-gradient(to right, rgba(93,26,139,0.95) 0%, rgba(93,26,139,0.85) 35%, rgba(93,26,139,0.6) 65%, rgba(93,26,139,0.5) 100%)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 py-20 lg:py-0">
            {/* Desktop: 55/45 grid · Mobile: single column */}
            <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-12 lg:gap-16 items-center">
              {/* Left column */}
              <div className="space-y-6">
                {/* Pill badge */}
                <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-full">
                  <span
                    className="w-2 h-2 rounded-full bg-teal-light shrink-0"
                    aria-hidden="true"
                  />
                  {stats.memberCount > 0
                    ? `${stats.memberCount.toLocaleString()}+ verified women in ${stats.countriesCount || 45} countries`
                    : "1,200+ verified women in 45 countries"}
                </div>

                {/* Headline */}
                <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-medium leading-tight">
                  Stay with verified women.
                  <br />
                  Host fearless sisters.
                </h1>

                {/* Value prop */}
                <p className="text-white/75 text-base md:text-lg leading-relaxed max-w-lg">
                  The verified community for female solo travellers. Find a
                  host, a co-traveller, or local recommendations — all from
                  sisters you can trust.
                </p>

                {/* CTAs */}
                <HeroCta />

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      icon: UserPlus,
                      label: "Find a co-traveller",
                      href: "/cotraveller",
                    },
                    {
                      icon: MapPin,
                      label: "Place recommendations",
                      href: "/recommendations",
                    },
                    {
                      icon: BookOpen,
                      label: "Travel stories",
                      href: "/stories",
                    },
                  ].map(({ icon: Icon, label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs border border-white/25 hover:bg-white/25 transition-colors"
                    >
                      <Icon
                        className="w-3.5 h-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      {label}
                    </Link>
                  ))}
                </div>

                {/* Trust points */}
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {[
                    "ID-verified hosts",
                    "SOS safety button",
                    "100% free to join",
                  ].map((point) => (
                    <div key={point} className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full bg-teal flex items-center justify-center shrink-0"
                        aria-hidden="true"
                      >
                        <CheckCircle className="w-2.5 h-2.5 text-white" />
                      </span>
                      <span className="text-white/75 text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column — host preview cards (desktop only) */}
              <div className="hidden lg:flex flex-col gap-3 py-8">
                {HERO_HOSTS.map((host, i) => (
                  <div
                    key={host.name}
                    className="bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-4 flex items-center gap-3"
                  >
                    <Avatar name={host.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-sm font-medium">
                          {host.name}
                        </span>
                        {host.tier === "trusted" && (
                          <Badge variant="trusted" size="sm">
                            Trusted
                          </Badge>
                        )}
                        {(host.tier === "verified" ||
                          host.tier === "trusted") && (
                          <Badge variant="verified" size="sm">
                            Verified
                          </Badge>
                        )}
                        {host.femaleOnly && (
                          <Badge variant="female" size="sm">
                            ♀ Only
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-white/60 text-xs mt-0.5">
                        <MapPin className="w-3 h-3" aria-hidden="true" />
                        <span>
                          {host.city}, {host.country}
                        </span>
                        <span className="mx-1">·</span>
                        <span>{host.type}</span>
                      </div>
                      {host.cyclingNote && (
                        <p className="text-xs text-white/60 italic mt-1">
                          Also looking for a cycling partner in April
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star
                        className="w-3.5 h-3.5 fill-amber text-amber"
                        aria-hidden="true"
                      />
                      <span className="text-white text-sm font-semibold">
                        {host.rating}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature cards row (desktop only) ────────────────────────── */}
        <section
          className="hidden md:block bg-white border-b border-gray-100 py-6"
          aria-label="Feature highlights"
        >
          <div className="max-w-6xl mx-auto px-10">
            <div className="grid grid-cols-3 gap-0">
              {/* Card 1 — Co-traveller */}
              <div className="flex items-start gap-3 pr-6 border-r border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-brand-lighter flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5 text-brand" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Find a co-traveller
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                    Post your trip and connect with verified sisters who share
                    your destination.
                  </p>
                  <Link
                    href="/cotraveller"
                    className="text-xs text-brand font-medium mt-1 inline-block hover:underline"
                  >
                    Explore trips →
                  </Link>
                </div>
              </div>
              {/* Card 2 — Recommendations */}
              <div className="flex items-start gap-3 px-6 border-r border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-teal-lighter flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-teal" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Place recommendations
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                    Real tips on stays, food, transport and safety from sisters
                    who have been there.
                  </p>
                  <Link
                    href="/recommendations"
                    className="text-xs text-brand font-medium mt-1 inline-block hover:underline"
                  >
                    Browse tips →
                  </Link>
                </div>
              </div>
              {/* Card 3 — Travel Stories */}
              <div className="flex items-start gap-3 pl-6">
                <div className="w-10 h-10 rounded-xl bg-pink-lighter flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-pink" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Travel stories
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                    Authentic experiences shared by verified female solo
                    travellers worldwide.
                  </p>
                  <Link
                    href="/stories"
                    className="text-xs text-brand font-medium mt-1 inline-block hover:underline"
                  >
                    Read stories →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── S2: Stats bar ────────────────────────────────────────────── */}
        <section className="bg-gray-50 py-8" aria-label="Community stats">
          <div className="max-w-5xl mx-auto px-6">
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                {
                  value: stats.memberCount,
                  label: "Verified members",
                  suffix: "+",
                },
                { value: stats.countriesCount, label: "Countries", suffix: "" },
                {
                  value: stats.staysCount,
                  label: "Stays completed",
                  suffix: "+",
                },
                {
                  value: stats.activeHostCount,
                  label: "Active hosts",
                  suffix: "+",
                },
              ].map(({ value, label, suffix }) => (
                <div key={label}>
                  <dt className="text-3xl font-medium text-brand">
                    {value > 0 ? `${value.toLocaleString()}${suffix}` : "—"}
                  </dt>
                  <dd className="text-sm text-gray-500 mt-1">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── S3: How it works ─────────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="py-14 lg:py-24 bg-gradient-to-b from-white via-brand-lighter/20 to-white"
          aria-labelledby="how-title"
        >
          <div className="max-w-5xl mx-auto px-6">
            {/* Header */}
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 bg-brand-lighter text-brand text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-brand shrink-0"
                  aria-hidden="true"
                />
                How it works
              </span>
              <h2 id="how-title" className="text-3xl font-medium text-gray-900">
                Safe. Simple. Sisterhood.
              </h2>
              <p className="text-gray-500 mt-3 max-w-md mx-auto leading-relaxed">
                From sign-up to stay, every step is designed with your safety
                and comfort in mind.
              </p>
            </div>

            {/* Steps grid */}
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Decorative connector — desktop only */}
              <div
                className="hidden md:block absolute top-[44px] left-[calc(33.33%_-_8px)] right-[calc(33.33%_-_8px)] h-px"
                style={{
                  background:
                    "linear-gradient(to right, transparent, var(--color-brand, #7c3aed) 20%, var(--color-brand, #7c3aed) 80%, transparent)",
                  opacity: 0.2,
                }}
                aria-hidden="true"
              />

              {HOW_IT_WORKS.map(({ icon: Icon, step, title, desc }) => (
                <div
                  key={step}
                  className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 p-7 flex flex-col gap-5 overflow-hidden"
                >
                  {/* Large faded background step number */}
                  <span
                    className="absolute -bottom-2 right-4 text-[88px] font-black leading-none select-none pointer-events-none text-brand/[0.06]"
                    aria-hidden="true"
                  >
                    {step}
                  </span>

                  {/* Icon row */}
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shadow-sm">
                        <Icon
                          className="w-7 h-7 text-white"
                          aria-hidden="true"
                        />
                      </div>
                      {/* Step number badge */}
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border-2 border-brand text-brand text-[9px] font-black flex items-center justify-center leading-none shadow-sm">
                        {step}
                      </span>
                    </div>
                  </div>

                  {/* Text */}
                  <div className="relative z-10">
                    <h3 className="font-semibold text-gray-900 text-base mb-2 leading-snug">
                      {title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA below */}
            <div className="mt-12 text-center">
              <HowItWorksCta />
            </div>
          </div>
        </section>

        {/* ── S4: Featured hosts ───────────────────────────────────────── */}
        <section
          className="py-14 lg:py-24 bg-gradient-to-b from-gray-50 to-white"
          aria-labelledby="hosts-title"
        >
          <div className="max-w-5xl mx-auto px-6">
            {/* Header */}
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 bg-brand-lighter text-brand text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-brand shrink-0"
                  aria-hidden="true"
                />
                Meet your sisters
              </span>
              <h2
                id="hosts-title"
                className="text-3xl font-medium text-gray-900"
              >
                Verified sisters near you
              </h2>
              <p className="text-gray-500 mt-3 max-w-md mx-auto leading-relaxed">
                Every host is ID-verified and community-rated — so you already
                know you&apos;re in good hands.
              </p>
            </div>

            {featuredHosts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredHosts.map((host) => (
                  <HostCard key={host._id} host={host} />
                ))}
              </div>
            ) : (
              /* Fallback when DB is empty — show placeholder cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {HERO_HOSTS.map((h) => (
                  <div
                    key={h.name}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                    aria-hidden="true"
                  >
                    {/* Card banner */}
                    <div className="h-24 bg-gradient-to-br from-brand to-brand-dark relative">
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                        <Avatar
                          name={h.name}
                          size="lg"
                          className="ring-4 ring-white shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="pt-10 pb-5 px-5 space-y-3 text-center">
                      <p className="font-semibold text-gray-900">{h.name}</p>
                      <div className="flex justify-center gap-1.5">
                        <Badge
                          variant={
                            h.tier === "trusted" ? "trusted" : "verified"
                          }
                          size="sm"
                        >
                          {h.tier === "trusted" ? "Trusted" : "Verified"}
                        </Badge>
                        {h.femaleOnly && (
                          <Badge variant="female" size="sm">
                            ♀ Only
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-gray-500 text-xs">
                        <MapPin className="w-3 h-3" aria-hidden="true" />
                        <span>
                          {h.city}, {h.country}
                        </span>
                        <span className="mx-1">·</span>
                        <span>{h.type}</span>
                      </div>
                      <div className="flex justify-center items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className="w-3.5 h-3.5 fill-amber text-amber"
                          />
                        ))}
                        <span className="text-xs text-gray-500 ml-1.5 font-medium">
                          {h.rating}
                        </span>
                      </div>
                      <Link
                        href="/browse"
                        className="block w-full py-2.5 text-sm font-medium text-white bg-brand rounded-[10px] hover:opacity-90 transition-opacity"
                      >
                        View profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="mt-10 text-center">
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 px-7 py-3 border-2 border-brand text-brand font-medium text-sm rounded-[10px] hover:bg-brand hover:text-white transition-colors"
              >
                See all hosts
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── S5: Safety features ──────────────────────────────────────── */}
        <section
          className="py-14 lg:py-24 bg-gradient-to-b from-brand-lighter/40 via-brand-lighter/20 to-white"
          aria-labelledby="safety-title"
        >
          <div className="max-w-5xl mx-auto px-6">
            {/* Header */}
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 bg-brand-lighter text-brand text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-brand shrink-0"
                  aria-hidden="true"
                />
                Safety first
              </span>
              <h2
                id="safety-title"
                className="text-3xl font-medium text-gray-900"
              >
                Built for your safety, not just your stay
              </h2>
              <p className="text-gray-500 mt-3 max-w-md mx-auto leading-relaxed">
                Multiple layers of protection, so you can focus on the
                adventure.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {SAFETY_CARDS.map(({ icon: Icon, bg, color, title, desc }) => (
                <div
                  key={title}
                  className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow duration-200 flex gap-5 items-start"
                >
                  {/* Icon block */}
                  <div
                    className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-6 h-6 ${color}`} aria-hidden="true" />
                  </div>
                  {/* Text */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1.5">
                      {title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── S6: Mobile App + Testimonials ────────────────────────────── */}
        <section
          className="bg-brand py-14 lg:py-24 overflow-hidden relative"
          aria-labelledby="app-section-title"
        >
          {/* Decorative blobs */}
          <div
            className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative max-w-5xl mx-auto px-6">
            {/* ── App promo row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              {/* Left: headline + features + download buttons */}
              <div className="space-y-6 text-white">
                <span className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
                  <Smartphone className="w-3 h-3" aria-hidden="true" />
                  Mobile App
                </span>

                <h2
                  id="app-section-title"
                  className="text-3xl font-medium leading-tight"
                >
                  Your safety net,
                  <br />
                  always in your pocket
                </h2>

                <p className="text-white/75 leading-relaxed max-w-md">
                  The SisterRoam app puts verified hosts, one-tap SOS, and daily
                  safety check-ins right at your fingertips — wherever your next
                  adventure takes you.
                </p>

                <ul className="space-y-3">
                  {[
                    "One-tap SOS from anywhere",
                    "Browse & message hosts on the go",
                    "Daily safety check-ins",
                    "Offline access to your host's contact",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 text-sm text-white/85"
                    >
                      <span
                        className="w-5 h-5 rounded-full bg-teal flex items-center justify-center shrink-0"
                        aria-hidden="true"
                      >
                        <CheckCircle className="w-3 h-3 text-white" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Download buttons — mobile only (PWA install) */}
                <PWAInstallButtons />

                {/* Desktop hint */}
                <p className="hidden md:block text-sm text-white/50 italic">
                  Open this page on your phone to install the app.
                </p>
              </div>

              {/* Right: tilted phone mockup */}
              <div className="flex justify-center lg:justify-end py-10 lg:py-6">
                <div
                  className="relative rotate-[8deg] drop-shadow-2xl"
                  style={{ width: 224 }}
                  role="img"
                  aria-label="SisterRoam app preview"
                >
                  {/* Glow */}
                  <div
                    className="absolute inset-0 blur-3xl bg-white/15 rounded-full scale-90 translate-y-6 pointer-events-none"
                    aria-hidden="true"
                  />

                  {/* Phone shell */}
                  <div
                    className="relative w-full bg-gray-900 rounded-[2.5rem] border-[5px] border-gray-800 overflow-hidden"
                    style={{ aspectRatio: "9 / 20" }}
                  >
                    {/* Dynamic island */}
                    <div
                      className="absolute top-3 left-1/2 -translate-x-1/2 w-[68px] h-[17px] bg-gray-900 rounded-full z-20"
                      aria-hidden="true"
                    />

                    {/* Screen */}
                    <div className="absolute inset-0 bg-gray-50 flex flex-col overflow-hidden">
                      {/* Status bar */}
                      <div className="h-8 bg-gray-50 flex items-end justify-between px-3.5 pb-1 shrink-0">
                        <span className="text-[7px] font-semibold text-gray-800">
                          9:41
                        </span>
                        <div className="flex items-center gap-1">
                          {/* Signal bars */}
                          <div className="flex gap-px items-end">
                            {[2, 3, 4, 5].map((h) => (
                              <div
                                key={h}
                                className="w-[3px] bg-gray-800 rounded-sm"
                                style={{ height: h }}
                              />
                            ))}
                          </div>
                          {/* Wifi */}
                          <svg
                            viewBox="0 0 16 12"
                            className="w-3 h-2.5 fill-gray-800"
                            aria-hidden="true"
                          >
                            <path d="M8 2.4C5.2 2.4 2.7 3.5 1 5.3L0 4.2C2 2.1 4.8.8 8 .8s6 1.3 8 3.4l-1 1.1C13.3 3.5 10.8 2.4 8 2.4zm0 3.2c-1.7 0-3.2.7-4.3 1.8L2.6 6.3C4 4.9 5.9 4 8 4s4 .9 5.4 2.3L12.3 7.4C11.2 6.3 9.7 5.6 8 5.6zm0 3.2c-.9 0-1.7.4-2.3.9L8 12l2.3-2.3C9.7 9.2 8.9 8.8 8 8.8z" />
                          </svg>
                          {/* Battery */}
                          <div className="flex items-center">
                            <div className="w-5 h-2.5 border border-gray-700 rounded-sm overflow-hidden flex items-stretch p-px">
                              <div className="w-4/5 bg-gray-800 rounded-sm" />
                            </div>
                            <div className="w-0.5 h-1.5 bg-gray-600 rounded-r-sm" />
                          </div>
                        </div>
                      </div>

                      {/* App mini-header — matches AppLayout mobile header */}
                      <div className="h-10 bg-white border-b border-gray-100 flex items-center px-3 shrink-0 relative">
                        <ArrowLeft
                          className="w-3.5 h-3.5 text-gray-600 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="absolute left-1/2 -translate-x-1/2 text-[9px] font-semibold text-gray-900 whitespace-nowrap">
                          Good morning, Priya!
                        </span>
                        <div className="ml-auto relative shrink-0">
                          <Bell
                            className="w-3.5 h-3.5 text-gray-400"
                            aria-hidden="true"
                          />
                          <span
                            className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-danger rounded-full"
                            aria-hidden="true"
                          />
                        </div>
                      </div>

                      {/* Feed content */}
                      <div className="flex-1 overflow-hidden px-2.5 pt-2.5 pb-1 space-y-2">
                        {/* Greeting row */}
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[9px] font-bold text-gray-900 leading-tight">
                              Ready for your next adventure?
                            </p>
                          </div>
                          <div className="relative shrink-0">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center">
                              <span className="text-white text-[8px] font-bold">
                                P
                              </span>
                            </div>
                            <span className="absolute bottom-0 right-0 w-2 h-2 bg-teal rounded-full border border-white" />
                          </div>
                        </div>

                        {/* Search bar */}
                        <div className="bg-white border border-gray-200 rounded-[8px] h-6 flex items-center px-2 gap-1.5 shadow-sm">
                          <Search
                            className="w-2.5 h-2.5 text-gray-400 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="text-[7px] text-gray-400 truncate">
                            Search for a host in any city...
                          </span>
                        </div>

                        {/* Quick chips */}
                        <div className="flex gap-1 overflow-hidden">
                          {["Browse all", "♀ Only", "Cyclists", "Trekkers"].map(
                            (chip) => (
                              <span
                                key={chip}
                                className="shrink-0 text-[6px] px-1.5 py-0.5 bg-white border border-gray-200 rounded-full text-gray-600 font-medium"
                              >
                                {chip}
                              </span>
                            ),
                          )}
                        </div>

                        {/* Section header */}
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-semibold text-gray-900">
                            Verified hosts near you
                          </span>
                          <span className="text-[7px] text-brand font-medium">
                            See all
                          </span>
                        </div>

                        {/* Host cards */}
                        <div className="space-y-1.5">
                          {[
                            {
                              initial: "P",
                              name: "Priya M.",
                              city: "Mumbai",
                              rating: "4.9",
                              type: "Private room",
                            },
                            {
                              initial: "A",
                              name: "Ananya K.",
                              city: "Delhi",
                              rating: "5.0",
                              type: "Shared room",
                            },
                          ].map((h) => (
                            <div
                              key={h.name}
                              className="bg-white rounded-lg border border-gray-100 p-1.5 flex gap-2 items-center shadow-sm"
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-dark shrink-0 flex items-center justify-center">
                                <span className="text-white text-[9px] font-bold">
                                  {h.initial}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[8px] font-semibold text-gray-900 truncate">
                                    {h.name}
                                  </span>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <Star
                                      className="w-2 h-2 fill-amber text-amber"
                                      aria-hidden="true"
                                    />
                                    <span className="text-[7px] text-gray-600">
                                      {h.rating}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5 mt-0.5">
                                  <MapPin
                                    className="w-1.5 h-1.5 text-gray-400 shrink-0"
                                    aria-hidden="true"
                                  />
                                  <span className="text-[7px] text-gray-400 truncate">
                                    {h.city} · {h.type}
                                  </span>
                                </div>
                                <div className="flex gap-0.5 mt-0.5">
                                  <span className="text-[6px] px-1 py-0.5 bg-brand-lighter text-brand rounded-full font-medium">
                                    Verified
                                  </span>
                                  <span className="text-[6px] px-1 py-0.5 bg-pink-lighter text-pink rounded-full font-medium">
                                    ♀ Only
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Community preview row */}
                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-[8px] font-semibold text-gray-900">
                            From the community
                          </span>
                          <span className="text-[7px] text-brand font-medium">
                            View all
                          </span>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-100 p-2 flex gap-2 shadow-sm">
                          <div className="w-5 h-5 rounded-full bg-teal-lighter shrink-0 flex items-center justify-center">
                            <span className="text-teal text-[7px] font-bold">
                              V
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="h-1.5 w-20 bg-gray-200 rounded-full mb-1" />
                            <div className="h-1.5 w-14 bg-gray-100 rounded-full" />
                          </div>
                        </div>
                      </div>

                      {/* Bottom TabBar — matches TabBar.jsx */}
                      <div className="bg-white border-t border-gray-100 flex h-10 shrink-0">
                        {[
                          { Icon: Home, label: "Home", active: true },
                          { Icon: Search, label: "Explore", active: false },
                          { Icon: Users, label: "Community", active: false },
                          {
                            Icon: MessageCircle,
                            label: "Messages",
                            active: false,
                          },
                          {
                            Icon: MoreHorizontal,
                            label: "More",
                            active: false,
                          },
                        ].map(({ Icon, label, active }) => (
                          <div
                            key={label}
                            className={`flex-1 flex flex-col items-center justify-center gap-0.5 ${
                              active ? "text-brand" : "text-gray-300"
                            }`}
                          >
                            <Icon className="w-3 h-3" aria-hidden="true" />
                            <span className="text-[5.5px] font-medium">
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── S7: Community categories ─────────────────────────────────── */}
        <section
          className="py-14 lg:py-24 bg-gradient-to-b from-gray-50 to-white"
          aria-labelledby="categories-title"
        >
          <div className="max-w-5xl mx-auto px-6">
            {/* Header */}
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 bg-brand-lighter text-brand text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-brand shrink-0"
                  aria-hidden="true"
                />
                Community
              </span>
              <h2
                id="categories-title"
                className="text-3xl font-medium text-gray-900"
              >
                Find your tribe
              </h2>
              <p className="text-gray-500 mt-3 max-w-md mx-auto leading-relaxed">
                Connect with sisters who share your travel style.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {CATEGORIES.map(({ icon: Icon, name }) => (
                <div
                  key={name}
                  className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand-lighter flex items-center justify-center mx-auto mb-4">
                    <Icon
                      className="w-6 h-6 text-brand"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="font-semibold text-sm text-gray-900">
                    {name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── S8: Testimonials ─────────────────────────────────────────── */}
        <section
          className="bg-brand py-14 lg:py-24"
          aria-labelledby="testimonials-title"
        >
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2
                id="testimonials-title"
                className="text-white text-2xl lg:text-3xl font-medium"
              >
                Sisters who roam, sisters who trust
              </h2>
              <p className="text-white/60 mt-3 text-sm">
                Real experiences from the SisterRoam community.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TESTIMONIALS.map(({ quote, name, location }) => (
                <div
                  key={name}
                  className="bg-white/[0.08] border border-white/15 rounded-2xl p-6 space-y-4"
                >
                  <div className="flex gap-0.5" aria-label="5 stars" role="img">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className="w-4 h-4 fill-amber text-amber"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <blockquote>
                    <p className="text-white/90 text-sm leading-relaxed italic">
                      &ldquo;{quote}&rdquo;
                    </p>
                  </blockquote>
                  <div className="flex items-center gap-3 pt-2">
                    <Avatar name={name} size="sm" />
                    <div>
                      <p className="text-white text-sm font-medium">{name}</p>
                      <p className="text-white/60 text-xs">{location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Founder's Word ────────────────────────────────────────────── */}
        <section aria-label="Founder's word">
          <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr]">
            {/* Left: founder photo */}
            <div className="relative overflow-hidden h-[300px] lg:h-auto lg:min-h-[560px]">
              <Image
                src="/founder-manisha-hero.jpg"
                alt="Dr Manisha Sonawane — Founder of SisterRoam, International Mountaineer, Kilimanjaro, Elbrus"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                // className="object-cover object-top"
                className="object-cover object-[center_-140px] lg:object-top"
              />
              {/* Gradient overlay at bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 px-7 py-8"
                style={{
                  background:
                    "linear-gradient(to top, rgba(93,26,139,0.85) 0%, rgba(93,26,139,0.4) 60%, transparent 100%)",
                }}
                aria-hidden="true"
              >
                <p className="text-white/60 text-xs uppercase tracking-widest mb-1">
                  International Mountaineer
                </p>
                <p className="text-white text-sm font-medium leading-relaxed">
                  ▲ Kilimanjaro 5,895m — Africa
                </p>
                <p className="text-white text-sm font-medium leading-relaxed">
                  ▲ Elbrus 5,642m — Europe
                </p>
                <p className="text-white/80 text-xs mt-2">2 of the 7 Summits</p>
              </div>
            </div>

            {/* Right: founder words */}
            <div className="bg-white flex flex-col justify-center px-8 lg:px-16 py-16 lg:py-20">
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-0.5 bg-brand shrink-0"
                  aria-hidden="true"
                />
                <p className="text-xs font-medium text-brand uppercase tracking-widest">
                  Founder&apos;s word
                </p>
              </div>

              {/* Decorative quote mark */}
              <div
                className="font-serif leading-none select-none mb-[-16px] text-gray-100"
                style={{ fontSize: 100 }}
                aria-hidden="true"
              >
                &ldquo;
              </div>

              {/* Quote */}
              <blockquote
                className="font-serif italic text-gray-800 leading-relaxed"
                style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", maxWidth: 500 }}
              >
                <p className="mb-4">
                  I have climbed Kilimanjaro and Elbrus. I have ridden my
                  motorcycle through Himalayan passes and driven across this
                  country from north to south. I have walked through six
                  countries as a doctor, an adventurer, and a woman who travels
                  alone.
                </p>
                <p>
                  Every time, I wished there was a community I could trust. A
                  verified sisterhood. SisterRoam is what I kept wishing existed
                  — so I built it.
                </p>
              </blockquote>

              {/* Attribution */}
              <div className="mt-6">
                <div className="w-12 h-0.5 bg-brand mb-5" />
                <p className="text-lg font-medium text-gray-900">
                  Dr Manisha Sonawane
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Founder &amp; Brand Ambassador, SisterRoam
                </p>
              </div>

              {/* Credential pills */}
              <div className="flex flex-wrap gap-2 mt-5">
                {[
                  {
                    label: "Homeopathic Consultant · 18 years",
                    bg: "bg-brand-lighter",
                    color: "text-brand-dark",
                  },
                  {
                    label: "Kilimanjaro & Elbrus",
                    bg: "bg-teal-lighter",
                    color: "text-teal-dark",
                  },
                  {
                    label: "NGO President",
                    bg: "bg-pink-lighter",
                    color: "text-pink-dark",
                  },
                  {
                    label: "Nutracare 360, Canada",
                    bg: "bg-amber-lighter",
                    color: "text-amber-dark",
                  },
                ].map(({ label, bg, color }) => (
                  <span
                    key={label}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium ${bg} ${color}`}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* Context sentence */}
              <p className="text-sm text-gray-500 leading-relaxed mt-4 max-w-sm">
                Mother of two. Doctor. Mountaineer. Entrepreneur. And the woman
                who built SisterRoam because every female solo traveller
                deserves a community she can trust.
              </p>

              {/* Links */}
              <div className="flex gap-5 mt-6">
                <Link
                  href="/about"
                  className="text-sm text-brand font-medium hover:underline flex items-center gap-1"
                >
                  Read her full story
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
                <Link
                  href="/signup"
                  className="text-sm text-gray-400 hover:text-brand transition-colors"
                >
                  Join SisterRoam →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── S9: Final CTA ────────────────────────────────────────────── */}
        <section
          className="bg-brand-lighter py-14 lg:py-20"
          aria-label="Call to action"
        >
          <div className="max-w-[560px] mx-auto px-6 text-center space-y-6">
            <h2 className="text-3xl font-medium text-brand-darker">
              Ready to travel fearlessly?
            </h2>
            <p className="text-brand-dark leading-relaxed">
              Join thousands of verified women hosting and staying safely around
              the world. It&apos;s free, fast, and built just for you.
            </p>
            <FinalCta />
            <p className="text-xs text-brand-light">
              No credit card required · Verified within 48 hours
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}
