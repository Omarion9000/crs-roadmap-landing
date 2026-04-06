import Link from "next/link";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import FunnelEventTracker from "@/components/funnel/FunnelEventTracker";
import TrackedSubmitButton from "@/components/funnel/TrackedSubmitButton";
import { getAuthBaseUrl, sanitizeReturnTo } from "@/lib/authRedirect";
import {
  getPreferredName,
  normalizePreferredName,
  withName,
} from "@/lib/personalization";
import { getStripeServer } from "@/lib/stripe";
import { buildRecommendationSummary } from "@/lib/strategy/recommendationSummary";
import { getUserPlan } from "@/lib/subscriptions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildBillingHref,
  buildLoginHref,
  buildPostUpgradeHref,
  type UpgradeUnlock,
  upgradeSuccessMessage,
} from "@/lib/upgrade";
import type { AIStrategyRecommendation } from "@/types/ai-strategy";

type RoadmapRow = {
  id: string;
  email: string;
  profile_snapshot: {
    baseCrs?: number;
    effectiveBaseCrs?: number;
    preferred_name?: string;
    ieltsClb?: number;
    frenchClb?: number;
    canExpYears?: number;
    hasJobOffer?: boolean;
    hasPnp?: boolean;
    educationLabel?: string;
    foreignExperienceLabel?: string;
    canadianCredentialLabel?: string;
    profileModeLabel?: string;
    rawForm?: Record<string, unknown>;
    ai_strategy?: AIStrategyRecommendation | null;
  } | null;
  program_target: string;
  top_scenarios:
    | Array<{
        id?: string;
        title?: string;
        delta?: number;
      }>
    | null;
  created_at: string;
};

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

function formatTimelineEstimate(bestMoveTitle: string | null, hasRoadmap: boolean) {
  const source = (bestMoveTitle ?? "").toLowerCase();

  if (source.includes("english") || source.includes("ielts")) {
    return "Fastest when you can test within the next 6-10 weeks";
  }

  if (source.includes("french")) {
    return "Usually a medium-term build with larger upside";
  }

  if (source.includes("pnp") || source.includes("nomination")) {
    return "Depends on stream fit and provincial intake timing";
  }

  if (source.includes("cec") || source.includes("experience")) {
    return "Builds as Canadian experience compounds over time";
  }

  return hasRoadmap
    ? "Sequenced from your current roadmap context"
    : "Estimated after your first simulator roadmap";
}

function bestMoveSupportLine(
  bestMoveDelta: number | null,
  bestMoveTitle: string | null,
  hasRoadmap: boolean
) {
  if (typeof bestMoveDelta === "number") {
    return `Potential upside: +${bestMoveDelta} CRS`;
  }

  if (bestMoveTitle) {
    return "Priority-ranked from your current roadmap context";
  }

  return hasRoadmap
    ? "Prioritized from your latest simulator roadmap"
    : "Unlock your strongest move after your first simulator preview";
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<{
    success?: string | string[];
    canceled?: string | string[];
    returnTo?: string | string[];
    unlock?: string | string[];
    billingError?: string | string[];
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const paymentSucceeded = firstQueryValue(resolvedSearchParams?.success) === "true";
  const paymentCanceled = firstQueryValue(resolvedSearchParams?.canceled) === "true";
  const billingError = firstQueryValue(resolvedSearchParams?.billingError);
  const rawReturnTo = firstQueryValue(resolvedSearchParams?.returnTo);
  const returnTo = rawReturnTo ? sanitizeReturnTo(rawReturnTo) : null;
  const unlock = normalizeUnlock(firstQueryValue(resolvedSearchParams?.unlock));
  const continueHref = returnTo ? buildPostUpgradeHref(returnTo, unlock) : "/dashboard";
  const stripeConfigured = Boolean(process.env.STRIPE_PRICE_PRO);

  console.log("[billing] route opened");
  console.log("[billing] authenticated:", "checking");
  console.log("[billing] returnTo:", returnTo);
  console.log("[billing] unlock:", unlock);
  console.log("[billing] stripe config present:", stripeConfigured ? "yes" : "no");
  if (!stripeConfigured) {
    console.log("[billing] missing config: STRIPE_PRICE_PRO");
  }

  let userEmail = "";
  let normalizedPlan = "free";
  let latestRoadmap: RoadmapRow | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[billing] authenticated:", "no");
      redirect(
        buildLoginHref({
          returnTo: buildBillingHref({
            returnTo,
            unlock,
          }),
        })
      );
    }

    console.log("[billing] authenticated:", "yes");
    userEmail = user.email ?? "";
    normalizedPlan = await getUserPlan(user.id);

    const { data: latestRoadmapData } = await supabase
      .from("roadmaps")
      .select("id, email, profile_snapshot, program_target, top_scenarios, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .returns<RoadmapRow[]>()
      .maybeSingle();

    latestRoadmap = latestRoadmapData ?? null;
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return (
      <main className="min-h-screen bg-[#070A12] px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-100/75">
            Billing unavailable
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-white">
            We couldn&apos;t open billing right now.
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/72">
            Try again in a moment. If this continues, check that billing and auth
            environment settings are configured correctly.
          </p>
          <div className="mt-4 text-xs text-white/55">
            {error instanceof Error ? error.message : "Unknown billing route error."}
          </div>
        </div>
      </main>
    );
  }

  const latestSnapshot = latestRoadmap?.profile_snapshot ?? null;
  const preferredName =
    getPreferredName(latestSnapshot) ??
    normalizePreferredName(userEmail.split("@")[0] ?? "");
  const currentCrs =
    typeof latestSnapshot?.effectiveBaseCrs === "number"
      ? latestSnapshot.effectiveBaseCrs
      : typeof latestSnapshot?.baseCrs === "number"
        ? latestSnapshot.baseCrs
        : null;
  const recommendationSummary = buildRecommendationSummary(
    latestRoadmap?.top_scenarios ?? [],
    {
      englishClb: latestSnapshot?.ieltsClb,
      frenchClb: latestSnapshot?.frenchClb,
      canadianExperienceYears: latestSnapshot?.canExpYears,
      hasJobOffer: latestSnapshot?.hasJobOffer,
      hasPnp: latestSnapshot?.hasPnp,
      educationLabel: latestSnapshot?.educationLabel,
      foreignExperienceLabel: latestSnapshot?.foreignExperienceLabel,
      canadianCredentialLabel: latestSnapshot?.canadianCredentialLabel,
      profileModeLabel: latestSnapshot?.profileModeLabel,
      rawForm: latestSnapshot?.rawForm ?? null,
      programTarget: latestRoadmap?.program_target,
    }
  );
  const latestAiStrategy = latestSnapshot?.ai_strategy ?? null;
  const bestMoveTitle =
    latestAiStrategy?.best_strategy ??
    recommendationSummary.bestRealisticPath?.title ??
    latestRoadmap?.top_scenarios?.[0]?.title ??
    null;
  const bestMoveDelta =
    recommendationSummary.bestRealisticPath?.delta ??
    latestRoadmap?.top_scenarios?.[0]?.delta ??
    null;
  const highestUpsideDelta = recommendationSummary.highestUpsidePath?.delta ?? null;
  const potentialCrs =
    typeof currentCrs === "number" && typeof highestUpsideDelta === "number"
      ? currentCrs + highestUpsideDelta
      : null;
  const timelineEstimate = formatTimelineEstimate(bestMoveTitle, !!latestRoadmap);
  const outcomeCards = [
    {
      label: "Current CRS",
      value: typeof currentCrs === "number" ? String(currentCrs) : "Your latest score preview",
      tone: "text-white",
      helper:
        typeof potentialCrs === "number"
          ? `Potential path could move you toward ${potentialCrs}`
          : "Use your latest simulator roadmap as the baseline",
    },
    {
      label: "Potential path",
      value:
        bestMoveTitle ??
        "Your strongest move becomes clearer after your first roadmap preview",
      tone: "text-cyan-100",
      helper: "Pulled from your latest strategy context when available",
    },
    {
      label: "Estimated gain",
      value:
        typeof highestUpsideDelta === "number"
          ? `Up to +${highestUpsideDelta} CRS`
          : "Potential CRS upside",
      tone: "text-emerald-100",
      helper: "Shown only when a real projection is available",
    },
    {
      label: "Roadmap timeline estimate",
      value: timelineEstimate,
      tone: "text-white/90",
      helper: "A planning cue, not a guaranteed outcome",
    },
  ];

  async function createCheckoutSession(formData: FormData) {
    "use server";

    const returnToEntry = formData.get("returnTo");
    const unlockEntry = formData.get("unlock");
    const actionReturnTo =
      typeof returnToEntry === "string" ? sanitizeReturnTo(returnToEntry) : "/dashboard";
    const actionUnlock = normalizeUnlock(
      typeof unlockEntry === "string" ? unlockEntry : undefined
    );

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      redirect(
        buildLoginHref({
          returnTo: buildBillingHref({
            returnTo: actionReturnTo,
            unlock: actionUnlock,
          }),
        })
      );
    }

    const priceId = process.env.STRIPE_PRICE_PRO;
    const appUrl = getAuthBaseUrl();
    const successPath = buildPostUpgradeHref(actionReturnTo, actionUnlock);
    const cancelParams = new URLSearchParams({ canceled: "true" });

    if (actionReturnTo) {
      cancelParams.set("returnTo", actionReturnTo);
    }

    if (actionUnlock) {
      cancelParams.set("unlock", actionUnlock);
    }

    if (!priceId) {
      console.log("[billing] missing config: STRIPE_PRICE_PRO");
      throw new Error("Missing STRIPE_PRICE_PRO");
    }

    try {
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
          unlock: actionUnlock,
          return_to: actionReturnTo ?? "",
        },
        subscription_data: {
          metadata: {
            user_id: user.id,
            email: user.email,
            plan: "pro",
            unlock: actionUnlock,
            return_to: actionReturnTo ?? "",
          },
        },
      });

      if (!session.url) {
        throw new Error("Stripe checkout session did not return a URL");
      }

      redirect(session.url);
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      console.log(
        "[billing] checkout error:",
        error instanceof Error ? error.message : "unknown"
      );

      const retryHref = buildBillingHref({
        returnTo: actionReturnTo,
        unlock: actionUnlock,
      });
      const separator = retryHref.includes("?") ? "&" : "?";
      redirect(`${retryHref}${separator}billingError=configuration`);
    }
  }

  return (
    <main className="min-h-screen bg-[#070A12] px-6 py-10 text-white">
      <FunnelEventTracker event="pricing_viewed" onceKey="pricing-viewed" />
      {paymentSucceeded ? (
        <>
          <FunnelEventTracker
            event="checkout_completed"
            onceKey={`checkout-completed-${unlock}`}
            payload={{ unlock }}
          />
          <FunnelEventTracker
            event="pro_unlocked"
            onceKey={`pro-unlocked-${unlock}`}
            payload={{ unlock }}
          />
        </>
      ) : null}

      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-8">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
            Pro access
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {preferredName
              ? `${preferredName}, your optimized PR roadmap is ready to unlock`
              : "Your optimized PR roadmap — built for your profile"}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
            See exactly how to increase your CRS and unlock the strongest path
            toward permanent residence.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Logged in as {userEmail}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Current plan: {normalizedPlan}
            </span>
            {latestRoadmap ? (
              <span className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                Built from your latest roadmap
              </span>
            ) : null}
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

          {billingError === "configuration" ? (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Billing is temporarily unavailable because the Stripe configuration
              could not be verified. Please try again shortly.
            </div>
          ) : null}

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {outcomeCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-white/10 bg-black/20 p-5"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      {card.label}
                    </div>
                    <div className={`mt-3 text-sm font-semibold leading-6 ${card.tone}`}>
                      {card.value}
                    </div>
                    <div className="mt-2 text-xs text-white/55">{card.helper}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[28px] border border-cyan-400/20 bg-linear-to-br from-cyan-500/10 via-transparent to-indigo-500/10 p-6 shadow-[0_26px_90px_-56px_rgba(34,211,238,0.35)]">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/75">
                    Best move right now
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    {bestMoveTitle ?? "Your highest-impact next move becomes clear with Pro"}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-white/72">
                    {bestMoveTitle
                      ? withName(
                          preferredName,
                          "this is your highest-impact next move based on your current roadmap context."
                        )
                      : "Based on your current profile, Pro turns your preview into a clearer execution plan with sequencing, trade-offs, and the next move to prioritize."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/75">
                      {bestMoveSupportLine(
                        bestMoveDelta,
                        bestMoveTitle,
                        !!latestRoadmap
                      )}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/75">
                      {timelineEstimate}
                    </span>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                    What Pro changes
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    From preview to full strategy
                  </h2>
                  <ul className="mt-5 space-y-3 text-sm text-white/78">
                    <li>• Exact steps to increase your CRS</li>
                    <li>• Personalized roadmap to PR from your real profile</li>
                    <li>• Priority-ranked actions by impact, effort, and sequence</li>
                    <li>• Save and track your strategy over time</li>
                    <li>• Compare alternative paths before you commit</li>
                    <li>• Return to your roadmap anytime</li>
                  </ul>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/62">
                    Less than a single immigration consultation — available whenever you need it.
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Locked preview
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  What you unlock with Pro
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/66">
                  You already have the direction. Pro opens the full roadmap behind
                  it, including the order, alternatives, and continuity that turn a
                  score preview into a real PR plan.
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    "Full step-by-step strategy",
                    "Alternative PR paths",
                    "Execution order and trade-offs",
                    "Saved roadmap continuity",
                  ].map((item) => (
                    <div
                      key={item}
                      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/6 via-transparent to-transparent" />
                      <div className="relative">
                        <div className="text-sm font-semibold text-white/92">Locked</div>
                        <div className="mt-2 text-sm leading-6 text-white/68">{item}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid content-start gap-6">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
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

              <div className="relative overflow-hidden rounded-[30px] border border-blue-400/40 bg-gradient-to-br from-blue-500/14 via-white/[0.05] to-violet-500/12 p-6 shadow-[0_0_40px_rgba(59,130,246,0.25)] xl:scale-[1.02]">
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
                    Your optimized PR roadmap — built for your profile
                  </div>
                  <div className="mt-3 text-sm leading-7 text-white/78">
                    Stop guessing what to do next. Unlock a structured roadmap
                    built from your real profile and the strongest next move
                    already visible in your strategy preview.
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-white/80">
                    <li>• Exact steps to increase your CRS</li>
                    <li>• Personalized roadmap to PR</li>
                    <li>• Priority-ranked actions by impact</li>
                    <li>• Compare alternative paths before you commit</li>
                    <li>• Save and track your strategy over time</li>
                    <li>• Return to your roadmap anytime</li>
                  </ul>
                  <div className="mt-5 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/72">
                    Less than a single immigration consultation — available whenever you need it.
                  </div>

                  {normalizedPlan === "pro" ? (
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                        You&apos;re on Pro
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
                        Unlock my PR plan
                      </TrackedSubmitButton>
                    </form>
                  ) : (
                    <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                      Billing configuration is incomplete right now. Please try again
                      after Stripe setup is restored.
                    </div>
                  )}
                  <div className="mt-3 text-xs text-white/72">
                    See the full roadmap, execution order, and alternatives behind your current best move
                  </div>
                  <div className="mt-2 text-xs text-white/55">
                    Cancel anytime. Early access pricing while the full advisor layer is being expanded.
                  </div>
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
