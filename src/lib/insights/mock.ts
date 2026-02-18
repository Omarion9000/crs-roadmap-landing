import type { Draw, NewsItem } from "./types";

export const MOCK_DRAWS: Draw[] = [
  { date: "2026-01-08", program: "CEC", cutoff: 472, invitations: 3500 },
  { date: "2026-01-22", program: "FSW", cutoff: 489, invitations: 2800 },
  { date: "2026-02-05", program: "PNP", cutoff: 724, invitations: 900 },
  { date: "2026-02-12", program: "CEC", cutoff: 476, invitations: 3200 },
  { date: "2026-02-15", program: "Category", cutoff: 435, invitations: 2500 },
];

export const MOCK_NEWS: NewsItem[] = [
  {
    id: "n1",
    title: "IRCC updates Express Entry categories (mock)",
    source: "IRCC",
    url: "https://www.canada.ca/",
    publishedAt: "2026-02-15",
    tag: "IRCC",
  },
  {
    id: "n2",
    title: "Analysts expect CRS to stabilize in Q2 (mock)",
    source: "CRS Roadmap",
    url: "https://www.canada.ca/",
    publishedAt: "2026-02-10",
    tag: "Analysis",
  },
];