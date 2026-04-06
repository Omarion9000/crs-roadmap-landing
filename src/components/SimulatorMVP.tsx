// src/components/SimulatorMVP.tsx
"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { simulate } from "@/lib/crs/api";
import {
  clearStoredProfileState,
  getBaseProfileOwnerKey,
  persistStoredBaseProfile,
  readAnyStoredBaseProfile,
  readStoredBaseProfile,
  type StoredBaseProfilePayload,
} from "@/lib/crs/baseProfile";
import type { Lang, Profile, ScenarioResult } from "@/lib/crs/types";
import type { User } from "@supabase/supabase-js";
import { getBenchmark } from "@/lib/insights/api";
import type { ProgramKey, BenchmarkData } from "@/lib/insights/api";
import SimulatorHero from "@/components/simulator/SimulatorHero";
import MarketOverview from "@/components/simulator/MarketOverview";
import ProfileSummaryPanel from "@/components/simulator/ProfileSummaryPanel";
import PremiumLockedPanel from "@/components/premium/PremiumLockedPanel";
import AIStrategyPanel from "@/components/ai/AIStrategyPanel";
import { trackFunnelEvent, trackFunnelEventOnce } from "@/lib/funnel";
import { buildRecommendationSummary } from "@/lib/strategy/recommendationSummary";
import { buildBillingHref, buildLoginHref, buildUpgradeEntryHref, upgradeSuccessMessage } from "@/lib/upgrade";
import { greetingLabel, roadmapDisplayName } from "@/lib/personalization";
import type { AIStrategyRecommendation } from "@/types/ai-strategy";

// ---------- UI helpers ----------
function deltaLabel(delta: number) {
  if (delta >= 500) return "Massive";
  if (delta >= 80) return "High";
  if (delta >= 45) return "Medium";
  return "Low";
}

function clampInt(value: number, min: number, max: number) {
  const n = Number.isFinite(value) ? Math.trunc(value) : min;
  return Math.max(min, Math.min(max, n));
}

function gapLabel(gap: number, hasPnp?: boolean) {
  if (hasPnp) return "Nomination level";
  const abs = Math.abs(gap);
  if (gap > 0) return `${abs} points below`;
  if (gap < 0) return `${abs} points above`;
  return "At cutoff";
}

function gapToneClass(gap: number) {
  if (gap <= 0) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (gap <= 15) return "border-blue-500/30 bg-blue-500/10 text-blue-200";
  if (gap <= 40) return "border-indigo-500/30 bg-indigo-500/10 text-indigo-200";
  return "border-red-500/30 bg-red-500/10 text-red-200";
}

function gapToneClassWithPnp(gap: number, hasPnp: boolean) {
  if (hasPnp) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  return gapToneClass(gap);
}

// ---------- Probability Zone (v2.2) ----------
type Zone = "very_unlikely" | "borderline" | "competitive" | "strong" | "nomination";

function zoneFromGap(gap: number): Zone {
  if (gap <= 0) return "strong";
  if (gap <= 10) return "competitive";
  if (gap <= 30) return "borderline";
  return "very_unlikely";
}

function zoneLabel(z: Zone) {
  switch (z) {
    case "nomination":
      return "Nomination level";
    case "strong":
      return "Strong";
    case "competitive":
      return "Competitive";
    case "borderline":
      return "Borderline";
    default:
      return "Very unlikely";
  }
}

function zonePillClass(z: Zone) {
  switch (z) {
    case "nomination":
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200";
    case "strong":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    case "competitive":
      return "border-blue-500/30 bg-blue-500/10 text-blue-200";
    case "borderline":
      return "border-indigo-500/30 bg-indigo-500/10 text-indigo-200";
    default:
      return "border-red-500/30 bg-red-500/10 text-red-200";
  }
}

function scenarioAccent(id: string) {
  if (id === "pnp") {
    return {
      ring: "border-fuchsia-500/25",
      glow: "from-fuchsia-500/20 via-violet-500/10 to-cyan-500/5",
      chip: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200",
      artA: "bg-linear-to-br from-fuchsia-400/90 to-violet-500/80",
      artB: "bg-linear-to-br from-white/80 to-fuchsia-200/70",
      text: "text-fuchsia-100",
      shadow: "shadow-[0_20px_60px_-40px_rgba(217,70,239,0.45)]",
    };
  }

  if (id.includes("french")) {
    return {
      ring: "border-cyan-500/25",
      glow: "from-cyan-500/20 via-sky-500/10 to-indigo-500/5",
      chip: "border-cyan-500/30 bg-cyan-500/10 text-cyan-100",
      artA: "bg-linear-to-br from-cyan-400/90 to-sky-500/80",
      artB: "bg-linear-to-br from-white/80 to-cyan-200/70",
      text: "text-cyan-100",
      shadow: "shadow-[0_20px_60px_-40px_rgba(34,211,238,0.45)]",
    };
  }

  if (id.includes("ielts") || id.includes("english")) {
    return {
      ring: "border-indigo-500/25",
      glow: "from-indigo-500/20 via-blue-500/10 to-cyan-500/5",
      chip: "border-indigo-500/30 bg-indigo-500/10 text-indigo-100",
      artA: "bg-linear-to-br from-indigo-400/90 to-blue-500/80",
      artB: "bg-linear-to-br from-white/80 to-indigo-200/70",
      text: "text-indigo-100",
      shadow: "shadow-[0_20px_60px_-40px_rgba(99,102,241,0.45)]",
    };
  }

  if (id.includes("cec") || id.includes("experience")) {
    return {
      ring: "border-emerald-500/25",
      glow: "from-emerald-500/20 via-teal-500/10 to-cyan-500/5",
      chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
      artA: "bg-linear-to-br from-emerald-400/90 to-teal-500/80",
      artB: "bg-linear-to-br from-white/80 to-emerald-200/70",
      text: "text-emerald-100",
      shadow: "shadow-[0_20px_60px_-40px_rgba(16,185,129,0.45)]",
    };
  }

  if (id.includes("job")) {
    return {
      ring: "border-amber-500/25",
      glow: "from-amber-500/20 via-orange-500/10 to-yellow-500/5",
      chip: "border-amber-500/30 bg-amber-500/10 text-amber-100",
      artA: "bg-linear-to-br from-amber-400/90 to-orange-500/80",
      artB: "bg-linear-to-br from-white/80 to-amber-200/70",
      text: "text-amber-100",
      shadow: "shadow-[0_20px_60px_-40px_rgba(245,158,11,0.45)]",
    };
  }

  return {
    ring: "border-white/10",
    glow: "from-white/10 via-white/5 to-transparent",
    chip: "border-white/10 bg-white/5 text-white/80",
    artA: "bg-linear-to-br from-white/80 to-white/30",
    artB: "bg-linear-to-br from-white/90 to-white/50",
    text: "text-white",
    shadow: "shadow-[0_20px_60px_-40px_rgba(255,255,255,0.15)]",
  };
}

function scenarioArtLabel(id: string) {
  if (id === "pnp") return "PNP";
  if (id.includes("french")) return "FR";
  if (id.includes("ielts") || id.includes("english")) return "EN";
  if (id.includes("cec") || id.includes("experience")) return "EXP";
  if (id.includes("job")) return "JOB";
  return "CRS";
}

function projectedOutcomeTone(projectedGap: number) {
  if (projectedGap <= 0) {
    return {
      pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
      label: "Above cutoff",
    };
  }

  if (projectedGap <= 15) {
    return {
      pill: "border-blue-500/30 bg-blue-500/10 text-blue-200",
      label: "Borderline",
    };
  }

  if (projectedGap <= 40) {
    return {
      pill: "border-indigo-500/30 bg-indigo-500/10 text-indigo-200",
      label: "Close range",
    };
  }

  return {
    pill: "border-red-500/30 bg-red-500/10 text-red-200",
    label: "Far below cutoff",
  };
}

const getScenarioImage = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("french")) return "/assets/brain.png";
  if (t.includes("ielts") || t.includes("english")) return "/assets/growth.png";
  if (t.includes("pnp")) return "/assets/shield.png";
  return null;
};

const getScenarioGradient = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("french")) {
    return "from-cyan-500/25 via-blue-500/12 to-indigo-500/20";
  }
  if (t.includes("ielts") || t.includes("english")) {
    return "from-blue-500/25 via-violet-500/12 to-fuchsia-500/18";
  }
  if (t.includes("pnp")) {
    return "from-fuchsia-500/28 via-violet-500/15 to-indigo-500/18";
  }
  return "from-white/10 via-white/5 to-transparent";
};

function getScenarioParticleClass(title: string) {
  const t = title.toLowerCase();
  if (t.includes("french")) return "bg-cyan-200/80";
  if (t.includes("ielts") || t.includes("english")) return "bg-blue-200/80";
  if (t.includes("pnp")) return "bg-fuchsia-200/80";
  return "bg-white/70";
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerShell: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

function MotionReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function GlassPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden border border-white/10 bg-[#0c1120]/96",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_18px_48px_-42px_rgba(99,102,241,0.26)]",
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/[0.08] via-transparent to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function programLabel(p: ProgramKey) {
  if (p === "general") return "General";
  if (p === "category") return "Category";
  if (p === "cec") return "CEC (soon)";
  if (p === "fsw") return "FSW (soon)";
  return "PNP (soon)";
}

function formatUpdatedAt(v: string) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

// ---------- Draws history helpers (no-any, defensive parsing) ----------
type DrawPoint = { date: string; cutoff: number };

type CompareSeries = {
  program: ProgramKey;
  cutoff: number;
  trendLabel: string;
  gap: number;
  zone: Zone;
  history: DrawPoint[];
  historyUpdatedAt?: string;
  source: string;
};

type RoadmapHistoryItem = {
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
    lang?: Lang;
    educationLabel?: string;
    foreignExperienceLabel?: string;
    canadianCredentialLabel?: string;
    profileModeLabel?: string;
    rawForm?: Record<string, unknown>;
    ai_strategy?: AIStrategyRecommendation | null;
    ai_strategy_updated_at?: string;
  };
  program_target: ProgramKey;
  created_at: string;
};

type SimulationToggleKey =
  | "english"
  | "french"
  | "canadianExperience"
  | "jobOffer"
  | "pnp";

type ScenarioOpportunity = {
  key: SimulationToggleKey;
  scenarioId: string;
  title: string;
  description: string;
};

const simulationOpportunities: ScenarioOpportunity[] = [
  {
    key: "english",
    scenarioId: "ielts_to_clb9",
    title: "Improve English to CLB 9",
    description: "Preview the upside from reaching the high-value English threshold.",
  },
  {
    key: "french",
    scenarioId: "french_to_b2",
    title: "Add French B2",
    description: "Model the jump from stronger French results and bilingual synergy.",
  },
  {
    key: "canadianExperience",
    scenarioId: "cec_plus_1_year",
    title: "Gain 1 year Canadian experience",
    description: "Estimate the next CRS lift from one more year of Canadian work experience.",
  },
  {
    key: "jobOffer",
    scenarioId: "job_offer",
    title: "Add qualifying job offer",
    description: "See the effect of a qualifying job offer on your roadmap options.",
  },
  {
    key: "pnp",
    scenarioId: "pnp_nomination",
    title: "Add provincial nomination",
    description: "Preview the strongest nomination-level jump when PNP is still missing.",
  },
];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function toDrawPoint(v: unknown): DrawPoint | null {
  if (!isRecord(v)) return null;
  const date = v.date;
  const cutoff = v.cutoff;
  if (typeof date !== "string") return null;
  if (typeof cutoff !== "number" || !Number.isFinite(cutoff)) return null;
  return { date, cutoff };
}

function parseDrawsPayload(payload: unknown): { points: DrawPoint[]; updatedAt?: string } {
  if (!isRecord(payload)) return { points: [] };

  const updatedAt = typeof payload.updatedAt === "string" ? payload.updatedAt : undefined;

  // Common shapes:
  // - { ok: true, items: [...] }
  // - { items: [...], updatedAt }
  // - { ok: true, data: { items: [...] } }
  // - { data: [...] }

  const directItems = payload.items;
  if (Array.isArray(directItems)) {
    return {
      points: directItems.map(toDrawPoint).filter((x): x is DrawPoint => x !== null),
      updatedAt,
    };
  }

  const data = payload.data;
  if (Array.isArray(data)) {
    return {
      points: data.map(toDrawPoint).filter((x): x is DrawPoint => x !== null),
      updatedAt,
    };
  }

  if (isRecord(data) && Array.isArray(data.items)) {
    const innerUpdatedAt = typeof data.updatedAt === "string" ? data.updatedAt : updatedAt;
    return {
      points: (data.items as unknown[]).map(toDrawPoint).filter((x): x is DrawPoint => x !== null),
      updatedAt: innerUpdatedAt,
    };
  }

  return { points: [], updatedAt };
}

function sparklinePoints(points: DrawPoint[]) {
  const values = points.map((p) => p.cutoff);
  const max = values.length ? Math.max(...values) : 1;
  const min = values.length ? Math.min(...values) : 0;
  const range = Math.max(1, max - min);

  const poly = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * 100;
      const y = 35 - ((v - min) / range) * 30;
      return `${x},${y}`;
    })
    .join(" ");

  return { poly, min, max };
}

function mapStoredDataToProfile(payload: StoredBaseProfilePayload): Profile {
  const base = payload.baseProfile;

  return {
    baseCrs: clampInt(base.currentCrs, 1, 2000),
    ieltsClb: clampInt(base.englishClb ?? 0, 0, 10),
    frenchClb: clampInt(base.frenchClb ?? 0, 0, 10),
    canExpYears: clampInt(base.canadianExperienceYears ?? 0, 0, 5),
    hasJobOffer: !!base.hasJobOffer,
    hasPnp: !!base.hasPnp,
  };
}

function scenarioAlreadyAchieved(profile: Profile, scenarioId: string) {
  switch (scenarioId) {
    case "ielts_to_clb9":
      return profile.ieltsClb >= 9;
    case "french_to_b2":
      return profile.frenchClb >= 9;
    case "cec_plus_1_year":
      return profile.canExpYears >= 5;
    case "job_offer":
      return profile.hasJobOffer;
    case "pnp_nomination":
      return profile.hasPnp;
    default:
      return false;
  }
}

function strategyHrefForScenario(id: string) {
  switch (id) {
    case "french_to_b2":
      return "/insights/french";
    case "pnp_nomination":
      return "/insights/pnp";
    case "job_offer":
      return "/insights/job-offer";
    case "cec_plus_1_year":
      return "/insights/canadian-experience";
    case "ielts_to_clb9":
    default:
      return "/insights/english";
  }
}

function scenarioSummaryText(s: ScenarioResult) {
  return (
    ("summary" in s && typeof (s as ScenarioResult & { summary?: string }).summary === "string"
      ? (s as ScenarioResult & { summary?: string }).summary
      : s.description) || "Projected improvement based on your current CRS profile and selected program."
  );
}

function scenarioNoteText(title: string) {
  const normalized = title.toLowerCase();

  if (normalized.includes("french")) {
    return "Useful when French is still missing from your current profile and you want one of the strongest non-PNP jumps.";
  }
  if (normalized.includes("ielts") || normalized.includes("english")) {
    return "Usually one of the fastest score improvements to execute if your English is not yet maxed out.";
  }
  if (normalized.includes("job")) {
    return "Depends on whether the offer qualifies under current Express Entry and work eligibility rules.";
  }
  if (normalized.includes("cec") || normalized.includes("experience")) {
    return "Canadian experience can improve CRS and may also strengthen eligibility positioning.";
  }
  if (normalized.includes("pnp")) {
    return "This is usually the highest possible score jump, but it depends on real provincial eligibility.";
  }

  return "Use this scenario to compare the score impact against your current profile.";
}

function projectedScenarioCrs(s: ScenarioResult, profile: Profile, scenarioId: string) {
  return typeof s.newCrs === "number"
    ? s.newCrs
    : profile.baseCrs + s.delta + (profile.hasPnp && scenarioId !== "pnp" ? 600 : 0);
}

function labelForBoolean(value: boolean, positive = "Yes", negative = "No") {
  return value ? positive : negative;
}

type ScenarioOpportunityCardProps = {
  scenario: ScenarioResult;
  profile: Profile;
  cutoff: number;
  userPlan: "free" | "pro";
  topTier?: boolean;
  animated?: boolean;
};

function ScenarioOpportunityCardInner({
  scenario,
  profile,
  cutoff,
  userPlan,
  topTier = false,
  animated = false,
}: ScenarioOpportunityCardProps) {
  const cardModel = useMemo(() => {
    const scenarioId = scenario.id === "pnp_nomination" ? "pnp" : scenario.id;
    const accent = scenarioAccent(scenarioId);
    const artLabel = scenarioArtLabel(scenarioId);
    const scenarioImage = topTier ? getScenarioImage(scenario.title) : null;
    const projectedCrs = projectedScenarioCrs(scenario, profile, scenarioId);
    const projectedGap = cutoff - projectedCrs;
    const outcomeTone = projectedOutcomeTone(projectedGap);
    const gradientClass = scenarioImage ? getScenarioGradient(scenario.title) : null;
    const particleClass = scenarioImage ? getScenarioParticleClass(scenario.title) : null;
    const summary = scenarioSummaryText(scenario);
    const note = scenarioNoteText(scenario.title);
    const strategyHref = strategyHrefForScenario(scenario.id);

    return {
      scenarioId,
      accent,
      artLabel,
      scenarioImage,
      projectedCrs,
      projectedGap,
      outcomeTone,
      gradientClass,
      particleClass,
      summary,
      note,
      strategyHref,
    };
  }, [scenario, profile, cutoff, topTier]);

  return (
    <motion.div
      variants={animated ? fadeUp : undefined}
      initial={animated ? undefined : { opacity: 0, y: 16 }}
      animate={animated ? undefined : { opacity: 1, y: 0 }}
      exit={animated ? undefined : { opacity: 0, y: -10 }}
      whileHover={{ y: topTier ? -4 : -3, scale: topTier ? 1.005 : 1.003 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={[
        "group relative overflow-hidden border bg-[#0c1120]/95 p-5 transition duration-300",
        topTier ? "rounded-[30px]" : "rounded-[28px]",
        "hover:border-white/20 hover:bg-[#121a2d]",
        cardModel.accent.ring,
        cardModel.accent.shadow,
      ].join(" ")}
    >
      <div
        className={[
          "pointer-events-none absolute inset-0 opacity-80",
          "bg-linear-to-br",
          cardModel.accent.glow,
        ].join(" ")}
      />

      <div className="relative z-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            {topTier ? (
              cardModel.scenarioImage ? (
                <div className="relative mt-1 flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[28px]">
                  <div
                    className={[
                      "absolute inset-0 rounded-[28px] bg-linear-to-br opacity-70",
                      cardModel.gradientClass ?? "",
                    ].join(" ")}
                  />
                  <div
                    className={[
                      "absolute inset-0 rounded-[28px] bg-linear-to-br",
                      cardModel.gradientClass ?? "",
                    ].join(" ")}
                  />
                  <div className="absolute inset-0 rounded-[28px] border border-white/10 bg-black/10" />
                  <div className="absolute z-0 h-[40px] w-[40px] rounded-full bg-white/8 blur-md" />
                  <Image
                    src={cardModel.scenarioImage}
                    alt=""
                    width={72}
                    height={72}
                    className="relative z-20 h-[72px] w-[72px] object-contain drop-shadow-[0_0_28px_rgba(255,255,255,0.32)]"
                  />
                </div>
              ) : (
                <div className="relative mt-1 h-14 w-14 shrink-0 rounded-2xl border border-white/10 bg-black/30 p-2">
                  <div className={["absolute inset-2 rounded-xl opacity-90", cardModel.accent.artA].join(" ")} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-black/20">
                      <div className={["absolute h-6 w-6 rounded-lg opacity-90", cardModel.accent.artB].join(" ")} />
                      <span className="relative text-[11px] font-bold tracking-[0.18em] text-black/80">
                        {cardModel.artLabel}
                      </span>
                    </div>
                  </div>
                </div>
              )
            ) : null}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={[topTier ? "text-2xl" : "text-xl", "font-semibold tracking-tight text-white"].join(" ")}>
                  {scenario.title}
                </h3>
                <span className={["rounded-full border px-2.5 py-1 text-xs font-semibold", cardModel.accent.chip].join(" ")}>
                  {deltaLabel(scenario.delta)}
                </span>
              </div>

              <p className={["max-w-2xl text-sm leading-6", topTier ? "mt-3 text-white/65" : "mt-3 text-white/62"].join(" ")}>
                {cardModel.summary}
              </p>
            </div>
          </div>

          <div className={topTier ? "shrink-0" : undefined}>
            <div className={["border border-white/10 bg-black/25 text-right", topTier ? "rounded-[22px] px-5 py-4" : "rounded-[20px] px-4 py-3"].join(" ")}>
              <div className={[topTier ? "text-[11px] tracking-[0.2em]" : "text-[10px] tracking-[0.18em]", "font-semibold uppercase text-white/45"].join(" ")}>
                Estimated gain
              </div>
              <div className={["mt-2 font-bold text-white", topTier ? "text-3xl" : "text-2xl"].join(" ")}>
                +{scenario.delta}
              </div>
            </div>
          </div>
        </div>

        {topTier ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Projected result
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <div className="text-4xl font-bold tracking-tight text-white">{cardModel.projectedCrs}</div>
                <div className="pb-1 text-sm text-white/55">new CRS</div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={["rounded-full border px-3 py-1 text-xs font-semibold", cardModel.outcomeTone.pill].join(" ")}>
                  {cardModel.outcomeTone.label}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/75">
                  {gapLabel(cardModel.projectedGap, false)} vs cutoff {cutoff}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Scenario note
              </div>
              <div className="mt-3 text-sm leading-6 text-white/65">{cardModel.note}</div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Projected result
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <div className="text-3xl font-bold tracking-tight text-white">{cardModel.projectedCrs}</div>
                  <div className="pb-1 text-sm text-white/55">new CRS</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={["rounded-full border px-3 py-1 text-xs font-semibold", cardModel.outcomeTone.pill].join(" ")}>
                  {cardModel.outcomeTone.label}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/75">
                  {gapLabel(cardModel.projectedGap, false)} vs cutoff {cutoff}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
              What happens if...
            </span>
            <span className={["rounded-full border px-3 py-1 text-xs font-semibold", cardModel.outcomeTone.pill].join(" ")}>
              {cardModel.outcomeTone.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {userPlan === "pro" ? (
              <Link
                href={cardModel.strategyHref}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:border-white/20 hover:bg-white/10"
              >
                View premium strategy
              </Link>
            ) : (
              <Link
                href={cardModel.strategyHref}
                className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition duration-300 hover:border-cyan-400/30 hover:bg-cyan-400/15"
              >
                Unlock strategy
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const ScenarioOpportunityCard = memo(ScenarioOpportunityCardInner);

function OpportunitySkeletonCard({ topTier = false }: { topTier?: boolean }) {
  return (
    <div
      className={[
        "relative overflow-hidden border border-white/10 bg-[#0c1120]/95 p-5",
        topTier ? "rounded-[30px]" : "rounded-[28px]",
      ].join(" ")}
    >
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/[0.03] to-transparent" />
      <div className="relative z-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className={["shrink-0 rounded-[28px] bg-white/8", topTier ? "h-[88px] w-[88px]" : "h-14 w-14"].join(" ")} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className={["rounded-full bg-white/10", topTier ? "h-7 w-56" : "h-6 w-44"].join(" ")} />
                <div className="h-6 w-16 rounded-full bg-white/10" />
              </div>
              <div className="mt-3 h-4 w-full max-w-xl rounded-full bg-white/8" />
              <div className="mt-2 h-4 w-4/5 max-w-lg rounded-full bg-white/8" />
            </div>
          </div>

          <div className={["rounded-[22px] border border-white/10 bg-black/25", topTier ? "h-[84px] w-[112px]" : "h-[72px] w-[100px]"].join(" ")} />
        </div>

        <div className={["mt-5 grid gap-3", topTier ? "lg:grid-cols-[1.15fr_0.85fr]" : ""].join(" ")}>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="h-3 w-24 rounded-full bg-white/10" />
            <div className="mt-4 h-10 w-28 rounded-full bg-white/10" />
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="h-7 w-28 rounded-full bg-white/10" />
              <div className="h-7 w-36 rounded-full bg-white/10" />
            </div>
          </div>
          {topTier ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="h-3 w-28 rounded-full bg-white/10" />
              <div className="mt-4 h-4 w-full rounded-full bg-white/8" />
              <div className="mt-2 h-4 w-5/6 rounded-full bg-white/8" />
              <div className="mt-2 h-4 w-3/4 rounded-full bg-white/8" />
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="flex gap-2">
            <div className="h-7 w-32 rounded-full bg-white/10" />
            <div className="h-7 w-24 rounded-full bg-white/10" />
          </div>
          <div className="h-10 w-40 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

// ---------- Component ----------
export default function SimulatorMVP() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<Lang>("en");

  const [showMarketDetails, setShowMarketDetails] = useState<boolean>(false);
  const [compareMode, setCompareMode] = useState<boolean>(true);
  const [compare, setCompare] = useState<{ general?: CompareSeries; category?: CompareSeries }>({});
  const [compareLoading, setCompareLoading] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string>("");

  const [storedProfile, setStoredProfile] = useState<StoredBaseProfilePayload | null>(null);
  const [baseProfileReady, setBaseProfileReady] = useState(false);
  const [showAllScenarios, setShowAllScenarios] = useState(false);
  const [selectedOpportunityIds, setSelectedOpportunityIds] = useState<string[]>([]);

  // Target program for benchmark
  const [programTarget, setProgramTarget] = useState<ProgramKey>("general");

  // Persist program selection
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("crs_program_target");
      if (saved === "general" || saved === "category" || saved === "cec" || saved === "fsw" || saved === "pnp") {
        setProgramTarget(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("crs_program_target", programTarget);
    } catch {
      // ignore
    }
  }, [programTarget]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [top, setTop] = useState<ScenarioResult[]>([]);
  const [allScenarios, setAllScenarios] = useState<ScenarioResult[]>([]);
  const [roadmapSaving, setRoadmapSaving] = useState(false);
  const [roadmapMessage, setRoadmapMessage] = useState("");
  const [roadmapError, setRoadmapError] = useState("");
  const [roadmapLoadMessage, setRoadmapLoadMessage] = useState("");
  const [roadmapLoadError, setRoadmapLoadError] = useState("");
  const [loadedRoadmapEmail, setLoadedRoadmapEmail] = useState("");
  const [loadedRoadmapCreatedAt, setLoadedRoadmapCreatedAt] = useState("");
  const [roadmapHistory, setRoadmapHistory] = useState<RoadmapHistoryItem[]>([]);
  const [roadmapReplaceMode, setRoadmapReplaceMode] = useState(false);
  const [roadmapReplacingId, setRoadmapReplacingId] = useState("");
  const [lastSavedRoadmapSignature, setLastSavedRoadmapSignature] = useState("");
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authUserLoading, setAuthUserLoading] = useState(true);
  const [authUserError, setAuthUserError] = useState("");
  const [userPlan, setUserPlan] = useState<"free" | "pro">("free");
  const [userPlanLoading, setUserPlanLoading] = useState(true);
  const [aiStrategyState, setAiStrategyState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [aiStrategyError, setAiStrategyError] = useState("");
  const [aiStrategyResult, setAiStrategyResult] = useState<AIStrategyRecommendation | null>(null);
  const [aiStrategyAccessDenied, setAiStrategyAccessDenied] = useState(false);
  const [aiUsage, setAiUsage] = useState<{
    used: number;
    limit: number;
    remaining: number;
    period_start: string;
  } | null>(null);
  const authenticatedEmail = authUser?.email?.trim().toLowerCase() ?? "";
  const baseProfileOwnerKey = useMemo(() => getBaseProfileOwnerKey(authUser), [authUser]);
  const restoreRoadmapId = searchParams.get("roadmapId")?.trim() ?? "";
  const shouldRestoreFromQuery = searchParams.get("restore") === "1";
  const upgradeUnlocked = searchParams.get("pro") === "unlocked";
  const upgradeUnlockTarget = searchParams.get("unlock") ?? "pro";
  const simulatorEntry = searchParams.get("entry") ?? "";
  const restoredRoadmapIdRef = useRef<string | null>(null);
  const previousBaseProfileOwnerKeyRef = useRef<string | null | undefined>(undefined);

  // Benchmark data
  const [bench, setBench] = useState<BenchmarkData | null>(null);
  const [cutoff, setCutoff] = useState<number>(491); // fallback
  const [cutoffLoading, setCutoffLoading] = useState<boolean>(true);
  const [cutoffError, setCutoffError] = useState<string>("");

  // Debounce + abort
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hasTopResultsRef = useRef(false);

  useEffect(() => {
    trackFunnelEventOnce("simulator-viewed", "simulator_viewed", {
      entry: simulatorEntry || "direct",
    });
  }, [simulatorEntry]);

  useEffect(() => {
    if (!upgradeUnlocked) {
      return;
    }

    trackFunnelEventOnce(`checkout-completed-simulator-${upgradeUnlockTarget}`, "checkout_completed", {
      unlock: upgradeUnlockTarget,
      location: "simulator",
    });
    trackFunnelEventOnce(`pro-unlocked-simulator-${upgradeUnlockTarget}`, "pro_unlocked", {
      unlock: upgradeUnlockTarget,
      location: "simulator",
    });
  }, [upgradeUnlockTarget, upgradeUnlocked]);

  useEffect(() => {
    if (authUserLoading) {
      return;
    }

    const previousOwnerKey = previousBaseProfileOwnerKeyRef.current;
    const ownerChanged = previousOwnerKey !== undefined && previousOwnerKey !== baseProfileOwnerKey;
    const rawStoredProfile = readAnyStoredBaseProfile();
    const scopedStoredProfile = readStoredBaseProfile(baseProfileOwnerKey);

    if (
      rawStoredProfile &&
      (!baseProfileOwnerKey ||
        !rawStoredProfile.ownerKey ||
        rawStoredProfile.ownerKey !== baseProfileOwnerKey)
    ) {
      clearStoredProfileState();
    }

    if (ownerChanged) {
      setSelectedOpportunityIds([]);
      setAiStrategyState("idle");
      setAiStrategyError("");
      setAiStrategyResult(null);
      setAiStrategyAccessDenied(false);
      setAiUsage(null);
      setRoadmapLoadMessage("");
      setRoadmapLoadError("");
      setLoadedRoadmapEmail("");
      setLoadedRoadmapCreatedAt("");
      setLastSavedRoadmapSignature("");
      setRoadmapHistory([]);
      restoredRoadmapIdRef.current = null;
    }

    setStoredProfile(scopedStoredProfile);
    setBaseProfileReady(true);
    previousBaseProfileOwnerKeyRef.current = baseProfileOwnerKey;
  }, [authUserLoading, baseProfileOwnerKey]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("crs_ui_lang");
      if (saved === "en" || saved === "es") {
        setLang(saved);
      }
    } catch {
      // ignore local storage failures
    }

    const syncLanguage = (event: Event) => {
      const nextLang =
        event instanceof CustomEvent && (event.detail === "en" || event.detail === "es")
          ? event.detail
          : null;

      if (nextLang) {
        setLang(nextLang);
      }
    };

    window.addEventListener("crs-ui-lang-change", syncLanguage);

    return () => {
      window.removeEventListener("crs-ui-lang-change", syncLanguage);
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("crs_ui_lang", lang);
    } catch {
      // ignore local storage failures
    }
  }, [lang]);

  const baseProfile = useMemo(
    () => (storedProfile ? mapStoredDataToProfile(storedProfile) : null),
    [storedProfile]
  );
  const preferredName = useMemo(
    () => greetingLabel(storedProfile?.baseProfile.preferred_name),
    [storedProfile]
  );
  const roadmapName = useMemo(() => roadmapDisplayName(preferredName), [preferredName]);
  const saveRoadmapLabel = useMemo(
    () => (preferredName ? `Save ${roadmapName}` : "Save your roadmap"),
    [preferredName, roadmapName]
  );

  const profile: Profile = useMemo(
    () =>
      baseProfile ?? {
        baseCrs: 0,
        ieltsClb: 0,
        frenchClb: 0,
        canExpYears: 0,
        hasJobOffer: false,
        hasPnp: false,
      },
    [baseProfile]
  );

  const effectiveEnglishClb = useMemo(() => profile.ieltsClb, [profile.ieltsClb]);

  const effectiveBaseCrs = useMemo(() => profile.baseCrs, [profile.baseCrs]);

  const canRun = useMemo(
    () => Number.isFinite(profile.baseCrs) && profile.baseCrs > 0 && !!baseProfile,
    [baseProfile, profile.baseCrs]
  );

  const programOptions = useMemo(
    () =>
      [
        { key: "general" as ProgramKey, label: "General", enabled: true },
        { key: "category" as ProgramKey, label: "Category", enabled: true },
        { key: "cec" as ProgramKey, label: "CEC", enabled: false },
        { key: "fsw" as ProgramKey, label: "FSW", enabled: false },
        { key: "pnp" as ProgramKey, label: "PNP", enabled: false },
      ] as const,
    []
  );

  const activeIndex = useMemo(() => {
    const i = programOptions.findIndex((o) => o.key === programTarget);
    return i >= 0 ? i : 0;
  }, [programOptions, programTarget]);

  const availableOpportunities = useMemo(() => {
    if (!baseProfile) return [];

    return simulationOpportunities.filter(
      (opportunity) => !scenarioAlreadyAchieved(baseProfile, opportunity.scenarioId)
    );
  }, [baseProfile]);

  const selectedOpportunityLookup = useMemo(
    () =>
      selectedOpportunityIds.reduce<Record<string, boolean>>((acc, scenarioId) => {
        acc[scenarioId] = true;
        return acc;
      }, {}),
    [selectedOpportunityIds]
  );

  const activeToggleCount = useMemo(
    () => selectedOpportunityIds.length,
    [selectedOpportunityIds]
  );

  const profileSummaryItems = useMemo(() => {
    if (!storedProfile) return [];

    const base = storedProfile.baseProfile;

    return [
      {
        label: "Current CRS",
        value: `${base.currentCrs}`,
        alwaysShow: true,
      },
      {
        label: "English",
        value: base.englishClb ? `CLB ${base.englishClb}` : undefined,
      },
      {
        label: "French",
        value: base.frenchClb ? `CLB ${base.frenchClb}` : undefined,
      },
      {
        label: "Canadian experience",
        value: `${base.canadianExperienceYears ?? 0} year${base.canadianExperienceYears === 1 ? "" : "s"}`,
        alwaysShow: true,
      },
      {
        label: "Education",
        value: base.educationLabel,
      },
      {
        label: "Marital status",
        value: base.maritalStatusLabel,
      },
      {
        label: "Job offer",
        value: labelForBoolean(!!base.hasJobOffer),
        alwaysShow: true,
      },
      {
        label: "PNP",
        value: labelForBoolean(!!base.hasPnp),
        alwaysShow: true,
      },
      {
        label: "Foreign experience",
        value: base.foreignExperienceLabel,
      },
    ]
      .filter((item) => item.alwaysShow || !!item.value)
      .map((item) => ({
        label: item.label,
        value: item.value ?? "",
      }));
  }, [storedProfile]);

  // (A) Fetch benchmark when program changes
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    async function run() {
      setCutoffLoading(true);
      setCutoffError("");

      try {
        const data = await getBenchmark(programTarget, controller.signal);
        if (!alive) return;

        setBench(data);

        // BenchmarkData from lib/insights/api.ts might be evolving,
        // so we read cutoff defensively.
        const maybeLatest = data as unknown as { latest?: { cutoff?: unknown } };
        const c = maybeLatest?.latest?.cutoff;

        if (typeof c === "number" && Number.isFinite(c) && c > 0) {
          setCutoff(c);
        } else {
          setCutoffError("Benchmark returned invalid cutoff. Using fallback.");
        }
      } catch (e: unknown) {
        if (!alive) return;
        setCutoffError(e instanceof Error ? e.message : "Failed to load benchmark. Using fallback.");
      } finally {
        if (!alive) return;
        setCutoffLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [programTarget]);

  // (A3) Compare mode: load General + Category benchmarks + histories in parallel
  useEffect(() => {
    if (!compareMode) return;

    let alive = true;
    const controller = new AbortController();

    async function loadCompare() {
      setCompareLoading(true);
      setCompareError("");

      try {
        const [benchG, benchC, drawsGRes, drawsCRes] = await Promise.all([
          getBenchmark("general", controller.signal),
          getBenchmark("category", controller.signal),
          fetch(`/api/draws?program=general`, { method: "GET", signal: controller.signal, cache: "no-store" }),
          fetch(`/api/draws?program=category`, { method: "GET", signal: controller.signal, cache: "no-store" }),
        ]);

        const drawsGJson: unknown = drawsGRes.ok ? await drawsGRes.json() : null;
        const drawsCJson: unknown = drawsCRes.ok ? await drawsCRes.json() : null;

        if (!alive) return;

        const parsedG = drawsGJson
          ? parseDrawsPayload(drawsGJson)
          : { points: [] as DrawPoint[], updatedAt: undefined as string | undefined };

        const parsedC = drawsCJson
          ? parseDrawsPayload(drawsCJson)
          : { points: [] as DrawPoint[], updatedAt: undefined as string | undefined };

        const seriesFrom = (
          program: ProgramKey,
          benchAny: BenchmarkData,
          parsed: { points: DrawPoint[]; updatedAt?: string }
        ): CompareSeries => {
          const maybeLatest = benchAny as unknown as { latest?: { cutoff?: unknown } };
          const cutoff =
            typeof maybeLatest?.latest?.cutoff === "number" && Number.isFinite(maybeLatest.latest.cutoff)
              ? (maybeLatest.latest.cutoff as number)
              : 0;

          const maybeBench = benchAny as unknown as { trend?: unknown; source?: unknown };
          const t = typeof maybeBench?.trend === "number" ? maybeBench.trend : 0;
          const trendLabel = t === 0 ? "Stable (0)" : t > 0 ? `Up (+${t})` : `Down (${t})`;
          const source = typeof maybeBench?.source === "string" ? maybeBench.source : "mock";

          const slice = parsed.points.slice(0, 6);
          const chronological =
            slice.length >= 2 && slice[0].date > slice[slice.length - 1].date ? slice.slice().reverse() : slice;

          const gap = cutoff - effectiveBaseCrs;
          const zone = profile.hasPnp ? ("nomination" as Zone) : zoneFromGap(gap);

          return {
            program,
            cutoff,
            trendLabel,
            gap,
            zone,
            history: chronological,
            historyUpdatedAt: parsed.updatedAt,
            source,
          };
        };

        setCompare({
          general: seriesFrom("general", benchG, parsedG),
          category: seriesFrom("category", benchC, parsedC),
        });
      } catch (e: unknown) {
        if (!alive) return;
        setCompareError(e instanceof Error ? e.message : "Failed to load compare data");
      } finally {
        if (!alive) return;
        setCompareLoading(false);
      }
    }

    loadCompare();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [compareMode, effectiveBaseCrs, profile.hasPnp]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let alive = true;

    async function loadAuthUser() {
      try {
        setAuthUserLoading(true);
        setAuthUserError("");

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!alive) return;

        if (sessionError) {
          setAuthUser(null);
          setAuthUserError(sessionError.message);
          return;
        }

        if (session?.user) {
          setAuthUser(session.user);
          return;
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!alive) return;

        if (userError) {
          setAuthUser(null);
          setAuthUserError(userError.message);
          return;
        }

        setAuthUser(user ?? null);
      } catch (err: unknown) {
        if (!alive) return;
        setAuthUser(null);
        setAuthUserError(err instanceof Error ? err.message : "Failed to load authenticated user.");
      } finally {
        if (!alive) return;
        setAuthUserLoading(false);
      }
    }

    void loadAuthUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setAuthUser(session?.user ?? null);
      setAuthUserError("");
      setAuthUserLoading(false);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authenticatedEmail) {
      setRoadmapHistory([]);
      setLoadedRoadmapEmail("");
      setLoadedRoadmapCreatedAt("");
      return;
    }

    void loadRoadmapHistory();
  }, [authenticatedEmail]);

  useEffect(() => {
    let alive = true;

    async function loadUserPlan() {
      if (!authUser) {
        if (!alive) return;
        setUserPlan("free");
        setUserPlanLoading(false);
        return;
      }

      try {
        setUserPlanLoading(true);

        const res = await fetch("/api/subscription", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await res.json()) as
          | { ok?: boolean; error?: string }
          | { ok: true; plan: "free" | "pro" };

        if (!alive) return;

        if (!res.ok || !("ok" in data) || data.ok !== true || !("plan" in data)) {
          setUserPlan("free");
          return;
        }

        setUserPlan(data.plan);
      } catch {
        if (!alive) return;
        setUserPlan("free");
      } finally {
        if (!alive) return;
        setUserPlanLoading(false);
      }
    }

    void loadUserPlan();

    return () => {
      alive = false;
    };
  }, [authUser]);

  // (B) Market gaps + zones
  const marketGap = useMemo(() => cutoff - effectiveBaseCrs, [cutoff, effectiveBaseCrs]);
  const marketZone = useMemo(() => (profile.hasPnp ? ("nomination" as Zone) : zoneFromGap(marketGap)), [marketGap, profile.hasPnp]);
  const visibleTop = useMemo(
    () => top.filter((scenario) => scenario.eligible && !scenarioAlreadyAchieved(profile, scenario.id)),
    [profile, top]
  );
  const eligibleScenarioUniverse = useMemo(
    () =>
      [...allScenarios]
        .filter((scenario) => scenario.eligible && !scenarioAlreadyAchieved(profile, scenario.id))
        .sort((a, b) => b.delta - a.delta),
    [allScenarios, profile]
  );
  const primaryVisibleTop = useMemo(() => eligibleScenarioUniverse.slice(0, 3), [eligibleScenarioUniverse]);
  const extraVisibleTop = useMemo(() => eligibleScenarioUniverse.slice(3), [eligibleScenarioUniverse]);
  const hasInitialData = top.length > 0;
  const isInitialLoading = loading && !hasInitialData;
  const isRefreshing = loading && hasInitialData;
  const showOpportunitySkeletons = isInitialLoading && !error;

  useEffect(() => {
    hasTopResultsRef.current = top.length > 0;
  }, [top.length]);

  useEffect(() => {
    const availableIds = new Set(availableOpportunities.map((opportunity) => opportunity.scenarioId));
    setSelectedOpportunityIds((prev) => prev.filter((id) => availableIds.has(id)));
  }, [availableOpportunities]);

  useEffect(() => {
    if (extraVisibleTop.length === 0) {
      setShowAllScenarios(false);
    }
  }, [extraVisibleTop.length]);

  const selectedScenarioResults = useMemo(() => {
    if (!baseProfileReady) {
      return selectedOpportunityIds.map((id) => ({
        id,
        scenario: null as ScenarioResult | null,
        isReady: false,
      }));
    }

    return selectedOpportunityIds.map((id) => {
      const scenario = allScenarios.find((item) => item.id === id);

      if (!scenario) {
        return {
          id,
          scenario: null as ScenarioResult | null,
          isReady: false,
        };
      }

      return {
        id,
        scenario,
        isReady: true,
      };
    });
  }, [allScenarios, baseProfileReady, selectedOpportunityIds]);

  const visibleOpportunityCards = useMemo(
    () =>
      selectedScenarioResults.map((item) => ({
        id: item.id,
        scenario: item.scenario,
        isReady: item.isReady,
      })),
    [selectedScenarioResults]
  );

  // (C) Simulate scenarios (debounced)
  useEffect(() => {
    if (!canRun) {
      setTop([]);
      setAllScenarios([]);
      setError("");
      setLoading(false);
      hasTopResultsRef.current = false;
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError("");

    const runSimulation = async () => {
      if (controller.signal.aborted) return;

      setLoading(true);
      setError("");

      try {
        const result = await simulate({
          lang,
          profile,
          topN: 5,
          signal: controller.signal,
        });

        setTop(result.top);
        setAllScenarios(
          result.all.map((scenario) => ({
            ...scenario,
            newCrs: projectedScenarioCrs(scenario, profile, scenario.id === "pnp_nomination" ? "pnp" : scenario.id),
          }))
        );
        hasTopResultsRef.current = result.top.length > 0;
      } catch (e: unknown) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Unexpected error");
      } finally {
        if (controller.signal.aborted) return;
        setLoading(false);
      }
    };

    if (hasTopResultsRef.current) {
      debounceRef.current = window.setTimeout(() => {
        void runSimulation();
      }, 250);
    } else {
      void runSimulation();
    }

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      controller.abort();
    };
  }, [lang, profile, canRun]);

  // ✅ FIX: remove `any` (ESLint no-explicit-any)
  const benchMeta = useMemo(() => {
    const maybeBench = bench as unknown as { trend?: unknown; source?: unknown } | null;

    const t = typeof maybeBench?.trend === "number" ? maybeBench.trend : 0;
    const trendLabel = t === 0 ? "Stable (0)" : t > 0 ? `Up (+${t})` : `Down (${t})`;

    const source = typeof maybeBench?.source === "string" ? maybeBench.source : "mock";

    return { trendLabel, source };
  }, [bench]);

  const recommendationSummary = useMemo(
    () =>
      buildRecommendationSummary(visibleTop, {
        englishClb: profile.ieltsClb,
        frenchClb: profile.frenchClb,
        canadianExperienceYears: profile.canExpYears,
        hasJobOffer: profile.hasJobOffer,
        hasPnp: profile.hasPnp,
        educationLabel: storedProfile?.baseProfile.educationLabel,
        foreignExperienceLabel: storedProfile?.baseProfile.foreignExperienceLabel,
        canadianCredentialLabel: storedProfile?.baseProfile.canadianCredentialLabel,
        profileModeLabel: storedProfile?.baseProfile.profileModeLabel,
        rawForm: isRecord(storedProfile?.baseProfile.rawForm)
          ? storedProfile.baseProfile.rawForm
          : null,
        programTarget,
      }),
    [
      profile.canExpYears,
      profile.frenchClb,
      profile.hasJobOffer,
      profile.hasPnp,
      profile.ieltsClb,
      programTarget,
      storedProfile?.baseProfile.canadianCredentialLabel,
      storedProfile?.baseProfile.educationLabel,
      storedProfile?.baseProfile.foreignExperienceLabel,
      storedProfile?.baseProfile.profileModeLabel,
      storedProfile?.baseProfile.rawForm,
      visibleTop,
    ]
  );

  const aiPreview = useMemo(() => {
    const bestMove =
      recommendationSummary.bestRealisticPath ?? recommendationSummary.highestUpsidePath ?? null;

    if (!bestMove) {
      return null;
    }

    const projectedCrs = profile.baseCrs + (bestMove.delta ?? 0);
    const gapAfterMove = cutoff - projectedCrs;
    const shortReason =
      bestMove === recommendationSummary.highestUpsidePath &&
      bestMove !== recommendationSummary.bestRealisticPath
        ? "This path shows the biggest upside available from your current profile, but it may depend on more external conditions."
        : "This is one of the fastest realistic ways to increase your score from your current profile.";

    const whyThisMatters =
      cutoff - profile.baseCrs > 30
        ? "At your current CRS, small improvements may not be enough on their own. A stronger, more realistic move matters more now."
        : "At your current CRS, focused improvements can still change how competitive your roadmap looks.";

    const realityCheck =
      gapAfterMove > 0
        ? "Even after this move, your profile may still remain below the current cutoff, so you may need a second lever or a parallel path."
        : "This move can improve your position meaningfully, but draw timing and the rest of your roadmap still matter.";

    return {
      introLine: preferredName
        ? `${preferredName}, based on your current profile, your strongest realistic next move is taking shape here.`
        : "Based on your current profile, your strongest realistic next move is taking shape here.",
      bestMove:
        typeof bestMove.delta === "number"
          ? `${bestMove.title} (+${bestMove.delta} CRS)`
          : bestMove.title,
      shortReason,
      whyThisMatters,
      realityCheck,
    };
  }, [cutoff, preferredName, profile.baseCrs, recommendationSummary.bestRealisticPath, recommendationSummary.highestUpsidePath]);

  useEffect(() => {
    if (!aiPreview) {
      return;
    }

    trackFunnelEventOnce("strategy-preview-viewed", "strategy_preview_viewed", {
      bestMove: aiPreview.bestMove,
    });
  }, [aiPreview]);

  const currentRoadmapPayload = useMemo(
    () => ({
      email: authenticatedEmail,
      profile_snapshot: {
        baseCrs: profile.baseCrs,
        effectiveBaseCrs,
        preferred_name: preferredName ?? undefined,
        ieltsClb: profile.ieltsClb,
        frenchClb: profile.frenchClb,
        canExpYears: profile.canExpYears,
        hasJobOffer: profile.hasJobOffer,
        hasPnp: profile.hasPnp,
        lang,
        educationLabel: storedProfile?.baseProfile.educationLabel,
        foreignExperienceLabel: storedProfile?.baseProfile.foreignExperienceLabel,
        canadianCredentialLabel: storedProfile?.baseProfile.canadianCredentialLabel,
        profileModeLabel: storedProfile?.baseProfile.profileModeLabel,
        rawForm: storedProfile?.baseProfile.rawForm,
        ai_strategy: aiStrategyResult,
        ai_strategy_updated_at: aiStrategyResult ? new Date().toISOString() : undefined,
      },
      program_target: programTarget,
      top_scenarios: visibleTop,
    }),
    [
      aiStrategyResult,
      authenticatedEmail,
      effectiveBaseCrs,
      lang,
      profile.baseCrs,
      profile.canExpYears,
      profile.frenchClb,
      profile.hasJobOffer,
      profile.hasPnp,
      profile.ieltsClb,
      preferredName,
      programTarget,
      storedProfile?.baseProfile.canadianCredentialLabel,
      storedProfile?.baseProfile.educationLabel,
      storedProfile?.baseProfile.foreignExperienceLabel,
      storedProfile?.baseProfile.profileModeLabel,
      storedProfile?.baseProfile.rawForm,
      visibleTop,
    ]
  );

  const currentRoadmapSignature = useMemo(
    () =>
      JSON.stringify({
        profile_snapshot: {
          ...currentRoadmapPayload.profile_snapshot,
          ai_strategy_updated_at: undefined,
        },
        program_target: currentRoadmapPayload.program_target,
        top_scenarios: currentRoadmapPayload.top_scenarios,
      }),
    [currentRoadmapPayload]
  );

  const hasUnsavedRoadmapChanges = useMemo(() => {
    if (!canRun || visibleTop.length === 0) return false;
    if (!lastSavedRoadmapSignature) return true;
    return currentRoadmapSignature !== lastSavedRoadmapSignature;
  }, [canRun, currentRoadmapSignature, lastSavedRoadmapSignature, visibleTop.length]);

  async function handleSaveRoadmap(replaceRoadmapId?: string) {
    setRoadmapMessage("");
    setRoadmapError("");

    const email = authenticatedEmail;

    if (!authUser || !email) {
      setRoadmapError("You must be logged in to save a roadmap.");
      return;
    }

    if (!visibleTop.length) {
      setRoadmapError("No roadmap data available yet.");
      return;
    }

    setRoadmapSaving(true);
    setRoadmapReplacingId(replaceRoadmapId ?? "");

    try {
      const payload = {
        ...currentRoadmapPayload,
        email,
        replace_roadmap_id: replaceRoadmapId,
      };

      const res = await fetch("/api/roadmaps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.status === 403) {
        setRoadmapError("Pro plan required to save roadmaps.");
        router.push(buildBillingHref({ returnTo: "/simulator?upgradeTarget=roadmap", unlock: "roadmap" }));
        return;
      }
      const json = await res.json().catch(() => null);
      const data = json as
        | { ok?: boolean; error?: string; code?: string }
        | { ok: true; roadmap: { id: string; email: string; created_at: string } };

      if (res.status === 409 && data && "code" in data && data.code === "roadmap_limit_reached") {
        setRoadmapReplaceMode(true);
        setRoadmapError(
          "You’ve reached your roadmap limit (2). Delete one or replace an existing roadmap to save a new version."
        );
        return;
      }

      if (!res.ok || !("ok" in data) || data.ok !== true) {
        throw new Error(("error" in data && data.error) || "Failed to save roadmap.");
      }

      setRoadmapReplaceMode(false);
      setLastSavedRoadmapSignature(currentRoadmapSignature);
      setRoadmapMessage(replaceRoadmapId ? "Roadmap replaced successfully." : "Roadmap saved successfully.");
      trackFunnelEvent("roadmap_saved", {
        action: replaceRoadmapId ? "replace" : "create",
        topScenarios: visibleTop.length,
      });
      await loadRoadmapHistory();
      // setRoadmapEmail(""); // removed for auth user
    } catch (err: unknown) {
      setRoadmapError(
        err instanceof Error ? err.message : "Failed to save roadmap."
      );
    } finally {
      setRoadmapSaving(false);
      setRoadmapReplacingId("");
    }
  }

  const applyStoredProfile = useCallback((payload: StoredBaseProfilePayload) => {
    setStoredProfile(payload);
    persistStoredBaseProfile(payload);
    setSelectedOpportunityIds([]);
  }, []);

  const roadmapSnapshotToStoredProfile = useCallback((
    snapshot: RoadmapHistoryItem["profile_snapshot"]
  ): StoredBaseProfilePayload => {
    const currentCrs =
      typeof snapshot.effectiveBaseCrs === "number"
        ? snapshot.effectiveBaseCrs
        : typeof snapshot.baseCrs === "number"
        ? snapshot.baseCrs
        : 0;

    return {
      createdAt: new Date().toISOString(),
      ownerKey: baseProfileOwnerKey,
      baseProfile: {
        currentCrs,
        preferred_name: snapshot.preferred_name,
        englishClb: typeof snapshot.ieltsClb === "number" ? snapshot.ieltsClb : 0,
        frenchClb: typeof snapshot.frenchClb === "number" ? snapshot.frenchClb : 0,
        canadianExperienceYears:
          typeof snapshot.canExpYears === "number" ? snapshot.canExpYears : 0,
        hasJobOffer: !!snapshot.hasJobOffer,
        hasPnp: !!snapshot.hasPnp,
        educationLabel: snapshot.educationLabel,
        foreignExperienceLabel: snapshot.foreignExperienceLabel,
        canadianCredentialLabel: snapshot.canadianCredentialLabel,
        profileModeLabel: snapshot.profileModeLabel,
        rawForm: snapshot.rawForm,
      },
    };
  }, [baseProfileOwnerKey]);

  const restoreRoadmapState = useCallback((
    roadmap: {
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
        lang?: Lang;
        educationLabel?: string;
        foreignExperienceLabel?: string;
        canadianCredentialLabel?: string;
        profileModeLabel?: string;
        rawForm?: Record<string, unknown>;
        ai_strategy?: AIStrategyRecommendation | null;
        ai_strategy_updated_at?: string;
      };
      program_target: ProgramKey;
      top_scenarios?: ScenarioResult[];
      created_at: string;
    },
    successMessage: string
  ) => {
    const snapshot = roadmap.profile_snapshot ?? {};
    applyStoredProfile(roadmapSnapshotToStoredProfile(snapshot));
    setAiStrategyResult(snapshot.ai_strategy ?? null);
    setAiStrategyState(snapshot.ai_strategy ? "success" : "idle");
    setAiStrategyError("");
    setAiStrategyAccessDenied(false);
    setLang(snapshot.lang === "es" ? "es" : "en");

    if (
      roadmap.program_target === "general" ||
      roadmap.program_target === "category" ||
      roadmap.program_target === "cec" ||
      roadmap.program_target === "fsw" ||
      roadmap.program_target === "pnp"
    ) {
      setProgramTarget(roadmap.program_target);
    }

    setLoadedRoadmapEmail(roadmap.email);
    setLoadedRoadmapCreatedAt(roadmap.created_at);
    setLastSavedRoadmapSignature(
      JSON.stringify({
        profile_snapshot: {
          ...snapshot,
          ai_strategy_updated_at: undefined,
        },
        program_target: roadmap.program_target,
        top_scenarios: roadmap.top_scenarios ?? [],
      })
    );
    setRoadmapReplaceMode(false);
    setRoadmapLoadMessage(successMessage);
    setRoadmapLoadError("");
  }, [applyStoredProfile, roadmapSnapshotToStoredProfile]);

  function applyRoadmapToSimulator(roadmap: RoadmapHistoryItem) {
    restoreRoadmapState(roadmap, "Roadmap loaded from history.");
  }

  useEffect(() => {
    async function restoreRoadmapFromQuery() {
      if (!shouldRestoreFromQuery || !restoreRoadmapId) {
        return;
      }

      if (restoredRoadmapIdRef.current === restoreRoadmapId) {
        return;
      }

      if (authUserLoading) {
        return;
      }

      if (!authUser) {
        return;
      }

      try {
        setRoadmapLoadError("");
        setRoadmapLoadMessage("");

        const res = await fetch(`/api/roadmaps?id=${encodeURIComponent(restoreRoadmapId)}`);

        if (res.status === 403) {
          setRoadmapLoadError("Pro plan required to restore this roadmap.");
          return;
        }

        const json = await res.json().catch(() => null);
        const data = json as
          | { ok?: boolean; error?: string }
          | {
              ok: true;
              roadmap: {
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
                  lang?: Lang;
                  educationLabel?: string;
                  foreignExperienceLabel?: string;
                  canadianCredentialLabel?: string;
                  profileModeLabel?: string;
                  rawForm?: Record<string, unknown>;
                  ai_strategy?: AIStrategyRecommendation | null;
                  ai_strategy_updated_at?: string;
                };
                program_target: ProgramKey;
                top_scenarios: ScenarioResult[];
                created_at: string;
              };
            };

        if (!res.ok || !data || !("ok" in data) || data.ok !== true || !("roadmap" in data)) {
          const restoreError =
            data && "error" in data && typeof data.error === "string"
              ? data.error
              : "Failed to restore roadmap.";
          throw new Error(restoreError);
        }

        restoreRoadmapState(data.roadmap, "Roadmap restored from dashboard.");
        restoredRoadmapIdRef.current = restoreRoadmapId;
      } catch (err) {
        setRoadmapLoadError(
          err instanceof Error ? err.message : "We couldn’t restore that saved roadmap."
        );
      }
    }

    void restoreRoadmapFromQuery();
  }, [authUser, authUserLoading, restoreRoadmapId, restoreRoadmapState, shouldRestoreFromQuery]);

  async function loadRoadmapHistory() {
    try {
      const res = await fetch(`/api/roadmaps/list`);
      if (res.status === 403) {
        // User is not on Pro plan; do not attempt to parse roadmap data
        setRoadmapHistory([]);
        return;
      }
      const json = await res.json().catch(() => null);
      const data = json as
        | { ok?: boolean; error?: string }
        | { ok: true; roadmaps: RoadmapHistoryItem[] };

      if (!res.ok || !('ok' in data) || data.ok !== true || !('roadmaps' in data)) {
        return;
      }

      setRoadmapHistory(data.roadmaps);
    } catch {
      // keep silent for MVP history panel
    }
  }

  async function deleteRoadmap(id: string) {
    try {
      const res = await fetch(`/api/roadmaps?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (res.status === 403) {
        setRoadmapLoadError("Pro plan required to manage saved roadmaps.");
        router.push(buildBillingHref({ returnTo: "/simulator?upgradeTarget=roadmap", unlock: "roadmap" }));
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to delete roadmap.");
      }

      setRoadmapHistory((prev) => prev.filter((r) => r.id !== id));
      setRoadmapReplaceMode(false);

      if (loadedRoadmapEmail && roadmapHistory.length <= 1) {
        setLoadedRoadmapEmail("");
        setLoadedRoadmapCreatedAt("");
        setLastSavedRoadmapSignature("");
      }
    } catch {
      // keep silent for MVP delete flow
    }
  }

  async function handleGenerateAiStrategy() {
    if (userPlan !== "pro") {
      setAiStrategyAccessDenied(true);
      setAiStrategyState("idle");
      return;
    }

    if (aiUsage?.remaining === 0) {
      setAiStrategyAccessDenied(false);
      setAiStrategyError("You’ve reached your monthly AI limit.");
      setAiStrategyState("error");
      return;
    }

    setAiStrategyAccessDenied(false);
    setAiStrategyError("");
    setAiStrategyState("loading");

    try {
      const res = await fetch("/api/ai/strategy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile: {
            baseCrs: profile.baseCrs,
            ieltsClb: profile.ieltsClb,
            frenchClb: profile.frenchClb,
            canExpYears: profile.canExpYears,
            hasJobOffer: profile.hasJobOffer,
            hasPnp: profile.hasPnp,
            educationLabel: storedProfile?.baseProfile.educationLabel,
            foreignExperienceLabel: storedProfile?.baseProfile.foreignExperienceLabel,
            canadianCredentialLabel: storedProfile?.baseProfile.canadianCredentialLabel,
            profileModeLabel: storedProfile?.baseProfile.profileModeLabel,
            rawForm: storedProfile?.baseProfile.rawForm,
          },
          lang,
          program_target:
            programTarget === "general" || programTarget === "cec" || programTarget === "pnp"
              ? programTarget
              : "general",
          benchmark_general:
            typeof compare.general?.cutoff === "number" && Number.isFinite(compare.general.cutoff)
              ? compare.general.cutoff
              : cutoff,
          benchmark_category:
            typeof compare.category?.cutoff === "number" && Number.isFinite(compare.category.cutoff)
              ? compare.category.cutoff
              : undefined,
        }),
      });

      const json = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            code?: string;
            usage?: {
              used: number;
              limit: number;
              remaining: number;
              period_start: string;
            };
          }
        | {
            ok: true;
            recommendation: AIStrategyRecommendation;
            usage?: {
              used: number;
              limit: number;
              remaining: number;
              period_start: string;
            };
          };

      if (res.status === 403) {
        const code = json && "code" in json ? json.code : undefined;

        if (code === "ai_limit_reached") {
          if (json && "usage" in json && json.usage) {
            setAiUsage(json.usage);
          }
          setAiStrategyAccessDenied(false);
          setAiStrategyError("You’ve reached your monthly AI limit.");
          setAiStrategyState("error");
          return;
        }

        setAiStrategyAccessDenied(true);
        setAiStrategyState("idle");
        return;
      }

      if (!res.ok || !json || !("ok" in json) || json.ok !== true || !("recommendation" in json)) {
        const code = json && "code" in json ? json.code : undefined;

        if (code === "invalid_context") {
          throw new Error("Your simulator context is incomplete. Update your profile and try again.");
        }

        if (code === "openai_request_failed" || code === "missing_api_key") {
          throw new Error(
            "We couldn’t generate your strategy right now. Your roadmap is still available below. Try again in a few seconds."
          );
        }

        if (code === "ai_parse_failed") {
          throw new Error("We received an invalid AI response. Please try again.");
        }

        throw new Error((json && "error" in json && json.error) || "AI strategy request failed");
      }

      if (json.usage) {
        setAiUsage(json.usage);
      }
      setAiStrategyResult(json.recommendation);
      setAiStrategyState("success");
    } catch (error) {
      setAiStrategyError(
        error instanceof Error
          ? error.message
          : "We couldn’t generate your strategy right now. Your roadmap is still available below. Try again in a few seconds."
      );
      setAiStrategyState("error");
    }
  }

  const hasServerRoadmapContinuity = !!authUser && userPlan === "pro" && roadmapHistory.length > 0;

  return (
    <div className="relative min-h-[calc(100vh-0px)] bg-[#070A12] text-white">
      {/* background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#070A12] via-[#070A12] to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_42%),radial-gradient(circle_at_18%_78%,rgba(59,130,246,0.12),transparent_34%),radial-gradient(circle_at_85%_42%,rgba(139,92,246,0.12),transparent_32%)]" />
      </div>

      <main className="mx-auto max-w-screen-2xl px-6 py-8 lg:px-12 2xl:px-16">
        {upgradeUnlocked ? (
          <MotionReveal>
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {upgradeSuccessMessage(upgradeUnlockTarget)}
            </div>
          </MotionReveal>
        ) : null}

        <MotionReveal>
          <GlassPanel className="mb-8 rounded-[40px]">
            <SimulatorHero
              loading={loading}
              cutoffLoading={cutoffLoading}
              benchAvailable={!!bench}
              benchSourceLabel={bench ? `Live source: ${benchMeta.source}` : "Benchmark fallback active"}
              programOptions={programOptions}
              activeIndex={activeIndex}
              programTarget={programTarget}
              onProgramChange={setProgramTarget}
            />
          </GlassPanel>
        </MotionReveal>

        {baseProfileReady && !storedProfile && !hasServerRoadmapContinuity ? (
          <MotionReveal delay={0.08}>
            <GlassPanel className="rounded-[32px]">
              <div className="max-w-2xl p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                Build your profile first
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Start with the calculator so we can personalize your simulator and roadmap.
              </div>
              <div className="mt-3 text-sm leading-6 text-white/60">
                Your simulator uses the base CRS profile from step one to rank realistic opportunities, preview strategy moves, and save a roadmap that actually reflects your situation.
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/crs-calculator"
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Go to calculator
                </Link>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
                  Free preview active
                </span>
              </div>
              </div>
            </GlassPanel>
          </MotionReveal>
        ) : null}

        {baseProfileReady && !storedProfile && hasServerRoadmapContinuity ? (
          <MotionReveal delay={0.08}>
            <GlassPanel className="rounded-[32px]">
              <div className="max-w-2xl p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                  Returning roadmap continuity
                </div>
                <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  Your saved roadmap history is ready to restore.
                </div>
                <div className="mt-4 text-sm leading-7 text-white/68">
                  Open your dashboard or restore a saved roadmap below to bring your latest profile and AI layer back into the simulator.
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/dashboard"
                    className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                  >
                    Open dashboard
                  </Link>
                  <Link
                    href={
                      roadmapHistory[0]
                        ? `/simulator?roadmapId=${encodeURIComponent(roadmapHistory[0].id)}&restore=1`
                        : "/dashboard"
                    }
                    className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Restore latest roadmap
                  </Link>
                </div>
              </div>
            </GlassPanel>
          </MotionReveal>
        ) : null}

        {!baseProfileReady || !storedProfile ? null : (
          <>
        {/* Market overview + optional details */}
        <MotionReveal delay={0.12}>
        <GlassPanel className="mb-6 rounded-[34px]">
          <MarketOverview
            programLabel={programLabel(programTarget)}
            marketZoneLabel={zoneLabel(marketZone)}
            marketZoneClass={zonePillClass(marketZone)}
            showMarketDetails={showMarketDetails}
            onToggleMarketDetails={() => setShowMarketDetails((v) => !v)}
            snapshotToneClass={gapToneClassWithPnp(marketGap, profile.hasPnp)}
            effectiveBaseCrs={effectiveBaseCrs}
            cutoff={cutoff}
            marketGap={marketGap}
            gapLabel={gapLabel(marketGap, profile.hasPnp)}
            hasPnp={profile.hasPnp}
            trendLabel={benchMeta.trendLabel}
            marketDirectionText={
              cutoffLoading
                ? "Refreshing latest market movement…"
                : cutoffError
                ? "Using fallback benchmark data."
                : bench
                ? `Source: ${benchMeta.source}`
                : "Benchmark unavailable."
            }
            progressWidth={Math.max(8, Math.min(100, (effectiveBaseCrs / Math.max(1, cutoff)) * 100))}
            detailsContent={
              <div className="rounded-3xl border border-white/10 bg-black/15 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">Detailed market compare</div>
                    <div className="mt-1 text-xs text-white/55">
                      Compare General vs Category only when you want more context.
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {compareLoading ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/75">
                        Loading…
                      </span>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setCompareMode((v) => !v)}
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-semibold transition",
                        compareMode
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                      ].join(" ")}
                    >
                      Compare: {compareMode ? "On" : "Off"}
                    </button>
                  </div>
                </div>

                {compareMode ? (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {([compare.general, compare.category] as Array<CompareSeries | undefined>).map((s) => {
                      if (!s) return null;

                      const hasHist = Array.isArray(s.history) && s.history.length >= 2;
                      const sparkData = hasHist ? sparklinePoints(s.history) : null;

                      const winner =
                        compare.general && compare.category
                          ? s.program ===
                            (Math.abs(compare.general.gap) <= Math.abs(compare.category.gap)
                              ? compare.general.program
                              : compare.category.program)
                          : false;

                      return (
                        <button
                          key={s.program}
                          type="button"
                          onClick={() => setProgramTarget(s.program)}
                          className={[
                            "w-full text-left rounded-3xl border bg-black/20 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition",
                            "hover:border-white/20 hover:bg-black/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
                            s.program === programTarget ? "border-indigo-500/30 ring-1 ring-indigo-500/25" : "border-white/10",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-white">{programLabel(s.program)}</div>

                                {winner ? (
                                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                                    Better right now
                                  </span>
                                ) : null}

                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/70">
                                  {s.source}
                                </span>
                              </div>

                              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                                  <div className="text-[10px] font-semibold text-white/60">Cutoff</div>
                                  <div className="mt-0.5 text-sm font-semibold text-white">{s.cutoff || "—"}</div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                                  <div className="text-[10px] font-semibold text-white/60">Trend</div>
                                  <div className="mt-0.5 text-sm font-semibold text-white">{s.trendLabel}</div>
                                </div>

                                <div className={["rounded-2xl border px-3 py-2", gapToneClassWithPnp(s.gap, profile.hasPnp)].join(" ")}>
                                  <div className="text-[10px] font-semibold opacity-80">Gap</div>
                                  <div className="mt-0.5 text-sm font-semibold">{gapLabel(s.gap, profile.hasPnp)}</div>
                                </div>

                                <div className={["rounded-2xl border px-3 py-2", zonePillClass(s.zone)].join(" ")}>
                                  <div className="text-[10px] font-semibold opacity-80">Zone</div>
                                  <div className="mt-0.5 text-xs font-semibold leading-tight line-clamp-2">
                                    {zoneLabel(s.zone)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {sparkData ? (
                                <svg viewBox="0 0 100 40" className="h-10 w-28">
                                  <defs>
                                    <linearGradient id={`cmp-spark-${s.program}`} x1="0" x2="1" y1="0" y2="0">
                                      <stop offset="0%" stopColor="#818cf8" stopOpacity="0.95" />
                                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.85" />
                                    </linearGradient>
                                  </defs>
                                  <polyline
                                    fill="none"
                                    stroke={`url(#cmp-spark-${s.program})`}
                                    strokeWidth="2"
                                    points={sparkData.poly}
                                  />
                                </svg>
                              ) : (
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/60">
                                  No history
                                </div>
                              )}
                            </div>
                          </div>

                          {s.historyUpdatedAt ? (
                            <div className="mt-3 text-[11px] text-white/50">Updated: {formatUpdatedAt(s.historyUpdatedAt)}</div>
                          ) : null}
                        </button>
                      );
                    })}

                    {compareError ? (
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200 lg:col-span-2">
                        {compareError}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-white/60">Compare is off.</div>
                )}
              </div>
            }
          />
        </GlassPanel>
        </MotionReveal>


        {/* MAIN GRID */}
        <div className="grid items-start gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
          {/* LEFT: Profile + simulation controls */}
          <aside className="self-start lg:sticky lg:top-28 lg:h-max">
            <MotionReveal className="group">
              <GlassPanel className="rounded-[34px] p-5 transition duration-300 hover:border-white/20">
                <ProfileSummaryPanel
                  profileSummaryItems={profileSummaryItems}
                  availableOpportunities={availableOpportunities}
                  scenarioToggles={selectedOpportunityLookup}
                  activeToggleCount={activeToggleCount}
                  onToggleOpportunity={(scenarioId) => {
                    setSelectedOpportunityIds((prev) =>
                      prev.includes(scenarioId)
                        ? prev.filter((id) => id !== scenarioId)
                        : [...prev, scenarioId]
                    );
                  }}
                  onClearPreviews={() => setSelectedOpportunityIds([])}
                />
              </GlassPanel>
            </MotionReveal>
          </aside>

          {/* RIGHT: Results */}
          <section className="min-w-0">
          <MotionReveal>
          <GlassPanel className="rounded-[34px] p-5 transition duration-300 hover:border-white/20">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">Your best improvement plan</div>

                <div className="mt-1 text-xs text-white/60">
                  Effective CRS: <span className="font-semibold text-white/90">{effectiveBaseCrs}</span>
                  {profile.hasPnp ? <span className="ml-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">+600 PNP</span> : null}
                  <span className="mx-2 text-white/20">•</span>
                  English CLB: <span className="font-semibold text-white/90">{effectiveEnglishClb}</span>
                  <span className="mx-2 text-white/20">•</span>
                  French CLB: <span className="font-semibold text-white/90">{profile.frenchClb}</span>
                  <span className="mx-2 text-white/20">•</span>
                  CEC: <span className="font-semibold text-white/90">{profile.canExpYears}y</span>
                  <span className="mx-2 text-white/20">•</span>
                  Program: <span className="font-semibold text-white/90">{programLabel(programTarget)}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/70">
                    {userPlan === "pro" ? "Pro plan active" : "Free preview active"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/60">
                    {userPlan === "pro"
                      ? "Premium strategy pages unlock when available"
                      : "Upgrade to save and track your roadmap"}
                  </span>
                  {activeToggleCount > 0 ? (
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold text-cyan-100">
                      Previewing {activeToggleCount} improvement{activeToggleCount === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
                {loadedRoadmapEmail ? (
                  <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-200/80">
                          Loaded roadmap
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white">Saved to your account</div>
                        <div className="mt-1 text-xs text-white/60">
                          {loadedRoadmapCreatedAt ? `Saved on ${formatUpdatedAt(loadedRoadmapCreatedAt)}` : loadedRoadmapEmail}
                        </div>
                      </div>

                      <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-200">
                        Restored into simulator
                      </span>
                    </div>
                  </div>
                ) : null}

                {recommendationSummary.bestRealisticPath || recommendationSummary.highestUpsidePath ? (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {recommendationSummary.bestRealisticPath ? (
                      <div className="rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/80">
                          Best realistic path right now
                        </div>
                        <div className="mt-3 text-base font-semibold text-white">
                          {recommendationSummary.bestRealisticPath.title}
                        </div>
                        <div className="mt-2 text-sm text-white/64">
                          The strongest user-actionable path based on impact, realism, and time-to-start.
                        </div>
                      </div>
                    ) : null}

                    {recommendationSummary.highestUpsidePath ? (
                      <div className="rounded-[24px] border border-fuchsia-400/20 bg-fuchsia-400/10 p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-100/80">
                          Highest upside path
                        </div>
                        <div className="mt-3 text-base font-semibold text-white">
                          {recommendationSummary.highestUpsidePath.title}
                        </div>
                        <div className="mt-2 text-sm text-white/64">
                          Powerful, but often more conditional on stream fit, timing, or eligibility.
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <AIStrategyPanel
                  userPlan={userPlan}
                  loading={aiStrategyState === "loading"}
                  error={aiStrategyState === "error" ? aiStrategyError : ""}
                  recommendation={aiStrategyResult}
                  accessDenied={aiStrategyAccessDenied}
                  usage={aiUsage}
                  preview={aiPreview}
                  preferredName={preferredName}
                  upgradeHref={buildUpgradeEntryHref({
                    isAuthenticated: !!authUser,
                    returnTo: "/simulator?upgradeTarget=ai",
                    unlock: "ai",
                  })}
                  onGenerate={handleGenerateAiStrategy}
                />

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-sm font-semibold text-white">{saveRoadmapLabel}</div>
                  <div className="mt-1 text-xs text-white/60">
                    Save your current profile, strategy, and AI action layer to continue later.
                  </div>
                  <div className="mt-2 text-[11px] text-white/45">
                    Saved roadmaps are tied to your authenticated account.
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {hasUnsavedRoadmapChanges ? (
                      <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-100">
                        Unsaved changes
                      </span>
                    ) : (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-100">
                        Saved state up to date
                      </span>
                    )}
                    {roadmapHistory.length >= 2 && userPlan === "pro" ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/65">
                        Roadmap limit reached
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <div className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/70">
                      {authUserLoading ? "Checking session..." : authenticatedEmail || "Login required to save roadmaps"}
                    </div>
                    {authUser ? (
                      <div className="mt-2 text-xs text-white/50">
                        Current plan: {userPlanLoading ? "checking..." : userPlan}
                      </div>
                    ) : null}

                    {authUser ? (
                      userPlan === "pro" ? (
                        <button
                          type="button"
                          onClick={() => void handleSaveRoadmap()}
                          disabled={roadmapSaving || visibleTop.length === 0 || authUserLoading || userPlanLoading}
                          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {roadmapSaving ? "Saving..." : saveRoadmapLabel}
                        </button>
                      ) : (
                        <Link
                          href={buildUpgradeEntryHref({
                            isAuthenticated: !!authUser,
                            returnTo: "/simulator?upgradeTarget=roadmap",
                            unlock: "roadmap",
                          })}
                          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-center text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/15"
                        >
                          Unlock your roadmap
                        </Link>
                      )
                    ) : (
                      <Link
                        href={buildLoginHref({ returnTo: "/simulator" })}
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-center text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/15"
                      >
                        Login to Save
                      </Link>
                    )}
                  </div>
                  {authUserError ? (
                    <div className="mt-2 text-xs text-amber-200">
                      {authUserError}
                    </div>
                  ) : null}

                  {roadmapLoadMessage ? (
                    <div className="mt-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-200">
                      {roadmapLoadMessage}
                    </div>
                  ) : null}

                  {roadmapLoadError ? (
                    <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                      {roadmapLoadError}
                    </div>
                  ) : null}

                  {roadmapMessage ? (
                    <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                      {roadmapMessage}
                    </div>
                  ) : null}

                  {roadmapError ? (
                    <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                      {roadmapError}
                    </div>
                  ) : null}

                  {roadmapReplaceMode && userPlan === "pro" && roadmapHistory.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-sm font-semibold text-white">Replace an existing roadmap</div>
                      <div className="mt-1 text-xs text-white/60">
                        You can keep up to 2 saved roadmaps. Choose one to replace with your current strategy.
                      </div>
                      <div className="mt-3 space-y-3">
                        {roadmapHistory.slice(0, 2).map((roadmap) => (
                          <div
                            key={roadmap.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3"
                          >
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {roadmapDisplayName(roadmap.profile_snapshot?.preferred_name)}
                                <span className="mx-2 text-white/30">•</span>
                                CRS {typeof roadmap.profile_snapshot?.baseCrs === "number" ? roadmap.profile_snapshot.baseCrs : "—"}
                                <span className="mx-2 text-white/30">•</span>
                                {programLabel(roadmap.program_target)}
                              </div>
                              <div className="mt-1 text-xs text-white/50">
                                {formatUpdatedAt(roadmap.created_at) || roadmap.created_at}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => void handleSaveRoadmap(roadmap.id)}
                              disabled={roadmapSaving}
                              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {roadmapReplacingId === roadmap.id && roadmapSaving ? "Replacing..." : "Replace this roadmap"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {authUser && userPlan === "free" ? (
                    <div className="mt-3 text-xs text-white/50">
                      Unlock full strategy history and deeper insights when you’re ready.
                    </div>
                  ) : null}

                  {authUser && userPlan === "free" ? (
                    <div className="mt-4">
                      <PremiumLockedPanel
                        compact
                        eyebrow="Roadmap saving"
                        title="Unlock your roadmap"
                        description="Free preview helps you understand your strongest next moves. Pro unlocks saved roadmaps, history, and a premium workflow you can return to."
                        primaryHref={buildUpgradeEntryHref({
                          isAuthenticated: !!authUser,
                          returnTo: "/simulator?upgradeTarget=roadmap",
                          unlock: "roadmap",
                        })}
                        primaryLabel="Unlock your roadmap"
                        analyticsEvent="locked_strategy_clicked"
                        bullets={[
                          "Save roadmap snapshots",
                          "Track strategy progress",
                          "Return to your plan later",
                        ]}
                        note="Free users can preview the simulator first. Pro turns that preview into a saved strategy system."
                      />
                    </div>
                  ) : null}
                </div>
                {authUser && userPlan === "pro" && roadmapHistory.length > 0 ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-semibold text-white">Your Saved Roadmaps</div>
                    <div className="mt-1 text-xs text-white/60">
                      Restore or replace strategies saved to your authenticated account.
                    </div>

                    <div className="mt-3 space-y-3">
                      {roadmapHistory.map((roadmap) => (
                        <div
                          key={roadmap.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                        >
                          <div>
                            <div className="text-sm font-semibold text-white">
                              {roadmapDisplayName(roadmap.profile_snapshot?.preferred_name)}
                              <span className="mx-2 text-white/30">•</span>
                              CRS {typeof roadmap.profile_snapshot?.baseCrs === "number" ? roadmap.profile_snapshot.baseCrs : "—"}
                              <span className="mx-2 text-white/30">•</span>
                              {programLabel(roadmap.program_target)}
                            </div>
                            <div className="mt-1 text-xs text-white/50">
                              {formatUpdatedAt(roadmap.created_at) || roadmap.created_at}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => applyRoadmapToSimulator(roadmap)}
                              className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/15"
                            >
                              Restore
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteRoadmap(roadmap.id)}
                              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/15"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {authUser && userPlan === "free" ? (
                  <div className="mt-4">
                    <PremiumLockedPanel
                      compact
                      eyebrow="Premium workflow"
                      title="Saved roadmaps and premium strategy live together on Pro"
                      description="Free users can see where they stand and preview their top opportunities. Pro unlocks roadmap history, premium strategy paths, and a fuller decision workflow."
                      primaryHref={buildUpgradeEntryHref({
                        isAuthenticated: !!authUser,
                        returnTo: "/simulator?upgradeTarget=roadmap",
                        unlock: "roadmap",
                      })}
                      primaryLabel="See full roadmap"
                      analyticsEvent="locked_strategy_clicked"
                      secondaryHref="/insights"
                      secondaryLabel="Preview strategy pages"
                      bullets={[
                        "Saved roadmap history",
                        "Premium strategy pages",
                        "Track and refine strategy",
                      ]}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="mt-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Best opportunities to increase your CRS</div>
                  <div className="mt-1 text-sm text-white/60">
                    {selectedOpportunityIds.length > 0
                      ? "Previewing the exact improvements you selected on the left."
                      : "These are the strongest score-improvement paths available from your current profile."}
                  </div>
                </div>
                {isRefreshing ? (
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/72">
                    Updating strategy...
                  </div>
                ) : null}
              </div>

              {selectedOpportunityIds.length > 0 ? (
                <motion.div
                  className="grid gap-4"
                  variants={staggerShell}
                  initial="hidden"
                  animate="visible"
                >
                  {visibleOpportunityCards.map((card, index) =>
                    card.isReady && card.scenario ? (
                      <ScenarioOpportunityCard
                        key={card.id}
                        scenario={card.scenario}
                        profile={baseProfile ?? profile}
                        cutoff={cutoff}
                        userPlan={userPlan}
                        topTier
                        animated={index < 3}
                      />
                    ) : (
                      <OpportunitySkeletonCard key={card.id} topTier />
                    )
                  )}
                </motion.div>
              ) : showOpportunitySkeletons ? (
                <motion.div
                  className="grid gap-4"
                  initial={{ opacity: 0.55 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  {[0, 1, 2].map((index) => (
                    <OpportunitySkeletonCard key={index} topTier />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  className="grid gap-4"
                  variants={staggerShell}
                  initial="hidden"
                  animate="visible"
                >
                  {primaryVisibleTop.map((scenario) => (
                    <ScenarioOpportunityCard
                      key={scenario.id}
                      scenario={scenario}
                      profile={profile}
                      cutoff={cutoff}
                      userPlan={userPlan}
                      topTier
                      animated
                    />
                  ))}
                </motion.div>
              )}

              {!error &&
              !isInitialLoading &&
              selectedOpportunityIds.length === 0 &&
              primaryVisibleTop.length === 0 &&
              extraVisibleTop.length === 0 ? (
                <div className="mt-4 rounded-[28px] border border-white/10 bg-white/5 p-5 text-white/72">
                  <div className="text-sm font-semibold text-white">No opportunities available yet</div>
                  <div className="mt-2 text-sm leading-6 text-white/62">
                    Complete your profile inputs to generate a stronger strategy view.
                  </div>
                </div>
              ) : null}

              {selectedOpportunityIds.length === 0 && extraVisibleTop.length > 0 ? (
                <div className="mt-5">
                  <div className="rounded-[28px] border border-white/10 bg-[#0c1120]/95 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                          Explore additional paths
                        </div>
                        <div className="mt-3 text-xl font-semibold text-white">
                          Go beyond the top 3 winners
                        </div>
                        <div className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                          Secondary opportunities like CEC and other roadmap paths still matter. Review them here without losing the focus on your strongest top recommendations.
                        </div>
                        <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/70">
                          {extraVisibleTop.length} additional {extraVisibleTop.length === 1 ? "path" : "paths"} available
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowAllScenarios((v) => !v)}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                      >
                        {showAllScenarios ? "Hide additional paths" : "Explore additional paths"}
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {showAllScenarios ? (
                        <motion.div
                          className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {extraVisibleTop.map((scenario) => (
                            <button
                              key={scenario.id}
                              type="button"
                              onClick={() => {
                                setSelectedOpportunityIds((prev) =>
                                  prev.includes(scenario.id) ? prev : [...prev, scenario.id]
                                );
                              }}
                              className="rounded-[22px] border border-white/10 bg-black/20 p-4 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
                            >
                              <div className="text-sm font-semibold text-white">{scenario.title}</div>
                              <div className="mt-2 text-xs leading-5 text-white/60">
                                {scenarioNoteText(scenario.title)}
                              </div>
                              <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70">
                                +{scenario.delta} CRS
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    {userPlan !== "pro" ? (
                      <div className="mt-5 rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-4 shadow-[0_16px_40px_-32px_rgba(34,211,238,0.28)]">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                          Unlock your roadmap
                        </div>
                        <div className="mt-3 text-xl font-semibold text-white">
                          See your full strategy beyond the first preview.
                        </div>
                        <div className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                          Free preview shows your strongest opportunities first. Upgrade to compare the remaining paths, unlock premium strategy guidance, and save your roadmap.
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <Link
                            href={buildUpgradeEntryHref({
                              isAuthenticated: !!authUser,
                              returnTo: "/simulator?upgradeTarget=strategy",
                              unlock: "strategy",
                            })}
                            className="rounded-full border border-cyan-400/20 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                          >
                            See your full strategy
                          </Link>
                          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/65">
                            Free preview active
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            {/* footer hint */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
              <div className="text-xs text-white/60">
                Tip: Switch between <span className="font-semibold text-white/80">General</span> and{" "}
                <span className="font-semibold text-white/80">Category</span> to see different market cutoffs.
              </div>
              <div className="text-xs text-white/50">v2.3 • Benchmark + Strategy</div>
            </div>
          </GlassPanel>
          </MotionReveal>
          </section>
        </div>
          </>
        )}
      </main>
    </div>
  );
}
