// src/lib/crs/optimize.ts
import type { Lang, Profile, Scenario, ScenarioResult, SimulateResponse } from "./types";
import { SCENARIOS } from "./scenarios";

function resolveEligible(s: Scenario, p: Profile): boolean {
  return typeof s.eligible === "function" ? s.eligible(p) : s.eligible;
}

function resolveDelta(s: Scenario, p: Profile): number {
  return typeof s.delta === "function" ? s.delta(p) : s.delta;
}

export function simulateTop(profile: Profile, lang: Lang, topN = 5): SimulateResponse {
  const baseCrs = profile.baseCrs;

  const allComputed: ScenarioResult[] = SCENARIOS.map((s) => {
    const eligible = resolveEligible(s, profile);
    const delta = resolveDelta(s, profile);

    return {
      id: s.id,
      title: s.title[lang],
      description: s.description[lang],
      delta,
      eligible,
      newCrs: eligible ? baseCrs + delta : undefined,
      programTarget: s.programTarget, // ✅ FIX
    };
  });

  // sort: eligible first, then higher delta
  const sorted = [...allComputed].sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    return b.delta - a.delta;
  });

  const top = sorted.slice(0, topN);

  // "all" sin newCrs (como tu API response actual)
const all = allComputed.map((r) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  delta: r.delta,
  eligible: r.eligible,
  programTarget: r.programTarget,
}));
  return { baseCrs, top, all };
}