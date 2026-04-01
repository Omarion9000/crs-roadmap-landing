"use client";

import Link from "next/link";
import { type FunnelEvent, trackFunnelEvent } from "@/lib/funnel";

type PremiumLockedPanelProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  note?: string;
  bullets?: string[];
  compact?: boolean;
  analyticsEvent?: FunnelEvent;
};

export default function PremiumLockedPanel({
  eyebrow = "Premium strategy path",
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  note,
  bullets = [],
  compact = false,
  analyticsEvent,
}: PremiumLockedPanelProps) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-cyan-400/20 bg-white/[0.05] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_26px_90px_-56px_rgba(34,211,238,0.35)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-cyan-500/10 via-transparent to-indigo-500/10" />
      <div className="pointer-events-none absolute -right-10 top-0 h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative z-10">
        <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
          {eyebrow}
        </div>

        <div className={compact ? "mt-4" : "mt-5"}>
          <h3 className={compact ? "text-xl font-semibold text-white" : "text-2xl font-semibold tracking-tight text-white"}>
            {title}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">{description}</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/56">
            Unlock the full strategy behind this preview with clearer sequencing, trade-offs, alternatives, and roadmap continuity.
          </p>
        </div>

        {bullets.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {bullets.map((bullet) => (
              <span
                key={bullet}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/72"
              >
                {bullet}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href={primaryHref}
            onClick={() => {
              if (analyticsEvent) {
                trackFunnelEvent(analyticsEvent, { primaryHref, primaryLabel });
              }
            }}
            className="rounded-full border border-cyan-400/20 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
          >
            {primaryLabel}
          </Link>

          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>

        {note ? (
          <div className="mt-4 text-xs leading-6 text-white/52">{note}</div>
        ) : null}
      </div>
    </div>
  );
}
