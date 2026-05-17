import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";

export const metadata = {
  title: "Terms of Service — SisterRoam",
  description:
    "The rules and conditions that govern use of the SisterRoam platform.",
  robots: { index: true, follow: false },
  alternates: {
    canonical: "https://sisterroam.com/terms",
  },
};

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <>
      <PublicNavbar />
      <main>
        {/* Coloured hero — covers the transparent navbar */}
        <div className="bg-brand pt-[60px]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              Terms of Service
            </h1>
            <p className="text-sm text-white/60">Last updated: 1 May 2026</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
          <div className="space-y-10">
            <Section title="1. Acceptance">
              <p>
                By creating an account or using SisterRoam you agree to these
                Terms. If you do not agree, do not use the platform.
              </p>
            </Section>

            <Section title="2. Eligibility">
              <ul className="list-disc pl-5 space-y-1">
                <li>You must be at least 18 years old.</li>
                <li>
                  You must identify as a woman (cis or trans) or non-binary
                  person.
                </li>
                <li>
                  Full features are available only after completing identity
                  verification and payment of the membership fee.
                </li>
              </ul>
            </Section>

            <Section title="3. Membership tiers">
              <p>SisterRoam has three access levels:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Guest (no account):</strong> Read travel stories,
                  About, Privacy Policy, Terms, and social links.
                </li>
                <li>
                  <strong>Basic member (registered, unverified):</strong> Browse
                  and view hosts, co-traveller trips, community posts, and
                  recommendations.
                </li>
                <li>
                  <strong>
                    Verified member (identity verified + payment confirmed):
                  </strong>{" "}
                  Full access — host, message hosts, post trips, join trips,
                  post in community, write stories, add recommendations, and
                  more.
                </li>
              </ul>
            </Section>

            <Section title="4. Verification and payment">
              <p>
                To become a verified member you must submit a valid
                government-issued photo ID for manual review and pay the
                one-time or annual membership fee. SisterRoam may approve or
                reject verification at its sole discretion. Fees are
                non-refundable once verification is approved.
              </p>
            </Section>

            <Section title="5. Acceptable use">
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Provide false identity information or impersonate another
                  person
                </li>
                <li>Harass, threaten, or harm other members</li>
                <li>
                  Post discriminatory, sexually explicit, or illegal content
                </li>
                <li>
                  Use the platform for commercial solicitation without
                  permission
                </li>
                <li>
                  Attempt to scrape, reverse-engineer, or disrupt the platform
                </li>
                <li>
                  Share another member&apos;s personal data without their
                  consent
                </li>
              </ul>
            </Section>

            <Section title="6. Hosting and stays">
              <p>
                SisterRoam facilitates connections between hosts and guests but
                is not a party to any hosting arrangement. Hosts and guests are
                solely responsible for their own safety, property, and
                compliance with local laws. SisterRoam strongly recommends all
                users complete our in-app safety check-in programme.
              </p>
              <p>
                SisterRoam is not liable for any loss, injury, or damage arising
                from a stay, co-travel arrangement, or any in-person meeting
                arranged through the platform.
              </p>
            </Section>

            <Section title="7. Content">
              <p>
                You retain ownership of content you post but grant SisterRoam a
                worldwide, royalty-free licence to display, distribute, and
                promote it within the platform. We may remove content that
                violates these Terms at any time.
              </p>
            </Section>

            <Section title="8. Account suspension and termination">
              <p>
                We may suspend or permanently ban any account that violates
                these Terms or poses a safety risk to the community, with or
                without prior notice. Membership fees are non-refundable upon
                termination for policy violations.
              </p>
            </Section>

            <Section title="9. Disclaimers and limitation of liability">
              <p>
                The platform is provided &ldquo;as is&rdquo; without warranties
                of any kind. SisterRoam&apos;s total liability to you for any
                claim shall not exceed the amount you paid us in the 12 months
                preceding the claim. We are not liable for indirect, incidental,
                or consequential damages.
              </p>
            </Section>

            <Section title="10. Governing law">
              <p>
                These Terms are governed by the laws of India. Any dispute shall
                be subject to the exclusive jurisdiction of courts in Pune,
                Maharashtra.
              </p>
            </Section>

            <Section title="11. Changes">
              <p>
                We may update these Terms. Material changes will be announced by
                email or in-app notice at least 14 days before taking effect.
                Continued use after the effective date constitutes acceptance.
              </p>
              <p>
                Questions? Email{" "}
                <a
                  href="mailto:admin.sisterroam@gmail.com"
                  className="text-brand hover:underline"
                >
                  admin.sisterroam@gmail.com
                </a>
                .
              </p>
            </Section>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
