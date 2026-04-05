import Link from "next/link";
import InsightNavCard from "@/components/insights/InsightNavCard";
import PremiumLockedPanel from "@/components/premium/PremiumLockedPanel";
import { strategyPageList } from "@/lib/insights/strategyPages";
import { resolveInsightViewer } from "@/lib/insights/viewer";
import { buildUpgradeEntryHref } from "@/lib/upgrade";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const viewer = await resolveInsightViewer("library");
  const isPro = viewer.isPro;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070A12] px-6 py-12 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#08101F] via-[#070A12] to-black" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:88px_88px] opacity-[0.04]" />
        <div className="absolute left-1/2 top-[-10rem] h-[24rem] w-[56rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-8rem] top-24 h-[22rem] w-[22rem] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/simulator"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Back to simulator
          </Link>
          <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/65">
            {isPro ? "Premium strategy access" : "Strategy preview hub"}
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.045] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_36px_120px_-72px_rgba(34,211,238,0.35)] backdrop-blur-xl sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-cyan-500/10 via-transparent to-indigo-500/10" />
          <div className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
              Premium strategy library
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Strategy paths built on top of your simulator.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-white/66">
              Explore the strategy library that turns score projections into a clearer product workflow. Each page is structured to support future guidance grounded in official Express Entry rules, current program requirements, and authoritative Canada.ca / IRCC references.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Free access
                </div>
                <div className="mt-2 text-sm font-semibold text-white">
                  Preview the structure and why each path matters
                </div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Pro access
                </div>
                <div className="mt-2 text-sm font-semibold text-white">
                  Unlock the full premium strategy workflow
                </div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Product role
                </div>
                <div className="mt-2 text-sm font-semibold text-white">
                  Connect simulator insight to roadmap execution
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {strategyPageList.map((page) => (
            <InsightNavCard key={page.slug} page={page} isPro={isPro} />
          ))}
        </section>

        {!isPro ? (
          <section className="mt-8">
            <PremiumLockedPanel
              title="Unlock premium strategy paths"
              description="Free users can preview the simulator and understand the value of each path. Pro unlocks the strategy library, roadmap saving, roadmap history, and the full premium workflow."
              primaryHref={buildUpgradeEntryHref({ isAuthenticated: viewer.isAuthenticated, returnTo: "/insights", unlock: "strategy" })}
              primaryLabel="Unlock full strategy"
              secondaryHref="/simulator"
              secondaryLabel="Return to simulator"
              bullets={[
                "Strategy library access",
                "Save and load roadmaps",
                "Track personalized progress",
              ]}
              note="Final guidance will reflect current IRCC criteria and official Canada.ca sources."
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}
