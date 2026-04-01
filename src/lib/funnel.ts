export type FunnelEvent =
  | "landing_cta_clicked"
  | "signup_started"
  | "signup_completed"
  | "base_profile_started"
  | "base_profile_completed"
  | "simulator_viewed"
  | "strategy_preview_viewed"
  | "locked_ai_clicked"
  | "locked_strategy_clicked"
  | "pricing_viewed"
  | "checkout_started"
  | "checkout_completed"
  | "pro_unlocked"
  | "roadmap_saved";

type FunnelPayload = Record<string, unknown>;

function getOnceStorageKey(key: string) {
  return `crs_funnel_once:${key}`;
}

export function trackFunnelEvent(event: FunnelEvent, payload: FunnelPayload = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const detail = {
    event,
    payload,
    timestamp: new Date().toISOString(),
  };

  try {
    const rawHistory = window.sessionStorage.getItem("crs_funnel_events");
    const history = rawHistory ? (JSON.parse(rawHistory) as unknown[]) : [];
    history.push(detail);
    window.sessionStorage.setItem("crs_funnel_events", JSON.stringify(history.slice(-100)));
  } catch {
    // ignore storage failures
  }

  console.log(`[funnel] ${event}`, payload);

  window.dispatchEvent(new CustomEvent("crs-funnel-event", { detail }));

  const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push(detail);
  }
}

export function trackFunnelEventOnce(
  onceKey: string,
  event: FunnelEvent,
  payload: FunnelPayload = {}
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const storageKey = getOnceStorageKey(onceKey);
    if (window.sessionStorage.getItem(storageKey)) {
      return;
    }

    window.sessionStorage.setItem(storageKey, "1");
  } catch {
    // ignore storage failures
  }

  trackFunnelEvent(event, payload);
}
