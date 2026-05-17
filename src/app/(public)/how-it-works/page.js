import Link from "next/link";
import { UserPlus, Search, Home, Shield, CheckCircle, ArrowRight } from "lucide-react";
import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";

export const metadata = {
  title: "How SisterRoam Works — Join the Women Travel Community",
  description:
    "Learn how SisterRoam connects verified female solo travellers with trusted women hosts worldwide. Sign up, get verified, and start your fearless journey.",
  openGraph: {
    type: "website",
    url: "https://sisterroam.com/how-it-works",
    siteName: "SisterRoam",
    title: "How SisterRoam Works — Join the Women Travel Community",
    description:
      "Learn how SisterRoam connects verified female solo travellers with trusted women hosts worldwide.",
    images: [{ url: "/sisterroam-og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How SisterRoam Works — Women Travel Community",
    description: "Learn how SisterRoam connects verified female solo travellers with trusted women hosts worldwide.",
    images: ["/sisterroam-og-image.png"],
  },
  alternates: {
    canonical: "https://sisterroam.com/how-it-works",
  },
};

const STEPS = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create your free profile",
    desc: "Sign up with your email or Google account. Tell us about yourself, your travel style, and what you're looking for. It takes less than 3 minutes.",
  },
  {
    icon: Shield,
    step: "02",
    title: "Get verified",
    desc: "Submit a government-issued ID and a short intro video. Our team reviews your documents within 48 hours and grants you the verified badge.",
  },
  {
    icon: Search,
    step: "03",
    title: "Find a sister host",
    desc: "Browse verified women hosts by city, dates, and traveller type. Filter for female-only homes and preferred languages. Every host is ID-verified.",
  },
  {
    icon: Home,
    step: "04",
    title: "Stay safe and connected",
    desc: "Use the in-app SOS button, daily safety check-ins, and our community throughout your stay. Your emergency contacts are always just one tap away.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen">
        {/* Hero */}
        <section className="bg-brand pt-[60px] pb-16">
          <div className="max-w-3xl mx-auto text-center px-6 pt-10">
            <h1 className="text-3xl md:text-4xl font-medium text-white leading-tight">
              How SisterRoam Works
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mt-4 max-w-xl mx-auto">
              A verified community built entirely for female solo travellers. Safe, simple, and free to join.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {STEPS.map(({ icon: Icon, step, title, desc }) => (
                <div key={step} className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-lighter flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-brand" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand uppercase tracking-widest mb-1">Step {step}</p>
                    <h2 className="text-base font-semibold text-gray-900 mb-2">{title}</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-medium text-gray-900 mb-4">Safety is built in, not bolted on</h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              Every single feature in SisterRoam was designed with safety as the first priority — not an afterthought.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {[
                { label: "ID-verified hosts", desc: "Government ID checked by our team before any hosting begins." },
                { label: "One-tap SOS", desc: "Instantly alert your emergency contacts and our safety team." },
                { label: "Daily check-ins", desc: "Automated check-ins during stays. No reply triggers an alert." },
              ].map(({ label, desc }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-teal shrink-0" aria-hidden="true" />
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3 bg-brand text-white font-medium text-sm rounded-[10px] hover:bg-brand-dark transition-colors"
            >
              Join SisterRoam — it&apos;s free
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
