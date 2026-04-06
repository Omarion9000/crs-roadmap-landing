import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — PRAVÉ",
  description: "Terms and conditions for using the PRAVÉ CRS Roadmap platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#070A12] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/40">
          Legal
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-white/50">Last updated: April 2025</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-white/72">
          <section>
            <h2 className="mb-3 text-base font-semibold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using PRAVÉ (&quot;the Service&quot;), you agree to be bound by these Terms
              of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">2. Description of Service</h2>
            <p>
              PRAVÉ is an informational tool that simulates CRS (Comprehensive Ranking System)
              score scenarios for Canadian Express Entry. The Service provides estimates,
              strategy suggestions, and roadmap previews based on user-provided profile data.
            </p>
            <p className="mt-3">
              PRAVÉ is not an immigration consultant, law firm, or regulated entity under ICCRC
              or any provincial immigration authority. Nothing on this platform constitutes legal
              or immigration advice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">3. Important Disclaimer</h2>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-100/85">
              CRS scores, draw thresholds, and immigration pathways change frequently. All
              calculations and strategy suggestions provided by PRAVÉ are estimates for
              informational purposes only. They do not guarantee any immigration outcome.
              Always verify current requirements with IRCC or a licensed immigration
              consultant (RCIC).
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">4. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activity under your account. You must provide accurate information
              when registering and promptly update it if it changes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">5. Subscriptions and Billing</h2>
            <p>
              Pro access is billed monthly via Stripe. You may cancel at any time through
              the billing portal. Cancellations take effect at the end of the current
              billing period — you will retain Pro access until then. We do not offer
              refunds for partial periods.
            </p>
            <p className="mt-3">
              Pricing may change with reasonable advance notice. Existing subscribers will
              be notified before any price increase takes effect.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">6. Prohibited Use</h2>
            <p>You agree not to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Reverse engineer or scrape the Service or its underlying data.</li>
              <li>Use the Service to provide immigration advice to third parties commercially.</li>
              <li>Attempt to circumvent subscription paywalls or access controls.</li>
              <li>Submit false or misleading profile data to manipulate outputs.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, PRAVÉ is not liable for any immigration
              decisions made based on outputs from this platform, or for any indirect, incidental,
              or consequential damages arising from use of the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">8. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the Province of Ontario and the federal
              laws of Canada applicable therein.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">9. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after
              changes are posted constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-white">10. Contact</h2>
            <p>
              Questions about these Terms? Contact us at{" "}
              <span className="text-white">legal@prave.ca</span>.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-4 border-t border-white/10 pt-8 text-sm text-white/45">
          <Link href="/privacy" className="transition hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/" className="transition hover:text-white">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
