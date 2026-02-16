"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

type DrawPoint = {
  date: string;
  crs: number;
  itas: number;
};

const RAW: DrawPoint[] = [
  { date: "Jan 10", crs: 489, itas: 1500 },
  { date: "Jan 24", crs: 484, itas: 1800 },
  { date: "Feb 07", crs: 481, itas: 2000 },
  { date: "Feb 21", crs: 478, itas: 2200 },
  { date: "Mar 06", crs: 474, itas: 2500 },
  { date: "Mar 20", crs: 470, itas: 2800 },
  { date: "Apr 03", crs: 468, itas: 3000 },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatInt(n: number) {
  return n.toLocaleString();
}

function TrendPill({
  value,
  labelUp,
  labelDown,
}: {
  value: number;
  labelUp: string;
  labelDown: string;
}) {
  const up = value >= 0;
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        up
          ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30"
          : "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          up ? "bg-emerald-300" : "bg-rose-300",
        ].join(" ")}
      />
      {up ? labelUp : labelDown}{" "}
      <span className="opacity-80">
        ({up ? "+" : ""}
        {value})
      </span>
    </span>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-white/6 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Stat({
  title,
  value,
  sub,
  accent = "indigo",
}: {
  title: string;
  value: string;
  sub?: React.ReactNode;
  accent?: "indigo" | "cyan" | "emerald" | "rose";
}) {
  const accentMap: Record<string, string> = {
    indigo: "from-indigo-500/25 to-indigo-500/0",
    cyan: "from-cyan-500/25 to-cyan-500/0",
    emerald: "from-emerald-500/25 to-emerald-500/0",
    rose: "from-rose-500/25 to-rose-500/0",
  };

  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-white/60">{title}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {value}
          </div>
          {sub ? <div className="mt-3">{sub}</div> : null}
        </div>

        <div
          className={[
            "h-10 w-10 rounded-xl bg-linear-to-b",
            accentMap[accent],
            "ring-1 ring-white/10",
          ].join(" ")}
        />
      </div>
    </GlassCard>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: number;
  onChange: (v: number) => void;
  options: { label: string; value: number }[];
}) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-white/6 p-1 backdrop-blur">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={[
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "bg-white/10 text-white ring-1 ring-white/10"
                : "text-white/70 hover:text-white",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function InsightsPage() {
  const [windowSize, setWindowSize] = useState<number>(7);

  const data = useMemo(() => {
    const n = clamp(windowSize, 3, RAW.length);
    return RAW.slice(RAW.length - n);
  }, [windowSize]);

  const kpis = useMemo(() => {
    const last = data[data.length - 1];
    const prev = data[data.length - 2] ?? last;

    const crsDelta = last.crs - prev.crs;
    const itasDelta = last.itas - prev.itas;

    const avgCrs =
      data.reduce((acc, d) => acc + d.crs, 0) / Math.max(1, data.length);
    const avgItas =
      data.reduce((acc, d) => acc + d.itas, 0) / Math.max(1, data.length);

    const minCrs = Math.min(...data.map((d) => d.crs));
    const maxCrs = Math.max(...data.map((d) => d.crs));

    return {
      last,
      prev,
      crsDelta,
      itasDelta,
      avgCrs: Math.round(avgCrs),
      avgItas: Math.round(avgItas),
      minCrs,
      maxCrs,
    };
  }, [data]);

  const pageEnter = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_10%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(900px_circle_at_80%_20%,rgba(34,211,238,0.12),transparent_55%),radial-gradient(900px_circle_at_55%_85%,rgba(16,185,129,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-linear-to-b from-white/3 via-transparent to-black/40" />
        <div className="absolute -top-24 left-1/2 h-64 w-240 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Live dashboard (mock) — real data next
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Express Entry Intelligence
            </h1>

            <p className="mt-2 text-white/70">
              CRS cutoffs, ITAs, trends and patterns — in a fintech-style dashboard.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Segmented
              value={windowSize}
              onChange={setWindowSize}
              options={[
                { label: "Last 3", value: 3 },
                { label: "Last 5", value: 5 },
                { label: "Last 7", value: 7 },
              ]}
            />

            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm font-semibold text-white/80 backdrop-blur hover:bg-white/10"
            >
              Back to landing
            </Link>
          </div>
        </div>

        {/* KPI row */}
        <motion.div
          variants={pageEnter}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.35 }}
          className="mt-8 grid gap-4 md:grid-cols-3"
        >
          <Stat
            title="Latest CRS cutoff"
            value={`${kpis.last.crs}`}
            accent={kpis.crsDelta <= 0 ? "emerald" : "rose"}
            sub={
              <TrendPill
                value={kpis.crsDelta}
                labelUp="Higher vs previous"
                labelDown="Lower vs previous"
              />
            }
          />

          <Stat
            title="Latest ITAs issued"
            value={formatInt(kpis.last.itas)}
            accent={kpis.itasDelta >= 0 ? "cyan" : "rose"}
            sub={
              <TrendPill
                value={kpis.itasDelta}
                labelUp="More ITAs vs previous"
                labelDown="Fewer ITAs vs previous"
              />
            }
          />

          <Stat
            title="Range (window)"
            value={`${kpis.minCrs} — ${kpis.maxCrs}`}
            accent="indigo"
            sub={
              <div className="text-sm text-white/70">
                Avg CRS: <span className="font-semibold text-white">{kpis.avgCrs}</span>{" "}
                • Avg ITAs:{" "}
                <span className="font-semibold text-white">{formatInt(kpis.avgItas)}</span>
              </div>
            }
          />
        </motion.div>

        {/* Charts */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <motion.div
            variants={pageEnter}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    CRS cutoff trend
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    Lower is better (generally)
                  </div>
                </div>

                <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-white/70">
                  {data.length} draws
                </div>
              </div>

              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.10)"
                      strokeDasharray="4 4"
                    />
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.55)" }} />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.55)" }}
                      domain={["dataMin - 5", "dataMax + 5"]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10,14,24,0.92)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 12,
                        color: "white",
                      }}
                      labelStyle={{ color: "rgba(255,255,255,0.75)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="crs"
                      stroke="rgba(99,102,241,0.95)"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            variants={pageEnter}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">ITAs issued</div>
                  <div className="mt-1 text-xs text-white/60">
                    More ITAs can push CRS down
                  </div>
                </div>

                <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-white/70">
                  Window: {data.length}
                </div>
              </div>

              <div className="mt-5 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.10)"
                      strokeDasharray="4 4"
                    />
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.55)" }} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.55)" }} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10,14,24,0.92)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 12,
                        color: "white",
                      }}
                      labelStyle={{ color: "rgba(255,255,255,0.75)" }}
                    />
                    <Bar
                      dataKey="itas"
                      fill="rgba(34,211,238,0.85)"
                      radius={[10, 10, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Table */}
        <motion.div
          variants={pageEnter}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.35, delay: 0.15 }}
          className="mt-8"
        >
          <GlassCard className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Draw table</div>
                <div className="mt-1 text-xs text-white/60">
                  Quick scan — connect to official data next.
                </div>
              </div>

              <div className="text-xs text-white/60">
                Latest:{" "}
                <span className="font-semibold text-white">
                  {kpis.last.date} • CRS {kpis.last.crs} • ITAs{" "}
                  {formatInt(kpis.last.itas)}
                </span>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/6 text-white/70">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">CRS</th>
                    <th className="px-4 py-3 font-semibold">ITAs</th>
                    <th className="px-4 py-3 font-semibold">Δ CRS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {data
                    .slice()
                    .reverse()
                    .map((d, idx, arr) => {
                      const next = arr[idx + 1];
                      const delta = next ? d.crs - next.crs : 0;
                      const down = delta < 0;
                      const up = delta > 0;

                      return (
                        <tr key={d.date} className="bg-black/10">
                          <td className="px-4 py-3 text-white/90">{d.date}</td>
                          <td className="px-4 py-3 font-semibold text-white">
                            {d.crs}
                          </td>
                          <td className="px-4 py-3 text-white/90">
                            {formatInt(d.itas)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={[
                                "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1",
                                down
                                  ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
                                  : up
                                  ? "bg-rose-500/15 text-rose-200 ring-rose-500/30"
                                  : "bg-white/10 text-white/70 ring-white/10",
                              ].join(" ")}
                            >
                              {delta === 0 ? "—" : delta > 0 ? `+${delta}` : `${delta}`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-xs text-white/60">
              Next: connect this to official Express Entry draw data + add filters
              (category, program, province, etc.).
            </div>
          </GlassCard>
        </motion.div>

        <div className="mt-10 text-xs text-white/50">
          Disclaimer: informational UI. Not legal or immigration advice.
        </div>
      </div>
    </main>
  );
}
