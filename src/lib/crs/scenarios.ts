// src/lib/crs/scenarios.ts
import type { Profile, Scenario } from "./types";

// Helpers
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/**
 * Motor v2.1 (heurístico)
 * - No intenta replicar CRS oficial todavía (eso sería v3 con tablas).
 * - Objetivo: ranking + ROI razonable (dependiente del profile).
 */
export const SCENARIOS: Scenario[] = [
  {
    id: "pnp_nomination",
    programTarget: "pnp",
    title: { en: "PNP nomination", es: "Nominación PNP" },
    description: {
      en: "If eligible, it’s a massive boost — depends on province & stream.",
      es: "Si eres elegible, es un impulso enorme — depende de provincia y stream.",
    },
    delta: 600,
    eligible: (p: Profile) => !p.hasPnp,
  },

  {
    id: "french_to_b2",
    programTarget: "french",
    title: { en: "French to B2", es: "Francés a B2" },
    description: {
      en: "Big impact especially when your English is already strong.",
      es: "Impacto grande sobre todo si tu inglés ya es fuerte.",
    },
    delta: (p: Profile) => {
      const fr = p.frenchClb ?? 0;
      const en = p.ieltsClb ?? 0;
      if (fr >= 9) return 0;

      const missing = 9 - clamp(fr, 0, 9); // 1..9
      const base = 18 * missing; // 18,36,...,162
      const synergy = en >= 9 ? 25 : en >= 8 ? 12 : 0;

      return clamp(base + synergy, 20, 120);
    },
    eligible: (p: Profile) => (p.frenchClb ?? 0) < 9,
  },

  {
    id: "ielts_to_clb9",
    programTarget: "general",
    title: { en: "IELTS to CLB 9", es: "IELTS a CLB 9" },
    description: {
      en: "Often the fastest high-ROI improvement for many profiles.",
      es: "Suele ser la mejora más rápida con alto ROI para muchos perfiles.",
    },
    delta: (p: Profile) => {
      const clb = p.ieltsClb ?? 0;
      if (clb >= 9) return 0;
      if (clb <= 6) return 95;
      if (clb === 7) return 80;
      if (clb === 8) return 60;
      return 70;
    },
    eligible: (p: Profile) => (p.ieltsClb ?? 0) < 9,
  },

  {
    id: "cec_plus_1_year",
    programTarget: "cec",
    title: { en: "CEC time (+1 year)", es: "Tiempo CEC (+1 año)" },
    description: {
      en: "Canadian experience increases CRS and can change draw eligibility.",
      es: "La experiencia canadiense sube CRS y puede cambiar elegibilidad en draws.",
    },
    delta: (p: Profile) => {
      const y = p.canExpYears ?? 0;
      if (y >= 5) return 0;
      if (y === 0) return 55;
      if (y === 1) return 35;
      if (y === 2) return 25;
      if (y === 3) return 18;
      return 12;
    },
    eligible: (p: Profile) => (p.canExpYears ?? 0) < 5,
  },

  {
    id: "job_offer",
    programTarget: "general",
    title: { en: "Job offer", es: "Oferta laboral" },
    description: {
      en: "Impact depends on whether it qualifies under current rules.",
      es: "Impacto depende de si califica bajo las reglas actuales.",
    },
    delta: (p: Profile) => (!p.hasJobOffer ? 50 : 0),
    eligible: (p: Profile) => !p.hasJobOffer,
  },
];