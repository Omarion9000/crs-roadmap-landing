// src/lib/insights/types.ts

/**
 * Programs we can fetch insights for.
 * Keep this small + stable (maps 1:1 to API routes / caching keys).
 */
export type ProgramKey = "general" | "cec" | "french" | "pnp";

export type LatestDraw = {
  cutoff: number;
  date: string; // ISO date string
  program: ProgramKey;
  source: "mock" | "real";
};

export type Draw = {
  date: string;
  program: string;
  cutoff: number;
  invitations: number;
};

export type NewsItem = {
  id: string;
  title: string;
  source?: string;
  url?: string;
  publishedAt?: string; // e.g. "2026-02-15"
  tag?: string; // e.g. "IRCC" | "Analysis"
};

export type ApiEnvelope<T> = {
  items: T;
  updatedAt: string;
};