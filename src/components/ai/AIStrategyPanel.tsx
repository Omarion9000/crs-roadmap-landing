"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import LockedInsightBlock from "@/components/insights/LockedInsightBlock";
import { advisorLine } from "@/lib/personalization";
import type { AIStrategyRecommendation } from "@/types/ai-strategy";

type AIStrategyPanelProps = {
  userPlan: "free" | "pro";
  loading: boolean;
  error: string;
  recommendation: AIStrategyRecommendation | null;
  accessDenied?: boolean;
  usage: {
    used: number;
    limit: number;
    remaining: number;
    period_start: string;
  } | null;
  preview?: {
    introLine?: string;
    bestMove: string;
    shortReason: string;
    whyThisMatters?: string;
    realityCheck?: string;
  } | null;
  preferredName?: string | null;
  upgradeHref?: string;
  onGenerate: () => void;
};

type StrategyResource = {
  title: string;
  description: string;
  href: string;
  external?: boolean;
};

function confidenceTone(confidence: AIStrategyRecommendation["confidence"]) {
  switch (confidence) {
    case "high":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
    case "medium":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-100";
    default:
      return "border-white/10 bg-white/5 text-white/80";
  }
}

function detectStrategyTrack(recommendation: AIStrategyRecommendation | null) {
  const source = `${recommendation?.best_strategy ?? ""} ${recommendation?.reason ?? ""}`.toLowerCase();

  if (source.includes("provincial") || source.includes("nomination") || source.includes("pnp")) {
    return "pnp";
  }

  if (source.includes("french")) {
    return "french";
  }

  if (source.includes("english") || source.includes("ielts") || source.includes("clb 9")) {
    return "english";
  }

  return "general";
}

function getOfficialResources(track: ReturnType<typeof detectStrategyTrack>): StrategyResource[] {
  if (track === "pnp") {
    return [
      {
        title: "PNP overview",
        description: "Review how provincial nominee programs work across Canada.",
        href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html",
        external: true,
      },
      {
        title: "PNP Express Entry process",
        description: "See how nomination works inside Express Entry.",
        href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees/express-entry.html",
        external: true,
      },
      {
        title: "PNP eligibility",
        description: "Check federal and stream-level eligibility context first.",
        href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees/express-entry/eligibility.html",
        external: true,
      },
      {
        title: "Confirm nomination",
        description: "Understand what happens after a province selects your profile.",
        href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees/express-entry/get-confirm-nomination.html",
        external: true,
      },
      {
        title: "Rounds of invitations",
        description: "Track current draw context while you compare timing and upside.",
        href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html",
        external: true,
      },
    ];
  }

  if (track === "english") {
    return [
      {
        title: "English strategy page",
        description: "Open the premium English strategy workspace.",
        href: "/insights/english",
      },
      {
        title: "Accepted language tests",
        description: "Confirm which official English tests Express Entry accepts.",
        href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html",
        external: true,
      },
      {
        title: "IELTS sample questions",
        description: "Use official-style sample questions to understand timing and format.",
        href: "https://ielts.org/take-a-test/preparation-resources/sample-test-questions/general-training-test",
        external: true,
      },
      {
        title: "IELTS Ready",
        description: "Structured preparation with guided practice and readiness tools.",
        href: "https://takeielts.britishcouncil.org/take-ielts/prepare/ielts-ready-premium",
        external: true,
      },
    ];
  }

  if (track === "french") {
    return [
      {
        title: "French strategy page",
        description: "Open the premium French strategy workspace.",
        href: "/insights/french",
      },
      {
        title: "Accepted language tests",
        description: "Review official language-test requirements used in Express Entry.",
        href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html",
        external: true,
      },
      {
        title: "Express Entry overview",
        description: "Check the current official framework before prioritizing French.",
        href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html",
        external: true,
      },
    ];
  }

  return [
    {
      title: "Express Entry overview",
      description: "Recheck official program structure before sequencing your next move.",
      href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html",
      external: true,
    },
    {
      title: "Rounds of invitations",
      description: "Use current draw trends as context while comparing roadmap options.",
      href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html",
      external: true,
    },
  ];
}

function topCtas(track: ReturnType<typeof detectStrategyTrack>, resources: StrategyResource[]) {
  if (track === "pnp") {
    return resources.slice(0, 2).map((resource, index) => ({
      ...resource,
      label: index === 0 ? "Check official PNP requirements" : "Review Express Entry pathway",
    }));
  }

  if (track === "english") {
    return resources.slice(0, 2).map((resource, index) => ({
      ...resource,
      label: index === 0 ? "Open English strategy page" : "Review IELTS resources",
    }));
  }

  if (track === "french") {
    return resources.slice(0, 2).map((resource, index) => ({
      ...resource,
      label: index === 0 ? "Open French strategy page" : "Review accepted language tests",
    }));
  }

  return resources.slice(0, 2).map((resource, index) => ({
    ...resource,
    label: index === 0 ? "Check official requirements" : "Explore official pathway",
  }));
}

function ActionCard({ index, step }: { index: number; step: string }) {
  const [title, support] = step.includes(". ")
    ? step.split(/\. (.+)/).filter(Boolean)
    : [step, "Turn this into a concrete move this week."];

  return (
    <div className="rounded-[22px] border border-cyan-400/15 bg-cyan-400/10 px-4 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">
        Task {index + 1}
      </div>
      <div className="mt-2 text-sm font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm leading-6 text-white/68">{support}</div>
    </div>
  );
}

function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-[24px] border border-white/10 bg-black/20">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {open ? "Hide" : "Open"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 px-4 py-4">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ResourceLink({ resource, label }: { resource: StrategyResource; label?: string }) {
  const content = (
    <>
      <div className="text-sm font-semibold text-white">{label ?? resource.title}</div>
      <div className="mt-2 text-sm leading-6 text-white/66">{resource.description}</div>
    </>
  );

  if (resource.external) {
    return (
      <a
        href={resource.href}
        target="_blank"
        rel="noreferrer"
        className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:border-white/20 hover:bg-white/[0.06]"
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={resource.href}
      className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:border-white/20 hover:bg-white/[0.06]"
    >
      {content}
    </Link>
  );
}

function LightningField({
  loading,
  hovered,
}: {
  loading: boolean;
  hovered: boolean;
}) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[230%] w-[250%] -translate-x-1/2 -translate-y-1/2">
      <motion.div
        className="absolute inset-[18%_22%] rounded-full bg-blue-500/35 blur-3xl"
        animate={{
          opacity: loading ? [0.45, 0.9, 0.52] : hovered ? [0.34, 0.75, 0.42] : [0.26, 0.58, 0.32],
          scale: loading ? [1, 1.14, 1] : hovered ? [1, 1.1, 1] : [1, 1.06, 1],
        }}
        transition={{ duration: loading ? 0.9 : hovered ? 1.2 : 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-[28%_30%] rounded-full border border-cyan-300/50"
        animate={{
          rotate: [0, 360],
          opacity: loading ? [0.42, 0.78, 0.46] : hovered ? [0.3, 0.62, 0.36] : [0.22, 0.48, 0.26],
          scale: loading ? [0.98, 1.05, 0.99] : [0.99, 1.03, 0.99],
        }}
        transition={{
          rotate: { duration: loading ? 3.2 : hovered ? 4.4 : 6.2, repeat: Infinity, ease: "linear" },
          opacity: { duration: loading ? 0.8 : hovered ? 1.1 : 1.6, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: loading ? 0.8 : hovered ? 1.1 : 1.6, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{
          clipPath:
            "polygon(0% 35%, 18% 12%, 36% 22%, 52% 8%, 68% 25%, 84% 12%, 100% 36%, 86% 58%, 100% 76%, 78% 88%, 60% 78%, 42% 92%, 22% 76%, 0% 64%, 10% 48%)",
          filter: "drop-shadow(0 0 10px rgba(34,211,238,0.9))",
        }}
      />
      <motion.svg
        aria-hidden="true"
        viewBox="0 0 320 220"
        className="absolute inset-0 h-full w-full"
        animate={{
          opacity: loading ? [0.75, 1, 0.82] : hovered ? [0.58, 0.92, 0.64] : [0.42, 0.74, 0.5],
        }}
        transition={{ duration: loading ? 0.55 : hovered ? 0.8 : 1.15, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <filter id="lightning-glow-strong" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>
        <motion.path
          d="M36 108 58 92 76 104 96 82 118 96 140 70 160 96"
          fill="none"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="3.2"
          strokeLinecap="round"
          filter="url(#lightning-glow-strong)"
          animate={{
            opacity: loading ? [0.5, 1, 0.58] : [0.34, 0.82, 0.42],
            x: [0, 2, -1, 0],
            y: [0, -1, 1, 0],
          }}
          transition={{ duration: loading ? 0.45 : 0.9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M280 96 260 82 246 94 228 72 210 90 190 64 170 88"
          fill="none"
          stroke="rgba(34,211,238,0.98)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#lightning-glow-strong)"
          animate={{
            opacity: loading ? [0.46, 0.96, 0.54] : [0.3, 0.76, 0.36],
            x: [0, -2, 1, 0],
            y: [0, 1, -1, 0],
          }}
          transition={{ duration: loading ? 0.42 : 0.84, repeat: Infinity, ease: "easeInOut", delay: 0.12 }}
        />
        <motion.path
          d="M82 158 104 144 120 154 138 136 156 148 176 130 194 144 214 132 236 148"
          fill="none"
          stroke="rgba(59,130,246,0.94)"
          strokeWidth="2.8"
          strokeLinecap="round"
          filter="url(#lightning-glow-strong)"
          animate={{
            opacity: loading ? [0.32, 0.82, 0.38] : [0.22, 0.58, 0.28],
            y: [0, 1, -1, 0],
          }}
          transition={{ duration: loading ? 0.5 : 1, repeat: Infinity, ease: "easeInOut", delay: 0.24 }}
        />
        <motion.path
          d="M68 54 92 60 108 46 124 58 142 40"
          fill="none"
          stroke="rgba(191,219,254,0.9)"
          strokeWidth="2.2"
          strokeLinecap="round"
          filter="url(#lightning-glow-strong)"
          animate={{ opacity: loading ? [0.3, 0.74, 0.36] : [0.18, 0.48, 0.22] }}
          transition={{ duration: loading ? 0.48 : 1.05, repeat: Infinity, ease: "easeInOut", delay: 0.18 }}
        />
        <motion.path
          d="M252 154 232 142 216 152 202 138 186 146"
          fill="none"
          stroke="rgba(125,211,252,0.88)"
          strokeWidth="2.2"
          strokeLinecap="round"
          filter="url(#lightning-glow-strong)"
          animate={{ opacity: loading ? [0.28, 0.7, 0.32] : [0.16, 0.42, 0.2] }}
          transition={{ duration: loading ? 0.52 : 1.1, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
      </motion.svg>
    </div>
  );
}

export default function AIStrategyPanel({
  userPlan,
  loading,
  error,
  recommendation,
  accessDenied = false,
  usage,
  preview = null,
  preferredName = null,
  upgradeHref = "/billing",
  onGenerate,
}: AIStrategyPanelProps) {
  const isPro = userPlan === "pro" && !accessDenied;
  const limitReached = (usage?.remaining ?? 1) <= 0;
  const strategyTrack = detectStrategyTrack(recommendation);
  const officialResources = recommendation ? getOfficialResources(strategyTrack) : [];
  const weeklyActions = recommendation ? recommendation.ordered_actions.slice(0, 2) : [];
  const primaryResources = topCtas(strategyTrack, officialResources);
  const [ctaHovered, setCtaHovered] = useState(false);

  if (!isPro) {
    return (
      <div className="mt-4">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
            <span aria-hidden="true">🔒</span>
            <span>Unlock your full AI roadmap</span>
          </div>
          <div className="mt-3 rounded-[26px] border border-cyan-400/20 bg-cyan-400/10 p-5">
            {preview?.introLine ? (
              <div className="text-sm leading-6 text-cyan-100/78">{preview.introLine}</div>
            ) : (
              <div className="text-sm leading-6 text-cyan-100/78">
                {advisorLine(
                  preferredName,
                  "based on your CRS profile, your AI roadmap preview starts here.",
                  "Based on your CRS profile, your AI roadmap preview starts here."
                )}
              </div>
            )}
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
              Advisor note
            </div>
            <div className="mt-3 text-2xl font-semibold text-white">
              {preview?.bestMove ?? "Generate a stronger roadmap signal in the simulator"}
            </div>
            <div className="mt-3 text-sm leading-7 text-white/76">
              {preview?.shortReason ??
                "Generate personalized roadmap sequencing, next steps, and trade-off guidance with the full AI strategy generator."}
            </div>
            <div className="mt-4 rounded-[20px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/76">
              Get complete execution steps, sequencing, and a personalized strategy built specifically for your CRS profile.
            </div>
            <div className="mt-4 rounded-[20px] border border-blue-400/20 bg-blue-500/10 p-4 text-sm leading-7 text-blue-50/90">
              You already know your strongest move. Unlock Pro to see exactly how to execute it.
            </div>
          </div>

          {preview?.whyThisMatters ? (
            <div className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Why this deserves attention now
              </div>
              <div className="mt-3 text-sm leading-6 text-white/72">{preview.whyThisMatters}</div>
            </div>
          ) : null}

          {preview?.realityCheck ? (
            <div className="mt-4 rounded-[22px] border border-amber-400/20 bg-amber-400/10 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100/75">
                Advisor reality check
              </div>
              <div className="mt-3 text-sm leading-6 text-amber-50/90">{preview.realityCheck}</div>
            </div>
          ) : null}

          <div className="mt-4">
            <LockedInsightBlock
              title="Unlock your full AI roadmap"
              features={[
                "Exact step-by-step plan",
                "Timing and sequencing",
                "Alternative paths if this fails",
                "Long-term CRS optimization strategy",
              ]}
              ctaText="Unlock AI strategy"
              href={upgradeHref}
              analyticsEvent="locked_ai_clicked"
              previewLines={[
                "Full reasoning and execution plan",
                "Timeline and risk analysis",
                "Parallel strategy view",
              ]}
            />
            <div className="mt-4 rounded-[22px] border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm leading-7 text-white/82">
              <div className="font-semibold text-white">This is just a preview.</div>
              <div className="mt-2">
                Your full roadmap includes:
              </div>
              <div className="mt-2 space-y-1 text-white/78">
                <div>• exact step-by-step plan</div>
                <div>• timing and sequencing</div>
                <div>• alternative paths if this fails</div>
                <div>• long-term CRS optimization strategy</div>
              </div>
              <div className="mt-3 font-medium text-cyan-100">
                Unlock to see everything and turn this preview into a complete execution plan.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-4 overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_36%),rgba(255,255,255,0.04)] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_-52px_rgba(59,130,246,0.32)] backdrop-blur">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/[0.06] via-transparent to-transparent" />

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/78">
            AI strategy recommendation
          </div>
          <div className="mt-2 text-base font-semibold text-white">
            Premium intelligence layered on top of your live simulator context.
          </div>
        </div>

        <motion.div
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.985 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative isolate"
          onHoverStart={() => setCtaHovered(true)}
          onHoverEnd={() => setCtaHovered(false)}
        >
          <LightningField loading={loading} hovered={ctaHovered} />
          <motion.div
            className="pointer-events-none absolute -inset-4 rounded-full bg-cyan-400/22 blur-xl"
            animate={{
              opacity: loading ? [0.4, 0.78, 0.46] : ctaHovered ? [0.28, 0.58, 0.34] : [0.2, 0.42, 0.24],
              scale: loading ? [1, 1.08, 1] : [1, 1.04, 1],
            }}
            transition={{ duration: loading ? 0.7 : ctaHovered ? 1.05 : 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -inset-x-5 -bottom-1 h-11 rounded-full bg-blue-400/18 blur-xl"
            animate={{
              opacity: loading ? [0.14, 0.34, 0.18] : ctaHovered ? [0.1, 0.22, 0.12] : [0.08, 0.18, 0.1],
            }}
            transition={{ duration: loading ? 0.8 : ctaHovered ? 1.1 : 1.7, repeat: Infinity, ease: "easeInOut" }}
          />
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading || limitReached}
            className="relative overflow-hidden rounded-full border border-cyan-300/35 bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-[0_12px_36px_-12px_rgba(56,189,248,0.55)] transition duration-300 hover:border-cyan-200/50 hover:shadow-[0_22px_46px_-14px_rgba(56,189,248,0.72)] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/20 disabled:text-white/60 disabled:shadow-none"
          >
            <span className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-cyan-200/45 to-transparent opacity-70" />
            <motion.span
              className="pointer-events-none absolute inset-y-0 left-[-30%] w-1/2 bg-linear-to-r from-transparent via-white/85 to-transparent"
              animate={{ x: ["0%", "240%"] }}
              transition={{ duration: loading ? 1.35 : 2.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="relative z-10">
              {loading
                ? "Generating your AI strategy..."
                : recommendation
                  ? "Refresh AI strategy"
                  : "Generate AI strategy"}
            </span>
          </button>
        </motion.div>
      </div>

      {usage ? (
        <div className="relative z-10 mt-4 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
          AI strategies left this month:{" "}
          <span className="font-semibold text-white">
            {usage.remaining} / {usage.limit}
          </span>
        </div>
      ) : null}

      {limitReached && !loading ? (
        <div className="relative z-10 mt-4 rounded-[18px] border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Monthly AI limit reached. Your usage resets next cycle.
        </div>
      ) : null}

      {loading ? (
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mt-4 overflow-hidden rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-5 shadow-[0_16px_50px_-28px_rgba(56,189,248,0.45)]"
        >
          <motion.div
            className="pointer-events-none absolute -left-10 top-2 h-24 w-24 rounded-full bg-cyan-300/18 blur-3xl"
            animate={{ opacity: [0.18, 0.34, 0.2], scale: [1, 1.08, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute right-0 top-0 h-28 w-36 rounded-full bg-blue-400/16 blur-3xl"
            animate={{ opacity: [0.12, 0.24, 0.14], x: [0, -10, 0] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="text-sm font-semibold text-white">Generating your AI strategy...</div>
          <div className="mt-2 text-sm leading-6 text-white/70">
            Interpreting your current CRS, strongest opportunities, and roadmap sequence in real time.
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
            <motion.div
              className="h-full w-1/3 rounded-full bg-linear-to-r from-cyan-400 via-blue-400 to-indigo-400"
              animate={{ x: ["-10%", "230%"] }}
              transition={{ duration: 1.35, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      ) : null}

      {!loading && error ? (
        <div className="relative z-10 mt-4 rounded-[24px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {!loading && recommendation ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mt-4 space-y-4"
        >
          <div className="rounded-[26px] border border-emerald-500/20 bg-emerald-500/10 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/75">
                Best realistic path right now
              </div>
              <span
                className={[
                  "rounded-full border px-3 py-1 text-xs font-semibold",
                  confidenceTone(recommendation.confidence),
                ].join(" ")}
              >
                {recommendation.confidence} confidence
              </span>
            </div>
            <div className="mt-3 text-sm leading-6 text-emerald-50/88">
              {advisorLine(
                preferredName,
                "based on your current profile, your strongest realistic next move is this one.",
                "Based on your current profile, your strongest realistic next move is this one."
              )}
            </div>
            <div className="mt-3 text-2xl font-semibold text-white">{recommendation.best_strategy}</div>
            <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              What I’d prioritize for you
            </div>
            <div className="mt-2 text-sm leading-6 text-white/74">{recommendation.reason}</div>
          </div>

          {weeklyActions.length > 0 ? (
            <div>
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                What to do first
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {weeklyActions.map((step, index) => (
                  <ActionCard key={`${index}-${step}`} index={index} step={step} />
                ))}
              </div>
            </div>
          ) : null}

          {primaryResources.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {primaryResources.map((resource) => (
                <ResourceLink key={`${resource.href}-${resource.label}`} resource={resource} label={resource.label} />
              ))}
            </div>
          ) : null}

          <div className="space-y-3">
            <AccordionSection title="See full action plan">
              <div className="grid gap-3">
                {recommendation.ordered_actions.map((step, index) => (
                  <div
                    key={`${index}-${step}`}
                    className="flex items-start gap-3 rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-sm font-semibold text-cyan-100">
                      {index + 1}
                    </div>
                    <div className="pt-1 text-sm leading-6 text-white/78">{step}</div>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {officialResources.length > 2 ? (
              <AccordionSection title="Explore official resources">
                <div className="grid gap-3 lg:grid-cols-2">
                  {officialResources.map((resource) => (
                    <ResourceLink key={resource.href} resource={resource} />
                  ))}
                </div>
              </AccordionSection>
            ) : null}

            {strategyTrack === "pnp" ? (
              <AccordionSection title="Check PNP requirements before relying on this path">
                <div className="grid gap-3 lg:grid-cols-3">
                  {[
                    "Confirm that a province or territory stream matches your profile.",
                    "Confirm that you also meet the related Express Entry and federal eligibility rules.",
                    "Check whether the pathway is actionable now or should remain a secondary plan.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-white/78"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </AccordionSection>
            ) : null}

            {recommendation.alternatives.length > 0 ? (
              <AccordionSection title="Compare alternative paths">
                <div className="grid gap-3 lg:grid-cols-2">
                  {recommendation.alternatives.map((alternative) => (
                    <div
                      key={alternative.name}
                      className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="text-base font-semibold text-white">{alternative.name}</div>
                      <div className="mt-2 text-sm text-cyan-100">{alternative.impact}</div>
                      <div className="mt-3 text-sm leading-6 text-white/68">
                        {alternative.tradeoff}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionSection>
            ) : null}

            {recommendation.caution ? (
              <AccordionSection title="Important note">
                <div className="rounded-[20px] border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
                  {recommendation.caution}
                </div>
              </AccordionSection>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
