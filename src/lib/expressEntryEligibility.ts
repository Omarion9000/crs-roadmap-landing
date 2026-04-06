export type ExpressEntryProgramId = "cec" | "fsw" | "fst";

export type ExpressEntryEligibilityStatus =
  | "eligible"
  | "not_eligible"
  | "needs_review";

export type ExpressEntryEligibilityItem = {
  id: ExpressEntryProgramId;
  label: string;
  status: ExpressEntryEligibilityStatus;
  summary: string;
  reasons: string[];
  unmetRequirements: string[];
  supportLevel?: "high" | "medium" | "low";
};

export type ExpressEntryEligibilityInput = {
  currentCrs?: number | null;
  englishClb?: number | null;
  frenchClb?: number | null;
  canadianExperienceYears?: number | null;
  educationLabel?: string | null;
  foreignExperienceLabel?: string | null;
  rawForm?: Record<string, unknown> | null;
};

function parseForeignExperienceYears(label?: string | null) {
  const source = (label ?? "").toLowerCase();

  if (source.includes("3") || source.includes("4") || source.includes("5")) return 3;
  if (source.includes("2")) return 2;
  if (source.includes("1")) return 1;
  return 0;
}

function hasPostSecondaryEducation(label?: string | null) {
  const source = (label ?? "").toLowerCase();

  return (
    source.includes("one-year") ||
    source.includes("two-year") ||
    source.includes("bachelor") ||
    source.includes("master") ||
    source.includes("phd") ||
    source.includes("degree") ||
    source.includes("professional")
  );
}

function strongestLanguageClb(input: ExpressEntryEligibilityInput) {
  return Math.max(input.englishClb ?? 0, input.frenchClb ?? 0);
}

function rawValue(
  rawForm: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = rawForm?.[key];
  return typeof value === "string" ? value : "";
}

function evaluateCec(
  input: ExpressEntryEligibilityInput
): ExpressEntryEligibilityItem {
  const canadianExperienceYears = input.canadianExperienceYears ?? 0;
  const strongestLanguage = strongestLanguageClb(input);
  const unmetRequirements: string[] = [];
  const reasons: string[] = [];

  if (canadianExperienceYears < 1) {
    unmetRequirements.push("Requires at least 1 year of qualifying Canadian work experience.");
  } else {
    reasons.push("Your profile already shows at least 1 year of Canadian work experience.");
  }

  if (strongestLanguage >= 7) {
    reasons.push("Your language profile looks strong enough for a likely CEC baseline review.");
  } else if (strongestLanguage >= 5) {
    reasons.push("Your language profile may support some CEC work categories, but this needs review.");
  } else {
    unmetRequirements.push("Likely needs stronger official-language results before CEC looks realistic.");
  }

  if (canadianExperienceYears >= 1 && strongestLanguage >= 7) {
    return {
      id: "cec",
      label: "Canadian Experience Class",
      status: "eligible",
      summary: "Based on your current profile, CEC looks like a likely federal pathway.",
      reasons,
      unmetRequirements: [],
      supportLevel: "high",
    };
  }

  if (canadianExperienceYears >= 1 && strongestLanguage >= 5) {
    return {
      id: "cec",
      label: "Canadian Experience Class",
      status: "needs_review",
      summary: "CEC may be within reach, but the exact work-category and language baseline still need review.",
      reasons,
      unmetRequirements,
      supportLevel: "medium",
    };
  }

  return {
    id: "cec",
    label: "Canadian Experience Class",
    status: "not_eligible",
    summary: "CEC does not appear open yet based on your current profile.",
    reasons,
    unmetRequirements,
    supportLevel: "high",
  };
}

function evaluateFsw(
  input: ExpressEntryEligibilityInput
): ExpressEntryEligibilityItem {
  const strongestLanguage = strongestLanguageClb(input);
  const foreignExperienceYears = parseForeignExperienceYears(
    input.foreignExperienceLabel
  );
  const canadianExperienceYears = input.canadianExperienceYears ?? 0;
  const totalExperienceYears = Math.max(
    foreignExperienceYears,
    canadianExperienceYears
  );
  const hasEducation = hasPostSecondaryEducation(input.educationLabel);
  const unmetRequirements: string[] = [];
  const reasons: string[] = [];

  if (totalExperienceYears >= 1) {
    reasons.push("Your profile shows at least 1 year of work experience that may support FSW review.");
  } else {
    unmetRequirements.push("Needs at least 1 year of qualifying skilled work experience for a stronger FSW case.");
  }

  if (strongestLanguage >= 7) {
    reasons.push("Your official-language level looks compatible with an FSW baseline review.");
  } else {
    unmetRequirements.push("Likely needs stronger official-language results to support FSW.");
  }

  if (hasEducation) {
    reasons.push("Your education profile supports a likely FSW-style pathway review.");
  } else {
    unmetRequirements.push("Needs more education detail before FSW can be assessed confidently.");
  }

  if (foreignExperienceYears >= 1 && strongestLanguage >= 7 && hasEducation) {
    return {
      id: "fsw",
      label: "Federal Skilled Worker",
      status: "eligible",
      summary: "Your current profile appears compatible with the Federal Skilled Worker pathway.",
      reasons,
      unmetRequirements: [],
      supportLevel: "medium",
    };
  }

  if (totalExperienceYears >= 1 && (strongestLanguage >= 7 || hasEducation)) {
    return {
      id: "fsw",
      label: "Federal Skilled Worker",
      status: "needs_review",
      summary: "FSW may be available, but some baseline eligibility details still need review.",
      reasons,
      unmetRequirements,
      supportLevel: "medium",
    };
  }

  return {
    id: "fsw",
    label: "Federal Skilled Worker",
    status: "not_eligible",
    summary: "FSW is not clearly supported by your current profile yet.",
    reasons,
    unmetRequirements,
    supportLevel: "medium",
  };
}

function evaluateFst(
  input: ExpressEntryEligibilityInput
): ExpressEntryEligibilityItem {
  const rawForm = input.rawForm ?? null;
  const strongestLanguage = strongestLanguageClb(input);
  const hasCertificateOfQualification =
    rawValue(rawForm, "hasCertificateOfQualification") === "yes";
  const hasValidJobOffer = rawValue(rawForm, "hasValidJobOffer") === "yes";
  const jobOfferTeer = rawValue(rawForm, "jobOfferTeer");
  const foreignExperienceYears = parseForeignExperienceYears(
    input.foreignExperienceLabel
  );
  const canadianExperienceYears = input.canadianExperienceYears ?? 0;
  const hasRelevantExperience =
    foreignExperienceYears >= 1 || canadianExperienceYears >= 1;
  const unmetRequirements: string[] = [];
  const reasons: string[] = [];

  if (hasCertificateOfQualification) {
    reasons.push("Your profile includes a certificate-of-qualification signal, which matters for FST.");
  } else {
    unmetRequirements.push("Usually needs trade-specific evidence such as a certificate of qualification.");
  }

  if (hasValidJobOffer && jobOfferTeer) {
    reasons.push("A valid job-offer signal is present, which may support an FST review.");
  } else if (!hasValidJobOffer) {
    unmetRequirements.push("May also depend on a trade-specific qualifying job offer or equivalent support.");
  }

  if (hasRelevantExperience) {
    reasons.push("Your profile already shows work experience that could support a skilled-trades review.");
  } else {
    unmetRequirements.push("Needs stronger trade-related work-experience evidence.");
  }

  if (strongestLanguage >= 5) {
    reasons.push("Your language profile meets a conservative FST-style baseline signal.");
  } else {
    unmetRequirements.push("Likely needs stronger official-language support for FST.");
  }

  if (hasCertificateOfQualification && hasRelevantExperience && strongestLanguage >= 5) {
    return {
      id: "fst",
      label: "Federal Skilled Trades",
      status: "eligible",
      summary: "FST may be a real option, but it still depends on trade-specific verification.",
      reasons,
      unmetRequirements: [],
      supportLevel: "low",
    };
  }

  if (hasCertificateOfQualification || hasValidJobOffer) {
    return {
      id: "fst",
      label: "Federal Skilled Trades",
      status: "needs_review",
      summary: "FST depends on trade-specific qualifications and supporting conditions that need review.",
      reasons,
      unmetRequirements,
      supportLevel: "low",
    };
  }

  return {
    id: "fst",
    label: "Federal Skilled Trades",
    status: "not_eligible",
    summary: "FST is not clearly supported by your current profile right now.",
    reasons,
    unmetRequirements,
    supportLevel: "low",
  };
}

export function buildExpressEntryEligibility(
  input: ExpressEntryEligibilityInput
): ExpressEntryEligibilityItem[] {
  return [evaluateCec(input), evaluateFsw(input), evaluateFst(input)];
}

export function expressEntryEligibilitySignals(
  items: ExpressEntryEligibilityItem[]
) {
  const signals: string[] = [];

  const cec = items.find((item) => item.id === "cec");
  const fsw = items.find((item) => item.id === "fsw");
  const fst = items.find((item) => item.id === "fst");

  if (cec?.status === "not_eligible") {
    signals.push("CEC does not look open yet, so it should be treated as a future path rather than the immediate federal baseline.");
  } else if (cec?.status === "eligible") {
    signals.push("CEC appears open based on your current profile, so Canadian-experience moves can be treated as part of your active federal options.");
  }

  if (fsw?.status === "eligible") {
    signals.push("FSW appears open from your current profile, so the main question is improving competitiveness rather than unlocking baseline access.");
  } else if (fsw?.status === "needs_review") {
    signals.push("FSW may be available, but some baseline eligibility details still need review before treating it as fully open.");
  }

  if (fst?.status !== "eligible") {
    signals.push("FST should stay secondary unless trade-specific qualifications are clearly supported in your profile.");
  }

  return signals.slice(0, 3);
}
