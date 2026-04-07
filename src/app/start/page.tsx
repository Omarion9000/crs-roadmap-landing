"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";

const STEP_STYLES = [
  { number: "1", color: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300", bar: "bg-cyan-400" },
  { number: "2", color: "border-blue-400/30 bg-blue-400/10 text-blue-300", bar: "bg-blue-400" },
  { number: "3", color: "border-violet-400/30 bg-violet-400/10 text-violet-300", bar: "bg-violet-400" },
] as const;

export default function StartPage() {
  const { t } = useLanguage();

  const steps = [
    { ...STEP_STYLES[0], title: t("start_step_1_title"), description: t("start_step_1_desc") },
    { ...STEP_STYLES[1], title: t("start_step_2_title"), description: t("start_step_2_desc") },
    { ...STEP_STYLES[2], title: t("start_step_3_title"), description: t("start_step_3_desc") },
  ];

  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#0B1020] via-[#070A12] to-black" />
        <div className="absolute -top-40 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-40 -right-32 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <section className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
            {t("start_eyebrow")}
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            {t("start_title")}
          </h1>
          <p className="mt-4 text-base leading-7 text-white/58">
            {t("start_subtitle")}
          </p>
        </div>

        {/* Steps */}
        <div className="relative mt-12 space-y-4">
          {/* Connecting line */}
          <div className="absolute left-[27px] top-10 hidden h-[calc(100%-80px)] w-px bg-gradient-to-b from-cyan-400/30 via-blue-400/20 to-violet-400/10 sm:block" />

          {steps.map((step) => (
            <div
              key={step.number}
              className="relative flex gap-5 rounded-[24px] border border-white/8 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-6"
            >
              <div
                className={`flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold ${step.color}`}
              >
                {step.number}
              </div>
              <div className="pt-1">
                <div className="text-base font-semibold text-white">
                  {step.title}
                </div>
                <p className="mt-1.5 text-sm leading-6 text-white/58">
                  {step.description}
                </p>
                <div className={`mt-3 h-0.5 w-12 rounded-full ${step.bar} opacity-40`} />
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <Link
            href="/crs-calculator"
            className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black shadow-[0_18px_44px_-18px_rgba(255,255,255,0.5)] transition hover:bg-gray-100"
          >
            {t("start_cta")}
          </Link>
          <span className="text-sm text-white/40">
            {t("start_already_know")}{" "}
            <Link href="/simulator" className="text-white/70 underline-offset-2 hover:text-white hover:underline">
              {t("start_go_simulator")}
            </Link>
          </span>
        </div>
      </section>
    </main>
  );
}
