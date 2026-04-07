"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type DrawItem = {
  date: string;
  program: string;
  cutoff: number;
  invitations: number;
  is_new: boolean;
  draw_number: number | null;
};

type ApiResponse = {
  items: DrawItem[];
  source: string;
  updatedAt: string;
};

function formatDate(iso: string) {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function programColor(program: string) {
  const p = program.toLowerCase();
  if (p.includes("general")) return "text-cyan-300 border-cyan-400/25 bg-cyan-400/10";
  if (p.includes("category")) return "text-blue-300 border-blue-400/25 bg-blue-400/10";
  if (p.includes("cec") || p.includes("canadian experience")) return "text-emerald-300 border-emerald-400/25 bg-emerald-400/10";
  if (p.includes("french")) return "text-violet-300 border-violet-400/25 bg-violet-400/10";
  if (p.includes("fsw") || p.includes("skilled worker")) return "text-amber-300 border-amber-400/25 bg-amber-400/10";
  return "text-white/60 border-white/15 bg-white/5";
}

function DrawCard({ draw, isLatest }: { draw: DrawItem; isLatest: boolean }) {
  const pillClass = programColor(draw.program);
  const irccUrl =
    "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html";

  return (
    <div className="relative flex w-72 shrink-0 flex-col gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.07] sm:w-80">
      {/* NEW badge */}
      {(draw.is_new || isLatest) && (
        <span className="absolute right-4 top-4 rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
          NEW
        </span>
      )}

      {/* Date + draw number */}
      <div className="pr-12">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
          {draw.draw_number ? `Draw #${draw.draw_number} · ` : ""}{formatDate(draw.date)}
        </div>
        <div className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${pillClass}`}>
          {draw.program}
        </div>
      </div>

      {/* Score */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
            Minimum CRS
          </div>
          <div className="mt-1.5 text-4xl font-bold tracking-tight text-white">
            {draw.cutoff}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
            Invitations
          </div>
          <div className="mt-1.5 text-xl font-semibold text-white/80">
            {draw.invitations.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Footer link */}
      <Link
        href={irccUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto flex items-center gap-1.5 text-[11px] font-medium text-white/35 transition hover:text-white/60"
      >
        <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" aria-hidden="true">
          <path d="M6 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3M9 1h6m0 0v6m0-6L8 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Source: canada.ca / IRCC
      </Link>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="w-72 shrink-0 animate-pulse rounded-[24px] border border-white/8 bg-white/[0.03] p-5 sm:w-80">
      <div className="h-3 w-24 rounded bg-white/10" />
      <div className="mt-3 h-5 w-32 rounded bg-white/8" />
      <div className="mt-5 flex items-end gap-4">
        <div>
          <div className="h-2.5 w-16 rounded bg-white/8" />
          <div className="mt-2 h-10 w-20 rounded bg-white/10" />
        </div>
        <div className="ml-auto text-right">
          <div className="h-2.5 w-16 rounded bg-white/8" />
          <div className="mt-2 h-6 w-16 rounded bg-white/8" />
        </div>
      </div>
    </div>
  );
}

export default function DrawsNewsFeed() {
  const [draws, setDraws] = useState<DrawItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/draws/live")
      .then((r) => r.json())
      .then((json: ApiResponse) => {
        if (!cancelled) {
          setDraws((json.items ?? []).slice(0, 8));
        }
      })
      .catch(() => {
        // silently fail — fallback static data also served by the API
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Scroll left/right with buttons
  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  };

  return (
    <section className="py-8">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/65">
              Live draws
            </div>
            <h2 className="mt-1.5 text-lg font-semibold text-white">
              Latest Express Entry results
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              ›
            </button>
          </div>
        </div>

        {/* Scroll track */}
        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-3 overflow-x-auto pb-2"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : draws.map((draw, i) => (
                <div key={`${draw.date}-${draw.program}`} style={{ scrollSnapAlign: "start" }}>
                  <DrawCard draw={draw} isLatest={i === 0} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
