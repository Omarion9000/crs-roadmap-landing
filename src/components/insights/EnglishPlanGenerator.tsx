"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import LockedInsightBlock from "@/components/insights/LockedInsightBlock";
import {
  buildEnglishStrategyContext,
  generateEnglishStrategyPlan,
} from "@/lib/strategy/englishPlan";
import { readStoredBaseProfile } from "@/lib/crs/baseProfile";

type EnglishPlanGeneratorProps = {
  userPlan: "free" | "pro";
  profileOwnerKey?: string | null;
  upgradeHref?: string;
};

export default function EnglishPlanGenerator({
  userPlan,
  profileOwnerKey = null,
  upgradeHref = "/billing",
}: EnglishPlanGeneratorProps) {
  const [hasGenerated, setHasGenerated] = useState(false);

  const context = useMemo(
    () => buildEnglishStrategyContext(readStoredBaseProfile(profileOwnerKey)),
    [profileOwnerKey]
  );
  const plan = useMemo(
    () => (context ? generateEnglishStrategyPlan(context) : null),
    [context]
  );

  const priorityTone =
    plan?.priority === "high"
      ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
      : plan?.priority === "medium"
      ? "border-indigo-400/20 bg-indigo-400/10 text-indigo-100"
      : "border-white/10 bg-white/5 text-white/80";
  const whyThisMatters = context
    ? context.currentCrs < 500
      ? "At your current CRS, small improvements may not be enough on their own. English matters most when it creates a stronger threshold unlock you can control directly."
      : "At your current CRS, English still matters when it protects competitiveness or sharpens a threshold that is already close."
    : "";
  const realityCheck = context
    ? context.currentCrs < 490
      ? "Even after an English gain, your profile may still need another lever such as French, experience, or a stronger parallel path."
      : "Even if English helps, the roadmap still depends on keeping results stable and comparing it against your other realistic moves."
    : "";

  if (!context) {
    return (
      <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
          AI-generated English plan
        </div>
        <div className="mt-4 text-2xl font-semibold text-white">
          Build your profile first to generate a personalized plan
        </div>
        <div className="mt-3 max-w-2xl text-sm leading-7 text-white/66">
          The AI plan uses your current roadmap context from the calculator and simulator flow. Start there so the strategy can be personalized to your real profile.
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
        <div className="rounded-[32px] border border-indigo-500/20 bg-indigo-500/10 p-6 shadow-[0_24px_80px_-56px_rgba(99,102,241,0.4)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-200/75">
            AI-generated English plan
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-white">
            Generate my English plan
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/82">
            This plan is generated from your current roadmap context and is designed to help you sequence English improvement more intelligently.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setHasGenerated(true)}
              className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
              {hasGenerated ? "Refresh my plan" : "Generate my English plan"}
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
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">French</div>
              <div className="mt-2 text-sm font-semibold text-white">{context.frenchClb || "Not set"}</div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Canadian experience</div>
              <div className="mt-2 text-sm font-semibold text-white">{context.canadianExperienceYears} year{context.canadianExperienceYears === 1 ? "" : "s"}</div>
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
                      ? "High priority"
                      : plan.priority === "medium"
                      ? "Medium priority"
                      : "Low priority"}
                  </div>
                </div>
                <div className="mt-4 text-2xl font-semibold text-white">{plan.title}</div>
                <div className="mt-3 max-w-2xl text-sm leading-7 text-white/68">{plan.explanation}</div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Your target</div>
                  <div className="mt-3 text-lg font-semibold text-white">{plan.target}</div>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Timeline estimate</div>
                  <div className="mt-3 text-lg font-semibold text-white">{plan.timeline}</div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Why English matters for you
                </div>
                <div className="mt-3 text-sm leading-7 text-white/68">{plan.explanation}</div>
              </div>
            </div>

            {userPlan === "pro" ? (
              <div className="space-y-4">
                <div className="rounded-[30px] border border-emerald-500/20 bg-emerald-500/10 p-6 shadow-[0_24px_80px_-56px_rgba(16,185,129,0.45)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/75">
                    Fastest path
                  </div>
                  <div className="mt-4 grid gap-3">
                    {plan.steps.map((step, index) => (
                      <div
                        key={step}
                        className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4"
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/70">
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
                    "Deeper sequencing guidance",
                  ]}
                  ctaText="Unlock full strategy"
                  analyticsEvent="locked_strategy_clicked"
                  previewLines={[
                    "Step-by-step execution path",
                    "Timeline and sequencing details",
                    "Combination strategy view",
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
