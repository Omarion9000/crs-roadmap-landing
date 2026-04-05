"use client";

import Link from "next/link";

type InsightRouteFallbackProps = {
  route: "english" | "pnp";
};

export default function InsightRouteFallback({
  route,
}: InsightRouteFallbackProps) {
  const title =
    route === "english"
      ? "English strategy workspace"
      : "Provincial nomination strategy";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070A12] px-6 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_38%),linear-gradient(to_bottom,#08101F,#070A12,#000000)]" />
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[36px] border border-white/10 bg-[#0c1120]/94 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_36px_120px_-72px_rgba(59,130,246,0.2)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            Premium strategy workspace
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">
            We hit a temporary issue while loading this personalized insight. Your
            roadmap and account remain intact, and you can continue from the simulator
            or dashboard while we safely fall back.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/simulator"
              className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Back to simulator
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Open dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
