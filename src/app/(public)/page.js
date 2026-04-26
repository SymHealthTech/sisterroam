import Link from "next/link";
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
  Bike,
  Mountain,
  Activity,
  Car,
  Globe,
} from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import HostProfile from "@/models/HostProfile";
import HostingRequest from "@/models/HostingRequest";
import BlogPost from "@/models/BlogPost";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import HostCard from "@/components/host/HostCard";
import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";

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
  {
    icon: Globe,
    name: "Solo Travel",
    members: "2,300+",
    href: "/community/circles?type=solo_traveller",
  },
  {
    icon: Bike,
    name: "Cycling",
    members: "890+",
    href: "/community/circles?type=cyclist",
  },
  {
    icon: Mountain,
    name: "Trekking",
    members: "1,100+",
    href: "/community/circles?type=trekker",
  },
  {
    icon: Activity,
    name: "Running",
    members: "650+",
    href: "/community/circles?type=runner",
  },
  {
    icon: Car,
    name: "Road Trip",
    members: "420+",
    href: "/community/circles?type=road_tripper",
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
        .populate({
          path: "userId",
          match: { verificationTier: { $in: ["verified", "trusted"] } },
          select:
            "fullName profilePhotoUrl verificationTier city country languages travellerCategories averageRating totalReviews",
        })
        .limit(20)
        .lean(),
      BlogPost.find({ isPublished: true })
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
          className="relative min-h-screen flex items-center overflow-hidden"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1723764881665-5b40cea01c9b?w=1920&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
          aria-label="Hero"
        >
          {/* Brand overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-brand/95 via-brand/80 to-brand/55"
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 py-20 lg:py-0">
            {/* Desktop: 55/45 grid · Mobile: single column */}
            <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-12 lg:gap-16 items-center">
              {/* Left column */}
              <div className="space-y-8">
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
                <p className="text-white/75 text-lg leading-relaxed max-w-lg">
                  SisterRoam is the only hospitality exchange built exclusively
                  for female solo travellers. Every host is ID-verified, every
                  stay has a safety net.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-[10px] bg-white text-brand font-medium text-sm hover:bg-white/90 transition-colors"
                  >
                    Join free — it takes 2 minutes
                  </Link>
                  <Link
                    href="/browse"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-[10px] bg-transparent border border-white/50 text-white font-medium text-sm hover:bg-white/10 transition-colors"
                  >
                    Browse hosts first
                  </Link>
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
                    style={{ transform: `translateX(${i === 1 ? 24 : 0}px)` }}
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
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-7 py-3 bg-brand text-white font-medium text-sm rounded-[10px] hover:opacity-90 transition-opacity"
              >
                Get started — it&apos;s free
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
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
          className="py-14 lg:py-24 bg-gradient-to-b from-white via-brand-lighter/20 to-white"
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

        {/* ── S6: Testimonials ─────────────────────────────────────────── */}
        <section
          className="bg-brand py-14 lg:py-20"
          aria-labelledby="testimonials-title"
        >
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2
                id="testimonials-title"
                className="text-white text-3xl font-medium"
              >
                Sisters who roam, sisters who trust
              </h2>
              <p className="text-white/60 mt-3">
                Real experiences from the SisterRoam community.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TESTIMONIALS.map(({ quote, name, location }) => (
                <div
                  key={name}
                  className="bg-white/[0.08] border border-white/15 rounded-2xl p-6 space-y-4"
                >
                  {/* Stars */}
                  <div className="flex gap-0.5" aria-label="5 stars" role="img">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className="w-4 h-4 fill-amber text-amber"
                        aria-hidden="true"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote>
                    <p className="text-white/90 text-sm leading-relaxed italic">
                      &ldquo;{quote}&rdquo;
                    </p>
                  </blockquote>

                  {/* Author */}
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
              {CATEGORIES.map(({ icon: Icon, name, members, href }) => (
                <Link
                  key={name}
                  href={href}
                  className="group bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm hover:shadow-md hover:border-brand-light hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand-lighter flex items-center justify-center mx-auto mb-4 group-hover:bg-gradient-to-br group-hover:from-brand group-hover:to-brand-dark transition-all duration-200">
                    <Icon
                      className="w-6 h-6 text-brand group-hover:text-white transition-colors duration-200"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="font-semibold text-sm text-gray-900 mb-0.5">
                    {name}
                  </p>
                  <p className="text-xs text-gray-400 font-medium">{members}</p>
                  <p className="text-[10px] text-gray-400">members</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── S8: Final CTA ────────────────────────────────────────────── */}
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
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 rounded-[10px] bg-brand text-white font-medium text-sm hover:bg-brand-dark transition-colors"
              >
                Join SisterRoam — it&apos;s free
              </Link>
              <Link
                href="/signup?role=host"
                className="inline-flex items-center justify-center px-6 py-3 rounded-[10px] border-2 border-brand text-brand font-medium text-sm hover:bg-brand hover:text-white transition-colors"
              >
                Become a host
              </Link>
            </div>
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
