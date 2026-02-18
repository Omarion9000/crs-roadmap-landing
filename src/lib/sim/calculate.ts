import type { CRSBreakdown, ProfileInput } from "./types";
import {
  AGE_POINTS,
  EDUCATION_POINTS,
  CAN_EXP_POINTS,
  FIRST_LANG_POINTS_PER_SKILL,
} from "./constants";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function calculateCRS(input: ProfileInput): CRSBreakdown {
  const marital = input.maritalStatus;

  const age = clamp(input.age, 0, 99);
  const canMonths = clamp(input.canadianExpMonths, 0, 120);

  const agePts = AGE_POINTS[marital](age);
  const eduPts = EDUCATION_POINTS[marital][input.education];
  const canExpPts = CAN_EXP_POINTS[marital](canMonths);

  const langTable = FIRST_LANG_POINTS_PER_SKILL[marital];
  const langPts =
    langTable[input.firstLanguage.speaking] +
    langTable[input.firstLanguage.listening] +
    langTable[input.firstLanguage.reading] +
    langTable[input.firstLanguage.writing];

  const total = agePts + eduPts + canExpPts + langPts;

  const notes: string[] = [];
  if (canMonths < 12) notes.push("Canadian experience under 12 months: CRS core gives 0 for CAN exp.");
  if (Object.values(input.firstLanguage).some((x) => x < 7))
    notes.push("CLB below 7 in any skill can reduce competitiveness; CLB 9 often unlocks big jumps.");

  return {
    total,
    core: {
      age: agePts,
      education: eduPts,
      firstLanguage: langPts,
      canadianExperience: canExpPts,
    },
    notes,
  };
}

export function diffCRS(a: ProfileInput, b: ProfileInput) {
  const A = calculateCRS(a);
  const B = calculateCRS(b);
  return {
    from: A.total,
    to: B.total,
    delta: B.total - A.total,
    breakdownFrom: A,
    breakdownTo: B,
  };
}
