import type { CLBLevel, EducationLevel, MaritalStatus } from "./types";

/**
 * NOTA:
 * Esto es un MVP “realista” para arrancar. No cubre TODO (ej. spouse factors, skill transferability completo, etc.)
 * Lo iremos ampliando fase por fase.
 *
 * La idea: tener una base sólida y luego agregar:
 * - Skill transferability
 * - Second language
 * - Spouse factors
 * - Additional points (PNP, job offer, French, siblings, etc.)
 */

export const AGE_POINTS: Record<MaritalStatus, (age: number) => number> = {
  single: (age) => {
    if (age < 18) return 0;
    if (age === 18) return 99;
    if (age === 19) return 105;
    if (age >= 20 && age <= 29) return 110;
    if (age === 30) return 105;
    if (age === 31) return 99;
    if (age === 32) return 94;
    if (age === 33) return 88;
    if (age === 34) return 83;
    if (age === 35) return 77;
    if (age === 36) return 72;
    if (age === 37) return 66;
    if (age === 38) return 61;
    if (age === 39) return 55;
    if (age === 40) return 50;
    if (age === 41) return 39;
    if (age === 42) return 28;
    if (age === 43) return 17;
    if (age === 44) return 6;
    return 0; // 45+
  },
  married: (age) => {
    // married = slightly lower core points vs single
    if (age < 18) return 0;
    if (age === 18) return 90;
    if (age === 19) return 95;
    if (age >= 20 && age <= 29) return 100;
    if (age === 30) return 95;
    if (age === 31) return 90;
    if (age === 32) return 85;
    if (age === 33) return 80;
    if (age === 34) return 75;
    if (age === 35) return 70;
    if (age === 36) return 65;
    if (age === 37) return 60;
    if (age === 38) return 55;
    if (age === 39) return 50;
    if (age === 40) return 45;
    if (age === 41) return 35;
    if (age === 42) return 25;
    if (age === 43) return 15;
    if (age === 44) return 5;
    return 0;
  },
};

export const EDUCATION_POINTS: Record<MaritalStatus, Record<EducationLevel, number>> = {
  single: {
    high_school: 30,
    one_year_post_secondary: 90,
    two_year_post_secondary: 98,
    bachelors: 120,
    two_or_more_credentials: 128,
    masters: 135,
    phd: 150,
  },
  married: {
    high_school: 28,
    one_year_post_secondary: 84,
    two_year_post_secondary: 91,
    bachelors: 112,
    two_or_more_credentials: 119,
    masters: 126,
    phd: 140,
  },
};

export const CAN_EXP_POINTS: Record<MaritalStatus, (months: number) => number> = {
  single: (months) => {
    if (months < 12) return 0;
    if (months < 24) return 40;
    if (months < 36) return 53;
    if (months < 48) return 64;
    if (months < 60) return 72;
    return 80;
  },
  married: (months) => {
    if (months < 12) return 0;
    if (months < 24) return 35;
    if (months < 36) return 46;
    if (months < 48) return 56;
    if (months < 60) return 63;
    return 70;
  },
};

// Simplificación MVP: First language por habilidad basado en CLB
// (estos números son aproximación útil para arrancar; luego refinamos para exactitud total y transferability)
export const FIRST_LANG_POINTS_PER_SKILL: Record<MaritalStatus, Record<CLBLevel, number>> = {
  single: {
    0: 0,
    4: 6,
    5: 6,
    6: 8,
    7: 16,
    8: 22,
    9: 29,
    10: 32,
  },
  married: {
    0: 0,
    4: 6,
    5: 6,
    6: 8,
    7: 14,
    8: 20,
    9: 26,
    10: 29,
  },
};
