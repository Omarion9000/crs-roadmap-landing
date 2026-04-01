"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import LockedInsightBlock from "@/components/insights/LockedInsightBlock";
import { readStoredBaseProfile } from "@/lib/crs/baseProfile";
import {
  buildFrenchStrategyContext,
  generateFrenchStrategyPlan,
} from "@/lib/strategy/frenchPlan";

type FrenchPlanGeneratorProps = {
  userPlan: "free" | "pro";
  profileOwnerKey?: string | null;
  upgradeHref?: string;
};

export default function FrenchPlanGenerator({
  userPlan,
  profileOwnerKey = null,
  upgradeHref = "/billing",
}: FrenchPlanGeneratorProps) {
  const [hasGenerated, setHasGenerated] = useState(false);
  const context = useMemo(
    () => buildFrenchStrategyContext(readStoredBaseProfile(profileOwnerKey)),
    [profileOwnerKey]
  );
  const plan = useMemo(
    () => (context ? generateFrenchStrategyPlan(context) : null),
    [context]
  );

  const priorityTone =
    plan?.priority === "high"
      ? "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100"
      : plan?.priority === "medium"
        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
      : "border-white/10 bg-white/5 text-white/80";
  const whyThisMatters = context
    ? context.currentCrs < 500
      ? "At your current CRS, a bigger user-controlled move may matter more than another small gain. French can become that differentiated lever."
      : "At your current CRS, French may matter most when it gives the roadmap stronger differentiation instead of just adding another modest tweak."
    : "";
  const realityCheck = context
    ? context.currentCrs < 490
      ? "Even a strong French move may not solve the roadmap by itself. You may still need another lever or a parallel path after it."
      : "French can be strategically valuable, but it still needs to be sequenced honestly against English, experience, and other realistic paths."
    : "";

  if (!context) {
    return (
      <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
          AI-generated French plan
        </div>
        <div className="mt-4 text-2xl font-semibold text-white">
          Build your profile first to generate a French roadmap
        </div>
        <div className="mt-3 max-w-2xl text-sm leading-7 text-white/66">
          The French plan reads your current CRS roadmap context so the strategy can focus on real sequence, likely upside, and whether French should lead or support your next move.
        </div>
        <div className="mt-5">
          <Link
            href="/crs-calculator"
            className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Build my profile
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
      <div className="grid gap-4 xl:grid-cols-[1fr_0.92fr]">
        <div className="rounded-[32px] border border-fuchsia-500/20 bg-fuchsia-500/10 p-6 shadow-[0_24px_80px_-56px_rgba(217,70,239,0.4)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-200/75">
            AI-generated French plan
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-white">
            Generate my French plan
          </h2>
          <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/82">
            French is one of the highest-impact CRS boosts available - but only if executed correctly.
            <div className="mt-2">
              This plan shows exactly how to reach B2 and convert it into points.
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-white/82">
            Sequence French against your other CRS levers, decide whether it should lead or support the roadmap, and see what to work on first.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setHasGenerated(true)}
              className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
              {hasGenerated ? "Refresh my French plan" : "Generate my French plan"}
            </button>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/70">
              {userPlan === "pro" ? "Full plan unlocked" : "Preview available"}
            </span>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-black/20 p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            Roadmap context
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Current CRS</div>
              <div className="mt-2 text-sm font-semibold text-white">{context.currentCrs}</div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">English CLB</div>
              <div className="mt-2 text-sm font-semibold text-white">{context.englishClb || "Not set"}</div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">French CLB</div>
              <div className="mt-2 text-sm font-semibold text-white">{context.frenchClb || "Not set"}</div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Canadian experience</div>
              <div className="mt-2 text-sm font-semibold text-white">
                {context.canadianExperienceYears} year{context.canadianExperienceYears === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {hasGenerated && plan ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.92fr]"
          >
            <div className="space-y-4">
              <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                    Priority
                  </div>
                  <div className={["rounded-full border px-3 py-1 text-xs font-semibold", priorityTone].join(" ")}>
                    {plan.priority === "high"
                      ? "High strategic advantage"
                      : plan.priority === "medium"
                        ? "Worth building in parallel"
                        : "Lower priority right now"}
                  </div>
                </div>
                <div className="mt-4 text-2xl font-semibold text-white">{plan.title}</div>
                <div className="mt-3 max-w-2xl text-sm leading-7 text-white/68">{plan.explanation}</div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Target</div>
                  <div className="mt-3 text-lg font-semibold text-white">{plan.target}</div>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Time</div>
                  <div className="mt-3 text-lg font-semibold text-white">{plan.timeline}</div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Why French may change the roadmap
                </div>
                <div className="mt-3 text-sm leading-7 text-white/68">{plan.explanation}</div>
              </div>
            </div>

            {userPlan === "pro" ? (
              <div className="space-y-4">
                <div className="rounded-[30px] border border-cyan-400/20 bg-cyan-400/10 p-6 shadow-[0_24px_80px_-56px_rgba(34,211,238,0.42)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                    Your fastest French path
                  </div>
                  <div className="mt-4 grid gap-3">
                    {plan.steps.map((step, index) => (
                      <div
                        key={step}
                        className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4"
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/70">
                          Step {index + 1}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-white/82">{step}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                    Focus areas
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {plan.focusAreas.map((area) => (
                      <span
                        key={area}
                        className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/75"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                  {plan.premiumNote ? (
                    <div className="mt-4 text-sm leading-7 text-white/66">{plan.premiumNote}</div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Why this matters for you
                  </div>
                  <div className="mt-3 text-sm leading-7 text-white/68">{whyThisMatters}</div>
                </div>
                <div className="rounded-[28px] border border-amber-400/20 bg-amber-400/10 p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100/75">
                    Reality check
                  </div>
                  <div className="mt-3 text-sm leading-7 text-amber-50/90">{realityCheck}</div>
                </div>
                <LockedInsightBlock
                  title="Unlock full execution plan"
                  href={upgradeHref}
                  features={[
                    "Full execution plan",
                    "Timeline optimization",
                    "Strategy combinations",
                    "Sequencing guidance",
                  ]}
                  ctaText="Unlock full strategy"
                  analyticsEvent="locked_strategy_clicked"
                  previewLines={[
                    "Full French execution path",
                    "Timeline and sequencing",
                    "Parallel strategy view",
                  ]}
                />
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
