// src/lib/sim/roi.ts

export type FrenchLevel = "none" | "b1" | "b2";

export type Baseline = {
  crs: number;
  clb: 7 | 8 | 9 | 10;
  cecMonths: number;
  hasFrench: FrenchLevel;
  hasPNP: boolean;
  hasJobOffer: boolean;
};

export type ImprovementKey =
  | "ielts_clb9"
  | "ielts_clb10"
  | "french_b1"
  | "french_b2"
  | "cec_12m"
  | "job_offer"
  | "pnp";

export type RoiEffort = "Low" | "Medium" | "High";

export type RoiRow = {
  key: ImprovementKey;
  label: string;
  ptsMin: number;
  ptsMax: number;
  effort: RoiEffort;
  why: string;
};

// ✅ Compat: si tu SimulatorMVP lo usa, aquí está.
export function calculateCRSMvp(baseline: Baseline): number {
  // MVP: por ahora regresamos el CRS base que el usuario pone.
  // Más adelante aquí pondremos lógica real.
  return baseline.crs;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function estimateImprovementRange(
  baseline: Baseline,
  key: ImprovementKey
): { min: number; max: number; effort: RoiEffort; why: string } {
  const clb = baseline.clb;
  const cec = baseline.cecMonths;
  const french = baseline.hasFrench;

  switch (key) {
    case "ielts_clb9": {
      const bump =
        clb >= 9
          ? { min: 0, max: 6 }
          : clb === 8
          ? { min: 25, max: 55 }
          : { min: 35, max: 70 };

      return { ...bump, effort: "High", why: "CLB 9 often unlocks skill-transfer boosts." };
    }

    case "ielts_clb10": {
      const bump =
        clb >= 10 ? { min: 0, max: 4 } : clb === 9 ? { min: 6, max: 18 } : { min: 10, max: 25 };

      return { ...bump, effort: "High", why: "Incremental gains after CLB 9." };
    }

    case "french_b1": {
      const bump = french === "none" ? { min: 8, max: 25 } : { min: 0, max: 6 };
      return { ...bump, effort: "High", why: "French can add bonus points (profile-dependent)." };
    }

    case "french_b2": {
      const bump =
        french === "b2"
          ? { min: 0, max: 6 }
          : french === "b1"
          ? { min: 10, max: 35 }
          : { min: 20, max: 62 };

      return { ...bump, effort: "High", why: "French at B2 can be a major lever for some profiles." };
    }

    case "cec_12m": {
      const to12 = 12 - cec;
      const bump =
        to12 <= 0 ? { min: 0, max: 8 } : to12 <= 2 ? { min: 10, max: 35 } : { min: 4, max: 20 };

      return { ...bump, effort: "Medium", why: "CEC milestone can increase points (time-based)." };
    }

    case "job_offer": {
      const bump = baseline.hasJobOffer ? { min: 0, max: 8 } : { min: 10, max: 50 };
      return { ...bump, effort: "High", why: "Job offers vary by conditions." };
    }

    case "pnp": {
      const bump = baseline.hasPNP ? { min: 0, max: 0 } : { min: 600, max: 600 };
      return { ...bump, effort: "High", why: "PNP nomination adds 600 points." };
    }
  }
}

export function buildRoiTable(baseline: Baseline): RoiRow[] {
  // ✅ Esto fuerza a que `key` sea ImprovementKey (no string)
  const base: { key: ImprovementKey; label: string }[] = [
    { key: "ielts_clb9", label: "IELTS → CLB 9" },
    { key: "ielts_clb10", label: "IELTS → CLB 10" },
    { key: "french_b1", label: "French → B1" },
    { key: "french_b2", label: "French → B2" },
    { key: "cec_12m", label: "Canadian experience → 12 months" },
    { key: "job_offer", label: "Valid job offer" },
    { key: "pnp", label: "PNP nomination" },
  ];

  const rows: RoiRow[] = base.map((r) => {
    const est = estimateImprovementRange(baseline, r.key);
    return {
      key: r.key,
      label: r.label,
      ptsMin: est.min,
      ptsMax: est.max,
      effort: est.effort,
      why: est.why,
    };
  });

  // ROI proxy: midpoint desc, then min desc
  return rows.sort((a, b) => {
    const midA = (a.ptsMin + a.ptsMax) / 2;
    const midB = (b.ptsMin + b.ptsMax) / 2;
    if (midB !== midA) return midB - midA;
    return b.ptsMin - a.ptsMin;
  });
}

export function applySelected(
  baseline: Baseline,
  selected: Partial<Record<ImprovementKey, boolean>>
): { min: number; max: number } {
  const table = buildRoiTable(baseline);

  let min = baseline.crs;
  let max = baseline.crs;

  for (const row of table) {
    if (selected[row.key]) {
      min += row.ptsMin;
      max += row.ptsMax;
    }
  }

  min = clamp(min, 0, 1200);
  max = clamp(max, 0, 1200);
  if (max < min) [min, max] = [max, min];

  return { min, max };
}
