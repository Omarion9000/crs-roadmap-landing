"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { trackFunnelEvent } from "@/lib/funnel";
import { buildUpgradeEntryHref } from "@/lib/upgrade";
import DrawsNewsFeed from "@/components/home/DrawsNewsFeed";

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

const solutionCards = [
  {
    icon: "→",
    accent: "from-cyan-400/20 to-cyan-400/0 border-cyan-400/25",
    iconColor: "text-cyan-300",
    title: "See your best next move",
    description:
      "Find the strongest path you can actually act on now instead of guessing which score lever matters most.",
  },
  {
    icon: "◎",
    accent: "from-blue-400/20 to-blue-400/0 border-blue-400/25",
    iconColor: "text-blue-300",
    title: "Understand why it matters",
    description:
      "See the reasoning behind the recommendation so you can make decisions with more clarity and less doubt.",
  },
  {
    icon: "⇉",
    accent: "from-violet-400/20 to-violet-400/0 border-violet-400/25",
    iconColor: "text-violet-300",
    title: "Follow a clear execution plan",
    description:
      "Turn raw score scenarios into a roadmap you can follow — with sequencing, timing, and practical next steps.",
  },
];

const valueStack = [
  { label: "AI-generated strategy",       color: "text-cyan-300   border-cyan-400/25   bg-cyan-400/10"   },
  { label: "Step-by-step roadmap",        color: "text-blue-300   border-blue-400/25   bg-blue-400/10"   },
  { label: "French / IELTS / PNP paths",  color: "text-violet-300 border-violet-400/25 bg-violet-400/10" },
  { label: "Personalized to your profile",color: "text-emerald-300 border-emerald-400/25 bg-emerald-400/10" },
  { label: "Save and track your progress",color: "text-amber-300  border-amber-400/25  bg-amber-400/10"  },
  { label: "Advisor-style insights",      color: "text-pink-300   border-pink-400/25   bg-pink-400/10"   },
];

const howItWorks = [
  {
    step: "01",
    stepColor: "text-cyan-300 border-cyan-400/25 bg-cyan-400/10",
    title: "Enter your profile",
    description:
      "Start from your real position so every recommendation reflects your actual CRS context.",
  },
  {
    step: "02",
    stepColor: "text-blue-300 border-blue-400/25 bg-blue-400/10",
    title: "See your strongest next move",
    description:
      "Compare realistic improvement paths and understand which move deserves your attention first.",
  },
  {
    step: "03",
    stepColor: "text-violet-300 border-violet-400/25 bg-violet-400/10",
    title: "Unlock your full roadmap",
    description:
      "Go from preview to execution with a deeper AI strategy, sequencing, and saved continuity.",
  },
];

const pricingPlans = [
  {
    name: "FREE",
    price: "$0",
    description: "Preview your strongest next move",
    features: [
      "Preview your strongest next move",
      "Explore score-improvement paths",
      "Use the simulator in preview mode",
      "See high-level roadmap direction",
    ],
    ctaHref: "/simulator",
    ctaLabel: "Try the simulator",
    isPro: false,
  },
  {
    name: "PRO",
    badge: "BEST VALUE",
    price: "$9.99 CAD",
    priceSub: "/ month",
    description: "Unlock your full PR roadmap",
    subtext: "Early access pricing — future $19/mo",
    features: [
      "Full AI-generated strategy",
      "Step-by-step execution plan",
      "Strategy sequencing and trade-offs",
      "Save and restore your roadmap",
      "Premium strategy pages",
      "Monthly AI strategy generations",
    ],
    ctaHref: buildUpgradeEntryHref({ returnTo: "/billing", unlock: "pro" }),
    ctaLabel: "Get my roadmap",
    isPro: true,
  },
];

const problemStats = [
  { raw: "78%",    prefix: "",  end: 78, suffix: "%",      label: "pick the wrong move first" },
  { raw: "3–6 mo", prefix: "",  end: 3,  suffix: "–6 mo",  label: "lost optimizing the wrong thing" },
  { raw: "40+",    prefix: "",  end: 40, suffix: "+ pts",   label: "left on the table from bad sequencing" },
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
              Premium PR strategy advisor
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Stop guessing your CRS path.
              <span className="mt-2 block bg-linear-to-r from-cyan-200 via-blue-200 to-violet-200 bg-clip-text text-transparent">
                Get a clear roadmap to PR.
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 text-lg leading-8 text-white/64"
            >
              See your strongest next move, understand why it matters, and unlock
              a strategy built around your real profile.
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
                Get my roadmap
              </Link>
              <Link
                href="#demo"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                See how it works
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-6 text-sm text-white/50"
            >
              No signup required to try the simulator
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
                      Simulator preview
                    </div>
                    <div className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                      Your strongest next move
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
                    Live strategy layer
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      CRS score
                    </div>
                    <div className="mt-3 text-5xl font-bold tracking-tight text-white">
                      407
                    </div>
                    <div className="mt-2 text-sm text-white/55">
                      Current baseline
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-cyan-400/20 bg-cyan-400/10 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">
                      Best move
                    </div>
                    <div className="mt-3 text-xl font-semibold text-white">
                      IELTS to CLB 9
                    </div>
                    <div className="mt-4 flex flex-wrap items-end gap-3">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                          Projected score
                        </div>
                        <div className="mt-2 text-4xl font-bold tracking-tight text-cyan-100">
                          435
                        </div>
                      </div>
                      <div className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-1 text-xs font-semibold text-cyan-100">
                        Fastest realistic path
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    <span>Current position</span>
                    <span>Improved path</span>
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
      <Section
        eyebrow="The real problem"
        title="Most people don't fail because of their CRS score."
      >
        <motion.div variants={containerVariants} className="space-y-6">
          <motion.div
            variants={itemVariants}
            className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-7 backdrop-blur-xl"
          >
            <div className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              They fail because they don&apos;t know what to do next.
            </div>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/60">
              Most Express Entry applicants try random improvements without
              a strategy — wasting months, money, and invite cycles on moves
              that barely shift their score.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {problemStats.map((stat) => (
                <CounterStat
                  key={stat.raw}
                  end={stat.end}
                  suffix={stat.suffix}
                  label={stat.label}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </Section>

      {/* ── THE SOLUTION ── */}
      <Section
        eyebrow="The solution"
        title="This is not a calculator."
      >
        <motion.div variants={itemVariants} className="mb-8">
          <div className="bg-linear-to-r from-cyan-200 via-blue-200 to-violet-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            This is a decision system.
          </div>
        </motion.div>
        <motion.div
          variants={containerVariants}
          className="grid gap-4 lg:grid-cols-3"
        >
          {solutionCards.map((card) => (
            <motion.div
              key={card.title}
              variants={itemVariants}
              className={`rounded-[28px] border bg-gradient-to-b p-6 backdrop-blur-xl ${card.accent}`}
            >
              <div
                className={`text-2xl font-bold leading-none ${card.iconColor}`}
              >
                {card.icon}
              </div>
              <div className="mt-4 text-lg font-semibold text-white">
                {card.title}
              </div>
              <div className="mt-3 text-sm leading-7 text-white/60">
                {card.description}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ── PRODUCT PREVIEW ── */}
      <Section
        id="demo"
        eyebrow="Product preview"
        title="Built to guide decisions — not just calculate points."
        tight
      >
        <motion.div
          variants={containerVariants}
          className="grid gap-4 lg:grid-cols-3"
        >
          <ScreenshotCard
            title="Simulator"
            caption="Compare realistic score-improvement paths"
          >
            <div className="space-y-3">
              {[
                ["Current CRS", "407", "text-white"],
                ["English to CLB 9", "+28", "text-cyan-200"],
                ["French to B2", "+50", "text-violet-200"],
              ].map(([label, value, tone]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3"
                >
                  <div className="text-sm text-white/70">{label}</div>
                  <div className={`text-lg font-semibold ${tone}`}>{value}</div>
                </div>
              ))}
            </div>
          </ScreenshotCard>

          <ScreenshotCard
            title="AI strategy panel"
            caption="Deeper reasoning, sequencing, and next steps"
          >
            <div className="rounded-[20px] border border-cyan-400/20 bg-cyan-400/10 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
                Best realistic path
              </div>
              <div className="mt-3 text-lg font-semibold text-white">
                French to B2
              </div>
              <div className="mt-3 text-sm leading-6 text-white/72">
                Your roadmap explains why this move is more controllable than
                waiting on a conditional pathway first.
              </div>
              <div className="mt-4 space-y-2">
                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
                  Step-by-step action flow
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
                  Timeline and sequencing
                </div>
              </div>
            </div>
          </ScreenshotCard>

          <ScreenshotCard
            title="Strategy paths"
            caption="French, IELTS, and pathway-specific planning"
          >
            <div className="space-y-3">
              {[
                {
                  label: "French strategy",
                  note: "High-upside, user-controlled move",
                  tone: "border-fuchsia-400/25 bg-fuchsia-400/10",
                },
                {
                  label: "IELTS optimization",
                  note: "Fast threshold-based score gain",
                  tone: "border-cyan-400/25 bg-cyan-400/10",
                },
                {
                  label: "PNP evaluation",
                  note: "Highest upside, more conditional",
                  tone: "border-violet-400/25 bg-violet-400/10",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-[18px] border px-4 py-3 ${item.tone}`}
                >
                  <div className="text-sm font-semibold text-white">
                    {item.label}
                  </div>
                  <div className="mt-1 text-xs text-white/62">{item.note}</div>
                </div>
              ))}
            </div>
          </ScreenshotCard>
        </motion.div>
      </Section>

      {/* ── VALUE STACK ── */}
      <Section eyebrow="Value stack" title="What you get" tight>
        <motion.div
          variants={containerVariants}
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        >
          {valueStack.map((item) => (
            <motion.div
              key={item.label}
              variants={itemVariants}
              className={`flex items-center gap-3 rounded-[20px] border px-5 py-4 text-sm font-medium backdrop-blur-xl ${item.color}`}
            >
              <span className="text-base leading-none">✦</span>
              <span className="text-white/85">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section eyebrow="Simple workflow" title="How it works" tight>
        <motion.div
          variants={containerVariants}
          className="grid gap-4 lg:grid-cols-3"
        >
          {howItWorks.map((item) => (
            <motion.div
              key={item.step}
              variants={itemVariants}
              className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl"
            >
              <div
                className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.18em] ${item.stepColor}`}
              >
                {item.step}
              </div>
              <div className="mt-4 text-xl font-semibold text-white">
                {item.title}
              </div>
              <div className="mt-3 text-sm leading-7 text-white/60">
                {item.description}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ── PRICING ── */}
      <Section
        eyebrow="Pricing"
        title="Start free. Unlock depth when you need the full roadmap."
      >
        <motion.p
          variants={itemVariants}
          className="mb-6 text-sm text-white/50"
        >
          Most users unlock Pro after seeing their first roadmap preview.
        </motion.p>
        <motion.div
          variants={containerVariants}
          className="grid gap-5 lg:grid-cols-2"
        >
          {pricingPlans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={itemVariants}
              className={[
                "relative overflow-hidden rounded-[30px] p-5 backdrop-blur-xl sm:p-7",
                plan.isPro
                  ? "border border-blue-400/35 bg-[linear-gradient(135deg,rgba(59,130,246,0.14),rgba(139,92,246,0.08),rgba(255,255,255,0.04))] shadow-[0_0_60px_rgba(59,130,246,0.22),0_0_0_1px_rgba(59,130,246,0.15)]"
                  : "border border-white/10 bg-white/[0.04]",
              ].join(" ")}
            >
              {plan.isPro ? (
                <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-400/12 blur-3xl" />
              ) : null}

              <div className="relative">
                {plan.badge ? (
                  <div className="mb-4 inline-flex rounded-full border border-blue-300/30 bg-blue-400/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100">
                    {plan.badge}
                  </div>
                ) : null}

                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
                  {plan.name}
                </div>

                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-bold tracking-tight text-white">
                    {plan.price}
                  </span>
                  {"priceSub" in plan && plan.priceSub ? (
                    <span className="mb-1 text-sm text-white/50">
                      {plan.priceSub}
                    </span>
                  ) : null}
                </div>

                {plan.subtext ? (
                  <div className="mt-1 text-xs font-medium text-white/45">
                    {plan.subtext}
                  </div>
                ) : null}

                <div className="mt-4 text-base font-semibold text-white">
                  {plan.description}
                </div>

                <div className="mt-5 space-y-2.5">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          plan.isPro
                            ? "bg-blue-400/20 text-blue-200"
                            : "bg-white/8 text-white/50"
                        }`}
                      >
                        ✓
                      </span>
                      <span
                        className={`text-sm ${plan.isPro ? "text-white/82" : "text-white/60"}`}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {plan.isPro ? (
                  <div className="mt-5 rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-xs text-white/55">
                    Less than a single immigration consultation — available
                    whenever you need it.
                  </div>
                ) : null}

                <div className="mt-6">
                  <Link
                    href={plan.ctaHref}
                    onClick={() =>
                      plan.isPro
                        ? trackFunnelEvent("landing_cta_clicked", {
                            location: "pricing-pro",
                          })
                        : trackFunnelEvent("landing_cta_clicked", {
                            location: "pricing-free",
                          })
                    }
                    className={[
                      "inline-flex rounded-full px-6 py-3 text-sm font-semibold transition",
                      plan.isPro
                        ? "bg-white text-black shadow-[0_18px_44px_-18px_rgba(255,255,255,0.55)] hover:bg-gray-100"
                        : "border border-white/15 bg-white/5 text-white hover:bg-white/10",
                    ].join(" ")}
                  >
                    {plan.ctaLabel}
                  </Link>
                </div>

                {plan.isPro ? (
                  <div className="mt-3 text-xs text-white/38">
                    Cancel anytime. Early access pricing while the full advisor
                    layer is being expanded.
                  </div>
                ) : null}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ── FINAL CTA ── */}
      <Section eyebrow="Get started" title="Start your roadmap today" tight>
        <motion.div
          variants={itemVariants}
          className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(59,130,246,0.12),rgba(255,255,255,0.03),rgba(99,102,241,0.08))] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_90px_-58px_rgba(59,130,246,0.35)] backdrop-blur-xl"
        >
          <div className="max-w-2xl">
            <p className="text-base leading-7 text-white/65">
              Stop calculating in circles. Use your profile, see your strongest
              path, and turn your next move into a roadmap.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/start"
                onClick={() =>
                  trackFunnelEvent("landing_cta_clicked", {
                    location: "final-cta",
                  })
                }
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-gray-200"
              >
                Get my roadmap
              </Link>
              <Link
                href="/simulator"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Try the simulator
              </Link>
            </div>
          </div>
        </motion.div>
      </Section>
    </main>
  );
}
