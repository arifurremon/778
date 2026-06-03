import Link from "next/link";
import { SiteFooter } from "@/components/legal/site-footer";
import {
  CURRENT_POLICY_VERSION,
  POLICY_LAST_UPDATED,
  PRIVACY_POLICY_TITLE,
} from "@/lib/legal/policy";

export const metadata = {
  title: `${PRIVACY_POLICY_TITLE} | The Chattala`,
  description: "How The Chattala collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral dark:prose-invert">
        <p className="text-sm text-muted-foreground not-prose">
          Version {CURRENT_POLICY_VERSION} · Last updated {POLICY_LAST_UPDATED}
        </p>
        <h1>{PRIVACY_POLICY_TITLE}</h1>
        <p>
          The Chattala (&quot;we&quot;, &quot;us&quot;) operates a hyperlocal community platform for
          Chittagong, Bangladesh. This Privacy Policy explains how we process personal data when
          you use our website and services.
        </p>

        <h2>1. Data We Collect</h2>
        <ul>
          <li>Account data: name, email, username, mobile, location, date of birth, profession</li>
          <li>Profile and community content: posts, comments, messages, reviews</li>
          <li>Marketplace data: shop registrations, orders, service bookings</li>
          <li>Technical data: IP address, browser user-agent, session cookies, audit logs</li>
          <li>Analytics (with consent): anonymised usage via Google Analytics</li>
        </ul>

        <h2>2. How We Use Data</h2>
        <ul>
          <li>Provide authentication, neighbourhood features, marketplace, and messaging</li>
          <li>Send transactional email (verification, password reset, notifications)</li>
          <li>Moderate content and maintain platform safety</li>
          <li>Comply with legal obligations and respond to lawful requests</li>
        </ul>

        <h2>3. Legal Basis</h2>
        <p>
          We process data based on contract performance (providing the service), legitimate
          interests (security, fraud prevention), and consent (analytics cookies, optional
          communications).
        </p>

        <h2>4. Data Sharing</h2>
        <p>
          We use trusted processors: Neon (database), Vercel (hosting), Upstash (rate limiting),
          UploadThing (media), Brevo (email), Pusher (real-time), and Sentry (error monitoring).
          We do not sell personal data.
        </p>

        <h2>5. Retention</h2>
        <ul>
          <li>Activity logs: 12 months</li>
          <li>Security audit logs: 24 months</li>
          <li>Soft-deleted accounts: purged after 30 days</li>
          <li>Order records: retained as required for legal and tax purposes</li>
        </ul>

        <h2>6. Your Rights</h2>
        <p>You may:</p>
        <ul>
          <li>Export your data via Settings → Download my data (`GET /api/user/export`)</li>
          <li>Delete your account via Settings → Delete account</li>
          <li>Update privacy settings in your profile</li>
          <li>Withdraw cookie consent at any time via the cookie banner</li>
          <li>Contact us to exercise GDPR-style rights: privacy@thechattala.com</li>
        </ul>

        <h2>7. Security</h2>
        <p>
          We use encrypted sessions, rate limiting, CSRF protection, role-based admin access, MFA
          for administrators, and audit logging. See our{" "}
          <Link href="/terms">Terms of Service</Link> for acceptable use.
        </p>

        <h2>8. Contact</h2>
        <p>
          Data controller: Inievo Technologies · privacy@thechattala.com · Chittagong, Bangladesh
        </p>

        <p className="not-prose pt-8 text-sm text-muted-foreground">
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>
          {" · "}
          <Link href="/" className="underline">
            Back to home
          </Link>
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
