// src/lib/insights/data/general-draws.real.ts
import type { Draw } from "@/lib/insights/types";

// ✅ Named exports (NO default export)
export const GENERAL_DRAWS_REAL: Draw[] = [
  { date: "2026-02-13", program: "General", cutoff: 491, invitations: 11000 },
  { date: "2026-01-30", program: "General", cutoff: 493, invitations: 10000 },
  { date: "2026-01-16", program: "General", cutoff: 496, invitations: 9500 },
  { date: "2025-12-19", program: "General", cutoff: 500, invitations: 8000 },
  { date: "2025-12-05", program: "General", cutoff: 502, invitations: 7500 },
];

export const CATEGORY_DRAWS_REAL: Draw[] = [
  { date: "2026-02-20", program: "Category", cutoff: 489, invitations: 3500 },
  { date: "2026-02-06", program: "Category", cutoff: 492, invitations: 3000 },
  { date: "2026-01-23", program: "Category", cutoff: 495, invitations: 2800 },
  { date: "2026-01-09", program: "Category", cutoff: 497, invitations: 2500 },
  { date: "2025-12-12", program: "Category", cutoff: 501, invitations: 2200 },
];