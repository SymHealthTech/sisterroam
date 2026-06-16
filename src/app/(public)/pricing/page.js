import Link from "next/link";
import { CheckCircle, Shield, ArrowRight } from "lucide-react";
import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";

export const metadata = {
  title: "Pricing — Verification Fee for Female Solo Travellers — SisterRoam",
  description:
    "One small one-time fee for lifetime verified status. ₹199 for India, $5 internationally. No subscriptions, no hidden charges. SisterRoam is free to join.",
  openGraph: {
    type: "website",
    url: "https://sisterroam.com/pricing",
    siteName: "SisterRoam",
    title: "Pricing — One-Time Verification Fee — SisterRoam",
    description:
      "One small one-time fee for lifetime verified status. ₹199 for India, $5 internationally. Free to join.",
    images: [{ url: "/sisterroam-og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — One-Time Verification Fee — SisterRoam",
    description: "₹199 for India · $5 internationally. One-time, lifetime verified status. Free to join SisterRoam.",
    images: ["/sisterroam-og-image.png"],
  },
  alternates: {
    canonical: "https://sisterroam.com/pricing",
  },
};

const FEATURES = [
  "Government ID verification",
  "Verified profile badge",
  "Full community access",
  "Host & guest matching",
  "SOS button & safety check-ins",
  "Co-traveller matching",
  "Place recommendations",
  "Travel stories",
  "Private messaging",
];

export default function PricingPage() {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen">
        {/* Hero */}
        <section className="bg-brand pt-[60px] pb-16">
          <div className="max-w-3xl mx-auto text-center px-6 pt-10">
            <h1 className="text-3xl md:text-4xl font-medium text-white leading-tight">
              Simple, transparent pricing
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mt-4 max-w-xl mx-auto">
              One small one-time fee for a lifetime verified status. No subscriptions, no hidden charges.
            </p>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              {/* India */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-8 text-white">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">India</p>
                <p className="text-5xl font-bold leading-none mb-1">₹199</p>
                <p className="text-white/60 text-sm mb-6">one-time · lifetime verified status</p>
                <ul className="space-y-2.5 mb-8">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/85">
                      <CheckCircle className="w-4 h-4 text-white shrink-0 mt-0.5" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block text-center py-3 bg-white text-brand font-semibold text-sm rounded-[10px] hover:opacity-90 transition-opacity"
                >
                  Join for ₹199
                </Link>
              </div>

              {/* International */}
              <div className="relative overflow-hidden rounded-2xl bg-white border-2 border-brand p-8">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Outside India</p>
                <p className="text-5xl font-bold leading-none text-brand mb-1">$5</p>
                <p className="text-gray-400 text-sm mb-6">one-time · lifetime verified status</p>
                <ul className="space-y-2.5 mb-8">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-teal shrink-0 mt-0.5" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block text-center py-3 bg-brand text-white font-semibold text-sm rounded-[10px] hover:bg-brand-dark transition-colors"
                >
                  Join for $5
                </Link>
              </div>
            </div>

            {/* FAQ */}
            <div className="space-y-5">
              <h2 className="text-xl font-medium text-gray-900 text-center mb-6">Frequently asked questions</h2>
              {[
                {
                  q: "Why is there a fee at all?",
                  a: "The small one-time fee covers real identity verification — keeping every member genuine and every connection trustworthy. It's a safety mechanism, not a profit model.",
                },
                {
                  q: "Is SisterRoam free to use after paying?",
                  a: "Yes. After your one-time verification fee, the entire platform is free forever — hosting, requesting stays, messaging, co-traveller matching, and everything else.",
                },
                {
                  q: "Can I browse before paying?",
                  a: "Yes. You can sign up for free, browse verified hosts, and share posts & comments in the community. The verification fee is only required to send stay requests or message other members.",
                },
                {
                  q: "What payment methods are accepted?",
                  a: "We accept all major credit and debit cards, UPI (India), and other popular payment methods via our secure payment provider.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{q}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <div className="inline-flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Shield className="w-4 h-4 text-teal shrink-0" aria-hidden="true" />
                Secure payment · No subscriptions · Cancel anytime
              </div>
              <div>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-7 py-3 bg-brand text-white font-medium text-sm rounded-[10px] hover:bg-brand-dark transition-colors"
                >
                  Join SisterRoam today
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
