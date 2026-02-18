"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";

const container: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1], // ✅ typed easing
      staggerChildren: 0.06,
    },
  },
};

export const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function LandingPreview() {
  return (
    <motion.section
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      className="mt-10"
    >
      <motion.div
        variants={item}
        className="rounded-3xl border border-white/10 bg-black/60 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">
              Live Insights & Draw History
            </div>
            <div className="mt-1 text-sm text-white/70">
              Track Express Entry draws, trends, and official updates — in one place.
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            New section
          </div>
        </div>

        {/* Body */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* Card 1 */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="text-xs text-white/60">Latest draw</div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-lg font-semibold text-white">CRS 491</div>
              <div className="text-xs font-semibold text-emerald-300">+3.2%</div>
            </div>
            <div className="mt-2 text-sm text-white/70">
              Snapshot: cut-off points and category overview.
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="text-xs text-white/60">Trend (90d)</div>
            <div className="mt-2 text-lg font-semibold text-white">
              Stable → Slightly up
            </div>
            <div className="mt-2 text-sm text-white/70">
              Visual charts for cut-offs, invitations, and categories.
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="text-xs text-white/60">Official news</div>
            <div className="mt-2 text-lg font-semibold text-white">
              Trusted sources only
            </div>
            <div className="mt-2 text-sm text-white/70">
              Curated headlines + direct source links.
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          variants={item}
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-linear-to-r from-white/5 to-white/0 p-4"
        >
          <div className="text-sm text-white/70">
            Want the full dashboard experience?
            <span className="ml-2 text-white/90 font-semibold">
              Open the Simulator & Insights
            </span>
          </div>

          <Link
            href="/simulator"
            className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-xs">
              ↗
            </span>
            Open dashboard
          </Link>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
