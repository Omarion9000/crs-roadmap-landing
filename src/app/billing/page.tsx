import Link from "next/link";
import { redirect } from "next/navigation";
import FunnelEventTracker from "@/components/funnel/FunnelEventTracker";
import TrackedSubmitButton from "@/components/funnel/TrackedSubmitButton";
import { sanitizeReturnTo } from "@/lib/authRedirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscriptions";
import { buildPostUpgradeHref, type UpgradeUnlock, upgradeSuccessMessage } from "@/lib/upgrade";
import { getStripeServer } from "@/lib/stripe";

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeUnlock(value: string | undefined): UpgradeUnlock {
  switch (value) {
    case "ai":
    case "strategy":
    case "roadmap":
    case "dashboard":
    case "pro":
      return value;
    default:
      return "pro";
  }
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<{
    success?: string | string[];
    canceled?: string | string[];
    returnTo?: string | string[];
    unlock?: string | string[];
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const paymentSucceeded = firstQueryValue(resolvedSearchParams?.success) === "true";
  const paymentCanceled = firstQueryValue(resolvedSearchParams?.canceled) === "true";
  const rawReturnTo = firstQueryValue(resolvedSearchParams?.returnTo);
  const returnTo = rawReturnTo ? sanitizeReturnTo(rawReturnTo) : null;
  const unlock = normalizeUnlock(firstQueryValue(resolvedSearchParams?.unlock));
  const continueHref = returnTo ? buildPostUpgradeHref(returnTo, unlock) : "/dashboard";
  const stripeConfigured = Boolean(process.env.STRIPE_PRICE_PRO);

  console.log("[billing] route opened");
  console.log("[billing] returnTo:", returnTo);
  console.log("[billing] unlock:", unlock);
  if (!stripeConfigured) {
    console.log("[billing] missing config: STRIPE_PRICE_PRO");
  }

  let userEmail = "";
  let normalizedPlan = "free";

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    userEmail = user.email ?? "";
    normalizedPlan = await getUserPlan(user.id);
  } catch (error) {
    return (
      <main className="min-h-screen bg-[#070A12] px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-100/75">
            Billing unavailable
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-white">We couldn&apos;t open billing right now.</h1>
          <p className="mt-3 text-sm leading-7 text-white/72">
            Try again in a moment. If this continues, check that billing and auth environment settings are configured correctly.
          </p>
          <div className="mt-4 text-xs text-white/55">
            {error instanceof Error ? error.message : "Unknown billing route error."}
          </div>
        </div>
      </main>
    );
  }

  async function createCheckoutSession(formData: FormData) {
    "use server";

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      redirect("/login");
    }

    const priceId = process.env.STRIPE_PRICE_PRO;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnToEntry = formData.get("returnTo");
    const unlockEntry = formData.get("unlock");
    const returnTo =
      typeof returnToEntry === "string" ? sanitizeReturnTo(returnToEntry) : "/dashboard";
    const unlock = normalizeUnlock(typeof unlockEntry === "string" ? unlockEntry : undefined);
    const successPath = buildPostUpgradeHref(returnTo, unlock);
    const cancelParams = new URLSearchParams({ canceled: "true" });

    if (returnTo) {
      cancelParams.set("returnTo", returnTo);
    }

    if (unlock) {
      cancelParams.set("unlock", unlock);
    }

    if (!priceId) {
      console.log("[billing] missing config: STRIPE_PRICE_PRO");
      throw new Error("Missing STRIPE_PRICE_PRO");
    }

    const stripe = getStripeServer();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}${successPath}`,
      cancel_url: `${appUrl}/billing?${cancelParams.toString()}`,
      metadata: {
        user_id: user.id,
        email: user.email,
        plan: "pro",
        unlock,
        return_to: returnTo ?? "",
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          email: user.email,
          plan: "pro",
          unlock,
          return_to: returnTo ?? "",
        },
      },
    });

    if (!session.url) {
      throw new Error("Stripe checkout session did not return a URL");
    }

    redirect(session.url);
  }

  return (
    <main className="min-h-screen bg-[#070A12] px-6 py-10 text-white">
      <FunnelEventTracker event="pricing_viewed" onceKey="pricing-viewed" />
      {paymentSucceeded ? (
        <>
          <FunnelEventTracker event="checkout_completed" onceKey={`checkout-completed-${unlock}`} payload={{ unlock }} />
          <FunnelEventTracker event="pro_unlocked" onceKey={`pro-unlocked-${unlock}`} payload={{ unlock }} />
        </>
      ) : null}
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-8">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
            Billing
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Manage your plan
          </h1>

          <p className="mt-3 text-sm text-white/65">
            Logged in as <span className="font-semibold text-white">{userEmail}</span>
          </p>

          <div className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            Current plan: {normalizedPlan}
          </div>

          {paymentSucceeded ? (
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {upgradeSuccessMessage(unlock)}
            </div>
          ) : null}

          {paymentCanceled ? (
            <div className="mt-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
              Checkout was canceled. You can try again anytime.
            </div>
          ) : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/75">
                What this unlocks
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Turn score uncertainty into a clear PR strategy
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/68">
                Don&apos;t just calculate your CRS. Decide what to do next with roadmap logic, sequencing, and personalized strategic next steps.
              </p>
              <div className="mt-5 space-y-3 text-sm text-white/76">
                {[
                  "Full AI-generated strategy with deeper reasoning",
                  "Execution planning, sequencing, and trade-offs",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-6 lg:self-start">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                FREE
              </div>
              <div className="mt-3 text-2xl font-bold">$0</div>
              <div className="mt-2 text-sm text-white/60">
                Useful for previewing direction, intentionally limited for execution depth.
              </div>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>• Preview your strongest next move</li>
                <li>• Explore score-improvement paths</li>
                <li>• Use the simulator in preview mode</li>
                <li>• See high-level roadmap direction</li>
              </ul>
            </div>

            <div className="relative scale-[1.03] overflow-hidden rounded-2xl border border-blue-400/40 bg-gradient-to-br from-blue-500/14 via-white/[0.05] to-violet-500/12 p-6 shadow-[0_0_40px_rgba(59,130,246,0.25)] lg:self-start">
              <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-blue-400/16 blur-3xl" />
              <div className="relative z-10">
                <div className="inline-flex rounded-full border border-blue-300/30 bg-blue-400/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                  BEST VALUE
                </div>
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                  PRO
                </div>
                <div className="mt-3 text-2xl font-bold">$9.99 CAD / month</div>
                <div className="mt-2 text-xs font-medium text-blue-100/80">
                  Early access pricing — future $19/mo
                </div>
                <div className="mt-5 text-xl font-semibold text-white">
                  Turn your CRS into a clear PR strategy
                </div>
                <div className="mt-3 text-sm leading-7 text-white/78">
                  Stop guessing what to do next. Unlock a structured roadmap built from your real profile.
                </div>
                <ul className="mt-4 space-y-2 text-sm text-white/80">
                  <li>• Full AI-generated strategy</li>
                  <li>• Step-by-step execution plan</li>
                  <li>• Strategy sequencing and trade-offs</li>
                  <li>• Save and restore your roadmap</li>
                  <li>• Premium strategy pages</li>
                  <li>• Monthly AI strategy generations</li>
                  <li>• Personal roadmap continuity</li>
                </ul>
                <div className="mt-5 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/72">
                  A fraction of the cost of a single consultation - with continuous strategy guidance.
                </div>

                {normalizedPlan === "pro" ? (
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                      You’re on Pro
                    </div>

                    <form action="/api/stripe/portal" method="POST">
                      <button
                        type="submit"
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Manage subscription
                      </button>
                    </form>
                  </div>
                ) : stripeConfigured ? (
                  <form action={createCheckoutSession}>
                    <input type="hidden" name="returnTo" value={returnTo ?? ""} />
                    <input type="hidden" name="unlock" value={unlock} />
                    <TrackedSubmitButton
                      event="checkout_started"
                      payload={{ unlock, returnTo: returnTo ?? "/dashboard" }}
                      type="submit"
                      className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-gray-200"
                    >
                      Get my full roadmap
                    </TrackedSubmitButton>
                  </form>
                ) : (
                  <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    Billing configuration is incomplete right now. Please try again after Stripe setup is restored.
                  </div>
                )}
                <div className="mt-3 text-xs text-white/72">
                  Unlock your complete PR strategy and execution plan
                </div>
                <div className="mt-2 text-xs text-white/55">
                  Cancel anytime. No long-term commitment.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {paymentSucceeded ? (
              <Link
                href={continueHref}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Continue with Pro unlocked
              </Link>
            ) : null}
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
