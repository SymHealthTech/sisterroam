import PublicNavbar from "@/components/layout/PublicNavbar";
import PublicFooter from "@/components/layout/PublicFooter";

export const metadata = {
  title: "Cookie Policy — SisterRoam",
  description: "How SisterRoam uses cookies and similar technologies.",
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

export default function CookiesPage() {
  return (
    <>
      <PublicNavbar />
      <main>
        {/* Coloured hero — covers the transparent navbar */}
        <div className="bg-brand pt-[60px]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              Cookie Policy
            </h1>
            <p className="text-sm text-white/60">Last updated: 1 May 2026</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
          <div className="space-y-10">
            <Section title="1. What are cookies?">
              <p>
                Cookies are small text files stored on your device by your
                browser when you visit a website. They allow the site to
                remember information about your visit — such as whether you are
                logged in — so you do not have to re-enter it on every page.
              </p>
            </Section>

            <Section title="2. Cookies we use">
              <p>
                SisterRoam uses only essential cookies. We do not use
                advertising, analytics, or tracking cookies.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 font-semibold text-gray-700 w-1/3">
                        Cookie
                      </th>
                      <th className="text-left py-2 pr-4 font-semibold text-gray-700 w-1/3">
                        Purpose
                      </th>
                      <th className="text-left py-2 font-semibold text-gray-700 w-1/3">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">
                        next-auth.session-token
                      </td>
                      <td className="py-2 pr-4">
                        Keeps you logged in between page loads
                      </td>
                      <td className="py-2">30 days (rolling)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">
                        next-auth.csrf-token
                      </td>
                      <td className="py-2 pr-4">
                        Protects against cross-site request forgery attacks
                      </td>
                      <td className="py-2">Session</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono text-xs">
                        next-auth.callback-url
                      </td>
                      <td className="py-2 pr-4">
                        Remembers where to redirect you after login
                      </td>
                      <td className="py-2">Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="3. Third-party cookies">
              <p>
                We do not load any third-party scripts that set their own
                cookies. Our payment provider (Cashfree) and media host
                (Cloudinary) process data on their own domains and are subject
                to their own cookie policies.
              </p>
            </Section>

            <Section title="4. Managing cookies">
              <p>
                You can control or delete cookies through your browser settings.
                Most browsers let you refuse new cookies, delete existing ones,
                or alert you before a cookie is set. Disabling our essential
                cookies will prevent you from staying logged in and using
                authenticated features of the platform.
              </p>
              <p>Useful links for common browsers:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Chrome: Settings &rarr; Privacy and security &rarr; Cookies
                  and other site data
                </li>
                <li>
                  Firefox: Settings &rarr; Privacy &amp; Security &rarr; Cookies
                  and Site Data
                </li>
                <li>
                  Safari: Preferences &rarr; Privacy &rarr; Manage Website Data
                </li>
                <li>Edge: Settings &rarr; Cookies and site permissions</li>
              </ul>
            </Section>

            <Section title="5. Changes to this policy">
              <p>
                We may update this Cookie Policy from time to time. Any changes
                will be posted on this page with an updated date. Continued use
                of SisterRoam after changes take effect constitutes your
                acceptance of the revised policy.
              </p>
            </Section>

            <Section title="6. Contact us">
              <p>
                Questions about our use of cookies? Email us at{" "}
                <a
                  href="mailto:privacy@sisterroam.com"
                  className="text-brand hover:underline"
                >
                  privacy@sisterroam.com
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
