"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  getBaseProfileOwnerKey,
  persistStoredBaseProfile,
  type StoredBaseProfilePayload,
} from "@/lib/crs/baseProfile";
import { trackFunnelEvent, trackFunnelEventOnce } from "@/lib/funnel";
import { normalizePreferredName } from "@/lib/personalization";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

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
  preferred_name: string;
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

function scoreOptionToClb(score: ScoreOption) {
  switch (score) {
    case "clb-4":
      return 4;
    case "clb-5":
      return 5;
    case "clb-6":
      return 6;
    case "clb-7":
      return 7;
    case "clb-8":
      return 8;
    case "clb-9":
      return 9;
    case "clb-10-plus":
      return 10;
    default:
      return 0;
  }
}

function minimumClb(scores: ScoreOption[]) {
  const resolved = scores.map(scoreOptionToClb).filter((value) => value > 0);
  if (!resolved.length) return 0;
  return Math.min(...resolved);
}

function firstLanguageTestLabel(test: FirstLanguageTest) {
  return firstLanguageTests.find((option) => option.value === test)?.label;
}

function secondLanguageTestLabel(test: SecondLanguageTest) {
  return secondLanguageTests.find((option) => option.value === test)?.label;
}

function educationLabel(value: EducationLevel) {
  switch (value) {
    case "secondary":
      return "Secondary";
    case "one-year":
      return "One-year post-secondary";
    case "two-year":
      return "Two-year post-secondary";
    case "bachelors-or-three-plus":
      return "Bachelor's or 3+ year program";
    case "two-or-more":
      return "Two or more credentials";
    case "masters-professional":
      return "Master's or professional degree";
    case "phd":
      return "PhD";
    default:
      return undefined;
  }
}

function maritalStatusLabel(value: MaritalStatus) {
  switch (value) {
    case "annulled-marriage":
      return "Annulled marriage";
    case "common-law":
      return "Common-law";
    case "divorced-separated":
      return "Divorced / separated";
    case "legally-separated":
      return "Legally separated";
    case "married":
      return "Married";
    case "never-married-single":
      return "Never married / single";
    case "widowed":
      return "Widowed";
    default:
      return undefined;
  }
}

function foreignExperienceLabel(value: ExperienceForeignOption) {
  switch (value) {
    case "none-or-less-than-one":
      return "Less than 1 year";
    case "1":
      return "1 year";
    case "2":
      return "2 years";
    case "3-or-more":
      return "3+ years";
    default:
      return undefined;
  }
}

function canadianCredentialLabel(
  hasCanadianCredential: YesNo,
  level: CanadianCredentialLevel
) {
  if (hasCanadianCredential !== "yes") return "No Canadian credential";

  switch (level) {
    case "secondary-or-less":
      return "Canadian secondary or less";
    case "one-or-two-year":
      return "Canadian 1-2 year credential";
    case "three-plus-or-masters-phd":
      return "Canadian 3+ year / master's / PhD credential";
    default:
      return "Canadian credential";
  }
}

function isEnglishTestType(test: FirstLanguageTest | SecondLanguageTest) {
  return test === "celpip-g" || test === "ielts" || test === "pte-core";
}

function isFrenchTestType(test: FirstLanguageTest | SecondLanguageTest) {
  return test === "tef-canada" || test === "tcf-canada";
}

function canadianExperienceYears(value: ExperienceCanadaOption) {
  switch (value) {
    case "1":
      return 1;
    case "2":
      return 2;
    case "3":
      return 3;
    case "4":
      return 4;
    case "5-or-more":
      return 5;
    default:
      return 0;
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

function cappedSecondLanguageTotal(
  scores: ScoreOption[],
  treatedAsNoSpouse: boolean
) {
  const raw = scores.reduce(
    (sum, score) => sum + secondLanguagePointsPerAbility(score),
    0
  );
  return Math.min(raw, treatedAsNoSpouse ? 24 : 22);
}

function agePoints(age: AgeOption, treatedAsNoSpouse: boolean) {
  const withSpouse: Record<Exclude<AgeOption, "">, number> = {
    "17-or-less": 0,
    "18": 90,
    "19": 95,
    "20": 100,
    "21": 100,
    "22": 100,
    "23": 100,
    "24": 100,
    "25": 100,
    "26": 100,
    "27": 100,
    "28": 100,
    "29": 100,
    "30": 95,
    "31": 90,
    "32": 85,
    "33": 80,
    "34": 75,
    "35": 70,
    "36": 65,
    "37": 60,
    "38": 55,
    "39": 50,
    "40": 45,
    "41": 35,
    "42": 25,
    "43": 15,
    "44": 5,
    "45-or-more": 0,
  };

  const withoutSpouse: Record<Exclude<AgeOption, "">, number> = {
    "17-or-less": 0,
    "18": 99,
    "19": 105,
    "20": 110,
    "21": 110,
    "22": 110,
    "23": 110,
    "24": 110,
    "25": 110,
    "26": 110,
    "27": 110,
    "28": 110,
    "29": 110,
    "30": 105,
    "31": 99,
    "32": 94,
    "33": 88,
    "34": 83,
    "35": 77,
    "36": 72,
    "37": 66,
    "38": 61,
    "39": 55,
    "40": 50,
    "41": 39,
    "42": 28,
    "43": 17,
    "44": 6,
    "45-or-more": 0,
  };

  if (!age) return 0;
  return treatedAsNoSpouse ? withoutSpouse[age] : withSpouse[age];
}

function educationPoints(
  education: EducationLevel,
  treatedAsNoSpouse: boolean
) {
  const withSpouse: Record<Exclude<EducationLevel, "">, number> = {
    secondary: 28,
    "one-year": 84,
    "two-year": 91,
    "bachelors-or-three-plus": 112,
    "two-or-more": 119,
    "masters-professional": 126,
    phd: 140,
  };

  const withoutSpouse: Record<Exclude<EducationLevel, "">, number> = {
    secondary: 30,
    "one-year": 90,
    "two-year": 98,
    "bachelors-or-three-plus": 120,
    "two-or-more": 128,
    "masters-professional": 135,
    phd: 150,
  };

  if (!education) return 0;
  return treatedAsNoSpouse ? withoutSpouse[education] : withSpouse[education];
}

function canadianExperiencePoints(
  exp: ExperienceCanadaOption,
  treatedAsNoSpouse: boolean
) {
  const withSpouse: Record<Exclude<ExperienceCanadaOption, "">, number> = {
    "none-or-less-than-one": 0,
    "1": 35,
    "2": 46,
    "3": 56,
    "4": 63,
    "5-or-more": 70,
  };

  const withoutSpouse: Record<Exclude<ExperienceCanadaOption, "">, number> = {
    "none-or-less-than-one": 0,
    "1": 40,
    "2": 53,
    "3": 64,
    "4": 72,
    "5-or-more": 80,
  };

  if (!exp) return 0;
  return treatedAsNoSpouse ? withoutSpouse[exp] : withSpouse[exp];
}

function spouseEducationPoints(education: SpouseEducationLevel) {
  const map: Record<Exclude<SpouseEducationLevel, "">, number> = {
    "none-or-less-than-secondary": 0,
    secondary: 2,
    "one-year": 6,
    "two-year": 7,
    "bachelors-or-three-plus": 8,
    "two-or-more": 9,
    "masters-professional": 10,
    phd: 10,
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
    "none-or-less-than-one": 0,
    "1": 5,
    "2": 7,
    "3": 8,
    "4": 9,
    "5-or-more": 10,
  };

  if (!exp) return 0;
  return map[exp];
}

function calculateCrsPreview(form: CalculatorData) {
  const treatedAsNoSpouse = isTreatedAsNoSpouse(form);
  const languageValid = form.languageResultsValid === "yes";
  const age = agePoints(form.age, treatedAsNoSpouse);
  const education = educationPoints(form.educationLevel, treatedAsNoSpouse);

  const firstLanguage = languageValid
  ? firstLanguagePointsPerAbility(form.firstSpeaking, treatedAsNoSpouse) +
    firstLanguagePointsPerAbility(form.firstListening, treatedAsNoSpouse) +
    firstLanguagePointsPerAbility(form.firstReading, treatedAsNoSpouse) +
    firstLanguagePointsPerAbility(form.firstWriting, treatedAsNoSpouse)
  : 0;

const secondLanguage = languageValid
  ? cappedSecondLanguageTotal(
      [
        form.secondSpeaking,
        form.secondListening,
        form.secondReading,
        form.secondWriting,
      ],
      treatedAsNoSpouse
    )
  : 0;

  const canadianExp = canadianExperiencePoints(
    form.canadianExperience,
    treatedAsNoSpouse
  );

  const corePrincipal = age + education + firstLanguage + secondLanguage + canadianExp;

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
  const spouseCanadianExp = treatedAsNoSpouse
    ? 0
    : spouseCanadianExperiencePoints(form.spouseCanadianExperience);

  const spouseTotal = spouseEducation + spouseLanguage + spouseCanadianExp;

  const additional =
    (form.hasProvincialNomination === "yes" ? 600 : 0) +
    (form.hasSiblingInCanada === "yes" ? 15 : 0);

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
    additional,
    total: corePrincipal + spouseTotal + additional,
  };
}

export default function CRSCalculatorPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [authUser, setAuthUser] = useState<User | null>(null);

  const [form, setForm] = useState<CalculatorData>({
    preferred_name: "",
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
  const baseProfileOwnerKey = useMemo(() => getBaseProfileOwnerKey(authUser), [authUser]);

  useEffect(() => {
    trackFunnelEventOnce("base-profile-started", "base_profile_started", {
      source: "calculator",
    });
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let alive = true;

    async function loadAuthUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!alive) return;
      setAuthUser(session?.user ?? null);
    }

    void loadAuthUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setAuthUser(session?.user ?? null);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const storedBaseProfile = useMemo<StoredBaseProfilePayload>(() => {
    const englishFromFirst = isEnglishTestType(form.firstLanguageTest)
      ? minimumClb([
          form.firstSpeaking,
          form.firstListening,
          form.firstReading,
          form.firstWriting,
        ])
      : 0;

    const englishFromSecond = isEnglishTestType(form.secondLanguageTest)
      ? minimumClb([
          form.secondSpeaking,
          form.secondListening,
          form.secondReading,
          form.secondWriting,
        ])
      : 0;

    const frenchFromFirst = isFrenchTestType(form.firstLanguageTest)
      ? minimumClb([
          form.firstSpeaking,
          form.firstListening,
          form.firstReading,
          form.firstWriting,
        ])
      : 0;

    const frenchFromSecond = isFrenchTestType(form.secondLanguageTest)
      ? minimumClb([
          form.secondSpeaking,
          form.secondListening,
          form.secondReading,
          form.secondWriting,
        ])
      : 0;

    return {
      createdAt: new Date().toISOString(),
      ownerKey: baseProfileOwnerKey,
      baseProfile: {
        currentCrs: crsPreview.total,
        preferred_name: normalizePreferredName(form.preferred_name) ?? undefined,
        englishClb: Math.max(englishFromFirst, englishFromSecond),
        frenchClb: Math.max(frenchFromFirst, frenchFromSecond),
        canadianExperienceYears: canadianExperienceYears(form.canadianExperience),
        hasJobOffer: form.hasValidJobOffer === "yes",
        hasPnp: form.hasProvincialNomination === "yes",
        educationLabel: educationLabel(form.educationLevel),
        maritalStatusLabel: maritalStatusLabel(form.maritalStatus),
        foreignExperienceLabel: foreignExperienceLabel(form.foreignExperience),
        canadianCredentialLabel: canadianCredentialLabel(
          form.hasCanadianCredential,
          form.canadianCredentialLevel
        ),
        firstLanguageTestLabel: firstLanguageTestLabel(form.firstLanguageTest),
        secondLanguageTestLabel: secondLanguageTestLabel(form.secondLanguageTest),
        profileModeLabel: crsPreview.treatedAsNoSpouse
          ? "Without spouse points"
          : "With spouse points",
        rawForm: form,
      },
    };
  }, [baseProfileOwnerKey, crsPreview.total, crsPreview.treatedAsNoSpouse, form]);

  useEffect(() => {
    persistStoredBaseProfile(storedBaseProfile);
  }, [storedBaseProfile]);

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

  function continueToSimulator() {
    persistStoredBaseProfile(storedBaseProfile);
    trackFunnelEvent("base_profile_completed", {
      source: "calculator",
      currentCrs: storedBaseProfile.baseProfile.currentCrs,
    });
    router.push("/simulator?entry=activation");
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
                <FieldLabel>What should we call you?</FieldLabel>
                <input
                  type="text"
                  value={form.preferred_name}
                  onChange={(e) => updateField("preferred_name", e.target.value)}
                  placeholder="First name"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-cyan-400/60 focus:bg-white/10"
                />
                <p className="mt-2 text-sm text-white/50">
                  Optional, but it helps make your roadmap feel more personal.
                </p>
              </div>

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
              eyebrow="Step 7"
              title="Results overview"
              subtitle="This screen now shows a real CRS preview for core factors already connected."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
                  Estimated CRS
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
                  Profile mode
                </div>
                <div className="mt-3 text-2xl font-semibold text-white">
                  {crsPreview.treatedAsNoSpouse ? "Without spouse points" : "With spouse points"}
                </div>
                <p className="mt-2 text-sm text-white/65">
                  Based on marital status, spouse accompaniment, and spouse PR/citizen status.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
                <div>Age points: {crsPreview.age}</div>
                <div>Education points: {crsPreview.education}</div>
                <div>First language points: {crsPreview.firstLanguage}</div>
                <div>Second language points: {crsPreview.secondLanguage}</div>
                <div>Canadian experience points: {crsPreview.canadianExp}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
                <div>Spouse education points: {crsPreview.spouseEducation}</div>
                <div>Spouse language points: {crsPreview.spouseLanguage}</div>
                <div>Spouse Canadian experience points: {crsPreview.spouseCanadianExp}</div>
                <div>Additional points: {crsPreview.additional}</div>
                <div className="mt-2 font-semibold text-white">Total: {crsPreview.total}</div>
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
            CRS Roadmap
          </div>
          <div className="mt-4 text-sm font-semibold text-cyan-200/75">
            Step 1 - Build your base CRS profile
          </div>
          <div className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            This profile becomes the foundation for your simulator and saved roadmap.
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/8 to-white/4 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="text-sm font-medium text-white/50">
                Step {currentStep + 1} of {steps.length}
              </div>
              <div className="text-sm font-medium text-cyan-200/70">
                {progress}% complete
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
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
                Back
              </button>

              {!canGoNext() ? (
                <div className="ml-auto text-xs text-white/45">
                  Complete the required fields to continue
                </div>
              ) : null}

              <button
                type="button"
                onClick={nextStep}
                disabled={currentStep === steps.length - 1 || !canGoNext()}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>

            {currentStep === steps.length - 1 ? (
              <div className="mt-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
                      Next step
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      Continue with your simulator
                    </div>
                    <div className="mt-2 text-sm leading-6 text-white/70">
                      Your base CRS profile is ready and stored for the simulator roadmap flow.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={continueToSimulator}
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                  >
                    Continue to simulator
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Live summary
            </div>

            <div className="mt-5 grid gap-3 text-sm text-white/75">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <span className="text-white/45">Current section:</span>{" "}
                {steps[currentStep]}
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <span className="text-white/45">Estimated CRS:</span> {crsPreview.total}
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <span className="text-white/45">Simulator flow:</span>{" "}
                <span className="font-semibold text-white">
                  Base profile saved locally
                </span>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <span className="text-white/45">Marital status:</span>{" "}
                {form.maritalStatus || "—"}
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
                <span className="text-white/45">Canadian experience:</span>{" "}
                {form.canadianExperience || "—"}
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <span className="text-white/45">Foreign experience:</span>{" "}
                {form.foreignExperience || "—"}
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <span className="text-white/45">Provincial nomination:</span>{" "}
                {form.hasProvincialNomination || "—"}
              </div>
              <Link
                href="/simulator"
                className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
              >
                Continue to simulator
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
