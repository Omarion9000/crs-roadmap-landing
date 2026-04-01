export function normalizePreferredName(value: string | null | undefined) {
  if (!value) return null;

  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized || null;
}

export function getPreferredName(
  profile:
    | { preferred_name?: string | null }
    | { baseProfile?: { preferred_name?: string | null } | null }
    | null
    | undefined
) {
  if (!profile) return null;

  if ("preferred_name" in profile) {
    return normalizePreferredName(profile.preferred_name);
  }

  if ("baseProfile" in profile) {
    return normalizePreferredName(profile.baseProfile?.preferred_name);
  }

  return null;
}

export function withName(name: string | null | undefined, text: string) {
  const preferredName = normalizePreferredName(name);
  if (!preferredName) return text;
  return `${preferredName}, ${text}`;
}

export function advisorLine(
  name: string | null | undefined,
  namedText: string,
  fallbackText: string
) {
  const preferredName = normalizePreferredName(name);
  return preferredName ? `${preferredName}, ${namedText}` : fallbackText;
}

export function possessiveLabel(name: string) {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

export function roadmapDisplayName(preferredName: string | null | undefined) {
  const name = normalizePreferredName(preferredName);
  return name ? `${possessiveLabel(name)} roadmap` : "Your roadmap";
}

export function greetingLabel(preferredName: string | null | undefined) {
  return getPreferredName({ preferred_name: preferredName });
}
