"use client";

import { motion } from "framer-motion";

type InsightHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  whyThisPathMatters: string;
  statusLabel: string;
  previewBullets: string[];
};

export default function InsightHero({
  eyebrow,
  title,
  description,
  whyThisPathMatters,
  statusLabel,
  previewBullets,
}: InsightHeroProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.045] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_36px_120px_-72px_rgba(34,211,238,0.35)] backdrop-blur-xl sm:p-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-cyan-500/10 via-transparent to-indigo-500/10" />
      <motion.div
        className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl"
        animate={{ opacity: [0.24, 0.42, 0.24], scale: [1, 1.06, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-4xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
            {eyebrow}
          </div>
          <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/68">
            {statusLabel}
          </div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-2xl text-base leading-8 text-white/66"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-5"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            Why this path matters
          </div>
          <div className="mt-3 max-w-3xl text-sm leading-7 text-white/72">{whyThisPathMatters}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 flex flex-wrap gap-2"
        >
          {previewBullets.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/72"
            >
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
