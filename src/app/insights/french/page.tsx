import Image from "next/image";
import Link from "next/link";
import FunnelEventTracker from "@/components/funnel/FunnelEventTracker";
import FrenchPlanGenerator from "@/components/insights/FrenchPlanGenerator";
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
  const primaryTag = tags[0];
  const secondaryTag = tags[1];
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
          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 transition-all duration-300 group-hover:bg-white/10">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={48}
              height={48}
              className="h-10 w-10 rounded-xl object-contain"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {primaryTag ? (
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/75">
              {primaryTag}
            </div>
          ) : null}
          <div className="text-lg font-semibold text-white transition group-hover:text-cyan-100">
            {title}
          </div>
          <div className="mt-2 text-sm leading-6 text-white/66">{description}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[primaryTag, secondaryTag].filter(Boolean).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-white/72"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/82">
            Open resource
            <span className="transition duration-300 group-hover:translate-x-0.5">→</span>
          </div>
        </div>
      </div>
    </a>
  );
}

const strategicUnlockCards = [
  {
    title: "A larger user-controlled move",
    description:
      "French can become a bigger self-driven roadmap lever than waiting on conditional pathways or small incremental CRS tweaks.",
  },
  {
    title: "More differentiated than another small threshold gain",
    description:
      "For some profiles, French changes the shape of the roadmap instead of only adding a modest score adjustment.",
  },
  {
    title: "A pathway-strengthening layer",
    description:
      "French can support stronger positioning when draw context, category context, or broader profile differentiation starts to matter.",
  },
];

const actionCards = [
  { label: "Focus", value: "Listening + speaking foundation" },
  { label: "Target", value: "B2 / TEF-oriented progress" },
  { label: "Time", value: "Multi-week strategic build" },
];

const actionSteps = [
  "Diagnose your current French level honestly before committing to a timeline.",
  "Build vocabulary, listening rhythm, and speaking comfort into a daily system.",
  "Move into exam-style practice once the foundation is strong enough to convert into a real CRS lever.",
];

const levelResources = [
  {
    title: "TV5MONDE level check",
    description: "Useful for a quick listening-based placement check before you build the roadmap.",
    href: "https://apprendre.tv5monde.com/fr",
    logoSrc: "/assets/tv5monde.png",
    logoAlt: "TV5MONDE style level check",
    logoTone: "cyan" as const,
    tags: ["Level check", "Listening placement"],
  },
  {
    title: "RFI podcasts and French-easy content",
    description: "Useful for immersion, listening exposure, and bilingual support if you need more real-world French input.",
    href: "https://francaisfacile.rfi.fr/fr/podcasts-bilingues-par-langue",
    logoSrc: "/assets/rfi.png",
    logoAlt: "RFI French resources",
    logoTone: "indigo" as const,
    tags: ["Listening exposure", "Bilingual support"],
  },
];

const momentumResources = [
  {
    title: "Duolingo",
    description: "Best for maintaining a daily beginner habit and repetition rhythm, not as a full test-prep system.",
    href: "https://en.duolingo.com/nojs/splash",
    logoSrc: "/assets/duolingo.png",
    logoAlt: "Duolingo",
    logoTone: "fuchsia" as const,
    tags: ["Daily habit", "Beginner repetition"],
  },
  {
    title: "Busuu",
    description: "Useful for more structured lesson flow and guided progression when you want more direction than a streak app.",
    href: "https://www.busuu.com/en-us",
    logoSrc: "/assets/bussu.png",
    logoAlt: "Busuu",
    logoTone: "indigo" as const,
    tags: ["Structured lessons", "Guided progression"],
  },
  {
    title: "Anki",
    description: "Strong for vocabulary retention and spaced repetition once French becomes part of your serious roadmap.",
    href: "https://apps.ankiweb.net/",
    logoSrc: "/assets/anki.png",
    logoAlt: "Anki",
    logoTone: "cyan" as const,
    tags: ["Vocabulary retention", "Spaced repetition"],
  },
  {
    title: "HelloTalk",
    description: "Best for speaking exposure and real interaction once you are ready to use French with other people regularly.",
    href: "https://www.hellotalk.com/",
    logoSrc: "/assets/hellotalk.png",
    logoAlt: "HelloTalk",
    logoTone: "fuchsia" as const,
    tags: ["Speaking exposure", "Real interaction"],
  },
];

const examResources = [
  {
    title: "TV5MONDE TCF guidance",
    description: "Useful when you want to understand official-style French testing context and how level positioning works.",
    href: "https://apprendre.tv5monde.com/fr/article/foire-aux-questions-du-tcf",
    logoSrc: "/assets/tv5monde.png",
    logoAlt: "TV5MONDE TCF",
    logoTone: "indigo" as const,
    tags: ["Exam context", "French testing"],
  },
  {
    title: "Learn with TV5MONDE app",
    description: "Useful for structured mobile practice using video-based French exercises across multiple levels.",
    href: "https://apprendre.tv5monde.com/en/article/mobile-app-learn-tv5monde",
    logoSrc: "/assets/tv5monde.png",
    logoAlt: "Learn with TV5MONDE app",
    logoTone: "cyan" as const,
    tags: ["Structured practice", "Mobile learning"],
  },
];

const roiCards = [
  {
    title: "Better than small score drift",
    description:
      "Not all score gains carry the same strategic value. French can become more meaningful than several smaller tweaks combined.",
  },
  {
    title: "Stronger when English is already decent",
    description:
      "If English is already reasonably established, French can offer a larger differentiated move than another incremental English-only push.",
  },
  {
    title: "More controllable than conditional pathways",
    description:
      "French still takes time, but it is a path you can build through your own effort instead of waiting on external selection.",
  },
];

const bestForCards = [
  "Your English is already decent and you need a stronger differentiator.",
  "You want a user-controlled strategy instead of relying on external selection.",
  "You need a bigger move than small incremental improvements alone.",
  "You want to build a parallel path with long-term strategic upside.",
];

export const dynamic = "force-dynamic";

export default async function FrenchStrategyPage({
  searchParams,
}: {
  searchParams?: Promise<{ pro?: string; unlock?: string }>;
}) {
  const viewer = await resolveInsightViewer("french");
  const resolvedSearchParams = await searchParams;
  const showUpgradeSuccess = resolvedSearchParams?.pro === "unlocked";
  const unlock = resolvedSearchParams?.unlock ?? "strategy";
  console.log("[insights] server render reached:", "french");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070A12] px-6 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#08101F] via-[#070A12] to-black" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:88px_88px] opacity-[0.04]" />
        <div className="absolute left-1/2 top-[-10rem] h-[24rem] w-[56rem] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute right-[-8rem] top-24 h-[22rem] w-[22rem] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-[-4rem] h-[18rem] w-[18rem] rounded-full bg-indigo-500/8 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        {showUpgradeSuccess ? (
          <>
            <FunnelEventTracker
              event="checkout_completed"
              onceKey={`checkout-completed-french-${unlock}`}
              payload={{ unlock, location: "insights-french" }}
            />
            <FunnelEventTracker
              event="pro_unlocked"
              onceKey={`pro-unlocked-french-${unlock}`}
              payload={{ unlock, location: "insights-french" }}
            />
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {upgradeSuccessMessage(unlock)}
            </div>
          </>
        ) : null}

        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#0c1120]/92 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_36px_120px_-72px_rgba(217,70,239,0.24)] supports-[backdrop-filter]:bg-white/[0.045] supports-[backdrop-filter]:backdrop-blur-md sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-fuchsia-500/10 via-transparent to-cyan-500/10" />
          <div className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-fuchsia-400/10 blur-3xl" />

          <div className="relative z-10 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-200/80">
                Premium strategy workspace
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/68">
                {viewer.isPro ? "Pro unlocked" : "Free preview"}
              </div>
              <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                Strategic unlock
              </div>
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              French strategy advantage
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/66">
              {withName(
                viewer.preferredName,
                "French can be more than an incremental score gain. For the right profile, it can become one of the strongest user-controlled moves in the roadmap."
              )}
            </p>
            <div className="mt-6 max-w-3xl rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 text-sm leading-7 text-white/74">
              This page is built to help you judge French as a strategic lever: whether it should lead now, strengthen the roadmap in parallel, or stay secondary until another move is secured.
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[32px] border border-fuchsia-400/20 bg-fuchsia-400/10 p-6 shadow-[0_24px_80px_-56px_rgba(217,70,239,0.35)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-200/75">
              AI decision
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              Should you focus on French right now?
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="inline-flex items-center rounded-full border border-fuchsia-400/20 bg-black/20 px-3 py-1 text-sm font-semibold text-fuchsia-100">
                High-leverage pathway
              </div>
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70">
                User-controlled upside
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82">
              French often matters differently from English. It can become a sharper, more differentiated move when the roadmap needs something bigger than another modest threshold optimization.
            </p>
            <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-white/72">
              This is usually strongest when you want a meaningful path you can actively build, rather than waiting on external selection to change the roadmap for you.
            </div>
          </section>

          <section className="rounded-[32px] border border-cyan-400/15 bg-[#0c1120]/90 p-6 supports-[backdrop-filter]:bg-white/[0.04] supports-[backdrop-filter]:backdrop-blur-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Potential impact
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">Potential impact</h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              French can become a high-ROI move when you need a bigger user-controlled gain, stronger differentiation, or a pathway lever beyond small incremental score improvements.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/72">
                +25 to +50 CRS points
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/72">
                Potential category advantage
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/72">
                High-ROI language path
              </span>
            </div>
            <div className="mt-5 rounded-[22px] border border-cyan-400/15 bg-cyan-400/10 px-4 py-4 text-sm leading-6 text-white/78">
              French can matter strategically, not only numerically. It may create a stronger roadmap shift than several small gains that look helpful on paper but do not meaningfully change positioning.
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="grid gap-5 xl:grid-cols-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                French as a strategic unlock
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">French as a strategic unlock</h2>
              <p className="mt-4 text-sm leading-7 text-white/68">
                French may matter differently from English because it can improve CRS, differentiate the profile more meaningfully, and support stronger pathway positioning depending on the rest of the roadmap.
              </p>
            </div>

            {strategicUnlockCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[24px] border border-white/10 bg-black/20 p-5"
              >
                <div className="text-lg font-semibold text-white">{card.title}</div>
                <div className="mt-3 text-sm leading-7 text-white/68">{card.description}</div>
              </div>
            ))}
          </div>
        </section>

        {viewer.isPro ? (
          <>
        <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Execution system
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">Your French execution plan</h2>
              <div className="mt-3 max-w-2xl text-sm leading-7 text-white/66">
                Treat French as a sequence, not a vague intention. The goal is to turn it into a roadmap lever with clear weekly execution.
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {actionCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 shadow-[0_16px_40px_-30px_rgba(34,211,238,0.25)]"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      {card.label}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">{card.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              {actionSteps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-[24px] border border-white/10 bg-black/20 px-5 py-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/20"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/75">
                    Execution step {index + 1}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[30px] border border-fuchsia-400/20 bg-fuchsia-400/10 p-6 shadow-[0_24px_80px_-56px_rgba(217,70,239,0.35)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-200/75">
                Why French can change the game
              </div>
              <div className="mt-4 text-2xl font-semibold text-white">
                French can shift the roadmap more than it first appears.
              </div>
              <div className="mt-4 text-sm leading-7 text-white/82">
                Not all score gains are equal. French can become more differentiated than small incremental changes, can outperform slower or more conditional alternatives for some profiles, and can give the roadmap a stronger user-controlled direction.
              </div>
            </div>

            <div className="grid gap-3">
              {roiCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4"
                >
                  <div className="text-sm font-semibold text-white">{card.title}</div>
                  <div className="mt-2 text-sm leading-6 text-white/68">{card.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            Best for
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-white">French may be especially strong if...</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {bestForCards.map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-white/74"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            French resources
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-white">
            Free resources that are actually useful
          </h2>
          <div className="mt-4 rounded-[24px] border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-4 text-sm leading-7 text-white/82">
            These tools are best used for distinct jobs: diagnostic, daily momentum, vocabulary retention, speaking exposure, or exam-style structure. None of them are magic on their own.
          </div>

          <div className="mt-6 grid gap-8">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                Check your level
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {levelResources.map((resource) => (
                  <ResourceCard key={resource.title} {...resource} />
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                Build daily French momentum
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {momentumResources.map((resource) => (
                  <ResourceCard key={resource.title} {...resource} />
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                Move toward exam-style readiness
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {examResources.map((resource) => (
                  <ResourceCard key={resource.title} {...resource} />
                ))}
              </div>
            </div>
          </div>
        </section>
          </>
        ) : (
          <>
            <section className="mt-8">
              <PremiumLockedPanel
                compact
                title="Unlock your French execution plan"
                description="Free preview keeps the strategic case visible. Pro unlocks the full execution system, timing, and roadmap-aware French sequencing."
                primaryHref={buildUpgradeEntryHref({ isAuthenticated: viewer.isAuthenticated, returnTo: "/insights/french", unlock: "strategy" })}
                primaryLabel="Unlock full strategy"
                bullets={["Execution plan", "Timeline guidance", "Roadmap sequencing"]}
              />
            </section>
            <section className="mt-8">
              <PremiumLockedPanel
                compact
                eyebrow="Locked resources"
                title="Unlock the full French resource stack"
                description="Free preview explains why French matters. Pro unlocks the curated level-check, momentum, exam-context, and roadmap-use guidance."
                primaryHref={buildUpgradeEntryHref({ isAuthenticated: viewer.isAuthenticated, returnTo: "/insights/french", unlock: "strategy" })}
                primaryLabel="Unlock full strategy"
                bullets={["Curated tools", "Exam-context resources", "Roadmap-use guidance"]}
              />
            </section>
          </>
        )}

        <FrenchPlanGenerator
          userPlan={viewer.userPlan}
          profileOwnerKey={viewer.profileOwnerKey}
          upgradeHref={buildBillingHref({ returnTo: "/insights/french", unlock: "strategy" })}
        />

        {viewer.isPro ? (
        <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Official-source foundation
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">
                Keep the French strategy grounded in official CRS context
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/68">
                French can be strategically valuable, but planning should still stay anchored in official CRS criteria, accepted testing frameworks, and current category-based selection context where relevant.
              </p>
              <div className="mt-4 rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-white/72">
                This is where the page moves from strategy to trust: roadmap upside is useful only when it stays grounded in official criteria and accepted testing context.
              </div>
            </div>

            <div className="grid gap-3">
              <a
                href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html"
                target="_blank"
                rel="noreferrer"
                className="rounded-[26px] border border-cyan-400/20 bg-cyan-400/10 p-5 transition duration-300 hover:border-cyan-400/30 hover:bg-cyan-400/15"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                  Official reference
                </div>
                <div className="mt-3 text-lg font-semibold text-white">CRS criteria</div>
                <div className="mt-3 text-sm leading-7 text-white/82">
                  Review the official CRS factors before treating French as a major roadmap lever.
                </div>
              </a>

              <a
                href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations/category-based-selection.html"
                target="_blank"
                rel="noreferrer"
                className="rounded-[26px] border border-white/10 bg-black/20 p-5 transition duration-300 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                  Official context
                </div>
                <div className="mt-3 text-lg font-semibold text-white">Category-based selection</div>
                <div className="mt-3 text-sm leading-7 text-white/68">
                  Use official category context when deciding whether French should lead or support the roadmap.
                </div>
              </a>
            </div>
          </div>
        </section>
        ) : null}

        <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Continue your roadmap
              </div>
              <div className="mt-3 text-xl font-semibold text-white">
                Continue building your roadmap with the simulator and track your latest strategic direction from the dashboard.
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/simulator"
                className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Back to simulator
              </Link>
              <Link
                href={viewer.isPro ? "/dashboard" : buildUpgradeEntryHref({ isAuthenticated: viewer.isAuthenticated, returnTo: "/insights/french", unlock: "strategy" })}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                {viewer.isPro ? "Open dashboard" : "Unlock Pro"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
