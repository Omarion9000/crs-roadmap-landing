import Link from "next/link";
import { redirect } from "next/navigation";
import FunnelEventTracker from "@/components/funnel/FunnelEventTracker";
import LockedInsightBlock from "@/components/insights/LockedInsightBlock";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPreferredName, roadmapDisplayName, withName } from "@/lib/personalization";
import { getUserPlan, getUserSubscription, isProUser } from "@/lib/subscriptions";
import { buildRecommendationSummary } from "@/lib/strategy/recommendationSummary";
import type { AIStrategyRecommendation } from "@/types/ai-strategy";
import { buildBillingHref, upgradeSuccessMessage } from "@/lib/upgrade";

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
    lang?: "en" | "es";
    educationLabel?: string;
    foreignExperienceLabel?: string;
    canadianCredentialLabel?: string;
    profileModeLabel?: string;
    rawForm?: Record<string, unknown>;
    ai_strategy?: AIStrategyRecommendation | null;
    ai_strategy_updated_at?: string;
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

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatShortDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatFreshness(value: string | null | undefined) {
  if (!value) {
    return "No update yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No update yet";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 24 && now.toDateString() === date.toDateString()) {
    return "Updated today";
  }

  if (diffHours < 48) {
    return "Updated yesterday";
  }

  if (diffDays < 7) {
    return `Updated ${diffDays} days ago`;
  }

  return `Updated ${formatShortDate(value)}`;
}

function formatAiUsage(used?: number | null, limit?: number | null) {
  const safeLimit = limit ?? 30;
  const safeUsed = used ?? 0;
  return `${Math.max(0, safeLimit - safeUsed)} / ${safeLimit}`;
}

function shortenText(value: string, maxLength = 140) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function programLabel(program: string) {
  switch (program) {
    case "general":
      return "General";
    case "category":
      return "Category";
    case "cec":
      return "CEC";
    case "fsw":
      return "FSW";
    case "pnp":
      return "PNP";
    default:
      return program;
  }
}

function restoreHref(roadmapId?: string | null) {
  return roadmapId ? `/simulator?roadmapId=${encodeURIComponent(roadmapId)}&restore=1` : "/simulator";
}

function nextActionLabel(strategy: AIStrategyRecommendation | null) {
  if (!strategy) {
    return "Generate my full strategy";
  }

  const primaryStep = strategy.ordered_actions[0];

  if (primaryStep) {
    return primaryStep;
  }

  return strategy.best_strategy;
}

function nextActionButton(strategy: AIStrategyRecommendation | null) {
  if (!strategy) {
    return "Open simulator";
  }

  const source = `${strategy.best_strategy} ${strategy.reason}`.toLowerCase();

  if (source.includes("pnp") || source.includes("nomination") || source.includes("provincial")) {
    return "Check official PNP requirements";
  }

  if (source.includes("french")) {
    return "Start French B2 planning";
  }

  if (source.includes("english") || source.includes("ielts") || source.includes("clb 9")) {
    return "Review IELTS resources";
  }

  return "Open simulator";
}

function secondaryRoadmapLabel(
  bestRealisticPath: string | null,
  highestUpsidePath: string | null
) {
  if (highestUpsidePath && highestUpsidePath !== bestRealisticPath) {
    return `Highest upside path: ${highestUpsidePath}`;
  }

  return "No secondary path highlighted yet.";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ pro?: string; unlock?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userPlan = await getUserPlan(user.id);
  const proAccess = isProUser(userPlan);
  const subscription = await getUserSubscription(user.id);
  const resolvedSearchParams = await searchParams;
  const showUpgradeSuccess = resolvedSearchParams?.pro === "unlocked";
  const unlock = resolvedSearchParams?.unlock ?? "dashboard";

  const { data: roadmapsData, error } = proAccess
    ? await supabase
        .from("roadmaps")
        .select("id, email, profile_snapshot, program_target, top_scenarios, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .returns<RoadmapRow[]>()
    : { data: [] as RoadmapRow[], error: null };

  const roadmaps = error ? [] : (roadmapsData ?? []);
  const lastRoadmap = roadmaps[0] ?? null;
  const preferredName = getPreferredName(lastRoadmap?.profile_snapshot ?? null);
  const personalizedRoadmapLabel = roadmapDisplayName(preferredName);
  const savedCount = roadmaps.length;
  const lastBaseCrs =
    typeof lastRoadmap?.profile_snapshot?.baseCrs === "number"
      ? lastRoadmap.profile_snapshot.baseCrs
      : null;
  const bestMove = lastRoadmap?.top_scenarios?.[0] ?? null;
  const latestAiStrategy = lastRoadmap?.profile_snapshot?.ai_strategy ?? null;
  const latestAiTimestamp = lastRoadmap?.profile_snapshot?.ai_strategy_updated_at ?? null;
  const savedRecommendationSummary = buildRecommendationSummary(lastRoadmap?.top_scenarios ?? [], {
    englishClb: lastRoadmap?.profile_snapshot?.ieltsClb,
    frenchClb: lastRoadmap?.profile_snapshot?.frenchClb,
    canadianExperienceYears: lastRoadmap?.profile_snapshot?.canExpYears,
    hasJobOffer: lastRoadmap?.profile_snapshot?.hasJobOffer,
    hasPnp: lastRoadmap?.profile_snapshot?.hasPnp,
    educationLabel: lastRoadmap?.profile_snapshot?.educationLabel,
    foreignExperienceLabel: lastRoadmap?.profile_snapshot?.foreignExperienceLabel,
    canadianCredentialLabel: lastRoadmap?.profile_snapshot?.canadianCredentialLabel,
    profileModeLabel: lastRoadmap?.profile_snapshot?.profileModeLabel,
    rawForm: lastRoadmap?.profile_snapshot?.rawForm ?? null,
    programTarget: lastRoadmap?.program_target,
  });
  const bestRealisticLabel =
    latestAiStrategy?.best_strategy ??
    savedRecommendationSummary.bestRealisticPath?.title ??
    null;
  const highestUpsideLabel = savedRecommendationSummary.highestUpsidePath?.title ?? null;
  const aiUsageLabel = formatAiUsage(
    subscription?.ai_requests_used ?? null,
    subscription?.ai_requests_limit ?? null
  );
  const strategyFreshness = formatFreshness(latestAiTimestamp ?? lastRoadmap?.created_at ?? null);
  const latestRoadmapLabel = lastRoadmap
    ? `${personalizedRoadmapLabel} saved ${formatDate(lastRoadmap.created_at)}`
    : "No roadmap saved yet";
  const strategySummary = latestAiStrategy
    ? shortenText(latestAiStrategy.reason, 150)
    : "Generate my full strategy from the simulator to turn raw opportunities into a clearer action plan.";
  const actionLabel = nextActionLabel(latestAiStrategy);
  const actionButtonLabel = nextActionButton(latestAiStrategy);
  const latestRestoreHref = restoreHref(lastRoadmap?.id ?? null);

  return (
    <main className="min-h-screen bg-[#070A12] px-6 py-10 text-white">
      {showUpgradeSuccess ? (
        <>
          <FunnelEventTracker
            event="checkout_completed"
            onceKey={`checkout-completed-dashboard-${unlock}`}
            payload={{ unlock, location: "dashboard" }}
          />
          <FunnelEventTracker
            event="pro_unlocked"
            onceKey={`pro-unlocked-dashboard-${unlock}`}
            payload={{ unlock, location: "dashboard" }}
          />
        </>
      ) : null}
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
              Mission control
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {preferredName ? `Welcome back, ${preferredName}` : "Your CRS strategy home base"}
            </h1>
            <p className="mt-3 text-sm text-white/65">
              {preferredName ? (
                <span className="text-white/80">{withName(preferredName, "here’s your roadmap command center.")}</span>
              ) : (
                <>
                  Logged in as <span className="font-semibold text-white">{user.email}</span>
                </>
              )}
            </p>
            <div className="mt-3 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              Current plan: {userPlan}
            </div>
            <div className="mt-3 text-sm text-white/58">
              {proAccess
                ? "Best move reflects your latest saved profile, roadmap history, and AI action layer."
                : "Free preview active. Unlock Pro for saved roadmaps, AI continuity, and premium dashboard tracking."}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/simulator"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Open simulator
            </Link>
            <Link
              href={latestRestoreHref}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Restore latest roadmap
            </Link>
          </div>
        </div>

        {showUpgradeSuccess ? (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {upgradeSuccessMessage(unlock)}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            {
              label: "Saved roadmaps",
              value: String(savedCount),
              note: proAccess
                ? "Strategies stored for your account."
                : "Unlock Pro to keep roadmap history.",
            },
            {
              label: "Last CRS",
              value: lastBaseCrs ?? "—",
              note: lastRoadmap ? `Program: ${programLabel(lastRoadmap.program_target)}` : "No roadmap saved yet.",
            },
            {
              label: "Best realistic path",
              value: bestRealisticLabel ?? "You haven’t unlocked your full strategy yet",
              note:
                bestRealisticLabel
                  ? secondaryRoadmapLabel(bestRealisticLabel, highestUpsideLabel)
                  : "Upgrade to Pro to generate and track your personalized roadmap.",
            },
            {
              label: "AI left this month",
              value: proAccess ? aiUsageLabel : "PRO only",
              note: proAccess ? "Live monthly usage from your subscription." : "Upgrade to unlock AI strategy generation.",
            },
            {
              label: "Last AI update",
              value: latestAiTimestamp ? formatShortDate(latestAiTimestamp) : "—",
              note: strategyFreshness,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.9)] backdrop-blur"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                {item.label}
              </div>
              <div className="mt-3 text-2xl font-bold text-white">{item.value}</div>
              <div className="mt-2 text-sm text-white/60">{item.note}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Latest AI strategy</h2>
                <p className="mt-1 text-sm text-white/60">
                  {preferredName
                    ? `${preferredName}, your latest saved premium action layer is ready to restore in the simulator.`
                    : "Your latest saved premium action layer, ready to restore in the simulator."}
                </p>
              </div>
            </div>

            {proAccess && latestAiStrategy ? (
              <div className="mt-5 rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/75">
                    Best realistic path right now
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/78">
                    {latestAiStrategy.confidence} confidence
                  </span>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                    Saved and restorable
                  </span>
                </div>
                <div className="mt-3 text-2xl font-semibold text-white">
                  {latestAiStrategy.best_strategy}
                </div>
                <div className="mt-3 text-sm leading-7 text-white/76">{strategySummary}</div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-white/45">
                  <span>{latestAiTimestamp ? `AI strategy generated ${formatShortDate(latestAiTimestamp)}` : "Latest strategy active"}</span>
                  <span>{latestRoadmapLabel}</span>
                  {highestUpsideLabel && highestUpsideLabel !== latestAiStrategy.best_strategy ? (
                    <span>{`Highest upside path: ${highestUpsideLabel}`}</span>
                  ) : null}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={latestRestoreHref}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                  >
                    Continue strategy
                  </Link>
                  <Link
                    href={latestRestoreHref}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Open in simulator
                  </Link>
                </div>
              </div>
            ) : proAccess ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-black/20 p-6 text-sm text-white/60">
                <div className="font-semibold text-white">You haven’t unlocked your full strategy yet</div>
                <div className="mt-2">
                  Upgrade to Pro to generate and track your personalized roadmap, then restore it here as your strategic command center.
                </div>
                <div className="mt-4">
                  <Link
                    href="/simulator"
                    className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                  >
                    Generate my full strategy
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-[28px] border border-cyan-400/20 bg-cyan-400/10 p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
                    Best next move
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-white">
                    {bestRealisticLabel ?? "Open the simulator to reveal your strongest next move"}
                  </div>
                <div className="mt-3 text-sm leading-7 text-white/76">
                  {bestRealisticLabel
                    ? "This is the strongest realistic path currently visible from your saved roadmap context."
                      : "Free preview keeps your high-level direction visible. Pro unlocks the deeper explanation, continuity, and full roadmap layer."}
                </div>
              </div>
              <LockedInsightBlock
                title="Full roadmap insight"
                features={[
                    "Full reasoning behind the move",
                    "Execution plan and sequencing",
                    "Parallel strategy trade-offs",
                    "Saved AI continuity",
                ]}
                ctaText="Unlock full roadmap"
                href={buildBillingHref({ returnTo: "/dashboard", unlock: "dashboard" })}
                analyticsEvent="locked_strategy_clicked"
                  previewLines={[
                    "Deeper reasoning",
                    "Execution steps and timeline",
                    "Saved roadmap continuity",
                  ]}
                />
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div>
              <h2 className="text-xl font-semibold text-white">Your next action</h2>
              <p className="mt-1 text-sm text-white/60">
                The single next move your roadmap is asking for right now.
              </p>
            </div>

            <div className="mt-5 rounded-[26px] border border-white/10 bg-black/20 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">
                Next step
              </div>
              <div className="mt-3 text-xl font-semibold text-white">{actionLabel}</div>
              <div className="mt-3 text-sm leading-7 text-white/68">
                {latestAiStrategy
                  ? "This is the first actionable step from your latest saved AI strategy."
                  : "Generate my full strategy to turn simulator output into a clearer execution plan."}
              </div>
              <div className="mt-5">
                <Link
                  href={latestAiStrategy ? latestRestoreHref : "/simulator"}
                  className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  {actionButtonLabel}
                </Link>
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-white/62">
              {proAccess
                ? latestRoadmapLabel
                : "Free preview keeps the dashboard lightweight. Unlock Pro for AI continuity, saved roadmaps, and live strategy tracking."}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">{personalizedRoadmapLabel}</h2>
              <p className="mt-1 text-sm text-white/60">
                Your most recently saved simulator state, ready to restore.
              </p>
            </div>
            {lastRoadmap ? (
              <Link
                href={latestRestoreHref}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Restore in simulator
              </Link>
            ) : null}
          </div>

          {proAccess && lastRoadmap ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Program
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {programLabel(lastRoadmap.program_target)}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Baseline CRS
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {lastBaseCrs ?? "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  English / French
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {typeof lastRoadmap.profile_snapshot?.ieltsClb === "number"
                    ? `CLB ${lastRoadmap.profile_snapshot.ieltsClb}`
                    : "—"}
                  <span className="mx-2 text-white/30">/</span>
                  {typeof lastRoadmap.profile_snapshot?.frenchClb === "number"
                    ? `CLB ${lastRoadmap.profile_snapshot.frenchClb}`
                    : "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Last updated
                </div>
                <div className="mt-2 text-sm font-semibold text-white">
                  {formatDate(lastRoadmap.created_at)}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Top move
                </div>
                <div className="mt-2 text-sm font-semibold text-white">
                  {bestRealisticLabel ?? bestMove?.title ?? "No ranked move saved"}
                </div>
                <div className="mt-2 text-xs text-white/55">
                  {highestUpsideLabel && highestUpsideLabel !== bestRealisticLabel
                    ? `Highest upside path: ${highestUpsideLabel}`
                    : "Best move reflects your latest saved profile."}
                </div>
              </div>
            </div>
          ) : proAccess ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-black/20 p-6 text-sm text-white/60">
              <div className="font-semibold text-white">No saved roadmaps yet</div>
              <div className="mt-2">
                Open the simulator and save your first roadmap to make this dashboard feel live.
              </div>
              <div className="mt-4">
                <Link
                  href="/simulator"
                  className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Open simulator
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-6 text-sm text-white/80">
              <div className="font-semibold text-white">See full roadmap on Pro</div>
              <div className="mt-2 text-white/68">
                Preview direction now, then unlock saved roadmap continuity, deeper insight, and premium dashboard workflow on Pro.
              </div>
              <div className="mt-4">
                <Link
                  href={buildBillingHref({ returnTo: "/dashboard", unlock: "dashboard" })}
                  className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  See full roadmap
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">Recent roadmaps</h2>
          <p className="mt-1 text-sm text-white/60">
            A quicker scan of your latest saved simulator states.
          </p>

          {proAccess && roadmaps.length > 0 ? (
            <div className="mt-5 space-y-3">
              {roadmaps.slice(0, 5).map((roadmap) => (
                <div
                  key={roadmap.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {roadmapDisplayName(roadmap.profile_snapshot?.preferred_name)}
                      <span className="mx-2 text-white/30">•</span>
                      CRS {typeof roadmap.profile_snapshot?.baseCrs === "number" ? roadmap.profile_snapshot.baseCrs : "—"}
                      <span className="mx-2 text-white/30">•</span>
                      {programLabel(roadmap.program_target)}
                    </div>
                    <div className="mt-1 text-xs text-white/55">{formatDate(roadmap.created_at)}</div>
                  </div>

                  <div className="text-sm text-white/65">
                    {(() => {
                      const summary = buildRecommendationSummary(roadmap.top_scenarios ?? [], {
                        englishClb: roadmap.profile_snapshot?.ieltsClb,
                        frenchClb: roadmap.profile_snapshot?.frenchClb,
                        canadianExperienceYears: roadmap.profile_snapshot?.canExpYears,
                        hasJobOffer: roadmap.profile_snapshot?.hasJobOffer,
                        hasPnp: roadmap.profile_snapshot?.hasPnp,
                        educationLabel: roadmap.profile_snapshot?.educationLabel,
                        foreignExperienceLabel: roadmap.profile_snapshot?.foreignExperienceLabel,
                        canadianCredentialLabel: roadmap.profile_snapshot?.canadianCredentialLabel,
                        profileModeLabel: roadmap.profile_snapshot?.profileModeLabel,
                        rawForm: roadmap.profile_snapshot?.rawForm ?? null,
                        programTarget: roadmap.program_target,
                      });

                      return summary.bestRealisticPath?.title
                        ? `Best realistic path: ${summary.bestRealisticPath.title}`
                        : roadmap.top_scenarios?.[0]?.title
                          ? `Top move: ${roadmap.top_scenarios[0].title}`
                          : "No ranked move saved";
                    })()}
                  </div>

                  <Link
                    href={restoreHref(roadmap.id)}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Restore
                  </Link>
                </div>
              ))}
            </div>
          ) : proAccess ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-black/20 p-6 text-sm text-white/60">
              No saved roadmap history yet. Save your first roadmap in the simulator to start building momentum here.
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-black/20 p-6 text-sm text-white/60">
              Unlock Pro to access recent roadmap history and deeper dashboard insight.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
