// src/lib/insights/types.ts

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
  tag?: string;         // e.g. "IRCC" | "Analysis"
};