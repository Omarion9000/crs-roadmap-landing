"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { MOCK_DRAWS, MOCK_NEWS } from "@/lib/insights/mock";
import type { Draw, NewsItem } from "@/lib/insights/types";
import { getBenchmark, type BenchmarkData } from "@/lib/insights/api";

type ApiEnvelope<T> = {
  items: T;
  updatedAt: string;
};

type Accent = "indigo" | "blue" | "violet" | "emerald" | "slate";

const ACCENT: Record<Accent, { ring: string; chipBg: string; chipText: string }> = {
  indigo: { ring: "ring-indigo-500/20", chipBg: "bg-indigo-500/15", chipText: "text-indigo-200" },
  blue: { ring: "ring-blue-500/20", chipBg: "bg-blue-500/15", chipText: "text-blue-200" },
  violet: { ring: "ring-violet-500/20", chipBg: "bg-violet-500/15", chipText: "text-violet-200" },
  emerald: { ring: "ring-emerald-500/20", chipBg: "bg-emerald-500/15", chipText: "text-emerald-200" },
  slate: { ring: "ring-white/10", chipBg: "bg-white/10", chipText: "text-white/70" },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getOptionalString(obj: unknown, key: string): string | undefined {
  if (typeof obj !== "object" || obj === null) return undefined;
  const rec = obj as Record<string, unknown>;
  const v = rec[key];
  return typeof v === "string" ? v : undefined;
}

function KpiCard(props: {
  title: string;
  value: string;
  sub?: string;
  chip?: string;
  accent?: Accent;
}) {
  const { title, value, sub, chip, accent = "slate" } = props;
  const a = ACCENT[accent];

  return (
    <div className={`rounded-3xl border border-white/10 bg-white/5 p-5 ring-1 ${a.ring} backdrop-blur`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-white/60">{title}</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
        </div>

        {chip ? (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${a.chipBg} ${a.chipText}`}>
            {chip}
          </span>
        ) : null}
      </div>

      {sub ? <div className="mt-2 text-sm text-white/60">{sub}</div> : null}
    </div>
  );
}

function DrawsChart(props: {
  title: string;
  subtitle?: string;
  mode: "cutoff" | "invitations";
  draws: Draw[];
  windowLabel?: string;
}) {
  const { title, subtitle, mode, draws, windowLabel } = props;
  const recent = draws.slice(-10);
  const values = recent.map((d) => (mode === "cutoff" ? d.cutoff : d.invitations));

  const max = values.length ? Math.max(...values) : 1;
  const min = values.length ? Math.min(...values) : 0;
  const range = Math.max(1, max - min);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-white/60">{subtitle}</div> : null}
        </div>
        {windowLabel ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
            {windowLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3">
        {recent.length === 0 ? (
          <div className="text-sm text-white/60">No draws yet.</div>
        ) : (
          recent
            .slice()
            .reverse()
            .map((d, idx) => {
              const v = mode === "cutoff" ? d.cutoff : d.invitations;
              const pct = clamp(((v - min) / range) * 100, 0, 100);
              const date = getOptionalString(d, "date") ?? "";

              return (
                <div key={`${d.program}-${idx}`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{d.program}</div>
                      <div className="text-xs text-white/60">{date}</div>
                    </div>
                    <div className="text-sm font-semibold">{mode === "cutoff" ? v : v.toLocaleString()}</div>
                  </div>

                  <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-linear-to-r from-indigo-600 to-blue-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
        )}
      </div>

      <div className="mt-4 text-xs text-white/50">
        Showing last {recent.length} draws • {mode === "cutoff" ? "Cutoff" : "Invitations"} bars are normalized.
      </div>
    </div>
  );
}

function NewsList(props: { items: NewsItem[] }) {
  const { items } = props;

  if (!items || items.length === 0) {
    return <div className="text-sm text-white/60">No news yet.</div>;
  }

  return (
    <ul className="space-y-3">
      {items.slice(0, 8).map((n, i) => {
        const url = getOptionalString(n, "url");
        const source = getOptionalString(n, "source");
        const date = getOptionalString(n, "publishedAt");

        return (
          <li key={`${n.title}-${i}`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm font-medium text-white hover:underline"
                  >
                    {n.title}
                  </a>
                ) : (
                  <div className="truncate text-sm font-medium">{n.title}</div>
                )}

                <div className="mt-1 text-xs text-white/60">
                  {source ? source : "Source"}
                  {date ? ` • ${date}` : ""}
                </div>
              </div>

              {url ? (
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
                  Open
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function InsightsClient() {
  const [draws, setDraws] = useState<Draw[]>(MOCK_DRAWS);
  const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS);

  const [bench, setBench] = useState<BenchmarkData | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [benchRes, dRes, nRes] = await Promise.all([
          getBenchmark("general", controller.signal).catch(() => null),
          fetch("/api/draws", { signal: controller.signal }).catch(() => null),
          fetch("/api/news", { signal: controller.signal }).catch(() => null),
        ]);

        if (benchRes) setBench(benchRes);

        if (dRes && dRes.ok) {
          const dJson = (await dRes.json()) as ApiEnvelope<Draw[]>;
          if (Array.isArray(dJson.items)) setDraws(dJson.items);
        }

        if (nRes && nRes.ok) {
          const nJson = (await nRes.json()) as ApiEnvelope<NewsItem[]>;
          if (Array.isArray(nJson.items)) setNews(nJson.items);
        }
      } catch {
        // keep MOCK_* fallback
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const stats = useMemo(() => {
    const last = draws[draws.length - 1];

    const avgCutoff =
      draws.length === 0 ? 0 : Math.round(draws.reduce((acc, d) => acc + d.cutoff, 0) / draws.length);

    const totalInv = draws.reduce((acc, d) => acc + d.invitations, 0);

    // ✅ Benchmark real response: latest only has cutoff+date (no program/source)
    const lastCutoff = bench?.latest?.cutoff ?? last?.cutoff ?? 0;
    const lastProgram = bench?.program ?? last?.program ?? "-";

    const liveChip = (() => {
      if (!bench) return "Fallback";
      const anyBench = bench as unknown as { source?: "mock" | "real" };
      return anyBench.source === "real" ? "Live" : "Mock";
    })();

    const trendLabel = (() => {
      if (!bench) return "0";
      const anyBench = bench as unknown as { trend?: number; trend90d?: { label?: string } };

      if (typeof anyBench.trend === "number") {
        const t = anyBench.trend;
        return t === 0 ? "0" : t > 0 ? `+${t}` : `${t}`;
      }

      const label = anyBench.trend90d?.label;
      return typeof label === "string" && label.trim() ? label : "0";
    })();

    return {
      lastCutoff,
      lastProgram,
      avgCutoff,
      totalInv,
      newsCount: news.length,
      liveChip,
      trendLabel,
    };
  }, [draws, news, bench]);

  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#070A12] via-[#070A12] to-black" />
        <div className="absolute -top-40 left-1/2 h-112 w-md -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute -bottom-48 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-40 top-56 h-104 w-104 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white font-bold text-black">C</div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">CRS Roadmap</div>
              <div className="text-xs text-white/60">Insights Dashboard</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              ← Back
            </Link>

            <Link
              href="/simulator"
              className="rounded-full bg-linear-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Open Simulator
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid gap-4 md:grid-cols-4"
        >
          <KpiCard
            title="Latest cutoff"
            value={`${stats.lastCutoff}`}
            sub={`Program: ${stats.lastProgram} • Trend: ${stats.trendLabel}`}
            chip={stats.liveChip}
            accent="indigo"
          />
          <KpiCard title="Avg cutoff (window)" value={`${stats.avgCutoff}`} sub="Last N draws (mock/API)" accent="blue" />
          <KpiCard
            title="Total invitations"
            value={`${stats.totalInv.toLocaleString()}`}
            sub="Sum in current window"
            accent="violet"
          />
          <KpiCard title="News tracked" value={`${stats.newsCount}`} sub="Latest headlines" accent="emerald" />
        </motion.div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DrawsChart
              title="Draws trend"
              subtitle="Cutoff & invitations (mock/API)"
              mode="cutoff"
              draws={draws}
              windowLabel="Recent"
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm font-semibold">News module</div>
            <div className="mt-1 text-sm text-white/60">Mock now — next we connect real feeds.</div>

            <div className="mt-4">
              <NewsList items={news} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}