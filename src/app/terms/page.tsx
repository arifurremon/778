import Link from "next/link";
import { SiteFooter } from "@/components/legal/site-footer";
import {
  CURRENT_POLICY_VERSION,
  POLICY_LAST_UPDATED,
  TERMS_OF_SERVICE_TITLE,
} from "@/lib/legal/policy";

export const metadata = {
  title: `${TERMS_OF_SERVICE_TITLE} | The Chattala`,
  description: "Terms governing use of The Chattala platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral dark:prose-invert">
        <p className="text-sm text-muted-foreground not-prose">
          Version {CURRENT_POLICY_VERSION} · Last updated {POLICY_LAST_UPDATED}
        </p>
        <h1>{TERMS_OF_SERVICE_TITLE}</h1>
        <p>
          By creating an account or using The Chattala, you agree to these Terms. If you do not
          agree, do not use the service.
        </p>

        <h2>1. Eligibility</h2>
        <p>You must be at least 16 years old and provide accurate registration information.</p>

        <h2>2. Acceptable Use</h2>
        <ul>
          <li>Do not post illegal, hateful, fraudulent, or harmful content</li>
          <li>Do not harass neighbours or impersonate others</li>
          <li>Do not attempt to bypass security controls or scrape the platform</li>
          <li>Shop and expert providers must comply with local laws and licensing requirements</li>
        </ul>

        <h2>3. User Content</h2>
        <p>
          You retain ownership of content you post. You grant The Chattala a licence to host,
          display, and moderate that content to operate the service.
        </p>

        <h2>4. Marketplace</h2>
        <p>
          Sellers and experts are independent providers. The Chattala facilitates discovery and
          communication but is not a party to offline transactions unless explicitly stated.
        </p>

        <h2>5. Account Termination</h2>
        <p>
          You may delete your account at any time. We may suspend accounts that violate these
          Terms or applicable law.
        </p>

        <h2>6. Disclaimers</h2>
        <p>
          The service is provided &quot;as is&quot;. Emergency directory information is supplied for
          convenience and must not replace official emergency services (999).
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by Bangladesh law, Inievo Technologies is not liable for
          indirect or consequential damages arising from platform use.
        </p>

        <h2>8. Changes</h2>
        <p>
          We may update these Terms. Material changes require re-acceptance on next login when the
          policy version changes.
        </p>

        <h2>9. Contact</h2>
        <p>legal@thechattala.com · Inievo Technologies, Chittagong, Bangladesh</p>

        <p className="not-prose pt-8 text-sm text-muted-foreground">
          <Link href="/privacy" className="underline">
            Privacy Policy
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
