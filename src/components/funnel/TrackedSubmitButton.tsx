"use client";

import { type ButtonHTMLAttributes } from "react";
import { type FunnelEvent, trackFunnelEvent } from "@/lib/funnel";

type TrackedSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  event: FunnelEvent;
  payload?: Record<string, unknown>;
};

export default function TrackedSubmitButton({
  event,
  payload = {},
  onClick,
  ...props
}: TrackedSubmitButtonProps) {
  return (
    <button
      {...props}
      onClick={(e) => {
        trackFunnelEvent(event, payload);
        onClick?.(e);
      }}
    />
  );
}
