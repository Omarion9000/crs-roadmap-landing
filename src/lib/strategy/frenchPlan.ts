import type { StoredBaseProfilePayload } from "@/lib/crs/baseProfile";

export type FrenchStrategyContext = {
  currentCrs: number;
  englishClb: number;
  frenchClb: number;
  canadianExperienceYears: number;
  hasJobOffer: boolean;
  hasPnp: boolean;
  educationLabel?: string;
  foreignExperienceLabel?: string;
  canadianCredentialLabel?: string;
};

export type FrenchStrategyPlan = {
  priority: "high" | "medium" | "low";
  title: string;
  explanation: string;
  target: string;
  timeline: string;
  focusAreas: string[];
  steps: string[];
  premiumNote?: string;
};

export function buildFrenchStrategyContext(
  payload: StoredBaseProfilePayload | null
): FrenchStrategyContext | null {
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
    canadianCredentialLabel: payload.baseProfile.canadianCredentialLabel,
  };
}

export function generateFrenchStrategyPlan(
  context: FrenchStrategyContext
): FrenchStrategyPlan {
  const { currentCrs, englishClb, frenchClb, canadianExperienceYears, hasPnp, hasJobOffer } =
    context;

  let priority: FrenchStrategyPlan["priority"] = "medium";

  if (hasPnp && frenchClb < 5) {
    priority = "low";
  } else if (frenchClb >= 4 && frenchClb < 7) {
    priority = "high";
  } else if (frenchClb === 0 && englishClb >= 8 && currentCrs < 520) {
    priority = "high";
  } else if (frenchClb >= 7) {
    priority = "medium";
  } else if (currentCrs >= 520) {
    priority = "low";
  }

  let title = "French can become a differentiated strategic lever";
  let explanation =
    "French is not only another language gain. For many profiles, it can create a bigger user-controlled move than smaller incremental CRS tweaks and can change how the roadmap is sequenced.";
  let target = "Build toward B2-level French with test-focused structure";
  let timeline = frenchClb >= 4 ? "8-16 weeks of structured progress" : "12-24 weeks depending on foundation";
  let focusAreas = [
    "Listening comprehension",
    "Speaking confidence",
    "High-frequency vocabulary",
    "TEF-oriented progression",
  ];
  let steps = [
    "Diagnose your real starting level so the roadmap does not overestimate how fast French can become a strategic lever.",
    "Build a daily listening and vocabulary habit before pushing harder into full exam-style pressure.",
    "Move into structured test-style practice once your comprehension and speaking rhythm begin to stabilize.",
  ];

  if (priority === "high") {
    title = frenchClb >= 4
      ? "French looks like a strong strategic unlock from your current base"
      : "French may be one of your biggest controllable moves";
    explanation =
      frenchClb >= 4
        ? "Because you already have some French foundation, this path may offer stronger strategic upside than it first appears and may be more realistic than slower or more conditional alternatives."
        : "Because your English is already reasonably established, French may offer a larger differentiated upside than another small threshold optimization alone.";
    target = frenchClb >= 4 ? "Push toward B2 / TEF-oriented progress" : "Build a durable A2-B1 foundation first";
    timeline = frenchClb >= 5 ? "8-12 weeks to sharpen toward stronger positioning" : "12-20 weeks of consistent build";
    focusAreas =
      frenchClb >= 4
        ? ["Listening + speaking", "B2 vocabulary expansion", "TEF-style rhythm", "Consistency"]
        : ["Pronunciation comfort", "Listening habit", "Core grammar patterns", "Vocabulary retention"];
    steps = [
      "Start with a level check and define whether the immediate target is foundational momentum or a B2-style push.",
      "Build French into a daily system instead of relying on occasional long sessions, because consistency matters more than intensity at this stage.",
      "Shift into TEF-style listening and speaking drills once the base becomes stable enough to turn effort into usable exam progress.",
    ];
  } else if (priority === "medium") {
    title = "French is worth building, even if it does not need to lead immediately";
    explanation =
      frenchClb >= 7
        ? "Your French already carries meaningful strategic value, so the near-term priority may be protecting and refining that advantage rather than rebuilding from scratch."
        : "French can still strengthen the roadmap meaningfully, but it may work best as a parallel build beside other realistic profile improvements.";
    target = frenchClb >= 7 ? "Protect B2+ momentum and exam readiness" : "Build French in parallel with your main CRS lever";
    timeline = frenchClb >= 7 ? "4-8 weeks of refinement" : "10-16 weeks of steady build";
    focusAreas =
      frenchClb >= 7
        ? ["Test readiness", "Speaking stability", "Listening precision", "Score protection"]
        : ["Daily habit", "Listening exposure", "Vocabulary retention", "Speaking repetition"];
    steps = [
      "Decide whether French should lead the roadmap now or remain a strong secondary build beside your fastest existing move.",
      "Create a weekly rhythm that keeps momentum alive without crowding out the rest of your roadmap.",
      "Reassess once French moves closer to an exam-relevant level or once your other major CRS lever stabilizes.",
    ];
  } else {
    title = "French may be valuable later, but it is probably not the first move right now";
    explanation = hasPnp
      ? "Your roadmap already includes a much stronger nomination-based advantage, so French may be more useful as a future differentiator than as the immediate lead."
      : "French can still become valuable, but right now another path may deliver a faster or clearer return for your current profile.";
    target = "Keep French on the roadmap without forcing it to lead";
    timeline = "Longer-term parallel build";
    focusAreas = ["Foundational exposure", "Habit formation", "Long-term consistency"];
    steps = [
      "Keep French alive as a strategic option without treating it as the only high-ROI move in the current phase.",
      "Prioritize the more immediate controllable gain first if another lever is already closer to paying off.",
      "Return to a stronger French push when the roadmap has more room for a larger language build.",
    ];
  }

  if (hasJobOffer) {
    focusAreas = [...focusAreas, "Roadmap sequencing against employer-linked options"];
  }

  if (canadianExperienceYears > 0) {
    focusAreas = [...focusAreas, "French layered on top of Canadian pathway strength"];
  }

  return {
    priority,
    title,
    explanation,
    target,
    timeline,
    focusAreas: Array.from(new Set(focusAreas)),
    steps,
    premiumNote:
      "This plan is generated from your current roadmap context and is designed to help you decide whether French should lead, support, or stay parallel inside your CRS strategy.",
  };
}
