export type StrategySlug =
  | "english"
  | "french"
  | "pnp"
  | "job-offer"
  | "canadian-experience";

export type StrategyCard = {
  label: string;
  title: string;
  description: string;
};

export type StrategyBenefit = {
  title: string;
  description: string;
};

export type StrategyPageContent = {
  slug: StrategySlug;
  title: string;
  eyebrow: string;
  description: string;
  whyThisPathMatters: string;
  summary: string;
  previewBullets: string[];
  snapshotCards: StrategyCard[];
  helpsWith: StrategyBenefit[];
  workspaceIncludes: string[];
  premiumSections: StrategyCard[];
};

export const strategyPages: Record<StrategySlug, StrategyPageContent> = {
  english: {
    slug: "english",
    title: "English score optimization",
    eyebrow: "Premium strategy workspace",
    description:
      "Understand how stronger language results can create fast CRS gains for many profiles.",
    whyThisPathMatters:
      "For many candidates, English becomes one of the clearest short-to-medium term levers because it can affect score strength quickly and interact with other parts of the profile.",
    summary:
      "This workspace is being built around official Express Entry rules, language-test baselines, and the CRS pathways most often affected by stronger English results.",
    previewBullets: ["Language improvement path", "Projected score context", "Roadmap sequencing"],
    snapshotCards: [
      {
        label: "Why it matters",
        title: "Often one of the fastest adjustable levers",
        description:
          "Stronger English results can improve CRS without changing the rest of your profile.",
      },
      {
        label: "Who this helps",
        title: "Candidates below stronger language thresholds",
        description:
          "Often relevant when language performance is still limiting the next meaningful score jump.",
      },
      {
        label: "Score impact",
        title: "Potentially high impact",
        description:
          "The real effect depends on the rest of the profile and where current language levels sit today.",
      },
      {
        label: "Timing",
        title: "Usually a near-term strategy path",
        description:
          "Can become one of the more realistic moves when the user can act on language prep sooner than larger profile changes.",
      },
    ],
    helpsWith: [
      {
        title: "Increase CRS potential",
        description:
          "Higher English results can raise score potential and improve overall competitiveness.",
      },
      {
        title: "Clarify best-next-move priorities",
        description:
          "This path helps compare whether language improvement should come before other longer-horizon moves.",
      },
      {
        title: "Create stronger simulator options",
        description:
          "English gains often change how the roadmap compares against French, PNP, or experience-based opportunities.",
      },
      {
        title: "Support faster experimentation",
        description:
          "Language scenarios can often be modeled earlier than pathways that depend on external approvals or longer timelines.",
      },
    ],
    workspaceIncludes: [
      "Eligibility-aware context for when English becomes the clearest next lever",
      "Scenario comparisons against French, PNP, and experience-driven moves",
      "Roadmap sequencing guidance for when language should come first",
      "Implementation planning notes and future action checklist structure",
      "Mistakes-to-avoid framing before deeper premium guidance is published",
    ],
    premiumSections: [
      {
        label: "Premium workflow",
        title: "Strategic use cases",
        description:
          "Use this section to compare when English is the best immediate move versus when it should be sequenced behind other opportunities.",
      },
      {
        label: "Premium workflow",
        title: "Roadmap integration",
        description:
          "Connect language improvement to the rest of the user’s plan, including timing, alternative paths, and future simulator decisions.",
      },
      {
        label: "Premium workflow",
        title: "Execution checklist",
        description:
          "This area is reserved for structured next-step planning once official-source-aligned guidance is published.",
      },
    ],
  },
  french: {
    slug: "french",
    title: "French strategy path",
    eyebrow: "Premium strategy workspace",
    description:
      "Explore how French-language results can change your CRS potential and category-based opportunities.",
    whyThisPathMatters:
      "French can become one of the most strategic non-PNP pathways for some profiles because it may improve score strength while also changing how category-based opportunities are evaluated.",
    summary:
      "This workspace is being built around official Express Entry rules, language requirements, and current pathways that may become more attractive with French results.",
    previewBullets: ["French gain scenarios", "Category-fit context", "Execution roadmap"],
    snapshotCards: [
      {
        label: "Why it matters",
        title: "Can become a high-leverage non-PNP path",
        description:
          "French may improve both score context and broader pathway positioning depending on the profile.",
      },
      {
        label: "Who this helps",
        title: "Often relevant for candidates missing a stronger second-language edge",
        description:
          "Particularly useful when the current profile needs a meaningful strategic jump without relying on nomination.",
      },
      {
        label: "Score impact",
        title: "Potentially high impact",
        description:
          "The eventual score effect depends on current language levels, profile structure, and official criteria.",
      },
      {
        label: "Timing",
        title: "Usually a medium-term but powerful route",
        description:
          "French may take longer to execute, but can become one of the strongest roadmap pathways when available.",
      },
    ],
    helpsWith: [
      {
        title: "Increase CRS potential",
        description:
          "French may provide a meaningful score lift when language remains one of the biggest gaps in the profile.",
      },
      {
        title: "Improve pathway optionality",
        description:
          "It can open broader strategy conversations beyond a single high-impact scenario.",
      },
      {
        title: "Strengthen competitiveness",
        description:
          "A stronger language profile can improve how the user compares against future draws and pathways.",
      },
      {
        title: "Expand roadmap flexibility",
        description:
          "French can become an alternative to waiting on slower or less controllable profile changes.",
      },
    ],
    workspaceIncludes: [
      "High-level context on when French becomes strategically meaningful",
      "Scenario comparisons against English, PNP, and job-offer pathways",
      "Sequencing guidance for users considering a longer-term language plan",
      "Roadmap integration for combining French with other profile improvements",
      "Future checklist structure for preparation, execution, and review",
    ],
    premiumSections: [
      {
        label: "Premium workflow",
        title: "Category-fit planning",
        description:
          "This section is reserved for premium guidance on how French may influence broader Express Entry strategy conversations.",
      },
      {
        label: "Premium workflow",
        title: "Scenario sequencing",
        description:
          "Compare when French should lead the roadmap and when it works better alongside other moves.",
      },
      {
        label: "Premium workflow",
        title: "Action framework",
        description:
          "Future content here will translate the strategy into a clearer step-by-step planning structure.",
      },
    ],
  },
  pnp: {
    slug: "pnp",
    title: "Provincial nomination strategy",
    eyebrow: "Premium strategy workspace",
    description:
      "Understand the highest-impact CRS pathway and where nomination-based opportunity can change your roadmap.",
    whyThisPathMatters:
      "Provincial nomination is often the most dramatic CRS pathway on the table, but it also depends on real eligibility, timing, and fit that need to be considered carefully.",
    summary:
      "This workspace is being built around official Express Entry rules, provincial nomination context, and current pathway structure without making unsupported immigration claims.",
    previewBullets: ["Nomination upside", "Alternative paths", "Eligibility-aware planning"],
    snapshotCards: [
      {
        label: "Why it matters",
        title: "Often the highest-impact CRS route",
        description:
          "Nomination-based opportunity can change the entire roadmap when it becomes available.",
      },
      {
        label: "Who this helps",
        title: "Candidates exploring major score-change pathways",
        description:
          "Often relevant when smaller optimizations may not be enough to close the gap meaningfully.",
      },
      {
        label: "Score impact",
        title: "Very high potential impact",
        description:
          "This path can be the strongest score change on paper, but official eligibility and program fit still apply.",
      },
      {
        label: "Timing",
        title: "Usually less immediate than language-only moves",
        description:
          "This route can be powerful, but it often requires more external conditions than other simulator scenarios.",
      },
    ],
    helpsWith: [
      {
        title: "Transform score positioning",
        description:
          "PNP can change the roadmap far more dramatically than most smaller profile adjustments.",
      },
      {
        title: "Compare realistic versus maximum upside",
        description:
          "This path helps users weigh the biggest possible move against faster or more controllable alternatives.",
      },
      {
        title: "Clarify pathway risk",
        description:
          "Nomination strategy can help frame where external dependencies matter more than pure score optimization.",
      },
      {
        title: "Support better sequencing",
        description:
          "Users can decide whether to pursue nomination in parallel with more immediate non-PNP improvements.",
      },
    ],
    workspaceIncludes: [
      "High-level nomination context and when this path becomes strategically relevant",
      "Comparisons between maximum upside and more realistic near-term alternatives",
      "Planning guidance for parallel versus primary-path execution",
      "Roadmap integration for combining PNP exploration with other simulator insights",
      "Future premium frameworks for evaluating timing, fit, and tradeoffs",
    ],
    premiumSections: [
      {
        label: "Premium workflow",
        title: "Parallel path planning",
        description:
          "Use this section to compare nomination strategy against faster non-PNP options without losing momentum.",
      },
      {
        label: "Premium workflow",
        title: "Eligibility-aware roadmap framing",
        description:
          "Future premium content will help structure this path around official criteria and practical roadmap sequencing.",
      },
      {
        label: "Premium workflow",
        title: "Decision checklist",
        description:
          "This area is reserved for a cleaner action checklist once official-source-backed guidance is published.",
      },
    ],
  },
  "job-offer": {
    slug: "job-offer",
    title: "Qualifying job offer strategy",
    eyebrow: "Premium strategy workspace",
    description:
      "See how a valid job offer can affect your CRS and when this path matters strategically.",
    whyThisPathMatters:
      "A qualifying job offer can become meaningful in the roadmap, but it needs to be evaluated carefully against current rules, profile fit, and alternative CRS pathways.",
    summary:
      "This workspace is being built around official Express Entry rules, current program requirements, and job-offer-related pathways reflected in official criteria.",
    previewBullets: ["Qualifying offer context", "Score comparison", "Roadmap sequencing"],
    snapshotCards: [
      {
        label: "Why it matters",
        title: "Can become a strategic score lever",
        description:
          "A valid offer may create a meaningful change in score context depending on the profile and the rules that apply.",
      },
      {
        label: "Who this helps",
        title: "Candidates weighing employment-based options",
        description:
          "Often relevant for users comparing employer-linked paths with language or experience improvements.",
      },
      {
        label: "Score impact",
        title: "Potentially meaningful, but profile-dependent",
        description:
          "The true value depends on the kind of offer, the current profile, and official eligibility requirements.",
      },
      {
        label: "Timing",
        title: "Often dependent on external conditions",
        description:
          "This route may be valuable, but it usually depends on factors outside the user’s direct control.",
      },
    ],
    helpsWith: [
      {
        title: "Compare employment-based strategy",
        description:
          "Users can see whether a job-offer path belongs near the top of the roadmap or as a secondary path.",
      },
      {
        title: "Clarify opportunity cost",
        description:
          "This path helps compare external employer-driven routes with more self-directed improvements.",
      },
      {
        title: "Strengthen roadmap sequencing",
        description:
          "A job offer can become more useful when evaluated alongside language, nomination, and experience scenarios.",
      },
      {
        title: "Support realistic decision-making",
        description:
          "The page is designed to help users think in pathways, not just static score jumps.",
      },
    ],
    workspaceIncludes: [
      "High-level context for when a qualifying offer matters strategically",
      "Comparisons between job-offer value and other simulator opportunities",
      "Roadmap sequencing guidance for users exploring employment-based routes",
      "Future premium notes on execution framing and scenario fit",
      "A structured planning area for turning this into a real decision workflow",
    ],
    premiumSections: [
      {
        label: "Premium workflow",
        title: "Use-case comparison",
        description:
          "This section will help compare job-offer strategy against language, PNP, and experience paths within the same roadmap.",
      },
      {
        label: "Premium workflow",
        title: "Decision framework",
        description:
          "Future content here will help users evaluate whether this path should be primary, secondary, or parallel.",
      },
      {
        label: "Premium workflow",
        title: "Execution guide",
        description:
          "This area is reserved for a structured implementation layer built around official-source-aligned guidance.",
      },
    ],
  },
  "canadian-experience": {
    slug: "canadian-experience",
    title: "Canadian experience strategy",
    eyebrow: "Premium strategy workspace",
    description:
      "See how time worked in Canada can improve your CRS and strengthen your pathway positioning.",
    whyThisPathMatters:
      "Canadian experience is often a slower but strategically important route because it can improve CRS while also strengthening how the broader profile is positioned over time.",
    summary:
      "This workspace is being built around official Express Entry rules, current CRS-related pathways, and the strategic value of Canadian experience over time.",
    previewBullets: ["Experience thresholds", "Longer-horizon gains", "Priority sequencing"],
    snapshotCards: [
      {
        label: "Why it matters",
        title: "Can strengthen both score and pathway stability",
        description:
          "Canadian experience often becomes a roadmap-building move rather than just a quick score optimization.",
      },
      {
        label: "Who this helps",
        title: "Candidates planning through longer horizons",
        description:
          "Often relevant when the profile may benefit from stronger positioning over time rather than a single immediate jump.",
      },
      {
        label: "Score impact",
        title: "Potentially meaningful over time",
        description:
          "The true effect depends on current profile structure, timing, and how experience interacts with other improvements.",
      },
      {
        label: "Timing",
        title: "Usually a medium-to-longer-term route",
        description:
          "This path often requires patience, but it can materially strengthen how the roadmap develops.",
      },
    ],
    helpsWith: [
      {
        title: "Support long-term profile growth",
        description:
          "Canadian experience can improve score context while also strengthening broader roadmap positioning.",
      },
      {
        title: "Clarify patience versus payoff",
        description:
          "Users can compare whether this longer-horizon path is worth prioritizing over faster score moves.",
      },
      {
        title: "Improve simulator sequencing",
        description:
          "This path helps clarify how medium-term profile growth fits beside immediate score improvements.",
      },
      {
        title: "Create stronger roadmap options",
        description:
          "Experience-driven improvements may combine well with language or other strategic changes over time.",
      },
    ],
    workspaceIncludes: [
      "High-level context on where Canadian experience becomes strategically valuable",
      "Comparisons against faster score improvements and nomination-driven paths",
      "Roadmap sequencing guidance for longer-horizon users",
      "Future premium planning notes on timing, tradeoffs, and combined strategy paths",
      "A structured implementation layer for turning this into a real roadmap step",
    ],
    premiumSections: [
      {
        label: "Premium workflow",
        title: "Long-horizon planning",
        description:
          "This section is reserved for premium guidance on how to think about experience as part of a multi-step roadmap.",
      },
      {
        label: "Premium workflow",
        title: "Pathway sequencing",
        description:
          "Future content here will help compare when experience should lead the roadmap and when it should support other moves.",
      },
      {
        label: "Premium workflow",
        title: "Execution checklist",
        description:
          "This area will become the structured planning layer for turning experience growth into a real strategy path.",
      },
    ],
  },
};

export const strategyPageList = Object.values(strategyPages);
