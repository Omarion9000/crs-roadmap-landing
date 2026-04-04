export const AUTH_CALLBACK_PATH = "/auth/callback";

function normalizeBaseUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/\/+$/, "");
  }

  if (trimmed.includes(".")) {
    return `https://${trimmed.replace(/\/+$/, "")}`;
  }

  return null;
}

export function sanitizeReturnTo(path: string | null | undefined) {
  if (!path || !path.startsWith("/")) {
    return "/start";
  }

  return path;
}

export function getAuthBaseUrl(options?: { requestOrigin?: string | null }) {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  const fromRequest = normalizeBaseUrl(options?.requestOrigin);
  if (fromRequest) {
    return fromRequest;
  }

  const fromEnv =
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeBaseUrl(process.env.VERCEL_URL);

  if (fromEnv) {
    return fromEnv;
  }

  return "http://localhost:3000";
}

export function getAuthRedirectUrl(
  path = AUTH_CALLBACK_PATH,
  options?: {
    returnTo?: string | null;
    requestOrigin?: string | null;
  }
) {
  const baseUrl = getAuthBaseUrl({ requestOrigin: options?.requestOrigin });
  const url = new URL(path, baseUrl);
  const returnTo = sanitizeReturnTo(options?.returnTo);

  if (returnTo) {
    url.searchParams.set("returnTo", returnTo);
  }

  return url.toString();
}
