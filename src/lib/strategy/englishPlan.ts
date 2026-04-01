import type { StoredBaseProfilePayload } from "@/lib/crs/baseProfile";

export type EnglishStrategyContext = {
  currentCrs: number;
  englishClb: number;
  frenchClb: number;
  canadianExperienceYears: number;
  hasJobOffer: boolean;
  hasPnp: boolean;
  educationLabel?: string;
  maritalStatusLabel?: string;
  foreignExperienceLabel?: string;
};

export type EnglishStrategyPlan = {
  priority: "high" | "medium" | "low";
  title: string;
  explanation: string;
  target: string;
  timeline: string;
  focusAreas: string[];
  steps: string[];
  premiumNote?: string;
};

export function buildEnglishStrategyContext(
  payload: StoredBaseProfilePayload | null
): EnglishStrategyContext | null {
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
    maritalStatusLabel: payload.baseProfile.maritalStatusLabel,
    foreignExperienceLabel: payload.baseProfile.foreignExperienceLabel,
  };
}

export function generateEnglishStrategyPlan(
  context: EnglishStrategyContext
): EnglishStrategyPlan {
  const englishClb = context.englishClb;
  const hasHighFrench = context.frenchClb >= 9;
  const hasPnp = context.hasPnp;

  let priority: EnglishStrategyPlan["priority"] = "medium";

  if (hasPnp || englishClb >= 9) {
    priority = "low";
  } else if (englishClb <= 7) {
    priority = "high";
  } else if (englishClb === 8) {
    priority = hasHighFrench ? "medium" : "high";
  }

  let title = "English can be a realistic score-growth lever";
  let explanation =
    "English may help strengthen your roadmap, especially when faster score movement matters more than slower profile changes.";
  let target = "Reach CLB 9";
  let timeline = "6-8 weeks";
  let focusAreas = ["Listening + Writing", "Full test familiarization first"];
  let steps = [
    "Identify the weakest skill first so practice time goes where score growth is most likely.",
    "Build short focused sessions around the two skills most likely to hold the result back.",
    "Use timed mock tests before booking so readiness is measured under real pressure.",
  ];
  const premiumNote =
    "This plan is generated from your current roadmap context and is designed to help you sequence English improvement more intelligently.";

  if (priority === "high") {
    title = "English looks like one of your strongest short-term levers";
    explanation =
      englishClb <= 7
        ? "Your current English level suggests that stronger language results may be one of the fastest realistic ways to improve CRS."
        : "English still appears to be a high-value move and may create faster score growth than slower profile changes.";
    target = englishClb >= 8 ? "Push the weakest skill to CLB 9" : "Build toward CLB 9 with weakest-skill focus";
    timeline = englishClb <= 6 ? "8-12 weeks" : englishClb === 7 ? "6-8 weeks" : "4-6 weeks";
    focusAreas =
      englishClb <= 6
        ? ["Full test familiarization first", "Reading speed + exam timing"]
        : englishClb === 7
        ? ["Listening + Writing", "Speaking consistency"]
        : ["Weakest skill first", "Exam timing + consistency"];
    steps = [
      "Start with a quick diagnostic and identify which one or two abilities are most likely to keep the score below target.",
      "Use targeted practice blocks instead of studying all four skills equally.",
      "Move into timed official-style practice before booking the exam so the gain is more likely to hold under pressure.",
    ];
  } else if (priority === "medium") {
    title = "English matters, but it may be one lever inside a broader roadmap";
    explanation =
      hasHighFrench
        ? "English can still strengthen your profile, but French already gives you another meaningful pathway to compare against."
        : "English may still offer useful score growth, but it may not be the only strong move in your roadmap.";
    target = englishClb >= 8 ? "Stabilize CLB 9-level performance" : "Improve the weakest skill first";
    timeline = englishClb >= 8 ? "4-6 weeks" : "6-8 weeks";
    focusAreas =
      englishClb >= 8
        ? ["Exam timing", "Consistency under pressure"]
        : ["Listening + Writing", "General accuracy first"];
    steps = [
      "Check whether English is still the fastest realistic move compared with the rest of your roadmap.",
      "Prioritize the weakest skill so improvement effort stays focused and efficient.",
      "Use one full mock cycle before booking to confirm that the gain is stable enough to matter.",
    ];
  } else {
    title = "English is likely a lower priority move right now";
    explanation = hasPnp
      ? "Your profile already includes a much stronger nomination-based pathway, so English may be more about maintaining strength than leading the roadmap."
      : "Your English level already looks relatively strong, so other moves may matter more than a full English push right now.";
    target = englishClb >= 9 ? "Maintain performance and protect exam readiness" : "Focus on the weakest remaining skill only";
    timeline = englishClb >= 9 ? "2-4 weeks" : "4-6 weeks";
    focusAreas =
      englishClb >= 9
        ? ["Timed mock validation", "Consistency before booking"]
        : ["Weakest skill only", "Exam confidence"];
    steps = [
      "Use a quick readiness check before investing heavily in another full study cycle.",
      "If English is already strong, limit effort to maintaining consistency rather than rebuilding everything.",
      "Compare this path against stronger roadmap levers before treating it as the primary next move.",
    ];
  }

  return {
    priority,
    title,
    explanation,
    target,
    timeline,
    focusAreas,
    steps,
    premiumNote,
  };
}
