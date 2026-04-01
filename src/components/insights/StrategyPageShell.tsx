import PremiumLockedPanel from "@/components/premium/PremiumLockedPanel";
import InsightCTAFooter from "@/components/insights/InsightCTAFooter";
import InsightHero from "@/components/insights/InsightHero";
import InsightSection from "@/components/insights/InsightSection";
import InsightSnapshotGrid from "@/components/insights/InsightSnapshotGrid";
import type { StrategyPageContent } from "@/lib/insights/strategyPages";
import { buildBillingHref, buildLoginHref } from "@/lib/upgrade";

type StrategyPageShellProps = {
  page: StrategyPageContent;
  userPlan: "free" | "pro";
  isAuthenticated: boolean;
};

export default function StrategyPageShell({
  page,
  userPlan,
  isAuthenticated,
}: StrategyPageShellProps) {
  const isPro = userPlan === "pro";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070A12] px-6 py-12 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#08101F] via-[#070A12] to-black" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:88px_88px] opacity-[0.04]" />
        <div className="absolute left-1/2 top-[-10rem] h-[24rem] w-[56rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-8rem] top-24 h-[22rem] w-[22rem] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-[-4rem] h-[18rem] w-[18rem] rounded-full bg-fuchsia-500/8 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        <InsightHero
          eyebrow={page.eyebrow}
          title={page.title}
          description={page.description}
          whyThisPathMatters={page.whyThisPathMatters}
          statusLabel={isPro ? "Pro unlocked" : "Free preview"}
          previewBullets={page.previewBullets}
        />

        <div className="mt-8 space-y-8">
          <InsightSection
            eyebrow="Strategy snapshot"
            title="A clear view of how this path fits into the roadmap"
            description="This snapshot frames the strategy at a high level before the full workflow expands with deeper premium guidance."
          >
            <InsightSnapshotGrid cards={page.snapshotCards} />
          </InsightSection>

          <InsightSection
            eyebrow="What this strategy helps with"
            title="Where this path can create meaningful value"
            description="These are the high-level outcomes this strategy workspace is designed to clarify without overstating what any one path guarantees."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {page.helpsWith.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[26px] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="text-lg font-semibold text-white">{item.title}</div>
                  <div className="mt-3 text-sm leading-6 text-white/66">{item.description}</div>
                </div>
              ))}
            </div>
          </InsightSection>

          <InsightSection
            eyebrow="How this page will be used"
            title="This premium strategy workspace is being built to include"
            description="The final version is designed to turn simulator insight into clearer roadmap execution while staying aligned with official criteria and pathway rules."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {page.workspaceIncludes.map((item) => (
                <div
                  key={item}
                  className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-white/68"
                >
                  {item}
                </div>
              ))}
            </div>
          </InsightSection>

          <InsightSection
            eyebrow="Official-source foundation"
            title="Grounded in official Express Entry information"
            description="This strategy workspace is being built around official Express Entry rules, current program requirements, and authoritative Canada.ca / IRCC references."
          >
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                <div className="text-sm leading-7 text-white/68">
                  Final guidance will reflect official criteria and current pathway rules before publication. This page is designed to support strategic thinking and product planning, not to replace official requirements or provide individualized legal advice.
                </div>
              </div>
              <div className="rounded-[26px] border border-cyan-400/20 bg-cyan-400/10 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                  Publication standard
                </div>
                <div className="mt-3 text-sm leading-7 text-white/82">
                  Final guidance will reflect official criteria and current pathway rules before publication.
                </div>
              </div>
            </div>
          </InsightSection>

          {isPro ? (
            <InsightSection
              eyebrow="Premium workflow"
              title="The full strategy template lives here"
              description="Pro users can use this page as part of the roadmap workflow, with richer structure already in place for future guidance expansion."
            >
              <div className="grid gap-4 md:grid-cols-3">
                {page.premiumSections.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[26px] border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-[0_24px_80px_-56px_rgba(16,185,129,0.45)]"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/75">
                      {item.label}
                    </div>
                    <div className="mt-3 text-lg font-semibold text-white">{item.title}</div>
                    <div className="mt-3 text-sm leading-6 text-white/82">{item.description}</div>
                  </div>
                ))}
              </div>
            </InsightSection>
          ) : (
            <PremiumLockedPanel
              title="Premium workflow locked"
              description="Free users can preview the strategy summary, why it matters, and the high-level fit. Pro unlocks the complete workflow, deeper planning, sequencing, and full roadmap integration."
              primaryHref={isAuthenticated ? buildBillingHref({ returnTo: `/insights/${page.slug}`, unlock: "strategy" }) : buildLoginHref({ returnTo: `/insights/${page.slug}` })}
              primaryLabel={isAuthenticated ? "Unlock full strategy" : "Continue to unlock"}
              secondaryHref="/simulator"
              secondaryLabel="Back to simulator"
              bullets={[
                "Full tactical workflow",
                "Timeline and sequencing",
                "Roadmap integration layers",
              ]}
              note="Start free. Upgrade later for full roadmap, premium strategies, and saved progress."
              analyticsEvent="locked_strategy_clicked"
            />
          )}

          <InsightCTAFooter
            isPro={isPro}
            isAuthenticated={isAuthenticated}
            upgradeHref={buildBillingHref({ returnTo: `/insights/${page.slug}`, unlock: "strategy" })}
          />
        </div>
      </div>
    </main>
  );
}
