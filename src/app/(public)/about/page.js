import Image from "next/image";
import Link from "next/link";
import {
  Mountain,
  Heart,
  Globe,
  Users,
  Award,
  Star,
  Bike,
  Map,
  ExternalLink,
  Trophy,
  Mail,
  Stethoscope,
} from "lucide-react";
import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";

export const metadata = {
  title: "About SisterRoam — Founded by Dr Manisha Sonawane",
  description:
    "SisterRoam was founded by Dr Manisha Sonawane — homeopathic consultant, international mountaineer who has climbed Kilimanjaro and Elbrus, NGO president, and passionate traveller — to create the safest hosting community for female solo travellers worldwide.",
  openGraph: {
    type: "profile",
    url: "https://sisterroam.com/about",
    siteName: "SisterRoam",
    title: "About SisterRoam — Dr Manisha Sonawane",
    description:
      "Meet the founder. Doctor. Mountaineer. NGO President. Two of the Seven Summits.",
    images: [{ url: "/founder-manisha-og.jpg", width: 1200, height: 630, alt: "Dr Manisha Sonawane — Founder of SisterRoam" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dr Manisha Sonawane — Founder of SisterRoam",
    description:
      "Doctor. Mountaineer. NGO President. Dr Manisha Sonawane climbed Mount Kilimanjaro and Mount Elbrus and founded SisterRoam — the verified hosting community for female solo travellers.",
    images: ["/founder-manisha-og.jpg"],
  },
  alternates: {
    canonical: "https://sisterroam.com/about",
  },
  keywords: [
    "Dr Manisha Sonawane",
    "SisterRoam founder",
    "female solo travel community",
    "Mount Kilimanjaro",
    "Mount Elbrus",
    "NIM mountaineering",
    "Shraddha Seva Pratishthan",
    "Nutracare 360",
  ],
};

// ── Static data ─────────────────────────────────────────────────────────────

const HERO_PILLS = [
  { icon: Mountain, label: "2 of 7 Summits" },
  { icon: Stethoscope, label: "18 Years in Practice" },
  { icon: Users, label: "NGO President" },
  { icon: Globe, label: "6 Countries Visited" },
];

const CREDENTIALS = [
  {
    icon: Stethoscope,
    bg: "bg-brand-lighter",
    color: "text-brand",
    label: "Homeopathic Consultant",
    desc: "Running her own clinic for 18 years · Co-founder, Nutracare 360, Canada (nutracare360.ca)",
  },
  {
    icon: Mountain,
    bg: "bg-teal-lighter",
    color: "text-teal",
    label: "International Mountaineer",
    desc: "NIM certified · Mount Kilimanjaro, Tanzania · Mount Elbrus, Russia · 2 of the 7 Summits",
  },
  {
    icon: Heart,
    bg: "bg-pink-lighter",
    color: "text-pink",
    label: "NGO President & Women's Advocate",
    desc: "President, Shraddha Seva Pratishthan · Women's empowerment, health & young girls",
  },
];

const BIO = [
  "For 18 years I have sat across from patients — mostly women — and listened to what their bodies were telling them that no one else would hear. Medicine taught me that healing is not just physical. It is community, trust, and the courage to ask for help.",
  "I started trekking at 35. Most people thought that was too late to begin. I trained at the Nehru Institute of Mountaineering in Uttarakhand, trekked across the Sahyadris and the Himalayas, then stood on top of Mount Kilimanjaro in Tanzania and Mount Elbrus in Russia. Two of the Seven Summits. And I am not done.",
  "I have travelled through Singapore, Malaysia, Thailand, Nepal, Russia, and Tanzania. I have done road trips with my family from the north to the south of India. I have ridden my Hero Xpulse 210 through mountain roads, cycled, run, and explored more places than I can count. Every journey taught me something the previous one could not.",
  "And in every country, every trail, every hostel — I met women travelling alone who deserved better. Better safety. Better community. Better tools. SisterRoam exists because I got tired of waiting for someone else to build it.",
];

const TIMELINE = [
  {
    year: "2008",
    icon: Stethoscope,
    iconBg: "bg-brand-lighter",
    iconColor: "text-brand",
    title: "Opened her clinic",
    desc: "Started her homeopathic practice. 18 years and thousands of patients later, still going strong.",
  },
  {
    year: "2009",
    icon: Heart,
    iconBg: "bg-pink-lighter",
    iconColor: "text-pink",
    title: "Founded Shraddha Seva Pratishthan",
    desc: "Established the NGO focused on women's empowerment and women's health. Became its President.",
  },
  {
    year: "2018",
    icon: Mountain,
    iconBg: "bg-teal-lighter",
    iconColor: "text-teal",
    title: "First trek at 35",
    desc: "Proved that adventure has no age limit. Started with the Sahyadris, then moved to the Himalayas.",
  },
  {
    year: "2019",
    icon: Award,
    iconBg: "bg-amber-lighter",
    iconColor: "text-amber",
    title: "NIM Certification",
    desc: "Completed professional mountaineering training at the Nehru Institute of Mountaineering, Uttarakhand — one of India's most respected mountaineering schools.",
  },
  {
    year: "2021",
    icon: Mountain,
    iconBg: "bg-teal-lighter",
    iconColor: "text-teal",
    title: "Mount Kilimanjaro, Tanzania",
    desc: "Stood on the highest peak in Africa at 5,895 metres. Summit 1 of 7.",
    badge: "5,895m · Africa's highest",
    badgeStyle: "bg-teal-lighter text-teal-dark",
  },
  {
    year: "2022",
    icon: Mountain,
    iconBg: "bg-brand-lighter",
    iconColor: "text-brand",
    title: "Mount Elbrus, Russia",
    desc: "Conquered Europe's highest peak at 5,642 metres — in Russia, one of the countries she had travelled to and loved. Summit 2 of 7.",
    badge: "5,642m · Europe's highest",
    badgeStyle: "bg-brand-lighter text-brand-dark",
  },
  {
    year: "2023",
    icon: Globe,
    iconBg: "bg-brand-lighter",
    iconColor: "text-brand",
    title: "Co-founded Nutracare 360, Canada",
    desc: "Launched Canada's Holistic Health Practitioner Directory — nutracare360.ca. Taking Indian holistic health expertise to the world.",
  },
  {
    year: "2025",
    icon: Star,
    iconBg: "bg-amber-lighter",
    iconColor: "text-amber",
    title: "Founded SisterRoam",
    desc: "Built the platform every solo female traveller needed but did not have.",
    special: true,
  },
  {
    year: "2026",
    icon: Bike,
    iconBg: "bg-amber-lighter",
    iconColor: "text-amber",
    title: "Hero Xpulse 210",
    desc: "Took on the Himalayas on two wheels. Adventure has no finish line.",
  },
];

const STATS = [
  { value: "2", label: "of 7 Summits climbed" },
  { value: "5,895m", label: "Kilimanjaro — Africa's highest" },
  { value: "6+", label: "Countries explored" },
  { value: "18", label: "Years in medical practice" },
  {
    value: "35",
    label: "Age she started trekking — proving it's never too late",
  },
  { value: "4,200+", label: "Community followers" },
];

const PHOTO_CARDS = [
  {
    bg: "bg-brand-lighter",
    icon: Mountain,
    color: "text-brand",
    label: "Kilimanjaro",
  },
  {
    bg: "bg-teal-lighter",
    icon: Mountain,
    color: "text-teal",
    label: "Elbrus",
  },
  {
    bg: "bg-amber-lighter",
    icon: Bike,
    color: "text-amber",
    label: "Xpulse 210",
  },
  {
    bg: "bg-pink-lighter",
    icon: Map,
    color: "text-pink",
    label: "India Road Trips",
  },
  {
    bg: "bg-gray-100",
    icon: Globe,
    color: "text-gray-400",
    label: "World Travels",
  },
];

const AWARDS = [
  { title: "Excellence in Medical Practice", subtitle: "Award · Organisation" },
  { title: "Women's Empowerment Leadership", subtitle: "Award · Organisation" },
  {
    title: "Adventure & Mountaineering Achievement",
    subtitle: "Award · Organisation",
  },
  { title: "Entrepreneurship Award", subtitle: "Award · Organisation" },
];

const FacebookIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <>
      <PublicNavbar />

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://sisterroam.com/#organization",
                name: "SisterRoam",
                url: "https://sisterroam.com",
                logo: "https://sisterroam.com/sisterroam-icon-512.png",
                description:
                  "The verified hosting community for female solo travellers",
                founder: { "@id": "https://sisterroam.com/#founder" },
                contactPoint: [
                  {
                    "@type": "ContactPoint",
                    email: "admin.sisterroam@gmail.com",
                    contactType: "customer service",
                  },
                  {
                    "@type": "ContactPoint",
                    email: "admin.sisterroam@gmail.com",
                    contactType: "technical support",
                  },
                ],
                sameAs: ["https://nutracare360.ca"],
              },
              {
                "@type": "Person",
                "@id": "https://sisterroam.com/#founder",
                name: "Dr Manisha Sonawane",
                jobTitle: "Founder and Brand Ambassador",
                description:
                  "Homeopathic consultant with 18 years experience, international mountaineer (Mount Kilimanjaro and Mount Elbrus), NGO president, and co-founder of Nutracare 360 Canada",
                knowsAbout: [
                  "Homeopathic medicine",
                  "Mountaineering",
                  "Women's empowerment",
                  "Solo female travel",
                  "Holistic health",
                ],
                alumniOf: {
                  "@type": "EducationalOrganization",
                  name: "Nehru Institute of Mountaineering",
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: "Uttarakhand",
                    addressCountry: "IN",
                  },
                },
                memberOf: {
                  "@type": "Organization",
                  name: "Shraddha Seva Pratishthan",
                  description: "NGO working on women's empowerment and health",
                },
              },
            ],
          }),
        }}
      />

      <main>
        {/* ── S1: Page Hero ──────────────────────────────────────────────── */}
        <section className="bg-brand py-24 md:py-20 pt-36 md:pt-28">
          <div className="max-w-3xl mx-auto text-center px-6">
            <p className="text-xs font-medium text-white/50 uppercase tracking-[0.15em] mb-4">
              Our story
            </p>
            <h1 className="text-2xl md:text-4xl font-medium text-white leading-tight">
              Born on a trail. Built for every sister who travels alone.
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mt-5 max-w-2xl mx-auto">
              SisterRoam was not built in a boardroom. It was built by a woman
              who has climbed two of the world&apos;s Seven Summits, run a
              clinic for 18 years, led an NGO for women&apos;s empowerment, and
              knows exactly what female solo travellers need — because she is
              one.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {HERO_PILLS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white border border-white/20 text-sm font-medium"
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── S2: Founder Main Section ────────────────────────────────────── */}
        <section id="founder" className="bg-white py-24 md:py-20">
          <div className="max-w-6xl mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-[42fr_58fr] gap-12 md:gap-20 items-start">
              {/* Photo column */}
              <div>
                <div
                  className="relative rounded-2xl overflow-hidden"
                  style={{ height: 540 }}
                >
                  <Image
                    src="/founder-manisha-about.jpg"
                    alt="Dr Manisha Sonawane — Founder of SisterRoam, International Mountaineer"
                    fill
                    sizes="(min-width: 768px) 42vw, 100vw"
                    className="object-cover object-top"
                    priority
                  />
                  {/* Achievement badge */}
                  <div className="absolute bottom-4 left-4 bg-white rounded-xl px-4 py-3 shadow-md">
                    <p className="text-xs font-medium text-brand uppercase tracking-wide mb-2">
                      2 of 7 Summits
                    </p>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Mountain
                        className="w-4 h-4 text-brand shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-xs text-gray-600">
                        Kilimanjaro 5,895m
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mountain
                        className="w-4 h-4 text-brand shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-xs text-gray-600">
                        Elbrus 5,642m
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700">
                    Dr Manisha Sonawane
                  </p>
                  <p className="text-xs text-gray-500">
                    Founder &amp; Brand Ambassador
                  </p>
                  <a
                    href="https://nutracare360.ca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand hover:underline"
                  >
                    SisterRoam · nutracare360.ca
                  </a>
                </div>
              </div>

              {/* Text column */}
              <div>
                <p className="text-xs font-medium text-brand uppercase tracking-widest mb-3">
                  Meet the founder
                </p>
                <h2 className="text-3xl font-medium text-gray-900">
                  Dr Manisha Sonawane
                </h2>
                <p className="text-sm text-gray-400 mt-1 mb-6">
                  43 · Pune, India · Mother of two
                </p>

                {/* Credentials */}
                <div className="flex flex-col gap-3">
                  {CREDENTIALS.map(({ icon: Icon, bg, color, label, desc }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}
                      >
                        <Icon
                          className={`w-5 h-5 ${color}`}
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                          {desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-gray-100 my-6" />

                {/* Bio */}
                <div className="space-y-4">
                  {BIO.map((para, i) => (
                    <p
                      key={i}
                      className="text-sm text-gray-600 leading-relaxed"
                    >
                      {para}
                    </p>
                  ))}
                </div>

                {/* Signature */}
                <div className="mt-6">
                  <div className="w-12 h-0.5 bg-brand my-5" />
                  <p className="font-serif text-xl italic text-brand">
                    Dr Manisha Sonawane
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Founder &amp; Brand Ambassador, SisterRoam
                  </p>
                </div>

                {/* Social proof */}
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-3">
                  <FacebookIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span>4,200+ followers and counting</span>
                </div>

                {/* Nutracare card */}
                <div className="bg-gray-50 rounded-xl px-4 py-3 mt-4 flex items-center gap-3">
                  <ExternalLink
                    className="w-3.5 h-3.5 text-gray-400 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700">
                      Co-founder of Nutracare 360, Canada
                    </p>
                    <p className="text-xs text-gray-400">
                      Canada&apos;s Holistic Health Practitioner Directory
                    </p>
                  </div>
                  <a
                    href="https://nutracare360.ca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand hover:underline shrink-0"
                  >
                    nutracare360.ca →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── S3: Achievements Timeline ───────────────────────────────────── */}
        <section id="timeline" className="bg-gray-50 py-20 md:py-20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-medium text-brand uppercase tracking-widest mb-3">
                Her journey
              </p>
              <h2 className="text-2xl font-medium text-gray-900">
                A life lived fully
              </h2>
              <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                Every achievement on this timeline shaped SisterRoam
              </p>
            </div>

            <div className="relative max-w-2xl mx-auto">
              {/* Vertical line */}
              <div
                className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-brand/20"
                aria-hidden="true"
              />

              <div className="space-y-8">
                {TIMELINE.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.year + item.title}
                      className="relative pl-10"
                    >
                      {/* Dot */}
                      <div
                        className={`absolute left-0 top-1 flex items-center justify-center rounded-full bg-brand border-2 border-white shadow-sm ${item.special ? "w-6 h-6" : "w-[22px] h-[22px]"}`}
                        aria-hidden="true"
                      >
                        <div
                          className={`rounded-full bg-white ${item.special ? "w-2.5 h-2.5" : "w-2 h-2"}`}
                        />
                      </div>

                      <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}
                          >
                            <Icon
                              className={`w-[18px] h-[18px] ${item.iconColor}`}
                              aria-hidden="true"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-brand">
                              {item.year}
                            </span>
                            <h3
                              className={`font-medium text-gray-900 mt-0.5 ${item.special ? "text-base" : "text-sm"}`}
                            >
                              {item.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                              {item.desc}
                            </p>
                            {item.badge && (
                              <span
                                className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-medium ${item.badgeStyle}`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── S4: Adventures in Numbers ───────────────────────────────────── */}
        <section className="bg-brand py-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-white text-2xl font-medium text-center mb-10">
              Dr Manisha&apos;s adventures in numbers
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
              {STATS.map(({ value, label }) => (
                <div key={value + label}>
                  <p className="text-4xl font-medium text-white">{value}</p>
                  <p className="text-white/60 text-sm mt-1 leading-tight">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── S5: Adventures Photo Strip ──────────────────────────────────── */}
        <section className="bg-white py-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-xl font-medium text-gray-900 text-center mb-8">
              From the trails to the summit
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {PHOTO_CARDS.map(({ bg, icon: Icon, color, label }) => (
                <div
                  key={label}
                  className={`${bg} rounded-xl aspect-square flex flex-col items-center justify-center gap-2 overflow-hidden`}
                >
                  <Icon className={`w-8 h-8 ${color}`} aria-hidden="true" />
                  <span className="text-xs font-medium text-gray-600">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 text-center mt-6">
              More photos coming soon · Follow Dr Manisha&apos;s journey
            </p>
          </div>
        </section>

        {/* ── S6: NGO and Empowerment ─────────────────────────────────────── */}
        <section id="ngo" className="bg-gray-50 py-20 md:py-20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              {/* Text */}
              <div>
                <p className="text-xs font-medium text-brand uppercase tracking-widest mb-3">
                  Women&apos;s empowerment
                </p>
                <h2 className="text-2xl font-medium text-gray-900">
                  Beyond the platform — Shraddha Seva Pratishthan
                </h2>
                <div className="mt-5 space-y-4 text-sm text-gray-600 leading-relaxed">
                  <p>
                    Long before SisterRoam existed, Dr Manisha was already
                    working to make the world safer and healthier for women. As
                    the President of Shraddha Seva Pratishthan, she has spent
                    years on the ground — working on women&apos;s empowerment,
                    addressing health challenges in women and young girls, and
                    building the kind of community that SisterRoam is now
                    bringing online.
                  </p>
                  <p>
                    SisterRoam is a natural extension of this work. The NGO
                    serves women in person. SisterRoam serves women who travel.
                    Both are built on the same belief: women are safer,
                    stronger, and more capable when they have a community they
                    can trust.
                  </p>
                  <p>
                    As a mother of two sons, Dr Manisha also brings a unique
                    perspective — she is raising the next generation to
                    understand and support women&apos;s independence, safety,
                    and ambition.
                  </p>
                </div>
              </div>

              {/* Cards */}
              <div>
                <div className="bg-brand rounded-2xl p-6 text-white">
                  <p className="text-lg font-medium text-white">
                    Shraddha Seva Pratishthan
                  </p>
                  <p className="text-white/70 text-sm mt-1">
                    President — Dr Manisha Sonawane
                  </p>
                  <div className="bg-white/20 h-px my-4" />
                  <ul className="space-y-2">
                    {[
                      "Women's empowerment",
                      "Women's health education",
                      "Health issues in young girls",
                      "Community outreach",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-white/80"
                      >
                        <span
                          className="w-1 h-1 rounded-full bg-white/60 shrink-0"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-4 mt-4 border border-gray-100">
                  <div className="flex items-start gap-3">
                    <Globe
                      className="w-4 h-4 text-brand shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">
                        International venture
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Co-founder, Nutracare 360 Incorporation
                      </p>
                      <p className="text-xs text-gray-500">
                        Canada&apos;s Holistic Health Practitioner Directory
                      </p>
                      <a
                        href="https://nutracare360.ca"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand hover:underline mt-1 inline-block"
                      >
                        nutracare360.ca →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── S7: Awards and Recognition ──────────────────────────────────── */}
        <section className="bg-white py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-10">
              <p className="text-xs font-medium text-brand uppercase tracking-widest mb-3">
                Recognition
              </p>
              <h2 className="text-2xl font-medium text-gray-900">
                Awards and achievements
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AWARDS.map(({ title, subtitle }) => (
                <div
                  key={title}
                  className="bg-amber-lighter rounded-2xl p-5 flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-amber" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 italic text-center mt-6">
              More achievements to be added — Dr Manisha has received multiple
              recognitions across medicine, mountaineering, and women&apos;s
              empowerment.
            </p>
          </div>
        </section>

        {/* ── S8: Why She Built SisterRoam ────────────────────────────────── */}
        <section className="bg-brand-lighter py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="text-xs font-medium text-brand uppercase tracking-widest mb-3">
              The founder&apos;s reason
            </p>
            <h2 className="text-2xl font-medium text-brand-darker mb-8">
              Why SisterRoam exists
            </h2>

            {/* Decorative quote mark */}
            <div
              className="text-brand-lighter font-serif text-9xl leading-none mb-[-20px] select-none"
              style={{ color: "#c5c3f0" }}
              aria-hidden="true"
            >
              &ldquo;
            </div>

            <blockquote className="font-serif text-lg text-brand-dark leading-relaxed italic text-left">
              <p className="mb-4">
                I have climbed Kilimanjaro and Elbrus. I have done road trips
                from one end of India to the other. I have walked through six
                countries as a traveller, a doctor, and a woman. And in every
                single place, I met women who were travelling alone and making
                do with whatever safety they could find for themselves.
              </p>
              <p className="mb-4">
                SisterRoam is what I kept wishing existed. Not a hotel booking
                site. Not a Facebook group. A real, verified, caring community
                of women who open their homes and their cities to other women
                they can trust.
              </p>
              <p>
                I built it because I am tired of waiting. And because the women
                who deserve it cannot wait any longer.
              </p>
            </blockquote>

            <div className="w-12 h-0.5 bg-brand mx-auto my-5" />
            <p className="font-serif text-base italic text-brand">
              — Dr Manisha Sonawane
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Founder, SisterRoam · President, Shraddha Seva Pratishthan
            </p>
          </div>
        </section>

        {/* ── S9: Contact ─────────────────────────────────────────────────── */}
        <section id="contact" className="bg-white py-20 md:py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="text-xs font-medium text-brand uppercase tracking-widest mb-3">
              Get in touch
            </p>
            <h2 className="text-2xl font-medium text-gray-900">
              We would love to hear from you
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mt-3 mb-10">
              Dr Manisha and the SisterRoam team read every message. Whether you
              have a question, want to share your story, or need help — we are
              here.
            </p>

            <div className="flex justify-center">
              <a
                href="mailto:admin.sisterroam@gmail.com"
                className="border border-gray-100 rounded-2xl p-6 text-center min-w-[180px] hover:border-brand-light transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-lighter flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-5 h-5 text-brand" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  General enquiries
                </p>
                <p className="text-xs text-brand mt-1">
                  admin.sisterroam@gmail.com
                </p>
              </a>
            </div>

            <div className="mt-8">
              <p className="text-xs text-gray-400">
                We typically respond within 48 hours
              </p>
            </div>
          </div>
        </section>

        {/* ── S10: Join CTA ───────────────────────────────────────────────── */}
        <section className="bg-brand py-20">
          <div className="max-w-xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-medium text-white">
              Join the community Dr Manisha built for you
            </h2>
            <p className="text-white/70 text-base leading-relaxed mt-4">
              A doctor who has climbed two of the Seven Summits built SisterRoam
              for every woman who travels alone and deserves a community she can
              trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link
                href="/signup"
                className="px-7 py-3 bg-white text-brand font-medium text-sm rounded-[10px] hover:opacity-90 transition-opacity"
              >
                Join SisterRoam — it&apos;s free
              </Link>
              <Link
                href="/browse"
                className="px-7 py-3 border border-white/50 text-white font-medium text-sm rounded-[10px] hover:bg-white/10 transition-colors"
              >
                Browse verified hosts
              </Link>
            </div>
            <p className="text-white/40 text-xs mt-4">
              No credit card required · Verified within 48 hours · 100% free to
              join
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}
