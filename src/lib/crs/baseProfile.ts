export const BASE_PROFILE_STORAGE_KEY = "crs_base_profile";
export const ROADMAP_STORAGE_KEY = "crs_roadmap";

export type StoredBaseProfilePayload = {
  createdAt: string;
  ownerKey?: string | null;
  baseProfile: {
    currentCrs: number;
    preferred_name?: string;
    englishClb?: number;
    frenchClb?: number;
    canadianExperienceYears?: number;
    hasJobOffer?: boolean;
    hasPnp?: boolean;
    educationLabel?: string;
    maritalStatusLabel?: string;
    foreignExperienceLabel?: string;
    canadianCredentialLabel?: string;
    firstLanguageTestLabel?: string;
    secondLanguageTestLabel?: string;
    profileModeLabel?: string;
    rawForm?: unknown;
  };
};

export function getBaseProfileOwnerKey(
  user: { id?: string | null; email?: string | null } | null | undefined
) {
  const id = user?.id?.trim();
  if (id) return id;

  const email = user?.email?.trim().toLowerCase();
  return email || null;
}

export function parseStoredBaseProfile(raw: string | null): StoredBaseProfilePayload | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredBaseProfilePayload;
    const currentCrs = parsed?.baseProfile?.currentCrs;

    if (typeof currentCrs !== "number" || !Number.isFinite(currentCrs) || currentCrs <= 0) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredBaseProfile() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(BASE_PROFILE_STORAGE_KEY);
  } catch {
    // ignore client storage failures
  }
}

export function readAnyStoredBaseProfile() {
  if (typeof window === "undefined") return null;
  return parseStoredBaseProfile(window.localStorage.getItem(BASE_PROFILE_STORAGE_KEY));
}

export function readStoredBaseProfile(ownerKey?: string | null): StoredBaseProfilePayload | null {
  const parsed = readAnyStoredBaseProfile();
  if (!parsed) return null;

  if (!ownerKey) {
    return parsed.ownerKey ? null : parsed;
  }

  return parsed.ownerKey === ownerKey ? parsed : null;
}

export function hasUsableBaseProfile(payload: StoredBaseProfilePayload | null | undefined) {
  return !!payload && typeof payload.baseProfile?.currentCrs === "number" && Number.isFinite(payload.baseProfile.currentCrs) && payload.baseProfile.currentCrs > 0;
}

export function hasBaseProfile(ownerKey?: string | null) {
  return hasUsableBaseProfile(readStoredBaseProfile(ownerKey));
}

export function hasRoadmap() {
  if (typeof window === "undefined") return false;

  try {
    const raw = window.localStorage.getItem(ROADMAP_STORAGE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.length > 0;
    }

    return !!parsed && typeof parsed === "object" && Object.keys(parsed).length > 0;
  } catch {
    return false;
  }
}

export function persistStoredBaseProfile(payload: StoredBaseProfilePayload | null) {
  if (typeof window === "undefined") return;

  if (!payload) {
    clearStoredBaseProfile();
    return;
  }

  try {
    window.localStorage.setItem(BASE_PROFILE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore client storage failures
  }
}
