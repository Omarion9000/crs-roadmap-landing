"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

type MarketOverviewProps = {
  programLabel: string;
  marketZoneLabel: string;
  marketZoneClass: string;
  showMarketDetails: boolean;
  onToggleMarketDetails: () => void;
  snapshotToneClass: string;
  effectiveBaseCrs: number;
  cutoff: number;
  marketGap: number;
  gapLabel: string;
  hasPnp: boolean;
  trendLabel: string;
  marketDirectionText: string;
  progressWidth: number;
  detailsContent: ReactNode;
};

export default function MarketOverview({
  programLabel,
  marketZoneLabel,
  marketZoneClass,
  showMarketDetails,
  onToggleMarketDetails,
  snapshotToneClass,
  effectiveBaseCrs,
  cutoff,
  marketGap,
  gapLabel,
  hasPnp,
  trendLabel,
  marketDirectionText,
  progressWidth,
  detailsContent,
}: MarketOverviewProps) {
  return (
    <div className="p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/75">Market overview</div>
          <div className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">Where you stand right now</div>
          <div className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            A premium snapshot of your current position, your gap to the latest cutoff, and the direction of the market for your selected program.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
            Program: {programLabel}
          </span>
          <span className={["rounded-full border px-3 py-1 text-xs font-semibold", marketZoneClass].join(" ")}>
            {marketZoneLabel}
          </span>
          <button
            type="button"
            onClick={onToggleMarketDetails}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/10"
          >
            {showMarketDetails ? "Hide market details" : "View market details"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.div
          className={[
            "relative overflow-hidden rounded-[32px] border p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_-48px_rgba(99,102,241,0.45)]",
            snapshotToneClass,
          ].join(" ")}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/[0.06] via-transparent to-transparent" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-80">
                Premium score snapshot
              </div>
              <motion.div
                className="mt-3 flex flex-wrap items-end gap-3"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.08,
                      delayChildren: 0.2,
                    },
                  },
                }}
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10, scale: 0.985 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
                >
                  {effectiveBaseCrs}
                </motion.div>
                <motion.span
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 0.75, y: 0 },
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="pb-1 text-lg font-medium text-white"
                >
                  vs {cutoff}
                </motion.span>
              </motion.div>
              <motion.div
                className="mt-3 max-w-xl text-sm leading-6 opacity-85"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                {gapLabel} against the latest {programLabel} cutoff.
              </motion.div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={["rounded-full border px-3 py-1 text-xs font-semibold", marketZoneClass].join(" ")}>
                {marketZoneLabel}
              </span>
              {hasPnp ? (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  +600 PNP included
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-center justify-between text-[11px] opacity-70">
              <span>Your score</span>
              <span>Current cutoff</span>
            </div>

            <div className="relative mt-2 h-3.5 w-full overflow-hidden rounded-full border border-white/10 bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/[0.05] via-transparent to-white/[0.03]" />
              <motion.div
                className={[
                  "relative h-full overflow-hidden rounded-full bg-linear-to-r shadow-[0_0_28px_-10px_rgba(99,102,241,0.75)]",
                  marketGap <= 0
                    ? "from-emerald-400/80 via-cyan-400/70 to-blue-400/70"
                    : marketGap <= 15
                    ? "from-blue-400/80 via-cyan-400/70 to-indigo-400/70"
                    : marketGap <= 40
                    ? "from-indigo-400/80 via-violet-400/70 to-fuchsia-400/70"
                    : "from-red-400/80 via-rose-400/70 to-amber-400/70",
                ].join(" ")}
                initial={{ width: 0 }}
                animate={{ width: `${progressWidth}%` }}
                transition={{ duration: 1.1, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/30 via-transparent to-transparent opacity-70" />
                <motion.div
                  className="pointer-events-none absolute inset-y-0 left-[-20%] w-18 bg-linear-to-r from-transparent via-white/65 to-transparent opacity-75 blur-[2px]"
                  animate={{ x: ["0%", "340%"] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "linear", repeatDelay: 0.35 }}
                />
                <motion.div
                  className="pointer-events-none absolute inset-y-0 left-[18%] w-1/3 rounded-full bg-white/18 blur-md"
                  animate={{ opacity: [0.18, 0.35, 0.18] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs opacity-75">
              <span>{effectiveBaseCrs}</span>
              <span>{cutoff}</span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <motion.div
              className="rounded-2xl border border-white/10 bg-black/15 p-4"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">Gap</div>
              <div className="mt-2 text-xl font-semibold text-white">{Math.abs(marketGap)}</div>
              <div className="mt-1 text-xs text-white/60">{gapLabel}</div>
            </motion.div>

            <motion.div
              className="rounded-2xl border border-white/10 bg-black/15 p-4"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">Trend</div>
              <div className="mt-2 text-xl font-semibold text-white">{trendLabel}</div>
              <div className="mt-1 text-xs text-white/60">Latest market direction</div>
            </motion.div>

            <motion.div
              className="rounded-2xl border border-white/10 bg-black/15 p-4"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.46, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">Program</div>
              <div className="mt-2 text-xl font-semibold text-white">{programLabel}</div>
              <div className="mt-1 text-xs text-white/60">Current benchmark target</div>
            </motion.div>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <motion.div
            className="rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
              Latest cutoff
            </div>
            <div className="mt-3 text-4xl font-bold tracking-tight text-white">{cutoff}</div>
            <div className="mt-2 text-sm leading-6 text-white/60">
              Latest draw benchmark for {programLabel}.
            </div>
          </motion.div>

          <motion.div
            className="rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
              Market direction
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight text-white">{trendLabel}</div>
            <div className="mt-2 text-sm leading-6 text-white/60">{marketDirectionText}</div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {showMarketDetails ? (
          <motion.div
            className="mt-5 space-y-5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {detailsContent}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
