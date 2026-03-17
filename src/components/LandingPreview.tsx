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
        className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">
              Live Insights & Draw History
            </div>
            <div className="mt-1 text-sm text-gray-700">
              Track Express Entry draws, trends, and official updates — in one place.
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-800">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            New section
          </div>
        </div>

        {/* Body */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* Card 1 */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
          >
            <div className="text-xs text-gray-500">Latest draw</div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-lg font-semibold text-gray-900">CRS 491</div>
              <div className="text-xs font-semibold text-emerald-700">+3.2%</div>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              Latest cut-off + invitations. Open Insights for the full breakdown.
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
          >
            <div className="text-xs text-gray-500">Trend (90d)</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">
              Stable → Slightly up
            </div>
            <div className="mt-2 text-sm text-gray-700">
              Visual charts for cut-offs, invitations, and categories.
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
          >
            <div className="text-xs text-gray-500">Official news</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">
              Trusted sources only
            </div>
            <div className="mt-2 text-sm text-gray-700">
              Curated headlines + direct source links.
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          variants={item}
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-linear-to-r from-indigo-50 to-white p-5"
        >
          <div className="text-sm text-gray-700">
            Want the full dashboard experience?
            <span className="ml-2 text-gray-900 font-semibold">
              Open the Simulator & Insights
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/simulator"
              className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-black/30"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-xs">
                ↗
              </span>
              Open simulator
            </Link>

            <Link
              href="/insights"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              View insights
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
