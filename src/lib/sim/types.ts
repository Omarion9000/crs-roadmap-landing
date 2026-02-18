export type Lang = "en" | "es";

export type MaritalStatus = "single" | "married";

export type EducationLevel =
  | "high_school"
  | "one_year_post_secondary"
  | "two_year_post_secondary"
  | "bachelors"
  | "two_or_more_credentials"
  | "masters"
  | "phd";

export type CLBLevel = 0 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type LanguageScores = {
  speaking: CLBLevel;
  listening: CLBLevel;
  reading: CLBLevel;
  writing: CLBLevel;
};

export type ProfileInput = {
  age: number; // 18 - 45+ typically
  maritalStatus: MaritalStatus;
  education: EducationLevel;
  firstLanguage: LanguageScores;
  canadianExpMonths: number; // 0 - 60+
};

export type CRSBreakdown = {
  total: number;
  core: {
    age: number;
    education: number;
    firstLanguage: number;
    canadianExperience: number;
  };
  notes?: string[];
};
