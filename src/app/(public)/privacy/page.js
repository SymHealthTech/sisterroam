import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";

export const metadata = {
  title: "Privacy Policy — SisterRoam",
  description:
    "How SisterRoam collects, uses, and protects your personal data. Your privacy matters to our women travel community.",
  robots: { index: true, follow: false },
  alternates: {
    canonical: "https://sisterroam.com/privacy",
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

export default function PrivacyPage() {
  return (
    <>
      <PublicNavbar />
      <main>
        {/* Coloured hero — covers the transparent navbar */}
        <div className="bg-brand pt-[60px]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              Privacy Policy
            </h1>
            <p className="text-sm text-white/60">Last updated: 1 May 2026</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
          <div className="space-y-10">
            <Section title="1. Who we are">
              <p>
                SisterRoam is a verified hospitality-exchange community for
                female solo travellers, operated by Sym Healthtech. When this
                policy says &ldquo;SisterRoam&rdquo;, &ldquo;we&rdquo;,
                &ldquo;us&rdquo;, or &ldquo;our&rdquo;, it refers to Sym
                Healthtech and the SisterRoam platform.
              </p>
              <p>
                For privacy questions contact us at{" "}
                <a
                  href="mailto:admin.sisterroam@gmail.com"
                  className="text-brand hover:underline"
                >
                  admin.sisterroam@gmail.com
                </a>
                .
              </p>
            </Section>

            <Section title="2. Information we collect">
              <p>We collect information you provide directly, including:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Account details: name, email address, password (hashed)</li>
                <li>
                  Profile information: photo, bio, city, country, languages,
                  travel style
                </li>
                <li>
                  Identity documents submitted for verification (stored securely
                  via Cloudinary)
                </li>
                <li>
                  Emergency contact details you provide when making or accepting
                  hosting requests
                </li>
                <li>
                  Content you create: community posts, stories, recommendations,
                  messages
                </li>
                <li>
                  Payment information processed securely by our payment provider
                  — we do not store card details
                </li>
              </ul>
              <p>
                We also collect usage data automatically, including device type,
                browser, pages visited, and IP address.
              </p>
            </Section>

            <Section title="3. How we use your information">
              <ul className="list-disc pl-5 space-y-1">
                <li>To operate, maintain, and improve the platform</li>
                <li>
                  To verify your identity and grant the verified member badge
                </li>
                <li>
                  To facilitate hosting requests, co-traveller matching, and
                  messaging
                </li>
                <li>To send safety check-ins during active stays</li>
                <li>
                  To notify emergency contacts only in a genuine emergency
                </li>
                <li>
                  To send transactional emails (request notifications,
                  verification updates)
                </li>
                <li>To detect fraud, abuse, and safety violations</li>
                <li>To comply with legal obligations</li>
              </ul>
            </Section>

            <Section title="4. Who we share your data with">
              <p>We do not sell your personal data. We share it only with:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Other members</strong> — your public profile (name,
                  photo, city, bio, verification badge) is visible to logged-in
                  members.
                </li>
                <li>
                  <strong>Service providers</strong> — Cloudinary (media
                  storage), Resend (transactional email), Pusher (real-time
                  messaging), Vercel (hosting), MongoDB Atlas (database).
                </li>
                <li>
                  <strong>Law enforcement</strong> — only when required by law
                  or to protect safety.
                </li>
              </ul>
            </Section>

            <Section title="5. Data retention">
              <p>
                We retain your account data for as long as your account is
                active. If you delete your account, we remove your personal data
                within 30 days, except where retention is required by law or to
                resolve disputes.
              </p>
              <p>
                Identity documents submitted for verification are deleted from
                our systems within 90 days of a decision being made.
              </p>
            </Section>

            <Section title="6. Security">
              <p>
                We use industry-standard security measures including HTTPS
                everywhere, bcrypt password hashing, strict CORS headers, and
                role-based access controls. No method of transmission over the
                internet is 100% secure, but we take all reasonable precautions.
              </p>
            </Section>

            <Section title="7. Your rights">
              <p>Depending on your location you may have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to or restrict certain processing</li>
                <li>Data portability</li>
              </ul>
              <p>
                To exercise any of these rights email{" "}
                <a
                  href="mailto:admin.sisterroam@gmail.com"
                  className="text-brand hover:underline"
                >
                  admin.sisterroam@gmail.com
                </a>
                .
              </p>
            </Section>

            <Section title="8. Cookies">
              <p>
                We use essential cookies to keep you logged in and a session
                cookie for CSRF protection. We do not use advertising or
                tracking cookies. You can disable cookies in your browser
                settings, but this will prevent you from logging in.
              </p>
            </Section>

            <Section title="9. Children">
              <p>
                SisterRoam is not directed at children under 18. If we become
                aware that a child has created an account, we will delete it
                promptly.
              </p>
            </Section>

            <Section title="10. Changes to this policy">
              <p>
                We may update this policy occasionally. We will notify you by
                email or in-app banner for material changes. Continued use of
                the platform after changes take effect constitutes acceptance.
              </p>
            </Section>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
