import Link from "next/link";
import FunnelEventTracker from "@/components/funnel/FunnelEventTracker";
import InsightCTAFooter from "@/components/insights/InsightCTAFooter";
import PnpPlanGenerator from "@/components/insights/PnpPlanGenerator";
import PremiumLockedPanel from "@/components/premium/PremiumLockedPanel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscriptions";
import { buildBillingHref, buildUpgradeEntryHref, upgradeSuccessMessage } from "@/lib/upgrade";

const pnpPaths = [
  {
    title: "Direct application to a provincial stream",
    description: "Some candidates apply directly when a province opens a stream that fits their background.",
    relevance: "Often matters when you already see a strong province-profile match.",
  },
  {
    title: "Selection from the Express Entry pool",
    description: "A province can search the pool and issue interest to candidates who fit current priorities.",
    relevance: "Most relevant when your profile overlaps with active provincial demand.",
  },
  {
    title: "Occupation or sector-targeted pathway",
    description: "Some streams focus more on labor-market fit than on raw CRS alone.",
    relevance: "Often matters when your work history matches province-specific demand.",
  },
  {
    title: "Employer-supported or regional routes",
    description: "In some cases, local ties, employer support, or regional pathways shape nomination options.",
    relevance: "More realistic when your roadmap includes local connection or employer alignment.",
  },
];

const pnpOpportunityCards = [
  {
    title: "Ontario (OINP)",
    description: "Large Express Entry-linked system with general and targeted pathways.",
    detail: "Useful when broader Express Entry-linked selection matters more than one narrow stream.",
    tag: "General stream",
    tone: "from-fuchsia-500/22 via-violet-500/12 to-indigo-500/12",
  },
  {
    title: "British Columbia (BC PNP)",
    description: "Often relevant for skilled worker and tech-adjacent profiles.",
    detail: "Can matter when your profile aligns more with sector demand than with raw score alone.",
    tag: "Tech-focused",
    tone: "from-cyan-500/20 via-blue-500/12 to-indigo-500/14",
  },
  {
    title: "Alberta Advantage",
    description: "Can become interesting when broader provincial fit matters more than one narrow stream.",
    detail: "Worth watching when your roadmap suggests broader profile fit may beat narrow targeting.",
    tag: "Demand-driven",
    tone: "from-amber-500/16 via-fuchsia-500/10 to-violet-500/12",
  },
  {
    title: "Express Entry-aligned streams",
    description: "Useful when you want to compare nomination as part of a broader strategy stack.",
    detail: "Best framed as a way to stack provincial selection with federal competitiveness, not a guaranteed shortcut.",
    tag: "Express Entry",
    tone: "from-indigo-500/20 via-cyan-500/10 to-fuchsia-500/12",
  },
];

export default async function PnpStrategyPage({
  searchParams,
}: {
  searchParams?: Promise<{ pro?: string; unlock?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userPlan = user ? await getUserPlan(user.id) : "free";
  const normalizedPlan = userPlan.trim().toLowerCase() === "pro" ? "pro" : "free";
  const isPro = normalizedPlan === "pro";
  const profileOwnerKey = user?.id ?? null;
  const resolvedSearchParams = await searchParams;
  const showUpgradeSuccess = resolvedSearchParams?.pro === "unlocked";
  const unlock = resolvedSearchParams?.unlock ?? "strategy";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070A12] px-6 py-12 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#08101F] via-[#070A12] to-black" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:88px_88px] opacity-[0.04]" />
        <div className="absolute left-1/2 top-[-10rem] h-[24rem] w-[56rem] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute right-[-8rem] top-24 h-[22rem] w-[22rem] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-[-4rem] h-[18rem] w-[18rem] rounded-full bg-cyan-500/8 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        {showUpgradeSuccess ? (
          <>
            <FunnelEventTracker
              event="checkout_completed"
              onceKey={`checkout-completed-pnp-${unlock}`}
              payload={{ unlock, location: "insights-pnp" }}
            />
            <FunnelEventTracker
              event="pro_unlocked"
              onceKey={`pro-unlocked-pnp-${unlock}`}
              payload={{ unlock, location: "insights-pnp" }}
            />
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {upgradeSuccessMessage(unlock)}
            </div>
          </>
        ) : null}

        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.045] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_36px_120px_-72px_rgba(217,70,239,0.35)] backdrop-blur-xl sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-fuchsia-500/10 via-transparent to-indigo-500/10" />
          <div className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-fuchsia-400/10 blur-3xl" />

          <div className="relative z-10 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-100/80">
                Premium strategy workspace
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/68">
                {isPro ? "Pro unlocked" : "Free preview"}
              </div>
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Provincial nomination strategy
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/66">
              Unlock the highest-impact CRS boost and understand how nomination pathways can transform your roadmap.
            </p>
            <div className="mt-6 max-w-3xl text-sm leading-7 text-white/78">
              A provincial nomination can add a significant boost to your CRS and change your position in Express Entry draws.
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[32px] border border-fuchsia-400/20 bg-fuchsia-400/10 p-6 shadow-[0_24px_80px_-56px_rgba(217,70,239,0.35)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-200/75">
              AI decision
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              Should you focus on PNP right now?
            </h2>
            <div className="mt-4 inline-flex items-center rounded-full border border-fuchsia-400/20 bg-black/20 px-3 py-1 text-sm font-semibold text-fuchsia-100">
              High impact opportunity
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82">
              Based on your current profile, PNP can be one of the strongest possible moves when your score needs a bigger strategic shift than incremental gains alone, but only if stream fit is actually actionable.
            </p>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Potential impact
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">Potential impact</h2>
            <div className="mt-4 text-4xl font-semibold tracking-tight text-white">+600 CRS points</div>
            <p className="mt-4 text-sm leading-7 text-white/72">
              A provincial nomination can significantly increase your CRS and change your draw competitiveness.
            </p>
          </section>
        </div>

        <PnpPlanGenerator
          userPlan={normalizedPlan}
          profileOwnerKey={profileOwnerKey}
          upgradeHref={buildBillingHref({ returnTo: "/insights/pnp", unlock: "strategy" })}
        />

        {isPro ? (
        <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            How people actually get nominated
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-white">How people actually get nominated</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {pnpPaths.map((path) => (
              <div
                key={path.title}
                className="rounded-[24px] border border-white/10 bg-black/20 px-5 py-5"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200/75">
                  Common pattern
                </div>
                <div className="mt-3 text-lg font-semibold text-white">{path.title}</div>
                <div className="mt-3 text-sm leading-6 text-white/68">{path.description}</div>
                <div className="mt-4 text-xs text-white/52">{path.relevance}</div>
              </div>
            ))}
          </div>
        </section>
        ) : (
          <section className="mt-8">
            <PremiumLockedPanel
              compact
              title="Unlock full PNP pathway analysis"
              description="Free preview keeps the feasibility framing visible. Pro unlocks the deeper nomination patterns, province-fit comparison, and practical pathway guidance."
              primaryHref={buildUpgradeEntryHref({ isAuthenticated: !!user, returnTo: "/insights/pnp", unlock: "strategy" })}
              primaryLabel="Unlock full strategy"
              bullets={["Real-world nomination patterns", "Province-fit guidance", "Deeper path analysis"]}
            />
          </section>
        )}

        <section className="mt-8 rounded-[32px] border border-amber-400/20 bg-amber-400/10 p-6 shadow-[0_24px_80px_-56px_rgba(251,191,36,0.28)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100/80">
            Reality check before relying on PNP
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-white">
            Reality check before relying on PNP
          </h2>
          <div className="mt-4 max-w-4xl text-sm leading-7 text-white/82">
            PNP can be the highest-upside strategy in the roadmap, but it is not automatically available. Selection still depends on provincial criteria, stream timing, and real profile fit. For some users, nomination should lead the roadmap now. For others, it is smarter as a parallel or fallback strategy while language, experience, or targeting improve first.
          </div>
        </section>

        {isPro ? (
        <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            Where PNP can work for you
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-white">Where PNP can work for you</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {pnpOpportunityCards.map((card) => (
              <div
                key={card.title}
                className="group rounded-[28px] border border-white/10 bg-black/20 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-[22px]">
                    <div
                      className={["absolute inset-0 bg-linear-to-br", card.tone].join(" ")}
                    />
                    <div className="absolute inset-0 border border-white/10 bg-white/[0.04] backdrop-blur-sm" />
                    <div className="relative z-10 text-center text-xs font-semibold uppercase tracking-[0.22em] text-white/78">
                      PNP
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-semibold text-white transition group-hover:text-fuchsia-100">
                      {card.title}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-white/66">{card.description}</div>
                    <div className="mt-2 text-sm leading-6 text-white/54">{card.detail}</div>
                    <div className="mt-4">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-white/72">
                        {card.tag}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        ) : null}

        <section className="mt-8 grid gap-4 xl:grid-cols-[1fr_0.92fr]">
          <div className="rounded-[32px] border border-fuchsia-500/20 bg-fuchsia-500/10 p-6 shadow-[0_24px_80px_-56px_rgba(217,70,239,0.4)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-200/75">
              AI CTA
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              Get a realistic PNP action plan
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/82">
              Generate a plan that tells you whether PNP should lead your roadmap now, what to do first, and what fallback path deserves attention if nomination is not immediately viable.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="#pnp-plan"
                className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Generate my PNP plan
              </Link>
              <Link
                href="/simulator"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Back to simulator
              </Link>
            </div>
          </div>

          {isPro ? (
            <div className="rounded-[32px] border border-emerald-500/20 bg-emerald-500/10 p-6 shadow-[0_24px_80px_-56px_rgba(16,185,129,0.45)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/75">
                Pro access
              </div>
              <div className="mt-4 text-2xl font-semibold text-white">
                Full roadmap logic unlocked
              </div>
              <div className="mt-3 text-sm leading-7 text-white/82">
                Use the full AI-generated plan, deeper sequencing guidance, and premium workflow blocks as part of your broader CRS roadmap.
              </div>
            </div>
          ) : (
            <PremiumLockedPanel
              compact
              title="Unlock full PNP strategy"
              description="Free preview shows the decision logic, impact framing, and PNP overview. Pro unlocks deeper planning, better sequencing, and the full AI-generated strategy workflow."
              primaryHref={buildUpgradeEntryHref({ isAuthenticated: !!user, returnTo: "/insights/pnp", unlock: "strategy" })}
              primaryLabel="Unlock full strategy"
              bullets={[
                "Full roadmap planning",
                "Deeper PNP guidance",
                "Better sequencing logic",
              ]}
            />
          )}
        </section>

        {isPro ? (
        <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Official-source foundation
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">
                Keep PNP planning grounded in official provincial rules
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/68">
                Provincial nominee programs are governed by provinces, Express Entry rules still apply, and criteria vary by stream. Any nomination path must match official provincial and federal requirements.
              </p>
            </div>

            <a
              href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees/works.html"
              target="_blank"
              rel="noreferrer"
              className="rounded-[26px] border border-fuchsia-400/20 bg-fuchsia-400/10 p-5 transition duration-300 hover:border-fuchsia-400/30 hover:bg-fuchsia-400/15"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-200/75">
                Official reference
              </div>
              <div className="mt-3 text-lg font-semibold text-white">
                Canada.ca provincial nominee overview
              </div>
              <div className="mt-3 text-sm leading-7 text-white/82">
                Review the official PNP overview and follow provincial criteria before acting on any pathway.
              </div>
            </a>
          </div>
        </section>
        ) : null}

        <InsightCTAFooter
          isPro={isPro}
          isAuthenticated={!!user}
          upgradeHref={buildBillingHref({ returnTo: "/insights/pnp", unlock: "strategy" })}
        />
      </div>
    </main>
  );
}
