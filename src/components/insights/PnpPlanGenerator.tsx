"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import PremiumLockedPanel from "@/components/premium/PremiumLockedPanel";
import { readStoredBaseProfile } from "@/lib/crs/baseProfile";
import {
  buildPnpStrategyContext,
  getPnpChanceLevers,
  getPnpFeasibility,
  generatePnpStrategyPlan,
} from "@/lib/strategy/pnpPlan";

type PnpPlanGeneratorProps = {
  userPlan: "free" | "pro";
  profileOwnerKey?: string | null;
  upgradeHref?: string;
};

export default function PnpPlanGenerator({
  userPlan,
  profileOwnerKey = null,
  upgradeHref = "/billing",
}: PnpPlanGeneratorProps) {
  const [hasGenerated, setHasGenerated] = useState(false);

  const context = useMemo(
    () => buildPnpStrategyContext(readStoredBaseProfile(profileOwnerKey)),
    [profileOwnerKey]
  );
  const plan = useMemo(
    () => (context ? generatePnpStrategyPlan(context) : null),
    [context]
  );
  const feasibility = useMemo(
    () => (context ? getPnpFeasibility(context) : null),
    [context]
  );
  const chanceLevers = useMemo(
    () => (context ? getPnpChanceLevers(context) : []),
    [context]
  );

  const priorityTone =
    plan?.priority === "high"
      ? "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100"
      : plan?.priority === "medium"
      ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
      : "border-white/10 bg-white/5 text-white/80";
  const feasibilityTone =
    feasibility?.status === "strong"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
      : feasibility?.status === "conditional"
      ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
      : "border-amber-400/20 bg-amber-400/10 text-amber-100";

  if (!context) {
    return (
      <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
          AI-generated PNP strategy
        </div>
        <div className="mt-4 text-2xl font-semibold text-white">
          Build your profile first to generate a provincial strategy
        </div>
        <div className="mt-3 max-w-2xl text-sm leading-7 text-white/66">
          The PNP plan uses your current CRS roadmap context so province-fit guidance can be grounded in your real profile.
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
    <section
      id="pnp-plan"
      className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_0.92fr]">
        <div className="rounded-[32px] border border-fuchsia-500/20 bg-fuchsia-500/10 p-6 shadow-[0_24px_80px_-56px_rgba(217,70,239,0.4)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-200/75">
            AI-generated PNP strategy
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-white">
            Get a realistic PNP action plan
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/82">
            See whether PNP should lead your roadmap now, what to do first, and what to use as fallback if nomination is not immediately viable.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setHasGenerated(true)}
              className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
              {hasGenerated ? "Refresh my PNP plan" : "Generate my PNP plan"}
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
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Current CRS
              </div>
              <div className="mt-2 text-sm font-semibold text-white">{context.currentCrs}</div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                English CLB
              </div>
              <div className="mt-2 text-sm font-semibold text-white">
                {context.englishClb || "Not set"}
              </div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                French CLB
              </div>
              <div className="mt-2 text-sm font-semibold text-white">
                {context.frenchClb || "Not set"}
              </div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Canadian experience
              </div>
              <div className="mt-2 text-sm font-semibold text-white">
                {context.canadianExperienceYears} year
                {context.canadianExperienceYears === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {feasibility ? (
        <div className="mt-5 rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Your PNP feasibility
            </div>
            <div
              className={[
                "rounded-full border px-3 py-1 text-xs font-semibold",
                feasibilityTone,
              ].join(" ")}
            >
              {feasibility.label}
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {feasibility.reasons.map((reason) => (
              <div
                key={reason}
                className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white/72"
              >
                {reason}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {chanceLevers.length > 0 ? (
        <div className="mt-5 rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            What would increase your chances?
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-white">
            What would increase your chances?
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {chanceLevers.map((lever) => (
              <div
                key={lever.title}
                className="rounded-[24px] border border-white/10 bg-black/20 p-4"
              >
                <div className="text-base font-semibold text-white">{lever.title}</div>
                <div className="mt-3 text-sm leading-6 text-white/68">
                  {lever.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
                  <div
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      priorityTone,
                    ].join(" ")}
                  >
                    {plan.priority === "high"
                      ? "High impact opportunity"
                      : plan.priority === "medium"
                        ? "Medium opportunity"
                        : "Not priority right now"}
                  </div>
                </div>
                <div className="mt-4 text-2xl font-semibold text-white">{plan.title}</div>
                <div className="mt-3 max-w-2xl text-sm leading-7 text-white/68">
                  {plan.explanation}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Your target
                  </div>
                  <div className="mt-3 text-lg font-semibold text-white">{plan.target}</div>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Timeline
                  </div>
                  <div className="mt-3 text-lg font-semibold text-white">{plan.timeline}</div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Why PNP matters for you
                </div>
                <div className="mt-3 text-sm leading-7 text-white/68">{plan.explanation}</div>
              </div>
            </div>

            {userPlan === "pro" ? (
              <div className="space-y-4">
                <div className="rounded-[30px] border border-fuchsia-500/20 bg-fuchsia-500/10 p-6 shadow-[0_24px_80px_-56px_rgba(217,70,239,0.45)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-200/75">
                    Strategy path
                  </div>
                  <div className="mt-4 grid gap-3">
                    {plan.steps.map((step, index) => (
                      <div
                        key={step}
                        className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4"
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200/70">
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
              <PremiumLockedPanel
                compact
                title="Unlock full PNP strategy"
                description="Free preview shows the priority, impact framing, and core target. Pro unlocks the full strategy path, focus areas, sequencing guidance, and deeper roadmap planning."
                primaryHref={upgradeHref}
                primaryLabel="Unlock full strategy"
                analyticsEvent="locked_strategy_clicked"
                bullets={[
                  "Full strategy path",
                  "Focus areas",
                  "Deeper roadmap guidance",
                ]}
              />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
