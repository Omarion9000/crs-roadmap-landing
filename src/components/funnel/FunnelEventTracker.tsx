"use client";

import { useEffect } from "react";
import {
  type FunnelEvent,
  trackFunnelEvent,
  trackFunnelEventOnce,
} from "@/lib/funnel";

type FunnelEventTrackerProps = {
  event: FunnelEvent;
  payload?: Record<string, unknown>;
  onceKey?: string;
};

export default function FunnelEventTracker({
  event,
  payload = {},
  onceKey,
}: FunnelEventTrackerProps) {
  useEffect(() => {
    if (onceKey) {
      trackFunnelEventOnce(onceKey, event, payload);
      return;
    }

    trackFunnelEvent(event, payload);
  }, [event, onceKey, payload]);

  return null;
}
