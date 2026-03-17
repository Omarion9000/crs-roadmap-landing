// src/components/SimulatorMVP.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { simulate } from "@/lib/crs/api";
import type { Lang, Profile, ScenarioResult } from "@/lib/crs/types";
import type { User } from "@supabase/supabase-js";
import { getBenchmark } from "@/lib/insights/api";
import type { ProgramKey, BenchmarkData } from "@/lib/insights/api";

// ---------- UI helpers ----------
function deltaLabel(delta: number) {
  if (delta >= 500) return "Massive";
  if (delta >= 80) return "High";
  if (delta >= 45) return "Medium";
  return "Low";
}

function deltaPillClass(delta: number) {
  if (delta >= 500) return "bg-emerald-500/20 text-emerald-200 border-emerald-500/30";
  if (delta >= 80) return "bg-indigo-500/20 text-indigo-200 border-indigo-500/30";
  if (delta >= 45) return "bg-blue-500/20 text-blue-200 border-blue-500/30";
  return "bg-white/10 text-white/70 border-white/10";
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

function zoneGradient(z: Zone) {
  switch (z) {
    case "nomination":
      return "from-emerald-400/25 via-emerald-500/15 to-cyan-400/10";
    case "strong":
      return "from-emerald-400/25 via-emerald-500/15 to-cyan-400/10";
    case "competitive":
      return "from-blue-400/25 via-indigo-500/15 to-cyan-400/10";
    case "borderline":
      return "from-indigo-400/25 via-violet-500/15 to-fuchsia-400/10";
    default:
      return "from-red-400/25 via-rose-500/15 to-amber-400/10";
  }
}

function zoneIcon(z: Zone) {
  switch (z) {
    case "nomination":
      return "✅";
    case "strong":
      return "✅";
    case "competitive":
      return "⚡";
    case "borderline":
      return "🧭";
    default:
      return "⛔";
  }
}

function zoneHeadlinePrefix(z: Zone) {
  switch (z) {
    case "nomination":
      return "Nomination level";
    case "strong":
      return "Strong position";
    case "competitive":
      return "Competitive";
    case "borderline":
      return "Borderline";
    default:
      return "Very unlikely";
  }
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
    ieltsClb?: number;
    frenchClb?: number;
    canExpYears?: number;
    hasJobOffer?: boolean;
    hasPnp?: boolean;
    lang?: Lang;
  };
  program_target: ProgramKey;
  created_at: string;
};

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

function trendFromHistory(points: DrawPoint[]) {
  // expects chronological points (oldest -> latest)
  if (points.length < 2) return 0;
  const oldest = points[0]?.cutoff;
  const latest = points[points.length - 1]?.cutoff;
  if (typeof oldest !== "number" || typeof latest !== "number") return 0;
  return latest - oldest; // positive => cutoff increased (harder), negative => decreased (easier)
}

function trendLabel(delta: number) {
  if (delta < 0) return `Better (${delta})`; // e.g. -3 means cutoff dropped by 3
  if (delta > 0) return `Worse (+${delta})`;
  return "Flat (0)";
}

// ---------- Component ----------
export default function SimulatorMVP() {
  const [lang, setLang] = useState<Lang>("en");

  const [compareMode, setCompareMode] = useState<boolean>(true);
  const [compare, setCompare] = useState<{ general?: CompareSeries; category?: CompareSeries }>({});
  const [compareLoading, setCompareLoading] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string>("");

  // Inputs
  const [baseCrs, setBaseCrs] = useState<number>(472);
  const [ieltsClb, setIeltsClb] = useState<number>(8);
  const [frenchClb, setFrenchClb] = useState<number>(0);
  const [canExpYears, setCanExpYears] = useState<number>(0);
  const [hasJobOffer, setHasJobOffer] = useState<boolean>(false);
  const [hasPnp, setHasPnp] = useState<boolean>(false);

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
  const [roadmapSaving, setRoadmapSaving] = useState(false);
  const [roadmapMessage, setRoadmapMessage] = useState("");
  const [roadmapError, setRoadmapError] = useState("");
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapLoadMessage, setRoadmapLoadMessage] = useState("");
  const [roadmapLoadError, setRoadmapLoadError] = useState("");
  const [loadedRoadmapEmail, setLoadedRoadmapEmail] = useState("");
  const [loadedRoadmapCreatedAt, setLoadedRoadmapCreatedAt] = useState("");
  const [roadmapHistory, setRoadmapHistory] = useState<RoadmapHistoryItem[]>([]);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authUserLoading, setAuthUserLoading] = useState(true);
  const [authUserError, setAuthUserError] = useState("");
  const [userPlan, setUserPlan] = useState<"free" | "pro">("free");
  const [userPlanLoading, setUserPlanLoading] = useState(true);
  const authenticatedEmail = authUser?.email?.trim().toLowerCase() ?? "";

  // Benchmark data
  const [bench, setBench] = useState<BenchmarkData | null>(null);
  const [cutoff, setCutoff] = useState<number>(491); // fallback
  const [cutoffLoading, setCutoffLoading] = useState<boolean>(true);
  const [cutoffError, setCutoffError] = useState<string>("");

  // Draws history (sparkline)
  const [history, setHistory] = useState<DrawPoint[]>([]);
  const [historyUpdatedAt, setHistoryUpdatedAt] = useState<string>("");

  // Debounce + abort
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const profile: Profile = useMemo(
    () => ({
      baseCrs: clampInt(baseCrs, 1, 2000),
      ieltsClb: clampInt(ieltsClb, 0, 10),
      frenchClb: clampInt(frenchClb, 0, 10),
      canExpYears: clampInt(canExpYears, 0, 5),
      hasJobOffer: !!hasJobOffer,
      hasPnp: !!hasPnp,
    }),
    [baseCrs, ieltsClb, frenchClb, canExpYears, hasJobOffer, hasPnp]
  );

  // Effective CRS: if user already has a provincial nomination, add +600 to the baseline.
  const effectiveBaseCrs = useMemo(
    () => profile.baseCrs + (profile.hasPnp ? 600 : 0),
    [profile.baseCrs, profile.hasPnp]
  );

  const canRun = useMemo(() => Number.isFinite(profile.baseCrs) && profile.baseCrs > 0, [profile.baseCrs]);

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

  // (A2) Fetch draws history (sparkline) when program changes
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    async function loadHistory() {
      try {
        const res = await fetch(`/api/draws?program=${programTarget}`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        if (!res.ok) return;
        const json: unknown = await res.json();
        if (!alive) return;

        const parsed = parseDrawsPayload(json);

        if (typeof parsed.updatedAt === "string") {
          setHistoryUpdatedAt(parsed.updatedAt);
        } else {
          setHistoryUpdatedAt("");
        }

        // Keep 6 points for a clean sparkline; ensure chronological left->right (oldest -> latest)
        const slice = parsed.points.slice(0, 6);
        const chronological =
          slice.length >= 2 && slice[0].date > slice[slice.length - 1].date ? slice.slice().reverse() : slice;

        setHistory(chronological);
      } catch {
        // silent fallback
      }
    }

    loadHistory();

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
    const email = authenticatedEmail;

    if (!email) {
      setRoadmapHistory([]);
      setLoadedRoadmapEmail("");
      setLoadedRoadmapCreatedAt("");
      return;
    }

    void loadRoadmapHistory(email);
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

  const spark = useMemo(() => {
    if (!history || history.length < 2) return null;
    const { poly } = sparklinePoints(history);
    const delta = trendFromHistory(history);
    const tLabel = trendLabel(delta);
    const firstDate = history[0]?.date ?? "";
    const lastDate = history[history.length - 1]?.date ?? "";
    const latest = history[history.length - 1]?.cutoff;
    const oldest = history[0]?.cutoff;
    return { poly, delta, tLabel, firstDate, lastDate, latest, oldest };
  }, [history]);

  // (C) Simulate scenarios (debounced)
  useEffect(() => {
    if (!canRun) {
      setTop([]);
      setError("");
      setLoading(false);
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    debounceRef.current = window.setTimeout(async () => {
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
      } catch (e: unknown) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Unexpected error");
        setTop([]);
      } finally {
        if (controller.signal.aborted) return;
        setLoading(false);
      }
    }, 250);

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

  const strategicInsight = useMemo(() => {
    if (!bench) return null;

    const currentScore = effectiveBaseCrs;
    const latestCutoff = cutoff;
    const gap = latestCutoff - currentScore;

    if (profile.hasPnp) {
      return {
        zone: "nomination" as Zone,
        chip: `${zoneHeadlinePrefix("nomination")} • ${programLabel(programTarget)}`,
        headline: `You are at nomination level (+600).`,
        detail: `You are ${Math.abs(gap)} points above the latest cutoff.`,
      };
    }

    // Find first eligible scenario that crosses cutoff
    const crossingScenario = top.find(
      (s) => s.eligible && (typeof s.newCrs === "number" ? s.newCrs : profile.baseCrs + s.delta) + (profile.hasPnp ? 600 : 0) >= latestCutoff
    );

    if (gap <= 0) {
      return {
        zone: "strong" as Zone,
        chip: `${zoneHeadlinePrefix("strong")} • ${programLabel(programTarget)}`,
        headline: `You are ABOVE the latest cutoff by ${Math.abs(gap)} points.`,
        detail: `You are currently competitive under ${programLabel(programTarget)} draws.`,
      };
    }

    if (crossingScenario) {
      const projected =
        (typeof crossingScenario.newCrs === "number"
          ? crossingScenario.newCrs
          : profile.baseCrs + crossingScenario.delta) +
        (profile.hasPnp ? 600 : 0);
      const projectedGap = latestCutoff - projected;
      const isPnpScenario = crossingScenario.id === "pnp" || crossingScenario.title.toLowerCase().includes("pnp");
      const projectedZone = isPnpScenario ? ("nomination" as Zone) : zoneFromGap(projectedGap);

      return {
        zone: zoneFromGap(gap) as Zone,
        chip: `${zoneHeadlinePrefix(zoneFromGap(gap))} • Best next move → ${zoneLabel(projectedZone)}`,
        headline: `You are ${gap} points below the cutoff.`,
        detail: `${crossingScenario.title} could move you to ${projected} (Δ +${crossingScenario.delta}) — ${gapLabel(
          projectedGap
        )} vs cutoff.`,
      };
    }

    return {
      zone: zoneFromGap(gap) as Zone,
      chip: `${zoneHeadlinePrefix(zoneFromGap(gap))} • ${programLabel(programTarget)}`,
      headline: `You are ${gap} points below the cutoff.`,
      detail:
        "Your current options don’t cross the cutoff yet. Prioritize CLB 9+, French B2, Canadian experience, and explore PNP streams.",
    };
  }, [bench, cutoff, effectiveBaseCrs, top, programTarget, profile.baseCrs, profile.hasPnp]);

  const projectionSummary = useMemo(() => {
    if (!top.length) return null;

    const eligibleScenarios = top.filter((s) => s.eligible);

    if (!eligibleScenarios.length) {
      return {
        currentCrs: effectiveBaseCrs,
        realisticMove: null,
        highestMove: {
          title: "No eligible moves yet",
          delta: 0,
          projectedCrs: effectiveBaseCrs,
        },
        recommendation:
          "Complete your profile inputs first. Then we can estimate your strongest CRS improvement path.",
      };
    }

    const getProjectedCrs = (scenario: ScenarioResult) => {
      const isPnpScenario = scenario.id === "pnp" || scenario.title.toLowerCase().includes("pnp");
      const rawNewCrs =
        typeof scenario.newCrs === "number" ? scenario.newCrs : profile.baseCrs + scenario.delta;

      return profile.hasPnp && !isPnpScenario ? rawNewCrs + 600 : rawNewCrs;
    };

    const highestScenario = eligibleScenarios.reduce((best, current) =>
      current.delta > best.delta ? current : best
    );

    const realisticScenarios = eligibleScenarios.filter(
      (s) => !(s.id === "pnp" || s.title.toLowerCase().includes("pnp"))
    );

    const realisticScenario = realisticScenarios.length
      ? realisticScenarios.reduce((best, current) =>
          current.delta > best.delta ? current : best
        )
      : null;

    const recommendationSource = realisticScenario ?? highestScenario;
    const recommendationTitle = recommendationSource.title.toLowerCase();

    let recommendation = "";

    if (recommendationTitle.includes("french")) {
      recommendation =
        "French appears to be your most realistic high-leverage move right now. It may unlock one of the fastest non-PNP CRS jumps.";
    } else if (recommendationTitle.includes("ielts") || recommendationTitle.includes("english")) {
      recommendation =
        "Improving English looks like your best immediate ROI. This is often the fastest improvement to execute.";
    } else if (recommendationTitle.includes("cec") || recommendationTitle.includes("experience")) {
      recommendation =
        "Canadian work experience is likely your strongest medium-term path. Time in Canada could materially improve your score.";
    } else if (recommendationTitle.includes("job")) {
      recommendation =
        "A qualifying job offer could improve your profile meaningfully, depending on the role and eligibility.";
    } else if (recommendationTitle.includes("pnp")) {
      recommendation =
        "A provincial nomination is the highest possible CRS jump, but you should also track a realistic non-PNP path you can execute sooner.";
    } else {
      recommendation =
        "This appears to be your strongest available CRS improvement based on your current profile.";
    }

    return {
      currentCrs: effectiveBaseCrs,
      realisticMove: realisticScenario
        ? {
            title: realisticScenario.title,
            delta: realisticScenario.delta,
            projectedCrs: getProjectedCrs(realisticScenario),
          }
        : null,
      highestMove: {
        title: highestScenario.title,
        delta: highestScenario.delta,
        projectedCrs: getProjectedCrs(highestScenario),
      },
      recommendation,
    };
  }, [top, effectiveBaseCrs, profile.baseCrs, profile.hasPnp]);

  async function handleSaveRoadmap() {
    setRoadmapMessage("");
    setRoadmapError("");

    const email = authenticatedEmail;

    if (!authUser || !email) {
      setRoadmapError("You must be logged in to save a roadmap.");
      return;
    }

    if (!top.length) {
      setRoadmapError("No roadmap data available yet.");
      return;
    }

    setRoadmapSaving(true);

    try {
      const payload = {
        email,
        profile_snapshot: {
          baseCrs: profile.baseCrs,
          effectiveBaseCrs,
          ieltsClb: profile.ieltsClb,
          frenchClb: profile.frenchClb,
          canExpYears: profile.canExpYears,
          hasJobOffer: profile.hasJobOffer,
          hasPnp: profile.hasPnp,
          lang,
        },
        program_target: programTarget,
        top_scenarios: top,
      };

      const res = await fetch("/api/roadmaps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as
        | { ok?: boolean; error?: string }
        | { ok: true; roadmap: { id: string; email: string; created_at: string } };

      if (!res.ok || !("ok" in data) || data.ok !== true) {
        throw new Error(("error" in data && data.error) || "Failed to save roadmap.");
      }

      setRoadmapMessage("Roadmap saved successfully.");
      await loadRoadmapHistory(email);
      // setRoadmapEmail(""); // removed for auth user
    } catch (err: unknown) {
      setRoadmapError(
        err instanceof Error ? err.message : "Failed to save roadmap."
      );
    } finally {
      setRoadmapSaving(false);
    }
  }
  async function handleLoadRoadmap() {
    setRoadmapLoadMessage("");
    setRoadmapLoadError("");

    const email = authenticatedEmail;

    if (!authUser || !email) {
      setRoadmapLoadError("You must be logged in to load a roadmap.");
      return;
    }

    setRoadmapLoading(true);

    try {
      const res = await fetch(`/api/roadmaps?email=${encodeURIComponent(email)}`);

      const data = (await res.json()) as
        | { ok?: boolean; error?: string }
        | {
            ok: true;
            roadmap: {
              id: string;
              email: string;
              profile_snapshot: {
                baseCrs?: number;
                effectiveBaseCrs?: number;
                ieltsClb?: number;
                frenchClb?: number;
                canExpYears?: number;
                hasJobOffer?: boolean;
                hasPnp?: boolean;
                lang?: Lang;
              };
              program_target: ProgramKey;
              top_scenarios: ScenarioResult[];
              created_at: string;
            };
          };

      if (!res.ok || !("ok" in data) || data.ok !== true || !("roadmap" in data)) {
        throw new Error(("error" in data && data.error) || "Failed to load roadmap.");
      }

      const roadmap = data.roadmap;
      const snapshot = roadmap.profile_snapshot ?? {};

      setBaseCrs(typeof snapshot.baseCrs === "number" ? snapshot.baseCrs : 472);
      setIeltsClb(typeof snapshot.ieltsClb === "number" ? snapshot.ieltsClb : 8);
      setFrenchClb(typeof snapshot.frenchClb === "number" ? snapshot.frenchClb : 0);
      setCanExpYears(typeof snapshot.canExpYears === "number" ? snapshot.canExpYears : 0);
      setHasJobOffer(!!snapshot.hasJobOffer);
      setHasPnp(!!snapshot.hasPnp);
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

      // setLoadRoadmapEmail(""); // removed for auth user
      setRoadmapLoadMessage("Roadmap loaded successfully.");
      await loadRoadmapHistory(email);
    } catch (err: unknown) {
      setRoadmapLoadError(
        err instanceof Error ? err.message : "Failed to load roadmap."
      );
    } finally {
      setRoadmapLoading(false);
    }
  }

  function applyRoadmapToSimulator(roadmap: RoadmapHistoryItem) {
    const snapshot = roadmap.profile_snapshot ?? {};

    setBaseCrs(typeof snapshot.baseCrs === "number" ? snapshot.baseCrs : 472);
    setIeltsClb(typeof snapshot.ieltsClb === "number" ? snapshot.ieltsClb : 8);
    setFrenchClb(typeof snapshot.frenchClb === "number" ? snapshot.frenchClb : 0);
    setCanExpYears(typeof snapshot.canExpYears === "number" ? snapshot.canExpYears : 0);
    setHasJobOffer(!!snapshot.hasJobOffer);
    setHasPnp(!!snapshot.hasPnp);
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
    setRoadmapLoadMessage("Roadmap loaded from history.");
    setRoadmapLoadError("");
  }

  async function loadRoadmapHistory(email: string) {
    try {
      const cleanedEmail = email.trim().toLowerCase();
      if (!cleanedEmail) return;

      const res = await fetch(`/api/roadmaps/list?email=${encodeURIComponent(cleanedEmail)}`);
      const data = (await res.json()) as
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

      if (!res.ok) {
        throw new Error("Failed to delete roadmap.");
      }

      setRoadmapHistory((prev) => prev.filter((r) => r.id !== id));

      if (loadedRoadmapEmail && roadmapHistory.length <= 1) {
        setLoadedRoadmapEmail("");
        setLoadedRoadmapCreatedAt("");
      }
    } catch {
      // keep silent for MVP delete flow
    }
  }

  return (
    <div className="min-h-[calc(100vh-0px)] bg-[#070A12] text-white">
      {/* background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#070A12] via-[#070A12] to-black" />
        <div className="absolute -top-48 left-1/2 h-112 w-130 -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute -bottom-48 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-40 top-56 h-104 w-104 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* header bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-4 lg:px-12 2xl:px-16">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white font-bold text-black">C</div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">CRS Roadmap</div>
              <div className="text-xs text-white/60">Simulator</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(loading || cutoffLoading) && (
              <div className="hidden sm:block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                Updating…
              </div>
            )}

            <div className="relative rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur">
              {/* sliding pill */}
              <div
                className="absolute bottom-1 top-1 rounded-full bg-white/10 shadow-[0_10px_30px_-18px_rgba(99,102,241,0.65)] transition-transform duration-300 ease-out"
                style={{
                  width: `calc(${100 / programOptions.length}% - 2px)`,
                  transform: `translateX(${activeIndex * 100}%)`,
                }}
              />

              <div className="relative z-10 grid grid-cols-5 gap-1">
                {programOptions.map((o) => {
                  const isActive = o.key === programTarget;
                  const disabled = !o.enabled;

                  return (
                    <button
                      key={o.key}
                      type="button"
                      disabled={disabled}
                      onClick={() => setProgramTarget(o.key)}
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold transition",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
                        disabled
                          ? "cursor-not-allowed text-white/30"
                          : isActive
                          ? "text-white"
                          : "text-white/70 hover:text-white",
                      ].join(" ")}
                      title={disabled ? `${o.label} (soon)` : o.label}
                    >
                      {o.label}
                      {!o.enabled ? <span className="ml-1 text-[10px] text-white/35">• soon</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/75">
                {bench ? `Live (${benchMeta.source})` : "Fallback"}
              </span>

              {formatUpdatedAt(historyUpdatedAt) ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/60">
                  Updated: {formatUpdatedAt(historyUpdatedAt) || "—"}
                </span>
              ) : null}
            </div>

            <Link
              href="/"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            >
              ← Back
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-6 py-8 lg:px-12 2xl:px-16">
        {/* Market Compare (Apple/Linear style) */}
        <section className="mb-6 rounded-4xl border border-white/10 bg-white/5 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Market Compare</div>
              <div className="mt-1 text-xs text-white/60">
                General vs Category — cutoff, trend, gap, and recent history.
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
        </section>

        {/* KPI bar */}
        <section className="mb-6 rounded-4xl border border-white/10 bg-white/5 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className={["rounded-full border px-2.5 py-1 text-[11px] font-semibold", zonePillClass(marketZone)].join(" ")}>
                {zoneLabel(marketZone)} • {gapLabel(marketGap, profile.hasPnp)}
              </div>

              {cutoffError ? (
                <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                  Insights warning
                </div>
              ) : null}
            </div>

            {/* sparkline + meta */}
            <div className="flex items-center gap-3">
              {spark ? (
                <div className="hidden rounded-2xl border border-white/10 bg-black/20 px-3 py-2 md:block">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-white/60">Cutoff trend</div>
                      <div className="mt-0.5 text-xs font-semibold text-white/85">{spark.tLabel}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-white/55">
                        {spark.firstDate} → {spark.lastDate}
                      </div>
                      <div className="text-xs font-semibold text-white/85">
                        {spark.oldest} → {spark.latest}
                      </div>
                    </div>
                  </div>
                  <svg viewBox="0 0 100 40" className="mt-2 h-10 w-64">
                    <defs>
                      <linearGradient id="spark-grad" x1="0" x2="1" y1="0" y2="0">
                        <stop
                          offset="0%"
                          stopColor={spark.delta > 0 ? "#fb7185" : spark.delta < 0 ? "#34d399" : "#60a5fa"}
                          stopOpacity="0.95"
                        />
                        <stop
                          offset="100%"
                          stopColor={spark.delta > 0 ? "#f59e0b" : spark.delta < 0 ? "#22d3ee" : "#818cf8"}
                          stopOpacity="0.85"
                        />
                      </linearGradient>
                    </defs>
                    <polyline fill="none" stroke="url(#spark-grad)" strokeWidth="2" points={spark.poly} />
                  </svg>
                </div>
              ) : (
                <div className="hidden rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/60 md:block">
                  No draw history yet
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                  <div className="text-[10px] font-semibold text-white/60">Latest cutoff</div>
                  <div className="mt-0.5 text-sm font-semibold text-white">{cutoff}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                  <div className="text-[10px] font-semibold text-white/60">Trend</div>
                  <div className="mt-0.5 text-sm font-semibold text-white">{benchMeta.trendLabel}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] font-semibold text-white/60">Your CRS</div>
                    {profile.hasPnp ? (
                      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                        +600 PNP
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-white">{effectiveBaseCrs}</div>
                </div>
                <div className={["rounded-2xl border px-3 py-2", gapToneClassWithPnp(marketGap, profile.hasPnp)].join(" ")}>
                  <div className="text-[10px] font-semibold opacity-80">Gap</div>
                  <div className="mt-0.5 text-sm font-semibold">{gapLabel(marketGap, profile.hasPnp)}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN GRID */}
        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
          {/* LEFT: Inputs */}
          <div className="group rounded-4xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur transition hover:border-white/20 hover:bg-white/6 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_60px_-40px_rgba(99,102,241,0.55)] lg:sticky lg:top-24 lg:h-fit">
            <div className="text-sm font-semibold text-white">Inputs</div>

            <div className="mt-4 space-y-4">
              {/* Baseline CRS */}
              <label className="block">
                <div className="text-xs font-semibold text-white/70">Baseline CRS</div>
                <input
                  type="number"
                  value={baseCrs}
                  onChange={(e) => setBaseCrs(Number(e.target.value || 0))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="e.g., 472"
                  min={1}
                  max={2000}
                />
                <div className="mt-1 text-[11px] text-white/50">
                  Used as your current score baseline.
                  {hasPnp ? (
                    <span className="ml-1 text-amber-200">PNP is ON → +600 will be added (effective CRS: {effectiveBaseCrs}).</span>
                  ) : null}
                </div>
              </label>

              {/* IELTS CLB */}
              <label className="block">
                <div className="text-xs font-semibold text-white/70">IELTS (English) CLB</div>
                <input
                  type="number"
                  value={ieltsClb}
                  onChange={(e) => setIeltsClb(Number(e.target.value || 0))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  min={0}
                  max={10}
                />
                <div className="mt-1 text-[11px] text-white/50">Common targets: CLB 9+.</div>
              </label>

              {/* French CLB */}
              <label className="block">
                <div className="text-xs font-semibold text-white/70">French CLB</div>
                <input
                  type="number"
                  value={frenchClb}
                  onChange={(e) => setFrenchClb(Number(e.target.value || 0))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  min={0}
                  max={10}
                />
                <div className="mt-1 text-[11px] text-white/50">B2 is usually around CLB 9+.</div>
              </label>

              {/* Canadian Exp */}
              <label className="block">
                <div className="text-xs font-semibold text-white/70">Canadian experience (years)</div>
                <input
                  type="number"
                  value={canExpYears}
                  onChange={(e) => setCanExpYears(Number(e.target.value || 0))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                  min={0}
                  max={5}
                />
                <div className="mt-1 text-[11px] text-white/50">We cap at 5 for the MVP.</div>
              </label>

              {/* Toggles */}
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setHasJobOffer((v) => !v)}
                  className={[
                    "rounded-2xl border px-4 py-3 text-left transition",
                    hasJobOffer
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-white/80">Has job offer</div>
                    <div
                      className={[
                        "h-5 w-10 rounded-full border p-0.5",
                        hasJobOffer ? "border-emerald-500/30 bg-emerald-500/15" : "border-white/10 bg-black/20",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "h-4 w-4 rounded-full transition",
                          hasJobOffer ? "translate-x-5 bg-emerald-300" : "translate-x-0 bg-white/60",
                        ].join(" ")}
                      />
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] text-white/50">Used to model the job-offer scenario.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setHasPnp((v) => !v)}
                  className={[
                    "rounded-2xl border px-4 py-3 text-left transition",
                    hasPnp ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:bg-white/10",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-white/80">Already has PNP</div>
                    <div
                      className={[
                        "h-5 w-10 rounded-full border p-0.5",
                        hasPnp ? "border-emerald-500/30 bg-emerald-500/15" : "border-white/10 bg-black/20",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "h-4 w-4 rounded-full transition",
                          hasPnp ? "translate-x-5 bg-emerald-300" : "translate-x-0 bg-white/60",
                        ].join(" ")}
                      />
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] text-white/50">If true, PNP scenario becomes ineligible.</div>
                </button>
              </div>

              {/* Language */}
              <label className="block">
                <div className="text-xs font-semibold text-white/70">Language</div>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Lang)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </label>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-white/60">
                <div className="font-semibold text-white/80">MVP note</div>
                <div className="mt-1">
                  The benchmark shows the latest cutoff and its direction (vs the previous draw) for the selected program.
                  Use it to measure your real gap and competitiveness.
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Results */}
          <div className="group rounded-4xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur transition hover:border-white/20 hover:bg-white/6 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_60px_-40px_rgba(99,102,241,0.55)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">Recommended plan</div>

                <div className="mt-1 text-xs text-white/60">
                  Effective CRS: <span className="font-semibold text-white/90">{effectiveBaseCrs}</span>
                  {profile.hasPnp ? <span className="ml-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">+600 PNP</span> : null}
                  <span className="mx-2 text-white/20">•</span>
                  English CLB: <span className="font-semibold text-white/90">{profile.ieltsClb}</span>
                  <span className="mx-2 text-white/20">•</span>
                  French CLB: <span className="font-semibold text-white/90">{profile.frenchClb}</span>
                  <span className="mx-2 text-white/20">•</span>
                  CEC: <span className="font-semibold text-white/90">{profile.canExpYears}y</span>
                  <span className="mx-2 text-white/20">•</span>
                  Program: <span className="font-semibold text-white/90">{programLabel(programTarget)}</span>
                </div>
                {loadedRoadmapEmail ? (
                  <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-blue-200/80">
                          Loaded roadmap
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white">{loadedRoadmapEmail}</div>
                        <div className="mt-1 text-xs text-white/60">
                          {loadedRoadmapCreatedAt ? `Saved on ${formatUpdatedAt(loadedRoadmapCreatedAt)}` : "Saved previously"}
                        </div>
                      </div>

                      <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-200">
                        Restored into simulator
                      </span>
                    </div>
                  </div>
                ) : null}
                {projectionSummary ? (
                  <div className="mt-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="max-w-2xl">
                        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-200/80">
                          Projection Summary
                        </div>
                        <div className="mt-2 text-sm text-white/70">{projectionSummary.recommendation}</div>
                      </div>

                      <div className="grid w-full gap-3 md:w-auto md:min-w-105 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
                            Best realistic move
                          </div>
                          {projectionSummary.realisticMove ? (
                            <>
                              <div className="mt-2 text-sm font-semibold text-white">
                                {projectionSummary.realisticMove.title}
                              </div>
                              <div className="mt-3 text-2xl font-bold text-emerald-200">
                                {projectionSummary.realisticMove.projectedCrs}
                              </div>
                              <div className="mt-1 text-xs text-white/60">
                                Current {projectionSummary.currentCrs}
                                <span className="mx-2 text-white/30">→</span>
                                Gain +{projectionSummary.realisticMove.delta}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="mt-2 text-sm font-semibold text-white">No non-PNP move yet</div>
                              <div className="mt-3 text-xs text-white/60">
                                Your current strongest path is still the highest possible one below.
                              </div>
                            </>
                          )}
                        </div>

                        <div className="rounded-2xl border border-emerald-500/20 bg-black/20 px-4 py-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-200/70">
                            Highest possible move
                          </div>
                          <div className="mt-2 text-sm font-semibold text-white">
                            {projectionSummary.highestMove.title}
                          </div>
                          <div className="mt-3 text-2xl font-bold text-emerald-200">
                            {projectionSummary.highestMove.projectedCrs}
                          </div>
                          <div className="mt-1 text-xs text-white/60">
                            Current {projectionSummary.currentCrs}
                            <span className="mx-2 text-white/30">→</span>
                            Gain +{projectionSummary.highestMove.delta}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Strategic Insight */}
                {strategicInsight && (
                  <div className="mt-4">
                    <div className={["rounded-3xl bg-linear-to-r p-px", zoneGradient(strategicInsight.zone)].join(" ")}>
                      <div className="rounded-3xl border border-white/10 bg-black/35 p-4 backdrop-blur">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={["grid h-10 w-10 place-items-center rounded-2xl border", zonePillClass(strategicInsight.zone)].join(" ")}>
                              <span className="text-lg">{zoneIcon(strategicInsight.zone)}</span>
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-xs font-semibold text-white/80">Strategic Insight</div>
                                <span className={["rounded-full border px-2.5 py-1 text-[11px] font-semibold", zonePillClass(strategicInsight.zone)].join(" ")}>
                                  {strategicInsight.chip}
                                </span>
                              </div>

                              <div className="mt-2 text-sm font-semibold text-white">{strategicInsight.headline}</div>
                              <div className="mt-1 text-xs leading-relaxed text-white/70">{strategicInsight.detail}</div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                              <div className="text-[10px] font-semibold text-white/60">Probability zone</div>
                              <div className="mt-1 flex items-center gap-2">
                                <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", zonePillClass(marketZone)].join(" ")}>
                                  {zoneLabel(marketZone)}
                                </span>
                                <span className="text-[11px] text-white/60">•</span>
                                <span className={"text-[11px] font-semibold " + (marketGap <= 0 ? "text-emerald-200" : "text-white/80")}>
                                  {gapLabel(marketGap, profile.hasPnp)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* micro-bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-[10px] text-white/50">
                            <span>Baseline {effectiveBaseCrs}</span>
                            <span>Cutoff {cutoff}</span>
                          </div>
                          <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                            <div
                              className={[
                                "h-2 rounded-full bg-linear-to-r",
                                marketGap <= 0
                                  ? "from-emerald-400/60 to-cyan-400/40"
                                  : marketGap <= 10
                                  ? "from-blue-400/60 to-cyan-400/40"
                                  : marketGap <= 30
                                  ? "from-indigo-400/60 to-violet-400/40"
                                  : "from-red-400/60 to-amber-400/40",
                              ].join(" ")}
                              style={{
                                width: `${Math.max(6, Math.min(100, (effectiveBaseCrs / Math.max(1, cutoff)) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Market reality */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-white/80">Market reality (benchmark)</div>
                      <div className="mt-1 text-[11px] text-white/50">
                        Latest cutoff + trend vs previous draw for selected program.{" "}
                        {cutoffLoading
                          ? "Loading…"
                          : cutoffError
                          ? "Using fallback."
                          : bench
                          ? `Live (${benchMeta.source})`
                          : "Using fallback."}
                      </div>
                      {cutoffLoading ? (
                        <div className="mt-3 grid gap-2">
                          <div className="h-3 w-56 animate-pulse rounded-full bg-white/10" />
                          <div className="h-3 w-40 animate-pulse rounded-full bg-white/10" />
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                        Cutoff: {cutoff}
                      </div>

                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                        Trend: {benchMeta.trendLabel}
                      </div>

                      <div className={["rounded-full border px-3 py-1 text-xs font-semibold", gapToneClassWithPnp(marketGap, profile.hasPnp)].join(" ")}>
                        {gapLabel(marketGap, profile.hasPnp)}
                      </div>

                      <div className={["rounded-full border px-3 py-1 text-xs font-semibold", zonePillClass(marketZone)].join(" ")}>
                        {zoneLabel(marketZone)}
                      </div>
                    </div>
                  </div>

                  {cutoffError && <div className="mt-3 text-[11px] text-amber-200">Insights warning: {cutoffError}</div>}
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-sm font-semibold text-white">Save My Roadmap</div>
                  <div className="mt-1 text-xs text-white/60">
                    Save this strategy to Supabase so you can track or reload it later.
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
                          onClick={handleSaveRoadmap}
                          disabled={roadmapSaving || top.length === 0 || authUserLoading || userPlanLoading}
                          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {roadmapSaving ? "Saving..." : "Save My Roadmap"}
                        </button>
                      ) : (
                        <Link
                          href="/billing"
                          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-center text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/15"
                        >
                          Upgrade to Pro
                        </Link>
                      )
                    ) : (
                      <Link
                        href="/login"
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
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-sm font-semibold text-white">Load My Roadmap</div>
                  <div className="mt-1 text-xs text-white/60">
                    Restore your most recent roadmap using your authenticated session.
                  </div>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <div className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/70">
                      {authUserLoading ? "Checking session..." : authenticatedEmail || "Login required to load roadmaps"}
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
                          onClick={handleLoadRoadmap}
                          disabled={roadmapLoading || authUserLoading || userPlanLoading}
                          className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {roadmapLoading ? "Loading..." : "Load My Roadmap"}
                        </button>
                      ) : (
                        <Link
                          href="/billing"
                          className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-center text-sm font-semibold text-blue-200 transition hover:bg-blue-500/15"
                        >
                          Upgrade to Pro
                        </Link>
                      )
                    ) : (
                      <Link
                        href="/login"
                        className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-center text-sm font-semibold text-blue-200 transition hover:bg-blue-500/15"
                      >
                        Login to Load
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
                </div>
                {authUser && userPlan === "pro" && roadmapHistory.length > 0 ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-semibold text-white">Your Saved Roadmaps</div>
                    <div className="mt-1 text-xs text-white/60">
                      Previously saved strategies for your authenticated account.
                    </div>

                    <div className="mt-3 space-y-3">
                      {roadmapHistory.map((roadmap) => (
                        <div
                          key={roadmap.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                        >
                          <div>
                            <div className="text-sm font-semibold text-white">
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
                              Load
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
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            {!error && !loading && top.length === 0 && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Enter valid inputs to see ranked scenarios.
              </div>
            )}

            <div className="mt-4 grid gap-3">
              {top.map((s) => {
                const isPnpScenario = s.id === "pnp" || s.title.toLowerCase().includes("pnp");

                const rawNewCrs = typeof s.newCrs === "number" ? s.newCrs : profile.baseCrs + s.delta;
                const newCrs = profile.hasPnp && !isPnpScenario ? rawNewCrs + 600 : rawNewCrs;

                const afterGap = cutoff - newCrs;

                const afterZone = profile.hasPnp
                  ? ("nomination" as Zone)
                  : isPnpScenario && s.eligible
                  ? ("nomination" as Zone)
                  : zoneFromGap(afterGap);

                return (
                  <div
                    key={s.id}
                    className="rounded-3xl border border-white/10 bg-black/30 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition hover:-translate-y-px hover:border-white/20 hover:bg-black/25"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-white">{s.title}</div>

                          <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", deltaPillClass(s.delta)].join(" ")}>
                            {deltaLabel(s.delta)}
                          </span>
                        </div>

                        <div className="mt-1 text-xs text-white/60">{s.description}</div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <div className="text-[11px] text-white/60">After this improvement:</div>

                          <div
                            className={[
                              "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                              gapToneClassWithPnp(afterGap, profile.hasPnp || (isPnpScenario && s.eligible)),
                            ].join(" ")}
                          >
                            {gapLabel(afterGap, profile.hasPnp || (isPnpScenario && s.eligible))} vs cutoff {cutoff}
                          </div>

                          <div className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold", zonePillClass(afterZone)].join(" ")}>
                            {zoneLabel(afterZone)}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="rounded-2xl bg-linear-to-r from-indigo-600 to-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(59,130,246,0.55)]">
                          +{s.delta}
                        </div>
                        <div className="mt-2 text-xs text-white/70">New CRS: {newCrs}</div>
                      </div>
                    </div>

                    {!s.eligible && <div className="mt-3 text-xs text-amber-200">Not eligible for this scenario (based on current inputs).</div>}
                  </div>
                );
              })}
            </div>

            {/* footer hint */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
              <div className="text-xs text-white/60">
                Tip: Switch between <span className="font-semibold text-white/80">General</span> and{" "}
                <span className="font-semibold text-white/80">Category</span> to see different market cutoffs.
              </div>
              <div className="text-xs text-white/50">v2.3 • Benchmark + Strategy</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}