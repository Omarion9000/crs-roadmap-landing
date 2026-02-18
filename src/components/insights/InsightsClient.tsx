"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import KpiCard from "@/components/insights/KpiCard";
import DrawsChart from "@/components/insights/DrawsChart";
import NewsList from "@/components/insights/NewsList";

import { MOCK_DRAWS, MOCK_NEWS } from "@/lib/insights/mock";
import type { Draw, NewsItem } from "@/lib/insights/types";

type ApiEnvelope<T> = {
  items: T;
  updatedAt: string;
};

export default function InsightsClient() {
  const [draws, setDraws] = useState<Draw[]>(MOCK_DRAWS);
  const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS);

  // API-first (pero con fallback a mock)
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [dRes, nRes] = await Promise.all([
          fetch("/api/draws", { signal: controller.signal }),
          fetch("/api/news", { signal: controller.signal }),
        ]);

        if (dRes.ok) {
          const dJson = (await dRes.json()) as ApiEnvelope<Draw[]>;
          if (Array.isArray(dJson.items)) setDraws(dJson.items);
        }

        if (nRes.ok) {
          const nJson = (await nRes.json()) as ApiEnvelope<NewsItem[]>;
          if (Array.isArray(nJson.items)) setNews(nJson.items);
        }
      } catch {
        // ignore (fallback keeps mock)
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const stats = useMemo(() => {
    const last = draws[draws.length - 1];
    const avgCutoff =
      draws.length === 0
        ? 0
        : Math.round(draws.reduce((acc, d) => acc + d.cutoff, 0) / draws.length);

    const totalInv = draws.reduce((acc, d) => acc + d.invitations, 0);

    return {
      lastCutoff: last?.cutoff ?? 0,
      lastProgram: last?.program ?? "-",
      avgCutoff,
      totalInv,
      newsCount: news.length,
    };
  }, [draws, news]);

  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      {/* bg */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#070A12] via-[#070A12] to-black" />
        <div className="absolute -top-40 left-1/2 h-112 w-md -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute bottom-[-12rem] -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-40 top-56 h-104 w-104 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-black font-bold">
              C
            </div>
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
          transition={{ duration: 0.5 }} // ✅ sin ease array
          className="grid gap-4 md:grid-cols-4"
        >
          <KpiCard
            title="Latest cutoff"
            value={`${stats.lastCutoff}`}
            sub={`Program: ${stats.lastProgram}`}
            chip="Live"
            accent="indigo"
          />
          <KpiCard
            title="Avg cutoff (window)"
            value={`${stats.avgCutoff}`}
            sub="Last N draws (mock/API)"
            accent="blue"
          />
          <KpiCard
            title="Total invitations"
            value={`${stats.totalInv.toLocaleString()}`}
            sub="Sum in current window"
            accent="violet"
          />
          <KpiCard
            title="News tracked"
            value={`${stats.newsCount}`}
            sub="Latest headlines"
            accent="emerald"
          />
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
            <div className="mt-1 text-sm text-white/60">
              Mock now — next we connect real feeds.
            </div>

            <div className="mt-4">
              <NewsList items={news} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}