import type { Baseline } from "@/lib/sim/roi";

/**
 * CRS "Auto-calc" (MVP estimate).
 * NO es cálculo oficial. Sirve para UX mientras construimos el motor real.
 */
export function calculateCRSMvp(b: Baseline): number {
  // Base arbitraria (para que caiga cerca de rangos reales típicos)
  let score = 330;

  // Language (CLB)
  // (aprox) CLB 7..10
  const clbAdd: Record<Baseline["clb"], number> = {
    7: 40,
    8: 65,
    9: 95,
    10: 115,
  };
  score += clbAdd[b.clb];

  // Canadian experience (months) - escalado suave
  const m = Math.max(0, Math.min(36, b.cecMonths));
  if (m >= 12) score += 55;
  else if (m >= 10) score += 42;
  else if (m >= 8) score += 34;
  else if (m >= 6) score += 26;
  else if (m >= 3) score += 14;

  // French (bonus aproximado)
  if (b.hasFrench === "b1") score += 15;
  if (b.hasFrench === "b2") score += 35;

  // Job offer (aprox)
  if (b.hasJobOffer) score += 50;

  // PNP (+600)
  if (b.hasPNP) score += 600;

  // Clamp
  score = Math.max(0, Math.min(1200, Math.round(score)));
  return score;
}
