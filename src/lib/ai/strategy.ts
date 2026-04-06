import { buildProfile } from "@/lib/crs/profile";
import type { ProfileDraft, ProgramKey } from "@/lib/crs/types";
import { simulateTop } from "@/lib/crs/optimize";
import {
  buildExpressEntryEligibility,
  expressEntryEligibilitySignals,
} from "@/lib/expressEntryEligibility";
import { buildRecommendationSummary } from "@/lib/strategy/recommendationSummary";
import type { AIStrategyContext, StrategyContextScenario } from "@/types/ai-strategy";

type RoadmapSnapshot = {
  baseCrs?: number;
  effectiveBaseCrs?: number;
  ieltsClb?: number;
  frenchClb?: number;
  canExpYears?: number;
  hasJobOffer?: boolean;
  hasPnp?: boolean;
  lang?: "en" | "es";
  educationLabel?: string;
  foreignExperienceLabel?: string;
  canadianCredentialLabel?: string;
  profileModeLabel?: string;
  rawForm?: Record<string, unknown> | null;
};

type StoredRoadmap = {
  profile_snapshot?: RoadmapSnapshot | null;
  program_target?: string | null;
  top_scenarios?:
    | Array<{
        id?: string;
        title?: string;
        description?: string;
        delta?: number;
        eligible?: boolean;
        newCrs?: number;
        programTarget?: ProgramKey;
      }>
    | null;
  created_at?: string | null;
};

export type StrategyContextInput = {
  profile?:
    | (ProfileDraft & {
        educationLabel?: string;
        foreignExperienceLabel?: string;
        canadianCredentialLabel?: string;
        profileModeLabel?: string;
        rawForm?: Record<string, unknown> | null;
      })
    | null;
  lang?: "en" | "es";
  program_target?: ProgramKey | null;
  benchmark_general?: number | null;
  benchmark_category?: number | null;
};

function toPriorityRank(index: number, gain: number): "high" | "medium" | "low" {
  if (index <= 1 || gain >= 50) return "high";
  if (index <= 3 || gain >= 20) return "medium";
  return "low";
}

function normalizeScenarios(
  scenarios:
    | Array<{
        id?: string;
        title?: string;
        delta?: number;
        newCrs?: number;
        programTarget?: ProgramKey;
        eligible?: boolean;
      }>
    | undefined,
  baseCrs: number
): StrategyContextScenario[] {
  return (scenarios ?? [])
    .filter(
      (scenario): scenario is NonNullable<typeof scenario> &
        Required<Pick<NonNullable<typeof scenario>, "id" | "title" | "delta">> =>
        typeof scenario.id === "string" &&
        typeof scenario.title === "string" &&
        typeof scenario.delta === "number"
    )
    .map((scenario, index) => ({
      id: scenario.id,
      name: scenario.title,
      gain: scenario.delta,
      projected_crs:
        typeof scenario.newCrs === "number" ? scenario.newCrs : baseCrs + scenario.delta,
      estimated_priority: toPriorityRank(index, scenario.delta),
      program_target: scenario.programTarget,
      eligible: scenario.eligible,
    }));
}

function englishThresholdSignal(clb?: number) {
  if (!clb || clb <= 0) return "English is still far from the strongest thresholds, so it may be a longer build.";
  if (clb >= 9) return "English already looks strong, so it may be less useful as the main growth path.";
  if (clb === 8) return "English is close to a stronger threshold, so it may be one of the most controllable short-term moves.";
  if (clb === 7) return "English is within realistic reach of a stronger threshold and remains highly user-controlled.";
  return "English can still improve, but the path may take more sustained work before the next meaningful threshold.";
}

function frenchThresholdSignal(clb?: number) {
  if (!clb || clb <= 0) return "French is not established yet, so it should be treated as a strategic build rather than an immediate threshold jump.";
  if (clb >= 7) return "French already looks strong enough to support higher-upside bilingual positioning.";
  if (clb === 6) return "French is near a stronger threshold, which can make it one of the best realistic profile-controlled paths.";
  if (clb >= 4) return "French may be viable, but it is still a medium-term build rather than an immediate gain.";
  return "French can matter later, but it is not yet close to the strongest thresholds.";
}

function buildProfileSignals(
  profile: NonNullable<ReturnType<typeof buildProfile>>,
  inputProfile: StrategyContextInput["profile"],
  programTarget: ProgramKey,
  summary: ReturnType<typeof buildRecommendationSummary>
) {
  const signals: string[] = [];
  const rawForm = inputProfile?.rawForm ?? null;
  const educationLabel = inputProfile?.educationLabel?.toLowerCase() ?? "";
  const foreignExperienceLabel = inputProfile?.foreignExperienceLabel?.toLowerCase() ?? "";
  const canadianCredentialLabel = inputProfile?.canadianCredentialLabel?.toLowerCase() ?? "";

  if (profile.ieltsClb === 8 || profile.ieltsClb === 7) {
    signals.push("English is close to a stronger threshold unlock.");
  }

  if ((profile.frenchClb ?? 0) >= 5) {
    signals.push("French already has enough foundation to support a realistic bilingual strategy.");
  } else if ((profile.frenchClb ?? 0) > 0) {
    signals.push("French exists as a medium-term build, but not yet as the fastest threshold jump.");
  }

  if ((profile.canExpYears ?? 0) >= 1) {
    signals.push("Canadian experience is already established, which can make timing-based gains more realistic.");
  }

  if (
    educationLabel.includes("bachelor") ||
    educationLabel.includes("master") ||
    educationLabel.includes("phd") ||
    foreignExperienceLabel.includes("3") ||
    foreignExperienceLabel.includes("4") ||
    foreignExperienceLabel.includes("5")
  ) {
    signals.push("Skill transferability may matter more because language gains can stack with education or experience.");
  }

  if (canadianCredentialLabel && !canadianCredentialLabel.includes("no")) {
    signals.push("Canadian education may strengthen profile-controlled gains beyond raw language points.");
  }

  if (programTarget === "cec") {
    signals.push("This roadmap already leans toward Canadian-experience-driven competitiveness.");
  }

  if (programTarget === "pnp" || summary.highestUpsidePath?.id?.includes("pnp")) {
    signals.push("PNP remains powerful, but should be treated as conditional unless stream fit is already actionable.");
  }

  if (typeof rawForm?.jobOfferTeer === "string" && rawForm.jobOfferTeer.length > 0) {
    signals.push("Occupation and TEER context may influence whether category or employer-linked options deserve more attention.");
  }

  if (rawForm?.spouseHasLanguageTest === "yes" || rawForm?.spouseHasCanadianWork === "yes") {
    signals.push("Spouse-related optimization may be worth reviewing if those factors are already part of your profile.");
  }

  return signals.slice(0, 6);
}

export function buildStrategyContext(
  input: StrategyContextInput | null | undefined,
  latestRoadmap?: StoredRoadmap | null
): AIStrategyContext {
  const liveProfile = input?.profile ? buildProfile(input.profile) : null;
  const snapshot = latestRoadmap?.profile_snapshot ?? null;

  const snapshotProfile =
    snapshot && (typeof snapshot.baseCrs === "number" || typeof snapshot.effectiveBaseCrs === "number")
      ? buildProfile({
          baseCrs:
            typeof snapshot.effectiveBaseCrs === "number"
              ? snapshot.effectiveBaseCrs
              : snapshot.baseCrs,
          ieltsClb: snapshot.ieltsClb,
          frenchClb: snapshot.frenchClb,
          canExpYears: snapshot.canExpYears,
          hasJobOffer: snapshot.hasJobOffer,
          hasPnp: snapshot.hasPnp,
        })
      : null;

  const profile = liveProfile ?? snapshotProfile;

  if (!profile || !Number.isFinite(profile.baseCrs) || profile.baseCrs <= 0) {
    throw new Error("Invalid strategy context");
  }

  const lang = input?.lang ?? snapshot?.lang ?? "en";
  const programTarget = input?.program_target ?? (latestRoadmap?.program_target as ProgramKey | null) ?? "general";
  const simulation = simulateTop(profile, lang, 5);
  const normalizedSavedScenarios = normalizeScenarios(
    latestRoadmap?.top_scenarios ?? undefined,
    simulation.baseCrs
  );
  const scenarios =
    normalizedSavedScenarios.length > 0
      ? normalizedSavedScenarios
      : normalizeScenarios(simulation.top, simulation.baseCrs);

  if (!Number.isFinite(simulation.baseCrs) || simulation.baseCrs <= 0 || scenarios.length === 0) {
    throw new Error("Invalid strategy context");
  }

  const recommendationSummary = buildRecommendationSummary(scenarios, {
    englishClb: profile.ieltsClb,
    frenchClb: profile.frenchClb,
    canadianExperienceYears: profile.canExpYears,
    hasJobOffer: profile.hasJobOffer,
    hasPnp: profile.hasPnp,
    educationLabel: input?.profile?.educationLabel ?? snapshot?.educationLabel,
    foreignExperienceLabel:
      input?.profile?.foreignExperienceLabel ?? snapshot?.foreignExperienceLabel,
    canadianCredentialLabel:
      input?.profile?.canadianCredentialLabel ?? snapshot?.canadianCredentialLabel,
    profileModeLabel: input?.profile?.profileModeLabel ?? snapshot?.profileModeLabel,
    rawForm: input?.profile?.rawForm ?? snapshot?.rawForm ?? null,
    programTarget,
  });
  const eligibility = buildExpressEntryEligibility({
    currentCrs: simulation.baseCrs,
    englishClb: profile.ieltsClb,
    frenchClb: profile.frenchClb,
    canadianExperienceYears: profile.canExpYears,
    educationLabel: input?.profile?.educationLabel ?? snapshot?.educationLabel,
    foreignExperienceLabel:
      input?.profile?.foreignExperienceLabel ?? snapshot?.foreignExperienceLabel,
    rawForm: input?.profile?.rawForm ?? snapshot?.rawForm ?? null,
  });

  return {
    current_crs: simulation.baseCrs,
    program_target: programTarget,
    source: liveProfile ? "live_profile" : "saved_roadmap",
    benchmark_general:
      typeof input?.benchmark_general === "number" ? input.benchmark_general : undefined,
    benchmark_category:
      typeof input?.benchmark_category === "number" ? input.benchmark_category : undefined,
    scenarios,
    best_realistic_path: recommendationSummary.bestRealisticPath?.title,
    highest_upside_path: recommendationSummary.highestUpsidePath?.title,
    fastest_start_path: recommendationSummary.fastestStartPath?.title,
    parallel_path: recommendationSummary.parallelPath?.title,
    english_threshold_signal: englishThresholdSignal(profile.ieltsClb),
    french_threshold_signal: frenchThresholdSignal(profile.frenchClb),
    profile_signals: buildProfileSignals(profile, input?.profile, programTarget, recommendationSummary),
    program_eligibility_signals: expressEntryEligibilitySignals(eligibility),
    profile: {
      current_crs: simulation.baseCrs,
      english_clb: profile.ieltsClb,
      french_clb: profile.frenchClb,
      canadian_experience_years: profile.canExpYears,
      job_offer: profile.hasJobOffer,
      pnp: profile.hasPnp,
      language: lang,
      education_label: input?.profile?.educationLabel ?? snapshot?.educationLabel,
      foreign_experience_label:
        input?.profile?.foreignExperienceLabel ?? snapshot?.foreignExperienceLabel,
      canadian_credential_label:
        input?.profile?.canadianCredentialLabel ?? snapshot?.canadianCredentialLabel,
      profile_mode_label: input?.profile?.profileModeLabel ?? snapshot?.profileModeLabel,
    },
    latest_saved_roadmap_at: latestRoadmap?.created_at ?? undefined,
  };
}
