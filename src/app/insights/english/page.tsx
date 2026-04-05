import Image from "next/image";
import FunnelEventTracker from "@/components/funnel/FunnelEventTracker";
import EnglishPlanGenerator from "@/components/insights/EnglishPlanGenerator";
import InsightCTAFooter from "@/components/insights/InsightCTAFooter";
import PremiumLockedPanel from "@/components/premium/PremiumLockedPanel";
import { resolveInsightViewer } from "@/lib/insights/viewer";
import { withName } from "@/lib/personalization";
import { buildBillingHref, buildUpgradeEntryHref, upgradeSuccessMessage } from "@/lib/upgrade";

type ResourceCardProps = {
  title: string;
  description: string;
  href: string;
  logoSrc: string;
  logoAlt: string;
  logoTone: "cyan" | "indigo" | "fuchsia";
  tags: string[];
};

function ResourceCard({
  title,
  description,
  href,
  logoSrc,
  logoAlt,
  logoTone,
  tags,
}: ResourceCardProps) {
  const toneClass =
    logoTone === "cyan"
      ? "from-cyan-500/20 via-sky-500/12 to-indigo-500/12"
      : logoTone === "indigo"
      ? "from-indigo-500/20 via-blue-500/12 to-cyan-500/10"
      : "from-fuchsia-500/18 via-violet-500/12 to-indigo-500/10";

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group rounded-[28px] border border-white/10 bg-black/20 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex items-center gap-4">
        <div className="relative flex h-[92px] w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-[26px]">
          <div className={["absolute inset-0 bg-linear-to-br", toneClass].join(" ")} />
          <div className="absolute inset-0 border border-white/10 bg-white/[0.04] backdrop-blur-sm" />
          <div className="absolute h-12 w-12 rounded-full bg-white/10 blur-2xl" />
          <div className="relative z-10 flex h-[70px] w-[70px] items-center justify-center rounded-[22px] bg-black/15">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={56}
              height={56}
              className="h-[56px] w-[56px] object-contain drop-shadow-[0_0_18px_rgba(255,255,255,0.18)]"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold text-white transition group-hover:text-cyan-100">
            {title}
          </div>
          <div className="mt-2 text-sm leading-6 text-white/66">{description}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-white/72"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 text-sm font-semibold text-white/82">Open resource</div>
        </div>
      </div>
    </a>
  );
}

const assessResources = [
  {
    title: "Cambridge English test",
    description: "Quick estimate of your current English level.",
    href: "https://www.cambridgeenglish.org/test-your-english/",
    logoSrc: "/assets/cambridge.png",
    logoAlt: "Cambridge English",
    logoTone: "cyan" as const,
    tags: ["Quick level estimate", "Diagnostic"],
  },
  {
    title: "British Council EnglishScore",
    description: "Fast level check to understand your starting point.",
    href: "https://www.britishcouncil.org/english/learn-online/englishscore",
    logoSrc: "/assets/britishcouncil.png",
    logoAlt: "British Council",
    logoTone: "indigo" as const,
    tags: ["Quick level estimate", "Diagnostic"],
  },
];

const practiceResources = [
  {
    title: "IELTS sample questions",
    description: "Understand real exam format and timing.",
    href: "https://ielts.org/take-a-test/preparation-resources/sample-test-questions/general-training-test",
    logoSrc: "/assets/ielts.png",
    logoAlt: "IELTS",
    logoTone: "indigo" as const,
    tags: ["Official-style"],
  },
  {
    title: "IELTS Ready",
    description: "Structured preparation with practice tools.",
    href: "https://takeielts.britishcouncil.org/take-ielts/prepare/ielts-ready-premium",
    logoSrc: "/assets/britishcouncil.png",
    logoAlt: "British Council IELTS Ready",
    logoTone: "fuchsia" as const,
    tags: ["Preparation"],
  },
];

const actionSteps = [
  "Identify weakest skill",
  "Practice targeted sections",
  "Take timed mock tests",
];

export const dynamic = "force-dynamic";

export default async function EnglishStrategyPage({
  searchParams,
}: {
  searchParams?: Promise<{ pro?: string; unlock?: string }>;
}) {
  try {
    const viewer = await resolveInsightViewer("english");
    const resolvedSearchParams = await searchParams;
    const showUpgradeSuccess = resolvedSearchParams?.pro === "unlocked";
    const unlock = resolvedSearchParams?.unlock ?? "strategy";

    console.log("[insights] route:", "english");
    console.log("[insights] using direct generator path:", "yes");
    console.log("[insights] profile available:", viewer.hasProfile ? "yes" : "no");
    console.log(
      "[insights] preferred name available:",
      viewer.preferredName ? "yes" : "no"
    );
    console.log(
      "[insights] strategy payload available:",
      viewer.hasStrategyPayload ? "yes" : "preview"
    );
    console.log("[insights] fallback used:", "no");
    console.log("[insights] server render reached:", "english");

    return (
    <main className="relative min-h-screen overflow-hidden bg-[#070A12] px-6 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#08101F] via-[#070A12] to-black" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:88px_88px] opacity-[0.04]" />
        <div className="absolute left-1/2 top-[-10rem] h-[24rem] w-[56rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-8rem] top-24 h-[22rem] w-[22rem] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-[-4rem] h-[18rem] w-[18rem] rounded-full bg-fuchsia-500/8 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        {showUpgradeSuccess ? (
          <>
            <FunnelEventTracker
              event="checkout_completed"
              onceKey={`checkout-completed-english-${unlock}`}
              payload={{ unlock, location: "insights-english" }}
            />
            <FunnelEventTracker
              event="pro_unlocked"
              onceKey={`pro-unlocked-english-${unlock}`}
              payload={{ unlock, location: "insights-english" }}
            />
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {upgradeSuccessMessage(unlock)}
            </div>
          </>
        ) : null}

        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#0c1120]/92 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_36px_120px_-72px_rgba(34,211,238,0.24)] supports-[backdrop-filter]:bg-white/[0.045] supports-[backdrop-filter]:backdrop-blur-md sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-cyan-500/10 via-transparent to-indigo-500/10" />
          <div className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
                Premium strategy workspace
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/68">
                {viewer.isPro ? "Pro unlocked" : "Free preview"}
              </div>
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              English score optimization
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/66">
              {withName(
                viewer.preferredName,
                "use English improvement strategically to unlock faster CRS gains, stronger competitiveness, and better roadmap sequencing."
              )}
            </p>
          </div>
        </section>

        <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[32px] border border-cyan-400/20 bg-cyan-400/10 p-6 shadow-[0_24px_80px_-56px_rgba(34,211,238,0.35)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
              AI decision
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              Should you focus on English right now?
            </h2>
            <div className="mt-4 inline-flex items-center rounded-full border border-cyan-400/20 bg-black/20 px-3 py-1 text-sm font-semibold text-cyan-100">
              High ROI move
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82">
              For many profiles, improving English is one of the fastest realistic ways to increase CRS without changing the rest of the profile.
            </p>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-[#0c1120]/90 p-6 supports-[backdrop-filter]:bg-white/[0.04] supports-[backdrop-filter]:backdrop-blur-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Potential impact
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">Potential impact</h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              Reaching CLB 9 can significantly improve your CRS depending on your current level.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/72">
                Fast-adjustment path
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/72">
                Strong roadmap lever
              </span>
            </div>
          </section>
        </div>

        {viewer.isPro ? (
        <section className="mt-8 rounded-[32px] border border-white/10 bg-[#0c1120]/90 p-6 supports-[backdrop-filter]:bg-white/[0.04] supports-[backdrop-filter]:backdrop-blur-md">
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Personalized action plan
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">Your fastest path</h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Focus</div>
                  <div className="mt-2 text-sm font-semibold text-white">Weakest 1-2 skills</div>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Target</div>
                  <div className="mt-2 text-sm font-semibold text-white">CLB 9</div>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Time</div>
                  <div className="mt-2 text-sm font-semibold text-white">6-8 focused weeks</div>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {actionSteps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-[24px] border border-white/10 bg-black/20 px-5 py-4"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/75">
                    Step {index + 1}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        ) : (
          <section className="mt-8">
            <PremiumLockedPanel
              compact
              title="Unlock full English execution plan"
              description="Free preview keeps the decision and impact visible. Pro unlocks the complete threshold strategy, sequencing, and study-to-score execution path."
              primaryHref={buildUpgradeEntryHref({ isAuthenticated: viewer.isAuthenticated, returnTo: "/insights/english", unlock: "strategy" })}
              primaryLabel="Unlock full strategy"
              bullets={["Execution plan", "Sequencing", "Threshold optimization"]}
            />
          </section>
        )}

        {viewer.isPro ? (
        <section className="mt-8 rounded-[32px] border border-white/10 bg-[#0c1120]/90 p-6 supports-[backdrop-filter]:bg-white/[0.04] supports-[backdrop-filter]:backdrop-blur-md">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            Start here
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-white">Start here</h2>
          <div className="mt-4 rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 px-4 py-4 text-sm leading-7 text-white/82">
            These tools help estimate your level and prepare. Official Express Entry requires accepted test results.
          </div>

          <div className="mt-6 grid gap-8">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                Check your level
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {assessResources.map((resource) => (
                  <ResourceCard key={resource.title} {...resource} />
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                Practice the real test
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {practiceResources.map((resource) => (
                  <ResourceCard key={resource.title} {...resource} />
                ))}
              </div>
            </div>
          </div>
        </section>
        ) : (
          <section className="mt-8">
            <PremiumLockedPanel
              compact
              eyebrow="Locked resources"
              title="Unlock the full English resource stack"
              description="Free preview shows the high-level opportunity. Pro unlocks the curated level-check, practice, and resource sequencing layer tied to your roadmap."
              primaryHref={buildUpgradeEntryHref({ isAuthenticated: viewer.isAuthenticated, returnTo: "/insights/english", unlock: "strategy" })}
              primaryLabel="Unlock full strategy"
              bullets={["Curated resources", "Roadmap-aware study flow", "Deeper planning context"]}
            />
          </section>
        )}

        <EnglishPlanGenerator
          userPlan={viewer.userPlan}
          profileOwnerKey={viewer.profileOwnerKey}
          upgradeHref={buildBillingHref({ returnTo: "/insights/english", unlock: "strategy" })}
        />

        <section className="mt-8 rounded-[32px] border border-white/10 bg-[#0c1120]/90 p-6 supports-[backdrop-filter]:bg-white/[0.04] supports-[backdrop-filter]:backdrop-blur-md">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Official-source foundation
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">Keep planning grounded in accepted test rules</h2>
              <p className="mt-4 text-sm leading-7 text-white/68">
                Accepted English tests for Express Entry include CELPIP-General, IELTS General Training, and PTE Core. Diagnostic tools help estimate your level only and do not replace official results.
              </p>
            </div>

            <a
              href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html"
              target="_blank"
              rel="noreferrer"
              className="rounded-[26px] border border-cyan-400/20 bg-cyan-400/10 p-5 transition duration-300 hover:border-cyan-400/30 hover:bg-cyan-400/15"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                Official reference
              </div>
              <div className="mt-3 text-lg font-semibold text-white">
                Canada.ca language test requirements
              </div>
              <div className="mt-3 text-sm leading-7 text-white/82">
                Review the official accepted test list before making final test decisions.
              </div>
            </a>
          </div>
        </section>

        <InsightCTAFooter
          isPro={viewer.isPro}
          isAuthenticated={viewer.isAuthenticated}
          upgradeHref={buildBillingHref({ returnTo: "/insights/english", unlock: "strategy" })}
        />
      </div>
    </main>
  );
  } catch (error) {
    console.log("[insights] route:", "english");
    console.log("[insights] fallback used:", "yes");
    console.log(
      "[insights] english route error:",
      error instanceof Error ? error.message : "unknown"
    );
    throw error;
  }
}
