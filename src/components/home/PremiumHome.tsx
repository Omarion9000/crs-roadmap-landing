"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { trackFunnelEvent } from "@/lib/funnel";
import { buildUpgradeEntryHref } from "@/lib/upgrade";
import DrawsNewsFeed from "@/components/home/DrawsNewsFeed";
import { useLanguage } from "@/lib/i18n/context";

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const VALUE_COLORS = [
  "text-cyan-300   border-cyan-400/25   bg-cyan-400/10",
  "text-blue-300   border-blue-400/25   bg-blue-400/10",
  "text-violet-300 border-violet-400/25 bg-violet-400/10",
  "text-emerald-300 border-emerald-400/25 bg-emerald-400/10",
  "text-amber-300  border-amber-400/25  bg-amber-400/10",
  "text-pink-300   border-pink-400/25   bg-pink-400/10",
] as const;

const problemStats = [
  { raw: "78%",    end: 78, suffix: "%",     statKey: "problem_stat_1" as const },
  { raw: "3–6 mo", end: 3,  suffix: "–6 mo", statKey: "problem_stat_2" as const },
  { raw: "40+",    end: 40, suffix: "+ pts",  statKey: "problem_stat_3" as const },
];

function useCountUp(end: number, duration = 1600) {
  const [count, setCount] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTriggered(true); },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!triggered) return;
    const startTime = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [triggered, end, duration]);

  return { count, ref };
}

function CounterStat({
  end,
  suffix,
  label,
}: {
  end: number;
  suffix: string;
  label: string;
}) {
  const { count, ref } = useCountUp(end);
  return (
    <div
      ref={ref}
      className="rounded-[20px] border border-red-500/20 bg-red-500/[0.07] p-5"
    >
      <div className="text-3xl font-bold tracking-tight text-red-200 tabular-nums">
        {count}{suffix}
      </div>
      <div className="mt-2 text-sm text-white/60">{label}</div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-5 text-left text-sm font-semibold text-white/80 transition hover:text-white"
      >
        <span>{question}</span>
        <span
          className={`ml-6 shrink-0 text-lg font-light text-white/35 transition-transform duration-200 ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      {open && (
        <p className="pb-5 text-sm leading-7 text-white/52">{answer}</p>
      )}
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  tight,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  tight?: boolean;
}) {
  return (
    <motion.section
      id={id}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      className={tight ? "py-10" : "py-14"}
    >
      <div className="mx-auto max-w-6xl px-6">
        <motion.div variants={itemVariants} className="max-w-3xl">
          {eyebrow ? (
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-3 text-base leading-7 text-white/58">{subtitle}</p>
          ) : null}
        </motion.div>
        <div className="mt-8">{children}</div>
      </div>
    </motion.section>
  );
}

function ScreenshotCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-[28px] border border-white/10 bg-white/[0.05] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_26px_80px_-56px_rgba(59,130,246,0.28)] backdrop-blur-xl"
    >
      <div className="rounded-[22px] border border-white/10 bg-black/25 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">{title}</div>
            <div className="mt-1 text-xs text-white/50">{caption}</div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">
            Preview
          </div>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </motion.div>
  );
}

export default function PremiumHome() {
  const { t } = useLanguage();

  const solutionCards = [
    { icon: "→", accent: "from-cyan-400/20 to-cyan-400/0 border-cyan-400/25", iconColor: "text-cyan-300", titleKey: "solution_card_1_title" as const, descKey: "solution_card_1_desc" as const },
    { icon: "◎", accent: "from-blue-400/20 to-blue-400/0 border-blue-400/25",  iconColor: "text-blue-300",  titleKey: "solution_card_2_title" as const, descKey: "solution_card_2_desc" as const },
    { icon: "⇉", accent: "from-violet-400/20 to-violet-400/0 border-violet-400/25", iconColor: "text-violet-300", titleKey: "solution_card_3_title" as const, descKey: "solution_card_3_desc" as const },
  ];

  const valueKeys = ["value_1","value_2","value_3","value_4","value_5","value_6"] as const;

  const howItWorks = [
    { step: "01", stepColor: "text-cyan-300 border-cyan-400/25 bg-cyan-400/10",   titleKey: "how_1_title" as const, descKey: "how_1_desc" as const },
    { step: "02", stepColor: "text-blue-300 border-blue-400/25 bg-blue-400/10",   titleKey: "how_2_title" as const, descKey: "how_2_desc" as const },
    { step: "03", stepColor: "text-violet-300 border-violet-400/25 bg-violet-400/10", titleKey: "how_3_title" as const, descKey: "how_3_desc" as const },
  ];

  const proHref = buildUpgradeEntryHref({ returnTo: "/billing", unlock: "pro" });

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070A12] text-white">
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.1),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(99,102,241,0.12),transparent_22%),radial-gradient(circle_at_16%_84%,rgba(139,92,246,0.08),transparent_24%)]" />
        <div className="absolute inset-0 bg-linear-to-b from-[#091120] via-[#070A12] to-black" />
      </div>

      {/* ── HERO ── */}
      <section className="py-14 lg:py-18">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr] [touch-action:pan-y]">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-2xl"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80"
            >
              {t("hero_eyebrow")}
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              {t("hero_title_1")}
              <span className="mt-2 block bg-linear-to-r from-cyan-200 via-blue-200 to-violet-200 bg-clip-text text-transparent">
                {t("hero_title_2")}
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 text-lg leading-8 text-white/64"
            >
              {t("hero_subtitle")}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                href="/start"
                onClick={() =>
                  trackFunnelEvent("landing_cta_clicked", { location: "hero" })
                }
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-gray-200"
              >
                {t("hero_cta")}
              </Link>
              <Link
                href="#demo"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {t("hero_cta_secondary")}
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-6 text-sm text-white/50"
            >
              {t("hero_no_signup")}
            </motion.div>
          </motion.div>

          {/* Hero product card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative pointer-events-none lg:pointer-events-auto"
          >
            <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.2),transparent_45%)] blur-2xl" />
            <div className="relative rounded-[32px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_100px_-60px_rgba(59,130,246,0.45)] backdrop-blur-xl">
              <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                      {t("hero_card_eyebrow")}
                    </div>
                    <div className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                      {t("hero_card_title")}
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
                    {t("hero_card_badge")}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      {t("hero_crs_label")}
                    </div>
                    <div className="mt-3 text-5xl font-bold tracking-tight text-white">
                      407
                    </div>
                    <div className="mt-2 text-sm text-white/55">
                      {t("hero_baseline")}
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-cyan-400/20 bg-cyan-400/10 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">
                      {t("hero_best_move")}
                    </div>
                    <div className="mt-3 text-xl font-semibold text-white">
                      IELTS to CLB 9
                    </div>
                    <div className="mt-4 flex flex-wrap items-end gap-3">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                          {t("hero_projected")}
                        </div>
                        <div className="mt-2 text-4xl font-bold tracking-tight text-cyan-100">
                          435
                        </div>
                      </div>
                      <div className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-1 text-xs font-semibold text-cyan-100">
                        {t("hero_fastest_path")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    <span>{t("hero_position")}</span>
                    <span>{t("hero_improved")}</span>
                  </div>
                  <div className="relative mt-3 h-3 overflow-hidden rounded-full border border-white/10 bg-black/30">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-cyan-400 via-blue-400 to-violet-400 shadow-[0_0_28px_-10px_rgba(59,130,246,0.85)]"
                      animate={{ width: ["48%", "61%", "48%"] }}
                      transition={{
                        duration: 4.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── LIVE DRAWS FEED ── */}
      <DrawsNewsFeed />

      {/* ── THE REAL PROBLEM ── */}
      <Section eyebrow={t("problem_eyebrow")} title={t("problem_title")}>
        <motion.div variants={containerVariants} className="space-y-6">
          <motion.div
            variants={itemVariants}
            className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-7 backdrop-blur-xl"
          >
            <div className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {t("problem_subtitle")}
            </div>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/60">
              {t("problem_body")}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {problemStats.map((stat) => (
                <CounterStat key={stat.raw} end={stat.end} suffix={stat.suffix} label={t(stat.statKey)} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </Section>

      {/* ── THE SOLUTION ── */}
      <Section eyebrow={t("solution_eyebrow")} title={t("solution_title")}>
        <motion.div variants={itemVariants} className="mb-8">
          <div className="bg-linear-to-r from-cyan-200 via-blue-200 to-violet-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            {t("solution_headline")}
          </div>
        </motion.div>
        <motion.div variants={containerVariants} className="grid gap-4 lg:grid-cols-3">
          {solutionCards.map((card) => (
            <motion.div
              key={card.titleKey}
              variants={itemVariants}
              className={`rounded-[28px] border bg-gradient-to-b p-6 backdrop-blur-xl ${card.accent}`}
            >
              <div className={`text-2xl font-bold leading-none ${card.iconColor}`}>{card.icon}</div>
              <div className="mt-4 text-lg font-semibold text-white">{t(card.titleKey)}</div>
              <div className="mt-3 text-sm leading-7 text-white/60">{t(card.descKey)}</div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ── PRODUCT PREVIEW ── */}
      <Section id="demo" eyebrow={t("preview_eyebrow")} title={t("preview_title")} tight>
        <motion.div variants={containerVariants} className="grid gap-4 lg:grid-cols-3">
          <ScreenshotCard title={t("preview_card_1_title")} caption={t("preview_card_1_caption")}>
            <div className="space-y-3">
              {[
                [t("hero_crs_label"), "407", "text-white"],
                ["English to CLB 9", "+28", "text-cyan-200"],
                ["French to B2", "+50", "text-violet-200"],
              ].map(([label, value, tone]) => (
                <div key={label} className="flex items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="text-sm text-white/70">{label}</div>
                  <div className={`text-lg font-semibold ${tone}`}>{value}</div>
                </div>
              ))}
            </div>
          </ScreenshotCard>

          <ScreenshotCard title={t("preview_card_2_title")} caption={t("preview_card_2_caption")}>
            <div className="rounded-[20px] border border-cyan-400/20 bg-cyan-400/10 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">{t("preview_best_path")}</div>
              <div className="mt-3 text-lg font-semibold text-white">French to B2</div>
              <div className="mt-3 text-sm leading-6 text-white/72">{t("preview_ai_body")}</div>
              <div className="mt-4 space-y-2">
                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">{t("preview_action_flow")}</div>
                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">{t("preview_timeline")}</div>
              </div>
            </div>
          </ScreenshotCard>

          <ScreenshotCard title={t("preview_card_3_title")} caption={t("preview_card_3_caption")}>
            <div className="space-y-3">
              {[
                { labelKey: "preview_french" as const, noteKey: "preview_french_note" as const, tone: "border-fuchsia-400/25 bg-fuchsia-400/10" },
                { labelKey: "preview_ielts"  as const, noteKey: "preview_ielts_note"  as const, tone: "border-cyan-400/25 bg-cyan-400/10" },
                { labelKey: "preview_pnp"    as const, noteKey: "preview_pnp_note"    as const, tone: "border-violet-400/25 bg-violet-400/10" },
              ].map((item) => (
                <div key={item.labelKey} className={`rounded-[18px] border px-4 py-3 ${item.tone}`}>
                  <div className="text-sm font-semibold text-white">{t(item.labelKey)}</div>
                  <div className="mt-1 text-xs text-white/62">{t(item.noteKey)}</div>
                </div>
              ))}
            </div>
          </ScreenshotCard>
        </motion.div>
      </Section>

      {/* ── VALUE STACK ── */}
      <Section eyebrow={t("value_eyebrow")} title={t("value_title")} tight>
        <motion.div variants={containerVariants} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {valueKeys.map((key, i) => (
            <motion.div
              key={key}
              variants={itemVariants}
              className={`flex items-center gap-3 rounded-[20px] border px-5 py-4 text-sm font-medium backdrop-blur-xl ${VALUE_COLORS[i]}`}
            >
              <span className="text-base leading-none">✦</span>
              <span className="text-white/85">{t(key)}</span>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section eyebrow={t("how_eyebrow")} title={t("how_title")} tight>
        <motion.div variants={containerVariants} className="grid gap-4 lg:grid-cols-3">
          {howItWorks.map((item) => (
            <motion.div key={item.step} variants={itemVariants} className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
              <div className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.18em] ${item.stepColor}`}>
                {item.step}
              </div>
              <div className="mt-4 text-xl font-semibold text-white">{t(item.titleKey)}</div>
              <div className="mt-3 text-sm leading-7 text-white/60">{t(item.descKey)}</div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ── PRICING ── */}
      <Section eyebrow={t("pricing_eyebrow")} title={t("pricing_title")}>
        <motion.p variants={itemVariants} className="mb-6 text-sm text-white/50">
          {t("pricing_subtext")}
        </motion.p>
        <motion.div variants={containerVariants} className="grid gap-5 lg:grid-cols-2">
          {/* FREE */}
          <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-7">
            <div className="relative">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">{t("pricing_free_name")}</div>
              <div className="mt-3 text-4xl font-bold tracking-tight text-white">{t("pricing_free_price")}</div>
              <div className="mt-4 text-base font-semibold text-white">{t("pricing_free_desc")}</div>
              <div className="mt-5 space-y-2.5">
                {(["pricing_free_f1","pricing_free_f2","pricing_free_f3","pricing_free_f4"] as const).map((fk) => (
                  <div key={fk} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/8 text-[11px] font-bold text-white/50">✓</span>
                    <span className="text-sm text-white/60">{t(fk)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="/simulator" onClick={() => trackFunnelEvent("landing_cta_clicked", { location: "pricing-free" })}
                  className="inline-flex rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  {t("pricing_free_cta")}
                </Link>
              </div>
            </div>
          </motion.div>

          {/* PRO */}
          <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[30px] border border-blue-400/35 bg-[linear-gradient(135deg,rgba(59,130,246,0.14),rgba(139,92,246,0.08),rgba(255,255,255,0.04))] p-5 shadow-[0_0_60px_rgba(59,130,246,0.22),0_0_0_1px_rgba(59,130,246,0.15)] backdrop-blur-xl sm:p-7">
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-400/12 blur-3xl" />
            <div className="relative">
              <div className="mb-4 inline-flex rounded-full border border-blue-300/30 bg-blue-400/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100">{t("pricing_pro_badge")}</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">{t("pricing_pro_name")}</div>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-bold tracking-tight text-white">{t("pricing_pro_price")}</span>
                <span className="mb-1 text-sm text-white/50">{t("pricing_pro_price_sub")}</span>
              </div>
              <div className="mt-1 text-xs font-medium text-white/45">{t("pricing_pro_subtext")}</div>
              <div className="mt-4 text-base font-semibold text-white">{t("pricing_pro_desc")}</div>
              <div className="mt-5 space-y-2.5">
                {(["pricing_pro_f1","pricing_pro_f2","pricing_pro_f3","pricing_pro_f4","pricing_pro_f5","pricing_pro_f6"] as const).map((fk) => (
                  <div key={fk} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-400/20 text-[11px] font-bold text-blue-200">✓</span>
                    <span className="text-sm text-white/82">{t(fk)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-xs text-white/55">{t("pricing_pro_note")}</div>
              <div className="mt-6">
                <Link href={proHref} onClick={() => trackFunnelEvent("landing_cta_clicked", { location: "pricing-pro" })}
                  className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-[0_18px_44px_-18px_rgba(255,255,255,0.55)] transition hover:bg-gray-100">
                  {t("pricing_pro_cta")}
                </Link>
              </div>
              <div className="mt-3 text-xs text-white/38">{t("pricing_pro_cancel")}</div>
            </div>
          </motion.div>
        </motion.div>
      </Section>

      {/* ── FAQ ── */}
      <Section eyebrow={t("faq_eyebrow")} title={t("faq_title")} tight>
        <motion.div variants={itemVariants} className="mx-auto max-w-2xl">
          {(
            [
              ["faq_q1", "faq_a1"],
              ["faq_q2", "faq_a2"],
              ["faq_q3", "faq_a3"],
              ["faq_q4", "faq_a4"],
              ["faq_q5", "faq_a5"],
            ] as const
          ).map(([qk, ak]) => (
            <FaqItem key={qk} question={t(qk)} answer={t(ak)} />
          ))}
        </motion.div>
      </Section>

      {/* ── FINAL CTA ── */}
      <Section eyebrow={t("cta_eyebrow")} title={t("cta_title")} tight>
        <motion.div variants={itemVariants} className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(59,130,246,0.12),rgba(255,255,255,0.03),rgba(99,102,241,0.08))] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_90px_-58px_rgba(59,130,246,0.35)] backdrop-blur-xl">
          <div className="max-w-2xl">
            <p className="text-base leading-7 text-white/65">{t("cta_body")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/start" onClick={() => trackFunnelEvent("landing_cta_clicked", { location: "final-cta" })}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-gray-200">
                {t("cta_primary")}
              </Link>
              <Link href="/simulator" className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                {t("cta_secondary")}
              </Link>
            </div>
          </div>
        </motion.div>
      </Section>
    </main>
  );
}
