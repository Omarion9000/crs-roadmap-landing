// src/lib/crs/types.ts

export type Lang = "en" | "es";

/**
 * ProgramKey = “contra qué cutoff” vamos a comparar este escenario.
 * (En v2.2 lo usaremos para pedir /api/insights/latest?program=...)
 */
export type ProgramKey = "general" | "cec" | "french" | "pnp";

export type Profile = {
  baseCrs: number; // baseline CRS
  ieltsClb: number; // 0..10 (por ahora)
  frenchClb: number; // 0..10 (por ahora)
  canExpYears: number; // 0..5 (por ahora)
  hasJobOffer: boolean;
  hasPnp: boolean;
};

export type ProfileDraft = Partial<Profile>;

export type Scenario = {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;

  /**
   * ✅ NEW: para benchmark por categoría/programa
   * ejemplo:
   * - PNP scenario => "pnp"
   * - French scenario => "french"
   * - Canadian exp / CEC => "cec"
   * - resto => "general"
   */
  programTarget: ProgramKey;

  // delta puede depender del perfil
  delta: number | ((p: Profile) => number);
  eligible: boolean | ((p: Profile) => boolean);
};

export type ScenarioResult = {
  id: string;
  title: string;
  description: string;
  delta: number;
  eligible: boolean;
  newCrs?: number;

  // ✅ NEW
  programTarget: ProgramKey;
};

export type SimulateResponse = {
  baseCrs: number;
  top: ScenarioResult[];
  all: Omit<ScenarioResult, "newCrs">[];
};

export type SimulateInput = {
  lang: Lang;
  profile: ProfileDraft;
  topN?: number;
  signal?: AbortSignal;
};