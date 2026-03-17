export type RoiEffort = "Low" | "Medium" | "High";

export type ImprovementKey =
  | "ielts_clb9"
  | "ielts_clb10"
  | "french_b1"
  | "french_b2"
  | "cec_12m"
  | "job_offer"
  | "pnp";

export type Baseline = {
  crs: number;
  clb: 7 | 8 | 9 | 10;
  cecMonths: number; // 0..36
  hasFrench: "none" | "b1" | "b2";
  hasPNP: boolean;
  hasJobOffer: boolean;
};

export type RoiRow = {
  key: ImprovementKey;
  label: string;
  ptsMin: number;
  ptsMax: number;
  effort: RoiEffort;
  why: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * MVP “estimate” model.
 * NOT official CRS math.
 */
export function buildRoiTable(b: Baseline): RoiRow[] {
  const clb = b.clb;
  const cecMonths = clamp(b.cecMonths, 0, 36);

  const base: RoiRow[] = [
    {
      key: "ielts_clb9",
      label: "IELTS → CLB 9",
      ptsMin: clb >= 9 ? 0 : 35,
      ptsMax: clb >= 9 ? 0 : 55,
      effort: "High",
      why: "Often unlocks strong skill transferability.",
    },
    {
      key: "ielts_clb10",
      label: "IELTS → CLB 10",
      ptsMin: clb >= 10 ? 0 : clb >= 9 ? 8 : 20,
      ptsMax: clb >= 10 ? 0 : clb >= 9 ? 18 : 35,
      effort: "High",
      why: "Extra gain after CLB 9; smaller incremental ROI.",
    },
    {
      key: "french_b1",
      label: "French → B1",
      ptsMin: b.hasFrench === "none" ? 10 : 0,
      ptsMax: b.hasFrench === "none" ? 25 : 0,
      effort: "High",
      why: "May add bonus points depending on profile.",
    },
    {
      key: "french_b2",
      label: "French → B2",
      ptsMin: b.hasFrench === "b2" ? 0 : b.hasFrench === "b1" ? 10 : 20,
      ptsMax: b.hasFrench === "b2" ? 0 : b.hasFrench === "b1" ? 35 : 62,
      effort: "High",
      why: "Can be a major boost for many candidates.",
    },
    {
      key: "cec_12m",
      label: "Canadian experience → 12 months",
      ptsMin: cecMonths >= 12 ? 0 : 10,
      ptsMax: cecMonths >= 12 ? 0 : 35,
      effort: "Medium",
      why: "Time-based milestone (CEC) that can add points.",
    },
    {
      key: "job_offer",
      label: "Valid job offer",
      ptsMin: b.hasJobOffer ? 0 : 10,
      ptsMax: b.hasJobOffer ? 0 : 50,
      effort: "High",
      why: "Only if it meets validity/eligibility conditions.",
    },
    {
      key: "pnp",
      label: "PNP nomination",
      ptsMin: b.hasPNP ? 0 : 600,
      ptsMax: b.hasPNP ? 0 : 600,
      effort: "High",
      why: "Transformational boost if nominated.",
    },
  ];

  // sort by ptsMax desc, tie-breaker ptsMin desc
  return base.sort((a, c) => c.ptsMax - a.ptsMax || c.ptsMin - a.ptsMin);
}

export function applySelected(
  baseline: Baseline,
  selected: Partial<Record<ImprovementKey, boolean>>
): { min: number; max: number } {
  const table = buildRoiTable(baseline);

  let addMin = 0;
  let addMax = 0;

  for (const row of table) {
    if (selected[row.key]) {
      addMin += row.ptsMin;
      addMax += row.ptsMax;
    }
  }

  const min = Math.max(0, Math.round(baseline.crs + addMin));
  const max = Math.max(min, Math.round(baseline.crs + addMax));
  return { min, max };
}
