export type StrategyPresentationScenario = {
  id?: string;
  title?: string;
  delta?: number;
  eligible?: boolean;
};

export type StrategyPresentationProfile = {
  englishClb?: number;
  frenchClb?: number;
  canadianExperienceYears?: number;
  hasJobOffer?: boolean;
  hasPnp?: boolean;
  educationLabel?: string;
  foreignExperienceLabel?: string;
  canadianCredentialLabel?: string;
  profileModeLabel?: string;
  rawForm?: Record<string, unknown> | null;
  programTarget?: string;
};

type NormalizedScenario = {
  id: string;
  title: string;
  delta: number;
  eligible: boolean;
  kind: "pnp" | "french" | "english" | "experience" | "job" | "general";
};

export type RecommendationSummary = {
  bestRealisticPath: NormalizedScenario | null;
  highestUpsidePath: NormalizedScenario | null;
  fastestStartPath: NormalizedScenario | null;
  parallelPath: NormalizedScenario | null;
};

function scenarioKind(input: StrategyPresentationScenario) {
  const source = `${input.id ?? ""} ${input.title ?? ""}`.toLowerCase();

  if (source.includes("pnp") || source.includes("nomination")) return "pnp";
  if (source.includes("french")) return "french";
  if (source.includes("english") || source.includes("ielts")) return "english";
  if (source.includes("experience") || source.includes("cec")) return "experience";
  if (source.includes("job")) return "job";
  return "general";
}

function impactScore(delta: number) {
  if (delta >= 500) return 5;
  if (delta >= 60) return 4;
  if (delta >= 35) return 3;
  if (delta >= 15) return 2;
  return 1;
}

function englishThresholdProximity(clb: number) {
  if (clb >= 9) return 1.6;
  if (clb === 8) return 5;
  if (clb === 7) return 4.6;
  if (clb >= 5) return 3.6;
  return 2.6;
}

function frenchThresholdProximity(clb: number) {
  if (clb >= 7) return 2.4;
  if (clb === 6) return 4.7;
  if (clb === 5) return 4.1;
  if (clb >= 3) return 3.4;
  return 2.4;
}

function controlScore(
  scenario: NormalizedScenario,
  profile: StrategyPresentationProfile
) {
  switch (scenario.kind) {
    case "english":
    case "french":
      return 5;
    case "experience":
      return 4;
    case "job":
      return profile.hasJobOffer ? 3.5 : 2;
    case "pnp":
      return 1.6;
    default:
      return 2.8;
  }
}

function includesText(value: string | undefined, fragments: string[]) {
  const source = value?.toLowerCase() ?? "";
  return fragments.some((fragment) => source.includes(fragment));
}

function transferabilityScore(
  scenario: NormalizedScenario,
  profile: StrategyPresentationProfile
) {
  const hasStrongEducation =
    includesText(profile.educationLabel, ["bachelor", "master", "phd", "degree"]) ||
    includesText(profile.canadianCredentialLabel, ["one-year", "two-year", "bachelor", "master"]);
  const hasForeignExperience =
    includesText(profile.foreignExperienceLabel, ["1 year", "2 years", "3 years", "4 years", "5 years", "or more"]) ||
    includesText(profile.foreignExperienceLabel, ["1 year", "2 years", "3 or more"]);
  const hasCanadianCredential = includesText(profile.canadianCredentialLabel, ["yes", "one", "two", "three", "credential"]);

  if (scenario.kind === "english" || scenario.kind === "french") {
    return (hasStrongEducation ? 0.8 : 0) + (hasForeignExperience ? 1 : 0) + (hasCanadianCredential ? 0.6 : 0);
  }

  if (scenario.kind === "experience") {
    return hasForeignExperience ? 1 : 0.4;
  }

  return 0;
}

function categoryRelevanceScore(
  scenario: NormalizedScenario,
  profile: StrategyPresentationProfile
) {
  const rawForm = profile.rawForm ?? {};
  const programTarget = (profile.programTarget ?? "").toLowerCase();
  const hasCertificate = rawForm.hasCertificateOfQualification === "yes";
  const hasTeerContext = typeof rawForm.jobOfferTeer === "string" && rawForm.jobOfferTeer.length > 0;

  if (scenario.kind === "french") {
    return profile.frenchClb && profile.frenchClb >= 5 ? 1.4 : 0.4;
  }

  if (scenario.kind === "experience") {
    return programTarget === "category" || programTarget === "cec" ? 1.2 : 0.4;
  }

  if (scenario.kind === "job") {
    return hasTeerContext ? 1.3 : 0.5;
  }

  if (scenario.kind === "general") {
    return hasCertificate ? 1 : 0.2;
  }

  return 0;
}

function actionabilityScore(
  scenario: NormalizedScenario,
  profile: StrategyPresentationProfile
) {
  const english = profile.englishClb ?? 0;
  const french = profile.frenchClb ?? 0;
  const experience = profile.canadianExperienceYears ?? 0;

  switch (scenario.kind) {
    case "pnp":
      return Math.min(
        3.2,
        1 +
          (profile.hasJobOffer ? 0.5 : 0) +
          (experience > 0 ? 0.5 : 0) +
          (french >= 7 ? 0.6 : 0) +
          (english >= 9 ? 0.4 : 0)
      );
    case "french":
      return frenchThresholdProximity(french);
    case "english":
      return englishThresholdProximity(english);
    case "experience":
      return experience > 0 ? 3.8 : 3.2;
    case "job":
      return profile.hasJobOffer ? 4.2 : 2.4;
    default:
      return 3;
  }
}

function timeToStartScore(
  scenario: NormalizedScenario,
  profile: StrategyPresentationProfile
) {
  switch (scenario.kind) {
    case "english":
      return 5;
    case "french":
      return profile.frenchClb && profile.frenchClb > 0 ? 4.4 : 3.4;
    case "experience":
      return 3;
    case "job":
      return profile.hasJobOffer ? 4 : 2.2;
    case "pnp":
      return 1.8;
    default:
      return 2.8;
  }
}

function normalizeScenarios(scenarios: StrategyPresentationScenario[]) {
  return scenarios
    .filter(
      (scenario): scenario is Required<Pick<StrategyPresentationScenario, "id" | "title" | "delta">> &
        StrategyPresentationScenario =>
        typeof scenario.id === "string" &&
        typeof scenario.title === "string" &&
        typeof scenario.delta === "number"
    )
    .map(
      (scenario): NormalizedScenario => ({
        id: scenario.id,
        title: scenario.title,
        delta: scenario.delta,
        eligible: scenario.eligible !== false,
        kind: scenarioKind(scenario),
      })
    )
    .filter((scenario) => scenario.eligible);
}

export function buildRecommendationSummary(
  scenarios: StrategyPresentationScenario[],
  profile: StrategyPresentationProfile
): RecommendationSummary {
  const normalized = normalizeScenarios(scenarios);

  if (!normalized.length) {
    return {
      bestRealisticPath: null,
      highestUpsidePath: null,
      fastestStartPath: null,
      parallelPath: null,
    };
  }

  const highestUpsidePath = normalized.reduce((best, current) =>
    current.delta > best.delta ? current : best
  );

  const bestRealisticPath = [...normalized].sort((a, b) => {
    const aScore =
      actionabilityScore(a, profile) * 0.42 +
      controlScore(a, profile) * 0.28 +
      impactScore(a.delta) * 0.18 +
      timeToStartScore(a, profile) * 0.08 +
      transferabilityScore(a, profile) * 0.03 +
      categoryRelevanceScore(a, profile) * 0.01;
    const bScore =
      actionabilityScore(b, profile) * 0.42 +
      controlScore(b, profile) * 0.28 +
      impactScore(b.delta) * 0.18 +
      timeToStartScore(b, profile) * 0.08 +
      transferabilityScore(b, profile) * 0.03 +
      categoryRelevanceScore(b, profile) * 0.01;

    return bScore - aScore;
  })[0];

  const fastestStartPath = [...normalized]
    .sort((a, b) => timeToStartScore(b, profile) - timeToStartScore(a, profile))[0];

  const parallelPath =
    normalized.find(
      (scenario) =>
        scenario.id !== bestRealisticPath.id &&
        scenario.id !== highestUpsidePath.id &&
        scenario.kind === "pnp"
    ) ??
    normalized.find(
      (scenario) =>
        scenario.id !== bestRealisticPath.id && scenario.id !== highestUpsidePath.id
    ) ??
    null;

  return {
    bestRealisticPath,
    highestUpsidePath,
    fastestStartPath,
    parallelPath,
  };
}
