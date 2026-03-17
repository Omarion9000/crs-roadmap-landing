// src/lib/crs/profile.ts
import type { Profile, ProfileDraft } from "./types";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const DEFAULT_PROFILE: Profile = {
  baseCrs: 472,
  ieltsClb: 8,
  frenchClb: 0,
  canExpYears: 0,
  hasJobOffer: false,
  hasPnp: false,
};

export function buildProfile(draft: ProfileDraft): Profile {
  const baseCrs = Number.isFinite(draft.baseCrs as number) ? Number(draft.baseCrs) : DEFAULT_PROFILE.baseCrs;

  const ieltsClb = Number.isFinite(draft.ieltsClb as number) ? Number(draft.ieltsClb) : DEFAULT_PROFILE.ieltsClb;
  const frenchClb = Number.isFinite(draft.frenchClb as number) ? Number(draft.frenchClb) : DEFAULT_PROFILE.frenchClb;
  const canExpYears = Number.isFinite(draft.canExpYears as number) ? Number(draft.canExpYears) : DEFAULT_PROFILE.canExpYears;

  return {
    baseCrs: clamp(baseCrs, 1, 1200),
    ieltsClb: clamp(ieltsClb, 0, 10),
    frenchClb: clamp(frenchClb, 0, 10),
    canExpYears: clamp(canExpYears, 0, 5),
    hasJobOffer: Boolean(draft.hasJobOffer ?? DEFAULT_PROFILE.hasJobOffer),
    hasPnp: Boolean(draft.hasPnp ?? DEFAULT_PROFILE.hasPnp),
  };
}