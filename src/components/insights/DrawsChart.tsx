"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Draw } from "@/lib/insights/types";

export type Mode = "cutoff" | "invitations";

function formatShortDate(iso: string) {
  // iso: "2026-02-15"
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

export default function DrawsChart({
  title,
  subtitle,
  mode,
  draws,
  windowLabel,
}: {
  title: string;
  subtitle: string;
  mode: Mode;
  draws: Draw[];
  windowLabel?: string;
}) {
  const series = useMemo(() => {
    const safe = [...draws].sort((a, b) => a.date.localeCompare(b.date));
    return safe.map((d) => ({
      xLabel: formatShortDate(d.date),
      date: d.date,
      cutoff: d.cutoff,
      invitations: d.invitations,
      program: d.program,
      value: mode === "cutoff" ? d.cutoff : d.invitations,
    }));
  }, [draws, mode]);

  const maxVal = useMemo(() => {
    const m = series.reduce((acc, s) => Math.max(acc, s.value), 0);
    return m <= 0 ? 1 : m;
  }, [series]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="mt-1 text-sm text-white/60">{subtitle}</div>
        </div>
        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
          {windowLabel ?? "Window"}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-white/60">
            Metric:{" "}
            <span className="font-semibold text-white/80">
              {mode === "cutoff" ? "CRS cutoff" : "Invitations (ITAs)"}
            </span>
          </div>
          <div className="text-xs text-white/50">{series.length} points</div>
        </div>

        {/* mini bar chart */}
        <div className="mt-4 grid grid-cols-12 items-end gap-2">
          {series.slice(-12).map((p) => {
            const h = Math.max(6, Math.round((p.value / maxVal) * 140)); // px
            return (
              <div key={p.date} className="group relative">
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="w-full rounded-xl border border-white/10 bg-linear-to-b from-indigo-500/25 to-indigo-500/5"
                  style={{ height: `${h}px` }}
                />
                <div className="mt-2 text-center text-[10px] text-white/55">
                  {p.xLabel}
                </div>

                {/* tooltip */}
                <div className="pointer-events-none absolute -top-2 left-1/2 hidden w-56 -translate-x-1/2 -translate-y-full rounded-2xl border border-white/10 bg-black/90 p-3 text-xs text-white/80 shadow-xl group-hover:block">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{p.program}</div>
                    <div className="text-white/60">{p.date}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                      <div className="text-white/60">Cutoff</div>
                      <div className="font-semibold text-white">{p.cutoff}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                      <div className="text-white/60">Invitations</div>
                      <div className="font-semibold text-white">
                        {p.invitations.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-xs text-white/50">
          Mock/API series. Next step: pull real IRCC draw data.
        </div>
      </div>
    </div>
  );
}