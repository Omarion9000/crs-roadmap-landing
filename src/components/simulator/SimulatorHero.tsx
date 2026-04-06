"use client";

import { motion } from "framer-motion";

type ProgramOption = {
  key: "general" | "category" | "programs";
  label: string;
};

type SimulatorHeroProps = {
  loading: boolean;
  cutoffLoading: boolean;
  benchAvailable: boolean;
  benchSourceLabel: string;
  programOptions: readonly ProgramOption[];
  activeIndex: number;
  activeKey: ProgramOption["key"];
  onProgramChange: (program: ProgramOption["key"]) => void;
};

export default function SimulatorHero({
  loading,
  cutoffLoading,
  benchAvailable,
  benchSourceLabel,
  programOptions,
  activeIndex,
  activeKey,
  onProgramChange,
}: SimulatorHeroProps) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-12 top-6 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl"
          animate={{ x: [0, 24, 0], y: [0, -10, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-3rem] top-[-2rem] h-72 w-72 rounded-full bg-indigo-500/14 blur-3xl"
          animate={{ x: [0, -18, 0], y: [0, 14, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.05]" />
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-linear-to-b from-transparent via-cyan-300/20 to-transparent" />
      </div>

      <motion.div
        className="relative z-10 p-6 md:p-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.08,
              delayChildren: 0.06,
            },
          },
        }}
      >
        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
          <div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80"
            >
              Premium strategy workspace
            </motion.div>

            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              CRS Strategy Simulator
            </motion.h1>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              className="mt-5 max-w-2xl text-base leading-8 text-white/65"
            >
              Model your next move, understand your program eligibility, and build a smarter CRS roadmap before you spend time or money in the wrong direction.
            </motion.p>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              className="mt-5 inline-flex max-w-2xl items-center rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/55"
            >
              We compare your current score against the latest cutoff, estimate your gap, and rank the best next moves by likely impact.
            </motion.div>
          </div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
              },
            }}
            className="flex flex-col gap-4 xl:items-end"
          >
            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              {(loading || cutoffLoading) && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                  Updating…
                </span>
              )}

              <span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                {benchAvailable ? "Live benchmark" : "Fallback benchmark"}
              </span>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-[34rem]">
              {[
                ["Live benchmark", "Current market-aware"],
                ["AI-guided logic", "Best-next-move ranking"],
                ["Save and refine later", "Roadmap-ready workflow"],
              ].map(([eyebrow, value]) => (
                <motion.div
                  key={eyebrow}
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                    },
                  }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-black/20 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_50px_-34px_rgba(59,130,246,0.28)] transition duration-300 hover:border-white/16 hover:bg-white/[0.06]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/[0.07] via-transparent to-transparent opacity-60 transition duration-300 group-hover:opacity-90" />
                  <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/28 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                    {eyebrow}
                  </div>
                  <div className="relative mt-2 text-sm font-semibold text-white">{value}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 18 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
            },
          }}
          className="mt-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"
        >
          <div className="relative overflow-hidden rounded-full border border-white/10 bg-black/30 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_42px_-32px_rgba(59,130,246,0.35)] backdrop-blur">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-cyan-400/8 via-transparent to-indigo-400/8" />
            <motion.div
              className="absolute bottom-1 top-1 rounded-full border border-white/10 bg-linear-to-r from-cyan-400/16 via-sky-400/10 to-indigo-400/14 shadow-[0_14px_34px_-20px_rgba(99,102,241,0.7)]"
              animate={{
                width: `calc(${100 / programOptions.length}% - 2px)`,
                x: `${activeIndex * 100}%`,
              }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />

            <div className="relative z-10 grid grid-cols-3 gap-1">
              {programOptions.map((o) => {
                const isActive = o.key === activeKey;

                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => onProgramChange(o.key)}
                    className={[
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition duration-300",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
                      isActive
                        ? "text-white"
                        : "text-white/68 hover:text-white",
                    ].join(" ")}
                    title={o.label}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
              {benchSourceLabel}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
