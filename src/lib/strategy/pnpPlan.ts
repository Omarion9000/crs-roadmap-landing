import type { StoredBaseProfilePayload } from "@/lib/crs/baseProfile";

export type PnpStrategyContext = {
  currentCrs: number;
  englishClb: number;
  frenchClb: number;
  canadianExperienceYears: number;
  hasJobOffer: boolean;
  hasPnp: boolean;
  educationLabel?: string;
  foreignExperienceLabel?: string;
};

export type PnpStrategyPlan = {
  priority: "high" | "medium" | "low";
  title: string;
  explanation: string;
  target: string;
  timeline: string;
  steps: string[];
  focusAreas: string[];
  premiumNote?: string;
};

export type PnpFeasibility = {
  status: "strong" | "conditional" | "low";
  label: string;
  reasons: string[];
};

export function getPnpFeasibility(context: PnpStrategyContext): PnpFeasibility {
  const reasons: string[] = [];

  if (context.hasPnp) {
    return {
      status: "strong",
      label: "Already reflected in your roadmap",
      reasons: [
        "Your profile already includes a nomination-level advantage.",
        "The next priority is likely execution timing rather than discovering PNP from scratch.",
      ],
    };
  }

  if (context.currentCrs < 470) {
    reasons.push("Your current CRS may need a bigger strategic jump than incremental profile gains alone.");
  }

  if (!context.hasJobOffer) {
    reasons.push("No employer-supported route is visible yet, so stream fit is not confirmed.");
  }

  if (context.frenchClb >= 7) {
    reasons.push("French strength could improve access to more targeted pathways if a province values bilingual fit.");
  }

  if (context.canadianExperienceYears > 0) {
    reasons.push("Canadian experience can make some streams or Express Entry-linked pathways more realistic.");
  }

  if (context.englishClb <= 7) {
    reasons.push("Language strength may still need work before nomination becomes the most actionable lead path.");
  }

  if (context.currentCrs >= 520) {
    return {
      status: "low",
      label: "Possible, but may not need to lead",
      reasons: [
        "Your profile may already be competitive enough that PNP does not need to be the primary roadmap move.",
        "Nomination remains high-upside, but it may be more useful as a parallel option than the first focus.",
      ],
    };
  }

  if (context.currentCrs < 470 || context.hasJobOffer || context.frenchClb >= 7) {
    return {
      status: "conditional",
      label: "Worth prioritizing now",
      reasons: reasons.slice(0, 4),
    };
  }

  return {
    status: "low",
    label: "Possible, but conditional",
    reasons: [
      "PNP can still matter, but no stream fit is confirmed from your current roadmap alone.",
      "For many profiles, nomination becomes more realistic after language, experience, or targeting improves first.",
      ...reasons,
    ].slice(0, 4),
  };
}

export function getPnpChanceLevers(context: PnpStrategyContext) {
  const levers = [
    {
      title: "Province targeting matters",
      description:
        "Shortlisting provinces that actually match your background is usually stronger than waiting passively for a generic nomination path.",
    },
  ];

  if (context.frenchClb >= 7) {
    levers.push({
      title: "French can widen targeted options",
      description:
        "Stronger French may improve access to more selective bilingual or category-aware pathways.",
    });
  } else {
    levers.push({
      title: "Language strength can improve fit",
      description:
        "Stronger language results can make provincial selection more realistic when streams rely on broader profile strength.",
    });
  }

  if (context.canadianExperienceYears > 0) {
    levers.push({
      title: "Canadian experience can strengthen overlap",
      description:
        "Experience in Canada can make some Express Entry-linked streams easier to position inside the roadmap.",
    });
  } else {
    levers.push({
      title: "Canadian experience can improve overlap",
      description:
        "If nomination is not actionable today, Canadian experience may strengthen future stream fit.",
    });
  }

  if (!context.hasJobOffer) {
    levers.push({
      title: "A job offer may expand options",
      description:
        "Some provincial pathways become more realistic when employer support or local labor-market alignment exists.",
    });
  }

  levers.push({
    title: "Occupation alignment often matters",
    description:
      "In many streams, fit with provincial demand matters more than raw CRS alone.",
  });

  return levers.slice(0, 5);
}

export function buildPnpStrategyContext(
  payload: StoredBaseProfilePayload | null
): PnpStrategyContext | null {
  if (!payload?.baseProfile || typeof payload.baseProfile.currentCrs !== "number") {
    return null;
  }

  return {
    currentCrs: payload.baseProfile.currentCrs,
    englishClb: payload.baseProfile.englishClb ?? 0,
    frenchClb: payload.baseProfile.frenchClb ?? 0,
    canadianExperienceYears: payload.baseProfile.canadianExperienceYears ?? 0,
    hasJobOffer: !!payload.baseProfile.hasJobOffer,
    hasPnp: !!payload.baseProfile.hasPnp,
    educationLabel: payload.baseProfile.educationLabel,
    foreignExperienceLabel: payload.baseProfile.foreignExperienceLabel,
  };
}

export function generatePnpStrategyPlan(
  context: PnpStrategyContext
): PnpStrategyPlan {
  const { currentCrs, englishClb, frenchClb, canadianExperienceYears, hasJobOffer, hasPnp } =
    context;

  let priority: PnpStrategyPlan["priority"] = "medium";

  if (hasPnp) {
    priority = "low";
  } else if (currentCrs < 470) {
    priority = "high";
  } else if (currentCrs < 520) {
    priority = "medium";
  } else {
    priority = "low";
  }

  let title = "PNP may be one high-impact path inside your roadmap";
  let explanation =
    "Based on your current profile, provincial nomination may be worth tracking when direct score gains alone do not fully change your draw position.";
  let target = "Align your profile with realistic provincial pathways";
  let timeline = "2-6 months typical preparation phase";
  let steps = [
    "Identify provinces and Express Entry-aligned streams that could fit your current profile strengths.",
    "Tighten the profile factors most likely to affect stream fit, such as language results, work history, and occupation alignment.",
    "Monitor stream openings and official provincial updates so applications are timed intentionally.",
  ];
  let focusAreas = [
    "Occupation alignment",
    "Language level",
    "Work experience strength",
    "Provincial demand",
  ];

  if (priority === "high") {
    title = "PNP looks like one of your strongest strategic moves";
    explanation = hasJobOffer
      ? "Based on your current profile, a nomination could become a major accelerator, especially if other profile signals already support provincial fit."
      : "Based on your current profile, PNP is likely one of the strongest possible moves when faster CRS growth is needed.";
    target = "Secure provincial nomination and prepare for stream fit";
    timeline = "2-6 months typical preparation phase";
    steps = [
      "Start with provinces whose streams are most compatible with your current work history, language profile, and Express Entry positioning.",
      "Strengthen the profile details most likely to influence eligibility before treating PNP as the lead pathway.",
      "Track official stream criteria and openings closely so you can act when a realistic match appears.",
    ];
    focusAreas = [
      "Provincial stream matching",
      "Language competitiveness",
      "Occupation and experience fit",
      "Application timing",
    ];
  } else if (priority === "medium") {
    title = "PNP can strengthen your roadmap, but it may not be your only move";
    explanation =
      "Based on your current profile, nomination is still meaningful, but it may sit alongside other realistic score-growth paths rather than replacing them.";
    target = "Keep PNP as an active secondary pathway";
    timeline = "2-4 months of structured monitoring";
    steps = [
      "Compare PNP against the faster profile moves already available in your roadmap.",
      "Shortlist a few provinces where your current background could be more competitive.",
      "Review official updates regularly so PNP stays ready without becoming your only strategy.",
    ];
    focusAreas = [
      "Province shortlist",
      "Roadmap sequencing",
      "Language and profile fit",
      "Update monitoring",
    ];
  } else if (hasPnp) {
    title = "Your roadmap already includes a nomination-level advantage";
    explanation =
      "Based on your current profile, PNP does not look like the next priority because nomination is already reflected in your roadmap.";
    target = "Protect nomination readiness and focus on execution";
    timeline = "Near-term execution focus";
    steps = [
      "Keep nomination-related documents and profile details current.",
      "Focus on the next execution step rather than reopening PNP as a discovery path.",
      "Use the rest of your roadmap to support application readiness and timing.",
    ];
    focusAreas = ["Profile accuracy", "Application readiness", "Execution timing"];
  } else {
    title = "PNP may be lower priority than your faster existing levers";
    explanation =
      currentCrs >= 520
        ? "Based on your current profile, nomination may not be necessary if your current competitiveness is already relatively strong."
        : "Based on your current profile, PNP may still matter, but other upgrades may deserve attention first.";
    target = "Keep PNP monitored while prioritizing faster moves";
    timeline = "Ongoing monitoring";
    steps = [
      "Do a light screening of plausible provinces instead of building your full strategy around nomination immediately.",
      "Prioritize faster profile gains first if they are already available and realistic.",
      "Reassess PNP if your draw position or roadmap shifts.",
    ];
    focusAreas = ["Monitoring", "Roadmap sequencing", "Profile positioning"];
  }

  if (englishClb <= 7) {
    focusAreas = [...focusAreas, "Language strengthening"];
  }

  if (frenchClb >= 7) {
    focusAreas = [...focusAreas, "Bilingual pathway review"];
  }

  if (canadianExperienceYears > 0) {
    focusAreas = [...focusAreas, "Canadian experience alignment"];
  }

  return {
    priority,
    title,
    explanation,
    target,
    timeline,
    steps,
    focusAreas: Array.from(new Set(focusAreas)),
    premiumNote:
      "This plan is generated from your current roadmap context and is designed to help you sequence provincial nomination more intentionally.",
  };
}
