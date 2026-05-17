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

// const HERO_HOSTS = [
//   {
//     name: "Ananya K.",
//     city: "Bengaluru",
//     country: "India",
//     tier: "verified",
//     femaleOnly: true,
//     rating: 4.9,
//     type: "Private room",
//   },
//   {
//     name: "Maria H.",
//     city: "Barcelona",
//     country: "Spain",
//     tier: "trusted",
//     femaleOnly: false,
//     rating: 5.0,
//     type: "Couch",
//   },
//   {
//     name: "Soo-Jin K.",
//     city: "Seoul",
//     country: "South Korea",
//     tier: "verified",
//     femaleOnly: false,
//     rating: 4.8,
//     type: "Shared room",
//     cyclingNote: true,
//   },
// ];

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

const CATEGORY_LABELS = {
  solo_travel: "Solo Travel",
  cycling: "Cycling",
  trekking: "Trekking",
  running: "Running",
  safety_experience: "Safety",
  cultural_immersion: "Culture",
  food_journey: "Food",
  budget_travel: "Budget Travel",
  tips_and_advice: "Tips",
  co_traveller_experience: "Co-Travel",
  hosting_experience: "Hosting",
  destination_guide: "Destination",
};

const STATIC_STORIES = [
  {
    _id: "static-1",
    title: "Solo in Japan: My 21-day adventure",
    slug: "stories",
    excerpt:
      "From Kyoto temples to Tokyo neon lights — how SisterRoam helped me travel Japan fearlessly.",
    coverImageUrl: null,
    category: "solo_travel",
    readTimeMinutes: 5,
    author: { fullName: "Keiko T.", profilePhotoUrl: null },
  },
  {
    _id: "static-2",
    title: "Finding home in Marrakech",
    slug: "stories",
    excerpt:
      "My host Fatima turned a strange city into the most memorable stop of my trip.",
    coverImageUrl: null,
    category: "hosting_experience",
    readTimeMinutes: 3,
    author: { fullName: "Valentina R.", profilePhotoUrl: null },
  },
  {
    _id: "static-3",
    title: "Cycling solo across Portugal",
    slug: "stories",
    excerpt:
      "1,200 km, six SisterRoam stays, and the kindest women I have ever met on the road.",
    coverImageUrl: null,
    category: "cycling",
    readTimeMinutes: 7,
    author: { fullName: "Amara O.", profilePhotoUrl: null },
  },
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
        .sort({ createdAt: -1 })
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

    const recentStories = recentPosts.map((s) => ({
      _id: s._id.toString(),
      title: s.title,
      slug: s.slug,
      excerpt: s.excerpt ?? null,
      coverImageUrl: s.coverImageUrl ?? null,
      category: s.category ?? null,
      readTimeMinutes: s.readTimeMinutes ?? null,
      publishedAt: s.publishedAt?.toISOString() ?? null,
      author: s.authorId
        ? {
            fullName: s.authorId.fullName,
            profilePhotoUrl: s.authorId.profilePhotoUrl ?? null,
          }
        : null,
    }));

    return {
      stats: {
        memberCount,
        countriesCount: countriesList.length,
        staysCount,
        activeHostCount,
      },
      featuredHosts,
      recentStories,
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
      recentStories: [],
    };
  }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { stats, featuredHosts, recentStories } = await getPageData();
  const stories = recentStories.length > 0 ? recentStories : STATIC_STORIES;

  return (
    <>
      <PublicNavbar />

      <main>
        {/* ── S1: Hero ─────────────────────────────────────────────────── */}
        <section
          className="relative min-h-[560px] lg:min-h-[640px] flex items-center overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80)",
          }}
          aria-label="Hero"
        >
          {/* Mobile overlay — brand purple, left-heavy */}
          <div
            className="absolute inset-0 lg:hidden"
            style={{
              background:
                "linear-gradient(to right, rgba(61,17,96,0.97) 0%, rgba(74,21,114,0.88) 50%, rgba(93,26,139,0.58) 100%)",
            }}
            aria-hidden="true"
          />
          {/* Desktop overlay — brand fade, photo breathes on the right */}
          <div
            className="absolute inset-0 hidden lg:block"
            style={{
              background:
                "linear-gradient(to right, rgba(61,17,96,0.97) 0%, rgba(74,21,114,0.92) 30%, rgba(93,26,139,0.70) 56%, rgba(93,26,139,0.18) 100%)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 pt-22 pb-14 lg:py-0">
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
                    ? `${stats.memberCount.toLocaleString()}+ verified women in ${stats.countriesCount} countries`
                    : "A verified sisterhood for female solo travellers"}
                </div>

                {/* Headline */}
                <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-medium leading-tight">
                  Stay with verified women.
                  <br />
                  Host fearless sisters.
                </h1>

                {/* Value prop */}
                <p className="text-white/75 text-sm md:text-base lg:text-lg leading-relaxed max-w-lg">
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

              {/* Right column — community showcase (desktop only) */}
              <div className="hidden lg:flex flex-col gap-3.5 py-8">
                {/* Card 1: Verified community stats */}
                <div className="bg-white/[0.08] backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white/50 text-[11px] font-semibold uppercase tracking-wider">
                      Verified Sisters
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-teal shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-white/40 text-[10px]">
                        Growing daily
                      </span>
                    </div>
                  </div>
                  {/* Avatar stack */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex -space-x-2.5">
                      {[
                        { label: "A", hue: 270 },
                        { label: "P", hue: 295 },
                        { label: "K", hue: 250 },
                        { label: "M", hue: 315 },
                        { label: "S", hue: 235 },
                      ].map(({ label, hue }) => (
                        <div
                          key={label}
                          className="w-9 h-9 rounded-full border-2 border-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{
                            background: `hsl(${hue}, 55%, 46%)`,
                          }}
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-white/55 text-xs leading-relaxed">
                    Verified female solo travellers from across the globe
                  </p>
                </div>

                {/* Card 2: Trust score */}
                <div className="bg-white/[0.08] backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
                  <div className="w-12 h-12 rounded-xl bg-teal/20 border border-teal/25 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold">
                      ID-Verified hosts only
                    </p>
                    <p className="text-white/45 text-xs mt-0.5 leading-relaxed">
                      Every host verified before their first guest
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-0.5 justify-end">
                      <Star
                        className="w-3.5 h-3.5 fill-amber text-amber"
                        aria-hidden="true"
                      />
                      <span className="text-white text-sm font-bold">4.9</span>
                    </div>
                    <p className="text-white/35 text-[10px] mt-0.5">
                      avg. rating
                    </p>
                  </div>
                </div>

                {/* Card 3: Find hosts in */}
                <div className="bg-white/[0.08] backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin
                      className="w-3 h-3 text-white/40 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-white/60 text-[11px] font-semibold uppercase tracking-wider">
                      Find verified hosts in
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Mumbai",
                      "Delhi",
                      "Bengaluru",
                      "Barcelona",
                      "Paris",
                      "London",
                      "Tokyo",
                      "Seoul",
                      "Bali",
                      "Istanbul",
                      "Cape Town",
                      "New York",
                      "Berlin",
                      "Sydney",
                      "Lisbon",
                    ].map((city) => (
                      <span
                        key={city}
                        className="text-[10px] font-medium text-white/70 bg-white/10 px-2 py-0.5 rounded-full"
                      >
                        {city}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── S2: Stats bar ────────────────────────────────────────────── */}
        {/* hidden — enable once real DB values are populated */}
        <section
          className="hidden bg-gray-50 py-8"
          aria-label="Community stats"
        >
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

        {/* ── S3: How it works / All Features ─────────────────────── */}
        <section
          id="how-it-works"
          className="py-14 lg:py-24 bg-gradient-to-b from-white via-brand-lighter/20 to-white"
          aria-labelledby="how-title"
        >
          <div className="max-w-6xl mx-auto px-6">
            {/* Header */}
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 bg-brand-lighter text-brand text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-brand shrink-0"
                  aria-hidden="true"
                />
                Everything you need
              </span>
              <h2 id="how-title" className="text-3xl font-medium text-gray-900">
                Your complete travel companion
              </h2>
              <p className="text-gray-500 mt-3 max-w-lg mx-auto leading-relaxed">
                From finding a verified host to sharing your story — every tool
                a female solo traveller needs, in one safe community.
              </p>
            </div>

            {/* Bento feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* 1. Host & Guest — large brand card */}
              <div className="sm:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-brand to-brand-dark p-8 min-h-[220px] flex flex-col justify-between">
                <div
                  className="absolute top-0 right-0 w-56 h-56 rounded-full bg-white/5 translate-x-1/3 -translate-y-1/3 pointer-events-none"
                  aria-hidden="true"
                />
                <div
                  className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/5 -translate-x-1/3 translate-y-1/3 pointer-events-none"
                  aria-hidden="true"
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                      <Home className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                      <Users
                        className="w-5 h-5 text-white"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="ml-2 text-white/50 text-[11px] font-bold uppercase tracking-widest">
                      Host &amp; Guest
                    </span>
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">
                    Stay with verified sisters. Host fearlessly.
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed max-w-sm">
                    Open your home to verified female travellers, or find a
                    sister host in any city worldwide. A 100% free hospitality
                    exchange built on trust.
                  </p>
                </div>
              </div>

              {/* 2. Safety */}
              <div className="relative rounded-2xl bg-white border border-gray-100 shadow-sm p-7 flex flex-col gap-5">
                <div className="w-11 h-11 rounded-xl bg-danger-lighter flex items-center justify-center">
                  <Shield className="w-5 h-5 text-danger" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 text-base font-semibold mb-1.5">
                    Safety First
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">
                    Multiple layers of protection so you can focus on the
                    adventure.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      "ID-verified hosts",
                      "One-tap SOS button",
                      "Daily safety check-ins",
                      "Female-only filter",
                    ].map((pt) => (
                      <li
                        key={pt}
                        className="flex items-center gap-2 text-xs text-gray-600"
                      >
                        <CheckCircle
                          className="w-3.5 h-3.5 text-teal shrink-0"
                          aria-hidden="true"
                        />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 3. Find a Co-traveller */}
              <div className="relative rounded-2xl bg-white border border-gray-100 shadow-sm p-7 flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl bg-teal-lighter flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-teal" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-gray-900 text-base font-semibold mb-1.5">
                    Find a Co-traveller
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Post your trip and match with verified sisters who share
                    your destination and travel vibe.
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  {["Bali", "Nepal", "Morocco", "Portugal"].map((dest) => (
                    <span
                      key={dest}
                      className="text-xs px-2.5 py-1 bg-teal-lighter text-teal rounded-full font-medium"
                    >
                      {dest}
                    </span>
                  ))}
                </div>
              </div>

              {/* 4. Community Messages */}
              <div className="relative rounded-2xl bg-white border border-gray-100 shadow-sm p-7 flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl bg-brand-lighter flex items-center justify-center">
                  <Globe className="w-5 h-5 text-brand" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-gray-900 text-base font-semibold mb-1.5">
                    Community Feed
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Post updates, ask for advice, and join travel-topic groups
                    with sisters around the world.
                  </p>
                </div>
                {/* Mini post preview */}
                <div className="mt-auto bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-brand-lighter flex items-center justify-center shrink-0">
                      <span className="text-brand text-[9px] font-bold">A</span>
                    </div>
                    <span className="text-[11px] font-medium text-gray-700">
                      Ananya · Solo Travel
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    &ldquo;Best solo-friendly cafes in Lisbon?&rdquo;
                  </p>
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-[10px] text-gray-400">24 likes</span>
                    <span className="text-[10px] text-gray-400">8 replies</span>
                  </div>
                </div>
              </div>

              {/* 5. Private Messaging */}
              <div className="relative rounded-2xl bg-white border border-gray-100 shadow-sm p-7 flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl bg-teal-lighter flex items-center justify-center">
                  <MessageCircle
                    className="w-5 h-5 text-teal"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="text-gray-900 text-base font-semibold mb-1.5">
                    Private Messaging
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Chat privately with your host, co-traveller, or any sister
                    you connect with — safe and in-app.
                  </p>
                </div>
                {/* Mini chat preview */}
                <div className="mt-auto space-y-2">
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-700 text-xs px-3 py-2 rounded-2xl rounded-tl-sm max-w-[85%] leading-relaxed">
                      Are you coming to Barcelona?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-brand text-white text-xs px-3 py-2 rounded-2xl rounded-tr-sm max-w-[85%] leading-relaxed">
                      Yes! Arriving Friday. Can&apos;t wait!
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Place Recommendations */}
              <div className="relative rounded-2xl bg-white border border-gray-100 shadow-sm p-7 flex flex-col gap-4">
                <div className="w-11 h-11 rounded-xl bg-pink-lighter flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-pink" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-gray-900 text-base font-semibold mb-1.5">
                    Place Recommendations
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Real tips on stays, food, transport, and safety — curated by
                    sisters who have actually been there.
                  </p>
                </div>
                <div className="mt-auto flex flex-col gap-2">
                  {[
                    "Safe guesthouses in Tbilisi",
                    "Night transport tips — Hanoi",
                    "Sister-approved cafes in Lisbon",
                  ].map((tip) => (
                    <div
                      key={tip}
                      className="flex items-center gap-1.5 text-xs text-gray-600"
                    >
                      <MapPin
                        className="w-3 h-3 text-pink shrink-0"
                        aria-hidden="true"
                      />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Travel Stories — large card */}
              <div className="sm:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-lighter/60 via-pink-lighter/30 to-white border border-pink-lighter p-8 flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center mb-5">
                    <BookOpen
                      className="w-5 h-5 text-pink"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-gray-900 text-xl font-semibold mb-2">
                    Travel Stories
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                    Authentic experiences written by verified female solo
                    travellers. Get inspired, share your journey, and learn from
                    sisters who have been where you are going.
                  </p>
                </div>
                {/* Story preview cards */}
                <div className="flex flex-col gap-3 sm:w-64 shrink-0 self-center">
                  {[
                    {
                      title: "Solo in Japan: The 21-day itinerary",
                      author: "Keiko T.",
                      read: "5 min",
                    },
                    {
                      title: "How I found a home in Marrakech",
                      author: "Valentina R.",
                      read: "3 min",
                    },
                  ].map((story) => (
                    <div
                      key={story.title}
                      className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
                    >
                      <p className="text-xs font-semibold text-gray-800 leading-snug mb-2">
                        {story.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <span>{story.author}</span>
                        <span>·</span>
                        <span>{story.read} read</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                  <HostCard key={host._id} host={host} blurred />
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
                          className="ring-4 ring-white shadow-sm blur-[2px]"
                        />
                      </div>
                    </div>
                    <div className="pt-10 pb-5 px-5 space-y-3 text-center">
                      <p className="font-semibold text-gray-900">
                        {h.name.slice(0, Math.ceil(h.name.length / 2))}
                        <span
                          className="blur-[2px] select-none"
                          aria-hidden="true"
                        >
                          {h.name.slice(Math.ceil(h.name.length / 2))}
                        </span>
                      </p>
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

        {/* ── S7: Travel stories ───────────────────────────────────────── */}
        <section
          className="py-14 lg:py-24 bg-gradient-to-b from-gray-50 to-white"
          aria-labelledby="stories-title"
        >
          <div className="max-w-5xl mx-auto px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <span className="inline-flex items-center gap-2 bg-pink-lighter text-pink text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
                  <BookOpen className="w-3 h-3" aria-hidden="true" />
                  Travel Stories
                </span>
                <h2
                  id="stories-title"
                  className="text-3xl font-medium text-gray-900"
                >
                  Real Roads. Real Women. Real Stories.
                </h2>
                <p className="text-gray-500 mt-2 max-w-md leading-relaxed">
                  Authentic journeys written by verified female solo travellers.
                  Get inspired before your next adventure.
                </p>
              </div>
              <Link
                href="/stories"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 border-2 border-brand text-brand font-medium text-sm rounded-[10px] hover:bg-brand hover:text-white transition-colors shrink-0"
              >
                Show more stories
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            {/* Story cards grid — 2 on mobile, 3 on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {stories.map((story, i) => (
                <Link
                  key={story._id}
                  href={`/stories/${story.slug}`}
                  className={`group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200${i === 2 ? " hidden lg:block" : ""}`}
                >
                  {/* Cover */}
                  <div className="h-36 sm:h-44 relative overflow-hidden">
                    {story.coverImageUrl ? (
                      <Image
                        src={story.coverImageUrl}
                        alt={story.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(min-width: 1024px) 33vw, 50vw"
                      />
                    ) : (
                      <div
                        className={`absolute inset-0 ${
                          i === 0
                            ? "bg-gradient-to-br from-brand-lighter via-brand-lighter/60 to-pink-lighter"
                            : i === 1
                            ? "bg-gradient-to-br from-teal-lighter via-teal-lighter/60 to-brand-lighter"
                            : "bg-gradient-to-br from-pink-lighter via-pink-lighter/60 to-teal-lighter"
                        }`}
                      />
                    )}
                    {story.category && (
                      <span className="absolute top-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-brand">
                        {CATEGORY_LABELS[story.category] ?? story.category}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-brand transition-colors">
                      {story.title}
                    </h3>
                    {story.excerpt && (
                      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3 hidden sm:block">
                        {story.excerpt}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Avatar
                          name={story.author?.fullName ?? "Sister"}
                          src={story.author?.profilePhotoUrl}
                          size="xs"
                        />
                        <span className="text-xs text-gray-600 truncate max-w-[80px] sm:max-w-none">
                          {story.author?.fullName ?? "Sister"}
                        </span>
                      </div>
                      {story.readTimeMinutes && (
                        <span className="text-[11px] text-gray-400 shrink-0">
                          {story.readTimeMinutes} min
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Mobile CTA */}
            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/stories"
                className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-brand text-brand font-medium text-sm rounded-[10px] hover:bg-brand hover:text-white transition-colors"
              >
                Show more stories
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
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
                  I have climbed Mt. Kilimanjaro and Mt. Elbrus. I have done
                  road-trips across this country from Manali to Kanyakumari by
                  our car. I have walked through six countries as a doctor, an
                  adventurer, and a woman who travels alone.
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

        {/* ── Pricing / Verification ───────────────────────────────────── */}
        <section aria-labelledby="pricing-title" className="bg-gray-50">
          <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] min-h-[580px]">
            {/* Left: pricing content */}
            <div className="bg-gray-50 flex flex-col justify-center px-8 lg:px-14 py-14 lg:py-20">
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-0.5 bg-brand shrink-0"
                  aria-hidden="true"
                />
                <p className="text-[10px] font-bold text-brand uppercase tracking-widest">
                  One-time verification fee
                </p>
              </div>

              <h2
                id="pricing-title"
                className="text-2xl lg:text-3xl font-medium text-gray-900 mb-3 leading-snug"
              >
                One small step for safety.
                <br />
                One giant leap for sisterhood.
              </h2>

              <p className="text-gray-500 text-sm leading-relaxed max-w-md mb-8">
                A small one-time fee covers real identity verification — keeping
                every member genuine and every connection trustworthy. No
                subscriptions, no hidden charges, full transparency.
              </p>

              {/* Pricing cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {/* India */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white">
                  <div
                    className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/5 translate-x-1/3 -translate-y-1/3 pointer-events-none"
                    aria-hidden="true"
                  />
                  <p className="text-white/60 text-[11px] font-semibold uppercase tracking-wider mb-2">
                    India
                  </p>
                  <p className="text-4xl font-bold leading-none mb-1">₹199</p>
                  <p className="text-white/60 text-xs mb-5">
                    one-time · lifetime verified status
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Government ID verification",
                      "Verified profile badge",
                      "Full community access",
                      "SOS button & safety check-ins",
                    ].map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-xs text-white/85"
                      >
                        <CheckCircle
                          className="w-3.5 h-3.5 text-white shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* International */}
                <div className="relative overflow-hidden rounded-2xl bg-white border-2 border-brand p-6">
                  <div
                    className="absolute top-0 right-0 w-28 h-28 rounded-full bg-brand-lighter/60 translate-x-1/3 -translate-y-1/3 pointer-events-none"
                    aria-hidden="true"
                  />
                  <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider mb-2">
                    Outside India
                  </p>
                  <p className="text-4xl font-bold leading-none text-brand mb-1">
                    $5
                  </p>
                  <p className="text-gray-400 text-xs mb-5">
                    one-time · lifetime verified status
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Government ID verification",
                      "Verified profile badge",
                      "Full community access",
                      "SOS button & safety check-ins",
                    ].map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-xs text-gray-600"
                      >
                        <CheckCircle
                          className="w-3.5 h-3.5 text-teal shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Community appeal strip */}
              <div className="bg-brand-lighter rounded-2xl px-5 py-4 mb-6">
                <p className="text-brand-dark text-sm font-semibold mb-1">
                  Be among the first verified sisters
                </p>
                <p className="text-brand-dark/70 text-xs leading-relaxed">
                  Every verification builds a safer, stronger community. Be part
                  of the movement that proves women can travel fearlessly —
                  together.
                </p>
              </div>
            </div>

            {/* Right: solo female traveller image */}
            <div
              className="relative h-[300px] lg:h-auto overflow-hidden order-first lg:order-last"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=900&q=80)",
                backgroundSize: "cover",
                backgroundPosition: "center 70%",
              }}
              role="img"
              aria-label="A female solo traveller on an adventure"
            >
              {/* Left-edge fade into gray-50 on desktop */}
              <div
                className="absolute inset-y-0 left-0 w-24 hidden lg:block"
                style={{
                  background:
                    "linear-gradient(to left, transparent, rgb(249,250,251))",
                }}
                aria-hidden="true"
              />
              {/* Bottom fade for mobile */}
              <div
                className="absolute inset-x-0 bottom-0 h-20 lg:hidden"
                style={{
                  background:
                    "linear-gradient(to top, rgb(249,250,251), transparent)",
                }}
                aria-hidden="true"
              />
              {/* Floating goal badge — desktop only */}
              <div className="hidden lg:block absolute bottom-6 right-6 lg:left-auto lg:max-w-[240px]">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg border border-white/60">
                  <p className="text-brand text-[10px] font-bold uppercase tracking-widest mb-1">
                    Community Goal
                  </p>
                  <p className="text-gray-900 text-sm font-semibold leading-snug">
                    Building a verified sisterhood worldwide
                  </p>
                  <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                    Be among the first to join and shape this community.
                  </p>
                </div>
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
