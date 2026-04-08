"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useLanguage } from "@/lib/i18n/context";

type YesNo = "yes" | "no" | "";

type MaritalStatus =
  | "annulled-marriage"
  | "common-law"
  | "divorced-separated"
  | "legally-separated"
  | "married"
  | "never-married-single"
  | "widowed"
  | "";

type FirstLanguageTest =
  | "celpip-g"
  | "ielts"
  | "pte-core"
  | "tef-canada"
  | "tcf-canada"
  | "";

type SecondLanguageTest =
  | "none"
  | "celpip-g"
  | "ielts"
  | "pte-core"
  | "tef-canada"
  | "tcf-canada"
  | "";

type SpouseLanguageTest =
  | "celpip-g"
  | "ielts"
  | "pte-core"
  | "tef-canada"
  | "tcf-canada"
  | "not-applicable"
  | "";

type EducationLevel =
  | "secondary"
  | "one-year"
  | "two-year"
  | "bachelors-or-three-plus"
  | "two-or-more"
  | "masters-professional"
  | "phd"
  | "";

type CanadianCredentialLevel =
  | "secondary-or-less"
  | "one-or-two-year"
  | "three-plus-or-masters-phd"
  | "";

type SpouseEducationLevel =
  | "none-or-less-than-secondary"
  | "secondary"
  | "one-year"
  | "two-year"
  | "bachelors-or-three-plus"
  | "two-or-more"
  | "masters-professional"
  | "phd"
  | "";

type AgeOption =
  | "17-or-less"
  | "18"
  | "19"
  | "20"
  | "21"
  | "22"
  | "23"
  | "24"
  | "25"
  | "26"
  | "27"
  | "28"
  | "29"
  | "30"
  | "31"
  | "32"
  | "33"
  | "34"
  | "35"
  | "36"
  | "37"
  | "38"
  | "39"
  | "40"
  | "41"
  | "42"
  | "43"
  | "44"
  | "45-or-more"
  | "";

type ExperienceCanadaOption =
  | "none-or-less-than-one"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5-or-more"
  | "";

type ExperienceForeignOption =
  | "none-or-less-than-one"
  | "1"
  | "2"
  | "3-or-more"
  | "";

type JobOfferTeer =
  | "major-group-00"
  | "teer-0-1-2-3-other"
  | "teer-4-5"
  | "";

type ScoreOption =
  | ""
  | "clb-0-3"
  | "clb-4"
  | "clb-5"
  | "clb-6"
  | "clb-7"
  | "clb-8"
  | "clb-9"
  | "clb-10-plus";

type CalculatorData = {
  maritalStatus: MaritalStatus;
  spouseIsCitizenOrPr: YesNo;
  spouseComing: YesNo;
  age: AgeOption;
  educationLevel: EducationLevel;
  hasCanadianCredential: YesNo;
  canadianCredentialLevel: CanadianCredentialLevel;
  languageResultsValid: YesNo;
  firstLanguageTest: FirstLanguageTest;
  firstSpeaking: ScoreOption;
  firstListening: ScoreOption;
  firstReading: ScoreOption;
  firstWriting: ScoreOption;
  secondLanguageTest: SecondLanguageTest;
  secondSpeaking: ScoreOption;
  secondListening: ScoreOption;
  secondReading: ScoreOption;
  secondWriting: ScoreOption;
  canadianExperience: ExperienceCanadaOption;
  foreignExperience: ExperienceForeignOption;
  hasCertificateOfQualification: YesNo;
  hasValidJobOffer: YesNo;
  jobOfferTeer: JobOfferTeer;
  hasProvincialNomination: YesNo;
  hasSiblingInCanada: YesNo;
  spouseEducationLevel: SpouseEducationLevel;
  spouseCanadianExperience: ExperienceCanadaOption;
  spouseLanguageTest: SpouseLanguageTest;
  spouseSpeaking: ScoreOption;
  spouseListening: ScoreOption;
  spouseReading: ScoreOption;
  spouseWriting: ScoreOption;
};

const steps = [
  "About you",
  "Education",
  "Official languages",
  "Work experience",
  "Additional factors",
  "Spouse factors",
  "Results",
] as const;

const ageOptions: Array<{ value: AgeOption; label: string }> = [
  { value: "17-or-less", label: "17 or less" },
  { value: "18", label: "18" },
  { value: "19", label: "19" },
  { value: "20", label: "20" },
  { value: "21", label: "21" },
  { value: "22", label: "22" },
  { value: "23", label: "23" },
  { value: "24", label: "24" },
  { value: "25", label: "25" },
  { value: "26", label: "26" },
  { value: "27", label: "27" },
  { value: "28", label: "28" },
  { value: "29", label: "29" },
  { value: "30", label: "30" },
  { value: "31", label: "31" },
  { value: "32", label: "32" },
  { value: "33", label: "33" },
  { value: "34", label: "34" },
  { value: "35", label: "35" },
  { value: "36", label: "36" },
  { value: "37", label: "37" },
  { value: "38", label: "38" },
  { value: "39", label: "39" },
  { value: "40", label: "40" },
  { value: "41", label: "41" },
  { value: "42", label: "42" },
  { value: "43", label: "43" },
  { value: "44", label: "44" },
  { value: "45-or-more", label: "45 or more" },
];

const firstLanguageTests: Array<{ value: FirstLanguageTest; label: string }> = [
  { value: "celpip-g", label: "CELPIP-G" },
  { value: "ielts", label: "IELTS General" },
  { value: "pte-core", label: "PTE Core" },
  { value: "tef-canada", label: "TEF Canada" },
  { value: "tcf-canada", label: "TCF Canada" },
];

const secondLanguageTests: Array<{ value: SecondLanguageTest; label: string }> = [
  { value: "none", label: "No second official language results" },
  { value: "celpip-g", label: "CELPIP-G" },
  { value: "ielts", label: "IELTS General" },
  { value: "pte-core", label: "PTE Core" },
  { value: "tef-canada", label: "TEF Canada" },
  { value: "tcf-canada", label: "TCF Canada" },
];

const spouseLanguageTests: Array<{ value: SpouseLanguageTest; label: string }> = [
  { value: "not-applicable", label: "Not applicable" },
  { value: "celpip-g", label: "CELPIP-G" },
  { value: "ielts", label: "IELTS General" },
  { value: "pte-core", label: "PTE Core" },
  { value: "tef-canada", label: "TEF Canada" },
  { value: "tcf-canada", label: "TCF Canada" },
];

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/70">
        {eyebrow}
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
        {subtitle}
      </p>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-2 block text-sm font-medium text-white/80">{children}</label>;
}

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/10"
    >
      {children}
    </select>
  );
}

function scoreLabel(score: ScoreOption) {
  switch (score) {
    case "clb-0-3":
      return "CLB 0–3";
    case "clb-4":
      return "CLB 4";
    case "clb-5":
      return "CLB 5";
    case "clb-6":
      return "CLB 6";
    case "clb-7":
      return "CLB 7";
    case "clb-8":
      return "CLB 8";
    case "clb-9":
      return "CLB 9";
    case "clb-10-plus":
      return "CLB 10+";
    default:
      return "—";
  }
}

function ScoresGrid({
  speaking,
  listening,
  reading,
  writing,
  onChange,
}: {
  speaking: ScoreOption;
  listening: ScoreOption;
  reading: ScoreOption;
  writing: ScoreOption;
  onChange: (
    field: "speaking" | "listening" | "reading" | "writing",
    value: ScoreOption
  ) => void;
}) {
  const options: Array<{ value: ScoreOption; label: string }> = [
    { value: "", label: "Select level" },
    { value: "clb-0-3", label: "CLB 0–3" },
    { value: "clb-4", label: "CLB 4" },
    { value: "clb-5", label: "CLB 5" },
    { value: "clb-6", label: "CLB 6" },
    { value: "clb-7", label: "CLB 7" },
    { value: "clb-8", label: "CLB 8" },
    { value: "clb-9", label: "CLB 9" },
    { value: "clb-10-plus", label: "CLB 10+" },
  ];

  const fields: Array<{
    key: "speaking" | "listening" | "reading" | "writing";
    label: string;
    value: ScoreOption;
  }> = [
    { key: "speaking", label: "Speaking", value: speaking },
    { key: "listening", label: "Listening", value: listening },
    { key: "reading", label: "Reading", value: reading },
    { key: "writing", label: "Writing", value: writing },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.key}>
          <FieldLabel>{field.label}</FieldLabel>
          <SelectField
            value={field.value}
            onChange={(value) => onChange(field.key, value as ScoreOption)}
          >
            {options.map((option) => (
              <option key={option.value || "empty"} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </div>
      ))}
    </div>
  );
}

// ─── CLB numeric helper ──────────────────────────────────────────────────────
function clbNumeric(clb: ScoreOption): number {
  switch (clb) {
    case "clb-10-plus": return 10;
    case "clb-9":       return 9;
    case "clb-8":       return 8;
    case "clb-7":       return 7;
    case "clb-6":       return 6;
    case "clb-5":       return 5;
    case "clb-4":       return 4;
    case "clb-0-3":     return 3;
    default:            return 0;
  }
}

function isTreatedAsNoSpouse(form: CalculatorData) {
  return (
    (form.maritalStatus !== "married" && form.maritalStatus !== "common-law") ||
    form.spouseComing === "no" ||
    form.spouseIsCitizenOrPr === "yes"
  );
}

function firstLanguagePointsPerAbility(
  clb: ScoreOption,
  treatedAsNoSpouse: boolean
) {
  if (clb === "clb-0-3") return 0;
  if (clb === "clb-4" || clb === "clb-5") return 6;
  if (clb === "clb-6") return treatedAsNoSpouse ? 9 : 8;
  if (clb === "clb-7") return treatedAsNoSpouse ? 17 : 16;
  if (clb === "clb-8") return treatedAsNoSpouse ? 23 : 22;
  if (clb === "clb-9") return treatedAsNoSpouse ? 31 : 29;
  if (clb === "clb-10-plus") return treatedAsNoSpouse ? 34 : 32;
  return 0;
}

function secondLanguagePointsPerAbility(clb: ScoreOption) {
  if (!clb || clb === "clb-0-3" || clb === "clb-4") return 0;
  if (clb === "clb-5" || clb === "clb-6") return 1;
  if (clb === "clb-7" || clb === "clb-8") return 3;
  if (clb === "clb-9" || clb === "clb-10-plus") return 6;
  return 0;
}

// Official cap for second official language is 22 pts for both with/without spouse
function cappedSecondLanguageTotal(scores: ScoreOption[]) {
  const raw = scores.reduce((sum, s) => sum + secondLanguagePointsPerAbility(s), 0);
  return Math.min(raw, 22);
}

function agePoints(age: AgeOption, treatedAsNoSpouse: boolean) {
  const withSpouse: Record<Exclude<AgeOption, "">, number> = {
    "17-or-less": 0,
    "18": 90,  "19": 95,  "20": 100, "21": 100, "22": 100,
    "23": 100, "24": 100, "25": 100, "26": 100, "27": 100,
    "28": 100, "29": 100, "30": 95,  "31": 90,  "32": 85,
    "33": 80,  "34": 75,  "35": 70,  "36": 65,  "37": 60,
    "38": 55,  "39": 50,  "40": 45,  "41": 35,  "42": 25,
    "43": 15,  "44": 5,   "45-or-more": 0,
  };

  const withoutSpouse: Record<Exclude<AgeOption, "">, number> = {
    "17-or-less": 0,
    "18": 99,  "19": 105, "20": 110, "21": 110, "22": 110,
    "23": 110, "24": 110, "25": 110, "26": 110, "27": 110,
    "28": 110, "29": 110, "30": 105, "31": 99,  "32": 94,
    "33": 88,  "34": 83,  "35": 77,  "36": 72,  "37": 66,
    "38": 61,  "39": 55,  "40": 50,  "41": 39,  "42": 28,
    "43": 17,  "44": 6,   "45-or-more": 0,
  };

  if (!age) return 0;
  return treatedAsNoSpouse ? withoutSpouse[age] : withSpouse[age];
}

function educationPoints(education: EducationLevel, treatedAsNoSpouse: boolean) {
  const withSpouse: Record<Exclude<EducationLevel, "">, number> = {
    secondary: 28, "one-year": 84, "two-year": 91,
    "bachelors-or-three-plus": 112, "two-or-more": 119,
    "masters-professional": 126, phd: 140,
  };
  const withoutSpouse: Record<Exclude<EducationLevel, "">, number> = {
    secondary: 30, "one-year": 90, "two-year": 98,
    "bachelors-or-three-plus": 120, "two-or-more": 128,
    "masters-professional": 135, phd: 150,
  };
  if (!education) return 0;
  return treatedAsNoSpouse ? withoutSpouse[education] : withSpouse[education];
}

function canadianExperiencePoints(exp: ExperienceCanadaOption, treatedAsNoSpouse: boolean) {
  const withSpouse: Record<Exclude<ExperienceCanadaOption, "">, number> = {
    "none-or-less-than-one": 0, "1": 35, "2": 46, "3": 56, "4": 63, "5-or-more": 70,
  };
  const withoutSpouse: Record<Exclude<ExperienceCanadaOption, "">, number> = {
    "none-or-less-than-one": 0, "1": 40, "2": 53, "3": 64, "4": 72, "5-or-more": 80,
  };
  if (!exp) return 0;
  return treatedAsNoSpouse ? withoutSpouse[exp] : withSpouse[exp];
}

function spouseEducationPoints(education: SpouseEducationLevel) {
  const map: Record<Exclude<SpouseEducationLevel, "">, number> = {
    "none-or-less-than-secondary": 0, secondary: 2, "one-year": 6, "two-year": 7,
    "bachelors-or-three-plus": 8, "two-or-more": 9, "masters-professional": 10, phd: 10,
  };
  if (!education) return 0;
  return map[education];
}

function spouseLanguagePerAbility(clb: ScoreOption) {
  if (!clb || clb === "clb-0-3" || clb === "clb-4") return 0;
  if (clb === "clb-5" || clb === "clb-6") return 1;
  if (clb === "clb-7" || clb === "clb-8") return 3;
  if (clb === "clb-9" || clb === "clb-10-plus") return 5;
  return 0;
}

function spouseCanadianExperiencePoints(exp: ExperienceCanadaOption) {
  const map: Record<Exclude<ExperienceCanadaOption, "">, number> = {
    "none-or-less-than-one": 0, "1": 5, "2": 7, "3": 8, "4": 9, "5-or-more": 10,
  };
  if (!exp) return 0;
  return map[exp];
}

// ─── Skill Transferability (max 100 pts) ─────────────────────────────────────
// Education tier: 0 = none/secondary, 1 = 1+ yr credential (incl. bachelor's), 2 = 2+ credentials / Master's / PhD
function educationTransferTier(edu: EducationLevel): 0 | 1 | 2 {
  if (!edu || edu === "secondary") return 0;
  if (edu === "one-year" || edu === "two-year" || edu === "bachelors-or-three-plus") return 1;
  return 2; // two-or-more, masters-professional, phd
}

// FWE tier: 0 = none, 1 = 1-2 yrs, 2 = 3+ yrs
function foreignExpTransferTier(exp: ExperienceForeignOption): 0 | 1 | 2 {
  if (!exp || exp === "none-or-less-than-one") return 0;
  if (exp === "1" || exp === "2") return 1;
  return 2; // 3-or-more
}

function cweYearsNum(exp: ExperienceCanadaOption): number {
  switch (exp) {
    case "1": return 1; case "2": return 2; case "3": return 3;
    case "4": return 4; case "5-or-more": return 5;
    default: return 0;
  }
}

function skillTransferabilityPoints(form: CalculatorData): number {
  const langValid = form.languageResultsValid === "yes";
  const eduTier = educationTransferTier(form.educationLevel);
  const fweTier = foreignExpTransferTier(form.foreignExperience);
  const cweYrs = cweYearsNum(form.canadianExperience);

  const firstAbilities: ScoreOption[] = [
    form.firstSpeaking, form.firstListening, form.firstReading, form.firstWriting,
  ];
  const hasAllFirst = firstAbilities.every(a => !!a);
  const minFirstClb = langValid && hasAllFirst
    ? Math.min(...firstAbilities.map(clbNumeric))
    : 0;

  // Education + Language sub-factor (CLB 7+ required)
  let eduLang = 0;
  if (eduTier >= 1 && langValid && minFirstClb >= 7) {
    eduLang = eduTier === 1
      ? (minFirstClb >= 9 ? 25 : 13)
      : (minFirstClb >= 9 ? 50 : 25);
  }

  // Education + Canadian work experience sub-factor
  let eduCwe = 0;
  if (eduTier >= 1 && cweYrs >= 1) {
    eduCwe = eduTier === 1
      ? (cweYrs >= 2 ? 25 : 13)
      : (cweYrs >= 2 ? 50 : 25);
  }

  // Education category is capped at 50
  const eduTotal = Math.min(eduLang + eduCwe, 50);

  // Foreign work experience + Language sub-factor (CLB 7+ required)
  let fweLang = 0;
  if (fweTier >= 1 && langValid && minFirstClb >= 7) {
    fweLang = fweTier === 1
      ? (minFirstClb >= 9 ? 25 : 13)
      : (minFirstClb >= 9 ? 50 : 25);
  }

  // Foreign work experience + Canadian work experience sub-factor
  let fweCwe = 0;
  if (fweTier >= 1 && cweYrs >= 1) {
    fweCwe = fweTier === 1
      ? (cweYrs >= 2 ? 25 : 13)
      : (cweYrs >= 2 ? 50 : 25);
  }

  // FWE category is capped at 50
  const fweTotal = Math.min(fweLang + fweCwe, 50);

  // Certificate of Qualification + Language (CLB 5+ required)
  let certTotal = 0;
  if (form.hasCertificateOfQualification === "yes" && langValid && hasAllFirst) {
    const allAbove5 = firstAbilities.every(a => clbNumeric(a) >= 5);
    if (allAbove5) {
      certTotal = minFirstClb >= 7 ? 50 : 25;
    }
  }

  return Math.min(eduTotal + fweTotal + certTotal, 100);
}

// ─── French language additional bonus (max 50 pts) ───────────────────────────
function frenchBonusPoints(form: CalculatorData): number {
  if (form.languageResultsValid !== "yes") return 0;
  const isFrench = (t: string) => t === "tef-canada" || t === "tcf-canada";
  const isEnglish = (t: string) => t === "celpip-g" || t === "ielts" || t === "pte-core";

  let frenchAbilities: ScoreOption[] = [];
  let englishAbilities: ScoreOption[] = [];

  if (isFrench(form.firstLanguageTest)) {
    frenchAbilities = [form.firstSpeaking, form.firstListening, form.firstReading, form.firstWriting];
    if (form.secondLanguageTest && form.secondLanguageTest !== "none" && isEnglish(form.secondLanguageTest)) {
      englishAbilities = [form.secondSpeaking, form.secondListening, form.secondReading, form.secondWriting];
    }
  } else if (form.secondLanguageTest && isFrench(form.secondLanguageTest)) {
    frenchAbilities = [form.secondSpeaking, form.secondListening, form.secondReading, form.secondWriting];
    if (isEnglish(form.firstLanguageTest)) {
      englishAbilities = [form.firstSpeaking, form.firstListening, form.firstReading, form.firstWriting];
    }
  } else {
    return 0; // no French test in either language slot
  }

  if (!frenchAbilities.every(a => !!a)) return 0;
  const frenchMin = Math.min(...frenchAbilities.map(clbNumeric));
  if (frenchMin < 7) return 0; // French CLB 7 required minimum

  const englishMin = englishAbilities.length === 4 && englishAbilities.every(a => !!a)
    ? Math.min(...englishAbilities.map(clbNumeric))
    : 0;

  return englishMin >= 5 ? 50 : 25;
}

// ─── Canadian education additional bonus (max 30 pts) ────────────────────────
function canadianEducationBonusPoints(form: CalculatorData): number {
  if (form.hasCanadianCredential !== "yes") return 0;
  if (form.canadianCredentialLevel === "one-or-two-year") return 15;
  if (form.canadianCredentialLevel === "three-plus-or-masters-phd") return 30;
  return 0;
}

// ─── Job offer points ─────────────────────────────────────────────────────────
// Note: IRCC suspended job offer points March 25, 2025. Included for completeness.
function jobOfferBonusPoints(form: CalculatorData): number {
  if (form.hasValidJobOffer !== "yes") return 0;
  if (form.jobOfferTeer === "major-group-00") return 200;
  if (form.jobOfferTeer === "teer-0-1-2-3-other") return 50;
  return 0;
}

function calculateCrsPreview(form: CalculatorData) {
  const treatedAsNoSpouse = isTreatedAsNoSpouse(form);
  const languageValid = form.languageResultsValid === "yes";

  // ── A: Core / Human Capital ──────────────────────────────────────────────
  const age = agePoints(form.age, treatedAsNoSpouse);
  const education = educationPoints(form.educationLevel, treatedAsNoSpouse);

  const firstLanguage = languageValid
    ? firstLanguagePointsPerAbility(form.firstSpeaking, treatedAsNoSpouse) +
      firstLanguagePointsPerAbility(form.firstListening, treatedAsNoSpouse) +
      firstLanguagePointsPerAbility(form.firstReading, treatedAsNoSpouse) +
      firstLanguagePointsPerAbility(form.firstWriting, treatedAsNoSpouse)
    : 0;

  const secondLanguage = languageValid
    ? cappedSecondLanguageTotal([
        form.secondSpeaking,
        form.secondListening,
        form.secondReading,
        form.secondWriting,
      ])
    : 0;

  const canadianExp = canadianExperiencePoints(form.canadianExperience, treatedAsNoSpouse);
  const corePrincipal = age + education + firstLanguage + secondLanguage + canadianExp;

  // ── B: Spouse / Common-law Factors ──────────────────────────────────────
  const spouseEducation = treatedAsNoSpouse ? 0 : spouseEducationPoints(form.spouseEducationLevel);
  const spouseLanguage = treatedAsNoSpouse
    ? 0
    : Math.min(
        spouseLanguagePerAbility(form.spouseSpeaking) +
        spouseLanguagePerAbility(form.spouseListening) +
        spouseLanguagePerAbility(form.spouseReading) +
        spouseLanguagePerAbility(form.spouseWriting),
        20
      );
  const spouseCanadianExp = treatedAsNoSpouse ? 0 : spouseCanadianExperiencePoints(form.spouseCanadianExperience);
  const spouseTotal = spouseEducation + spouseLanguage + spouseCanadianExp;

  // ── C: Skill Transferability (max 100) ──────────────────────────────────
  const skillTransferability = skillTransferabilityPoints(form);

  // ── D: Additional Points ─────────────────────────────────────────────────
  const pnp = form.hasProvincialNomination === "yes" ? 600 : 0;
  const sibling = form.hasSiblingInCanada === "yes" ? 15 : 0;
  const frenchBonus = frenchBonusPoints(form);
  const canadianEdBonus = canadianEducationBonusPoints(form);
  const jobOffer = jobOfferBonusPoints(form);
  const additional = pnp + sibling + frenchBonus + canadianEdBonus + jobOffer;

  return {
    treatedAsNoSpouse,
    age,
    education,
    firstLanguage,
    secondLanguage,
    canadianExp,
    spouseEducation,
    spouseLanguage,
    spouseCanadianExp,
    skillTransferability,
    pnp,
    sibling,
    frenchBonus,
    canadianEdBonus,
    jobOffer,
    additional,
    total: corePrincipal + spouseTotal + skillTransferability + additional,
  };
}

export default function CRSCalculatorPage() {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const [form, setForm] = useState<CalculatorData>({
    maritalStatus: "",
    spouseIsCitizenOrPr: "",
    spouseComing: "",
    age: "",
    educationLevel: "",
    hasCanadianCredential: "",
    canadianCredentialLevel: "",
    languageResultsValid: "",
    firstLanguageTest: "",
    firstSpeaking: "",
    firstListening: "",
    firstReading: "",
    firstWriting: "",
    secondLanguageTest: "",
    secondSpeaking: "",
    secondListening: "",
    secondReading: "",
    secondWriting: "",
    canadianExperience: "",
    foreignExperience: "",
    hasCertificateOfQualification: "",
    hasValidJobOffer: "",
    jobOfferTeer: "",
    hasProvincialNomination: "",
    hasSiblingInCanada: "",
    spouseEducationLevel: "",
    spouseCanadianExperience: "",
    spouseLanguageTest: "",
    spouseSpeaking: "",
    spouseListening: "",
    spouseReading: "",
    spouseWriting: "",
  });

  const progress = useMemo(
    () => Math.round(((currentStep + 1) / steps.length) * 100),
    [currentStep]
  );

  const hasSpouseFlow =
    form.maritalStatus === "married" || form.maritalStatus === "common-law";

  const crsPreview = useMemo(() => calculateCrsPreview(form), [form]);

  function updateField<K extends keyof CalculatorData>(
    field: K,
    value: CalculatorData[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function nextStep() {
    if (!hasSpouseFlow && currentStep === 4) {
      setCurrentStep(6);
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function prevStep() {
    if (!hasSpouseFlow && currentStep === 6) {
      setCurrentStep(4);
      return;
    }

    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  function canGoNext() {
  switch (currentStep) {
    case 0:
      return (
        !!form.maritalStatus &&
        !!form.age &&
        (!hasSpouseFlow || (!!form.spouseIsCitizenOrPr && !!form.spouseComing))
      );

    case 1:
      return (
        !!form.educationLevel &&
        !!form.hasCanadianCredential &&
        (form.hasCanadianCredential !== "yes" || !!form.canadianCredentialLevel)
      );

    case 2:
      return (
        !!form.languageResultsValid &&
        !!form.firstLanguageTest &&
        !!form.firstSpeaking &&
        !!form.firstListening &&
        !!form.firstReading &&
        !!form.firstWriting &&
        (!form.secondLanguageTest ||
          form.secondLanguageTest === "none" ||
          (!!form.secondSpeaking &&
            !!form.secondListening &&
            !!form.secondReading &&
            !!form.secondWriting))
      );

    case 3:
      return (
        !!form.canadianExperience &&
        !!form.foreignExperience &&
        !!form.hasCertificateOfQualification
      );

    case 4:
      return (
        !!form.hasValidJobOffer &&
        !!form.hasProvincialNomination &&
        !!form.hasSiblingInCanada &&
        (form.hasValidJobOffer !== "yes" || !!form.jobOfferTeer)
      );

    case 5:
      return (
        !hasSpouseFlow ||
        (!!form.spouseEducationLevel &&
          !!form.spouseCanadianExperience &&
          !!form.spouseLanguageTest &&
          (form.spouseLanguageTest === "not-applicable" ||
            (!!form.spouseSpeaking &&
              !!form.spouseListening &&
              !!form.spouseReading &&
              !!form.spouseWriting)))
      );

    default:
      return true;
  }
}

  function renderStep() {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-8">
            <SectionTitle
              eyebrow="Step 1"
              title="About you"
              subtitle="Start with the same key profile inputs the official Express Entry CRS tool expects."
            />

            <div className="grid gap-5">
              <div>
                <FieldLabel>What is your marital status?</FieldLabel>
                <SelectField
                  value={form.maritalStatus}
                  onChange={(value) =>
                    updateField("maritalStatus", value as MaritalStatus)
                  }
                >
                  <option value="">Select one</option>
                  <option value="annulled-marriage">Annulled Marriage</option>
                  <option value="common-law">Common-Law</option>
                  <option value="divorced-separated">Divorced / Separated</option>
                  <option value="legally-separated">Legally Separated</option>
                  <option value="married">Married</option>
                  <option value="never-married-single">Never Married / Single</option>
                  <option value="widowed">Widowed</option>
                </SelectField>
              </div>

              {hasSpouseFlow ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <FieldLabel>
                      Is your spouse or common-law partner a citizen or PR of Canada?
                    </FieldLabel>
                    <SelectField
                      value={form.spouseIsCitizenOrPr}
                      onChange={(value) =>
                        updateField("spouseIsCitizenOrPr", value as YesNo)
                      }
                    >
                      <option value="">Select one</option>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </SelectField>
                  </div>

                  <div>
                    <FieldLabel>
                      Will your spouse or common-law partner come with you to Canada?
                    </FieldLabel>
                    <SelectField
                      value={form.spouseComing}
                      onChange={(value) =>
                        updateField("spouseComing", value as YesNo)
                      }
                    >
                      <option value="">Select one</option>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </SelectField>
                  </div>
                </div>
              ) : null}

              <div>
                <FieldLabel>How old are you?</FieldLabel>
                <p className="mb-3 text-sm text-white/50">
                  If you already received an ITA, use your age on the date of invitation.
                </p>
                <SelectField
                  value={form.age}
                  onChange={(value) => updateField("age", value as AgeOption)}
                >
                  <option value="">Select one</option>
                  {ageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-8">
            <SectionTitle
              eyebrow="Step 2"
              title="Education"
              subtitle="Use the same education categories normally required to estimate CRS points."
            />

            <div className="grid gap-5">
              <div>
                <FieldLabel>What is your level of education?</FieldLabel>
                <SelectField
                  value={form.educationLevel}
                  onChange={(value) =>
                    updateField("educationLevel", value as EducationLevel)
                  }
                >
                  <option value="">Select one</option>
                  <option value="secondary">Secondary (high school)</option>
                  <option value="one-year">
                    One-year program at a university, college, trade or technical school, or other institute
                  </option>
                  <option value="two-year">
                    Two-year program at a university, college, trade or technical school, or other institute
                  </option>
                  <option value="bachelors-or-three-plus">
                    Bachelor&apos;s degree OR a program of three years or more at a university, college, trade or technical school, or other institute
                  </option>
                  <option value="two-or-more">
                    Two or more certificates, diplomas, or degrees. One must be for a program of three or more years
                  </option>
                  <option value="masters-professional">
                    Master&apos;s degree, or professional degree needed to practice in a licensed profession
                  </option>
                  <option value="phd">Doctoral level university degree (PhD)</option>
                </SelectField>
              </div>

              <div>
                <FieldLabel>Have you earned a Canadian degree, diploma or certificate?</FieldLabel>
                <SelectField
                  value={form.hasCanadianCredential}
                  onChange={(value) =>
                    updateField("hasCanadianCredential", value as YesNo)
                  }
                >
                  <option value="">Select one</option>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </SelectField>
              </div>

              {form.hasCanadianCredential === "yes" ? (
                <div>
                  <FieldLabel>Choose the best answer to describe this Canadian credential.</FieldLabel>
                  <SelectField
                    value={form.canadianCredentialLevel}
                    onChange={(value) =>
                      updateField(
                        "canadianCredentialLevel",
                        value as CanadianCredentialLevel
                      )
                    }
                  >
                    <option value="">Select one</option>
                    <option value="secondary-or-less">Secondary (high school) or less</option>
                    <option value="one-or-two-year">One- or two-year diploma or certificate</option>
                    <option value="three-plus-or-masters-phd">
                      Degree, diploma or certificate of three years or longer OR a Master&apos;s, professional or doctoral degree of at least one academic year
                    </option>
                  </SelectField>
                </div>
              ) : null}
            </div>
          </div>
        );

            case 2:
        return (
          <div className="space-y-8">
            <SectionTitle
              eyebrow="Step 3"
              title="Official languages"
              subtitle="Add your first and second official language test details in a clearer, more modern flow."
            />

            <div className="grid gap-5">
              <div>
                <FieldLabel>
                  Are your language test results still valid (taken within the last 2 years)?
                </FieldLabel>
                <p className="mb-2 text-xs text-white/50">
                  Language test results are valid for 2 years under Express Entry rules.
                </p>
                <SelectField
                  value={form.languageResultsValid}
                  onChange={(value) =>
                    updateField("languageResultsValid", value as YesNo)
                  }
                >
                  <option value="">Select one</option>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </SelectField>
              </div>

              {form.languageResultsValid === "no" && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                  Your language test results are expired. They will NOT count toward your CRS score.
                </div>
              )}

              <div>
                <FieldLabel>First official language test</FieldLabel>
                <SelectField
                  value={form.firstLanguageTest}
                  onChange={(value) =>
                    updateField("firstLanguageTest", value as FirstLanguageTest)
                  }
                >
                  <option value="">Select one</option>
                  {firstLanguageTests.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 text-sm font-medium text-white/85">
                  First official language levels
                </div>
                <ScoresGrid
                  speaking={form.firstSpeaking}
                  listening={form.firstListening}
                  reading={form.firstReading}
                  writing={form.firstWriting}
                  onChange={(field, value) => {
                    const map = {
                      speaking: "firstSpeaking",
                      listening: "firstListening",
                      reading: "firstReading",
                      writing: "firstWriting",
                    } as const;
                    updateField(map[field], value);
                  }}
                />
              </div>

              <div>
                <FieldLabel>Second official language test</FieldLabel>
                <SelectField
                  value={form.secondLanguageTest}
                  onChange={(value) =>
                    updateField("secondLanguageTest", value as SecondLanguageTest)
                  }
                >
                  <option value="">Select one</option>
                  {secondLanguageTests.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
              </div>

              {form.secondLanguageTest && form.secondLanguageTest !== "none" ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 text-sm font-medium text-white/85">
                    Second official language levels
                  </div>
                  <ScoresGrid
                    speaking={form.secondSpeaking}
                    listening={form.secondListening}
                    reading={form.secondReading}
                    writing={form.secondWriting}
                    onChange={(field, value) => {
                      const map = {
                        speaking: "secondSpeaking",
                        listening: "secondListening",
                        reading: "secondReading",
                        writing: "secondWriting",
                      } as const;
                      updateField(map[field], value);
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <SectionTitle
              eyebrow="Step 4"
              title="Work experience"
              subtitle="Continue with the skilled work experience inputs commonly used in CRS evaluation."
            />

            <div className="grid gap-5">
              <div>
                <FieldLabel>Canadian skilled work experience (last 10 years)</FieldLabel>
                <SelectField
                  value={form.canadianExperience}
                  onChange={(value) =>
                    updateField("canadianExperience", value as ExperienceCanadaOption)
                  }
                >
                  <option value="">Select one</option>
                  <option value="none-or-less-than-one">None or less than a year</option>
                  <option value="1">1 year</option>
                  <option value="2">2 years</option>
                  <option value="3">3 years</option>
                  <option value="4">4 years</option>
                  <option value="5-or-more">5 years or more</option>
                </SelectField>
              </div>

              <div>
                <FieldLabel>Foreign skilled work experience (last 10 years)</FieldLabel>
                <SelectField
                  value={form.foreignExperience}
                  onChange={(value) =>
                    updateField("foreignExperience", value as ExperienceForeignOption)
                  }
                >
                  <option value="">Select one</option>
                  <option value="none-or-less-than-one">None or less than a year</option>
                  <option value="1">1 year</option>
                  <option value="2">2 years</option>
                  <option value="3-or-more">3 years or more</option>
                </SelectField>
              </div>

              <div>
                <FieldLabel>Do you have a certificate of qualification?</FieldLabel>
                <SelectField
                  value={form.hasCertificateOfQualification}
                  onChange={(value) =>
                    updateField("hasCertificateOfQualification", value as YesNo)
                  }
                >
                  <option value="">Select one</option>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </SelectField>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <SectionTitle
              eyebrow="Step 5"
              title="Additional factors"
              subtitle="Capture the extra CRS-related factors and keep the interface cleaner than the official version."
            />

            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100/90">
              As of March 25, 2025, job offers no longer add CRS points, but this input may still matter in some immigration contexts.
            </div>

            <div className="grid gap-5">
              <div>
                <FieldLabel>Do you have a valid job offer?</FieldLabel>
                <SelectField
                  value={form.hasValidJobOffer}
                  onChange={(value) =>
                    updateField("hasValidJobOffer", value as YesNo)
                  }
                >
                  <option value="">Select one</option>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </SelectField>
              </div>

              {form.hasValidJobOffer === "yes" ? (
                <div>
                  <FieldLabel>Which NOC TEER is the job offer?</FieldLabel>
                  <SelectField
                    value={form.jobOfferTeer}
                    onChange={(value) =>
                      updateField("jobOfferTeer", value as JobOfferTeer)
                    }
                  >
                    <option value="">Select one</option>
                    <option value="major-group-00">NOC TEER 0 Major group 00</option>
                    <option value="teer-0-1-2-3-other">
                      NOC TEER 1, 2 or 3, or any TEER 0 other than Major group 00
                    </option>
                    <option value="teer-4-5">NOC TEER 4 or 5</option>
                  </SelectField>
                </div>
              ) : null}

              <div>
                <FieldLabel>Do you have a provincial nomination?</FieldLabel>
                <SelectField
                  value={form.hasProvincialNomination}
                  onChange={(value) =>
                    updateField("hasProvincialNomination", value as YesNo)
                  }
                >
                  <option value="">Select one</option>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </SelectField>
              </div>

              <div>
                <FieldLabel>Do you have a sibling in Canada who is a citizen or PR?</FieldLabel>
                <SelectField
                  value={form.hasSiblingInCanada}
                  onChange={(value) =>
                    updateField("hasSiblingInCanada", value as YesNo)
                  }
                >
                  <option value="">Select one</option>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </SelectField>
              </div>
            </div>
          </div>
        );

      case 5:
        return hasSpouseFlow ? (
          <div className="space-y-8">
            <SectionTitle
              eyebrow="Step 6"
              title="Spouse factors"
              subtitle="Because spouse details can affect CRS, keep them here in a dedicated step with cleaner UX."
            />

            <div className="grid gap-5">
              <div>
                <FieldLabel>Spouse education level</FieldLabel>
                <SelectField
                  value={form.spouseEducationLevel}
                  onChange={(value) =>
                    updateField("spouseEducationLevel", value as SpouseEducationLevel)
                  }
                >
                  <option value="">Select one</option>
                  <option value="none-or-less-than-secondary">
                    None, or less than secondary (high school)
                  </option>
                  <option value="secondary">Secondary diploma (high school graduation)</option>
                  <option value="one-year">
                    One-year program at a university, college, trade or technical school, or other institute
                  </option>
                  <option value="two-year">
                    Two-year program at a university, college, trade or technical school, or other institute
                  </option>
                  <option value="bachelors-or-three-plus">
                    Bachelor&apos;s degree (three or more year program at a university, college, trade or technical school, or other institute)
                  </option>
                  <option value="two-or-more">
                    Two or more certificates, diplomas or degrees. One must be for a program of three or more years
                  </option>
                  <option value="masters-professional">
                    Master&apos;s degree, or professional degree needed to practice in a licensed profession
                  </option>
                  <option value="phd">Doctoral level university degree (PhD)</option>
                </SelectField>
              </div>

              <div>
                <FieldLabel>Spouse Canadian work experience</FieldLabel>
                <SelectField
                  value={form.spouseCanadianExperience}
                  onChange={(value) =>
                    updateField("spouseCanadianExperience", value as ExperienceCanadaOption)
                  }
                >
                  <option value="">Select one</option>
                  <option value="none-or-less-than-one">None or less than a year</option>
                  <option value="1">1 year</option>
                  <option value="2">2 years</option>
                  <option value="3">3 years</option>
                  <option value="4">4 years</option>
                  <option value="5-or-more">5 years or more</option>
                </SelectField>
              </div>

              <div>
                <FieldLabel>Spouse language test</FieldLabel>
                <SelectField
                  value={form.spouseLanguageTest}
                  onChange={(value) =>
                    updateField("spouseLanguageTest", value as SpouseLanguageTest)
                  }
                >
                  <option value="">Select one</option>
                  {spouseLanguageTests.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
              </div>

              {form.spouseLanguageTest && form.spouseLanguageTest !== "not-applicable" ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 text-sm font-medium text-white/85">
                    Spouse language levels
                  </div>
                  <ScoresGrid
                    speaking={form.spouseSpeaking}
                    listening={form.spouseListening}
                    reading={form.spouseReading}
                    writing={form.spouseWriting}
                    onChange={(field, value) => {
                      const map = {
                        speaking: "spouseSpeaking",
                        listening: "spouseListening",
                        reading: "spouseReading",
                        writing: "spouseWriting",
                      } as const;
                      updateField(map[field], value);
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <SectionTitle
              eyebrow="Step 6"
              title="Spouse factors"
              subtitle="This section is skipped because spouse factors do not apply to your current profile."
            />
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/65">
              No spouse-related inputs are required for this scenario.
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-8">
            <SectionTitle
              eyebrow={`${t("calc_step_label")} 7`}
              title={t("calc_results_title")}
              subtitle={t("calc_results_subtitle")}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
                  {t("calc_estimated_crs")}
                </div>
                <div className="mt-3 text-4xl font-semibold text-white">
                  {crsPreview.total}
                </div>
                <p className="mt-2 text-sm text-white/65">
                  Core factors, spouse factors, sibling points, and provincial nomination are now connected.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                  {t("calc_profile_mode")}
                </div>
                <div className="mt-3 text-2xl font-semibold text-white">
                  {crsPreview.treatedAsNoSpouse ? t("calc_without_spouse") : t("calc_with_spouse")}
                </div>
                <p className="mt-2 text-sm text-white/65">
                  Based on marital status, spouse accompaniment, and spouse PR/citizen status.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Core Human Capital */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Core</div>
                <div className="flex justify-between"><span>{t("calc_age_pts")}</span><span>{crsPreview.age}</span></div>
                <div className="flex justify-between"><span>{t("calc_edu_pts")}</span><span>{crsPreview.education}</span></div>
                <div className="flex justify-between"><span>{t("calc_lang1_pts")}</span><span>{crsPreview.firstLanguage}</span></div>
                <div className="flex justify-between"><span>{t("calc_lang2_pts")}</span><span>{crsPreview.secondLanguage}</span></div>
                <div className="flex justify-between"><span>{t("calc_can_exp_pts")}</span><span>{crsPreview.canadianExp}</span></div>
                {!crsPreview.treatedAsNoSpouse && (
                  <>
                    <div className="mt-2 flex justify-between"><span>{t("calc_spouse_edu_pts")}</span><span>{crsPreview.spouseEducation}</span></div>
                    <div className="flex justify-between"><span>{t("calc_spouse_lang_pts")}</span><span>{crsPreview.spouseLanguage}</span></div>
                    <div className="flex justify-between"><span>{t("calc_spouse_can_pts")}</span><span>{crsPreview.spouseCanadianExp}</span></div>
                  </>
                )}
              </div>

              {/* Skill Transferability + Additional */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Skill Transferability</div>
                <div className="flex justify-between"><span>{t("calc_skill_transfer_pts")}</span><span className="text-white">{crsPreview.skillTransferability}</span></div>
                <div className="mb-2 mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">{t("calc_additional_label")}</div>
                {crsPreview.pnp > 0 && <div className="flex justify-between"><span>Provincial nomination</span><span>+{crsPreview.pnp}</span></div>}
                {crsPreview.jobOffer > 0 && <div className="flex justify-between"><span>Job offer</span><span>+{crsPreview.jobOffer}</span></div>}
                {crsPreview.frenchBonus > 0 && <div className="flex justify-between"><span>French language bonus</span><span>+{crsPreview.frenchBonus}</span></div>}
                {crsPreview.canadianEdBonus > 0 && <div className="flex justify-between"><span>Canadian education</span><span>+{crsPreview.canadianEdBonus}</span></div>}
                {crsPreview.sibling > 0 && <div className="flex justify-between"><span>Sibling in Canada</span><span>+{crsPreview.sibling}</span></div>}
                {crsPreview.additional === 0 && <div className="text-white/40">—</div>}
                <div className="mt-3 border-t border-white/10 pt-3 flex justify-between font-semibold text-white">
                  <span>{t("calc_total")}</span><span>{crsPreview.total}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
              <div>Marital status: {form.maritalStatus || "—"}</div>
              <div>Spouse citizen/PR: {form.spouseIsCitizenOrPr || "—"}</div>
              <div>Spouse coming: {form.spouseComing || "—"}</div>
              <div>Age: {form.age || "—"}</div>
              <div>Education level: {form.educationLevel || "—"}</div>
              <div>Canadian credential: {form.hasCanadianCredential || "—"}</div>
              <div>Canadian credential level: {form.canadianCredentialLevel || "—"}</div>
              <div>Language results valid: {form.languageResultsValid || "—"}</div>
              <div>
                First language levels: {scoreLabel(form.firstSpeaking)}, {scoreLabel(form.firstListening)}, {scoreLabel(form.firstReading)}, {scoreLabel(form.firstWriting)}
              </div>
              <div>
                Second language levels: {scoreLabel(form.secondSpeaking)}, {scoreLabel(form.secondListening)}, {scoreLabel(form.secondReading)}, {scoreLabel(form.secondWriting)}
              </div>
              <div>Canadian experience: {form.canadianExperience || "—"}</div>
              <div>Foreign experience: {form.foreignExperience || "—"}</div>
              <div>Certificate of qualification: {form.hasCertificateOfQualification || "—"}</div>
              <div>Valid job offer: {form.hasValidJobOffer || "—"}</div>
              <div>Job offer TEER: {form.jobOfferTeer || "—"}</div>
              <div>Provincial nomination: {form.hasProvincialNomination || "—"}</div>
              <div>Sibling in Canada: {form.hasSiblingInCanada || "—"}</div>
              <div>Spouse education: {form.spouseEducationLevel || "—"}</div>
              <div>Spouse Canadian experience: {form.spouseCanadianExperience || "—"}</div>
              <div>
                Spouse language levels: {scoreLabel(form.spouseSpeaking)}, {scoreLabel(form.spouseListening)}, {scoreLabel(form.spouseReading)}, {scoreLabel(form.spouseWriting)}
              </div>
            </div>

            {/* CTA to simulator */}
            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
              <div className="text-sm font-semibold text-white">
                {t("calc_cta_score")} <span className="text-cyan-200">{crsPreview.total}</span>
              </div>
              <p className="mt-1 text-sm text-white/65">
                {t("calc_cta_desc")}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/simulator"
                  onClick={() => {
                    try {
                      const clbFromOption = (opt: string) => {
                        if (opt === "clb-10-plus") return 10;
                        if (opt.startsWith("clb-")) return Number(opt.slice(4)) || 0;
                        return 0;
                      };
                      const minClb = [
                        form.firstSpeaking,
                        form.firstListening,
                        form.firstReading,
                        form.firstWriting,
                      ].every((s) => s !== "")
                        ? Math.min(
                            clbFromOption(form.firstSpeaking),
                            clbFromOption(form.firstListening),
                            clbFromOption(form.firstReading),
                            clbFromOption(form.firstWriting)
                          )
                        : 0;
                      const canExpYears =
                        form.canadianExperience === "5-or-more"
                          ? 5
                          : form.canadianExperience === "none-or-less-than-one"
                          ? 0
                          : Number(form.canadianExperience) || 0;
                      const pending = {
                        currentCrs: crsPreview.total,
                        englishClb: minClb,
                        canadianExperienceYears: canExpYears,
                        hasJobOffer: form.hasValidJobOffer === "yes",
                        hasPnp: form.hasProvincialNomination === "yes",
                      };
                      window.localStorage.setItem(
                        "crs_pending_profile",
                        JSON.stringify(pending)
                      );
                    } catch {
                      // ignore storage failures
                    }
                  }}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  {t("calc_open_simulator")}
                </Link>
                <Link
                  href="/start"
                  className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {t("calc_back_to_start")}
                </Link>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
            {t("calc_eyebrow")}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[28px] border border-white/10 bg-linear-to-b from-white/8 to-white/4 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="text-sm font-medium text-white/50">
                {t("calc_step_label")} {currentStep + 1} {t("calc_of_label")} {steps.length}
              </div>
              <div className="text-sm font-medium text-cyan-200/70">
                {progress}{t("calc_complete")}
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-linear-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-8">{renderStep()}</div>

            <div className="mt-10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("calc_back")}
              </button>

              {!canGoNext() ? (
                <div className="ml-auto text-xs text-white/45">
                  {t("calc_required_hint")}
                </div>
              ) : null}

              <button
                type="button"
                onClick={nextStep}
                disabled={currentStep === steps.length - 1 || !canGoNext()}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("calc_next")}
              </button>
            </div>
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              {t("calc_live_summary")}
            </div>

            <div className="mt-5 grid gap-3 text-sm text-white/75">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3">
                <span className="text-cyan-200/70">Estimated CRS:</span>{" "}
                <span className="font-semibold text-white">{crsPreview.total}</span>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3 text-xs">
                <div className="flex justify-between text-white/50">
                  <span>Core:</span>
                  <span>{crsPreview.age + crsPreview.education + crsPreview.firstLanguage + crsPreview.secondLanguage + crsPreview.canadianExp}</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Skill transfer:</span>
                  <span>{crsPreview.skillTransferability}</span>
                </div>
                {!crsPreview.treatedAsNoSpouse && (
                  <div className="flex justify-between text-white/50">
                    <span>Spouse:</span>
                    <span>{crsPreview.spouseEducation + crsPreview.spouseLanguage + crsPreview.spouseCanadianExp}</span>
                  </div>
                )}
                {crsPreview.additional > 0 && (
                  <div className="flex justify-between text-white/50">
                    <span>Additional:</span>
                    <span>+{crsPreview.additional}</span>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <span className="text-white/45">Age:</span> {form.age || "—"}
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <span className="text-white/45">Education:</span>{" "}
                {form.educationLevel || "—"}
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <span className="text-white/45">1st language:</span>{" "}
                {form.firstLanguageTest || "—"}
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <span className="text-white/45">Canadian exp:</span>{" "}
                {form.canadianExperience || "—"}
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <span className="text-white/45">Foreign exp:</span>{" "}
                {form.foreignExperience || "—"}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}