export type UpgradeUnlock =
  | "ai"
  | "strategy"
  | "roadmap"
  | "dashboard"
  | "pro";

function sanitizeInternalPath(path: string | null | undefined) {
  if (!path || !path.startsWith("/")) {
    return "/billing";
  }

  return path;
}

export function buildBillingHref(options?: {
  returnTo?: string | null;
  unlock?: UpgradeUnlock | null;
}) {
  const params = new URLSearchParams();

  const returnTo = sanitizeInternalPath(options?.returnTo);
  if (returnTo !== "/billing") {
    params.set("returnTo", returnTo);
  }

  if (options?.unlock) {
    params.set("unlock", options.unlock);
  }

  const query = params.toString();
  return query ? `/billing?${query}` : "/billing";
}

export function buildLoginHref(options?: {
  returnTo?: string | null;
}) {
  const params = new URLSearchParams();
  const rawReturnTo = options?.returnTo;
  const returnTo =
    rawReturnTo && rawReturnTo.startsWith("/") ? rawReturnTo : "/start";

  params.set("returnTo", returnTo);

  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}

export function buildPostUpgradeHref(
  returnTo?: string | null,
  unlock?: UpgradeUnlock | null
) {
  const safeTarget = sanitizeInternalPath(returnTo);

  if (safeTarget === "/billing") {
    const params = new URLSearchParams({
      success: "true",
    });

    if (unlock) {
      params.set("unlock", unlock);
    }

    return `/billing?${params.toString()}`;
  }

  const [pathname, existingQuery = ""] = safeTarget.split("?");
  const params = new URLSearchParams(existingQuery);
  params.set("pro", "unlocked");

  if (unlock) {
    params.set("unlock", unlock);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function upgradeSuccessMessage(unlock?: string | null) {
  switch (unlock) {
    case "ai":
      return "Pro unlocked. Your full AI strategy is now available.";
    case "strategy":
      return "Pro unlocked. Your full strategy workspace is now available.";
    case "roadmap":
      return "Pro unlocked. You can now save and track your roadmap.";
    case "dashboard":
      return "Pro unlocked. Your full dashboard workflow is now active.";
    default:
      return "Pro unlocked. Your full strategy is now available.";
  }
}
