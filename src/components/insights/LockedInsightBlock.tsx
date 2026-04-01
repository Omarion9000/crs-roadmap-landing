"use client";

import Link from "next/link";
import { type FunnelEvent, trackFunnelEvent } from "@/lib/funnel";

type LockedInsightBlockProps = {
  title: string;
  features: string[];
  ctaText: string;
  href?: string;
  previewLines?: string[];
  analyticsEvent?: FunnelEvent;
};

export default function LockedInsightBlock({
  title,
  features,
  ctaText,
  href = "/billing",
  previewLines = [],
  analyticsEvent,
}: LockedInsightBlockProps) {
  return (
    <div className="rounded-[30px] border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(255,255,255,0.03))] p-5 shadow-[0_24px_80px_-56px_rgba(34,211,238,0.32)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white/85">
          <span className="text-sm">🔒</span>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/75">
            Locked depth
          </div>
          <div className="mt-1 text-lg font-semibold text-white">{title}</div>
          <div className="mt-1 text-sm text-white/62">
            Turn this preview into a complete roadmap with the full execution layer.
          </div>
        </div>
      </div>

      {previewLines.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-black/20 p-4">
          <div className="space-y-3 blur-[3px] opacity-70">
            {previewLines.map((line) => (
              <div key={line} className="h-4 rounded-full bg-white/10">
                <span className="sr-only">{line}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2">
        {features.map((feature) => (
          <div
            key={feature}
            className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/76"
          >
            {feature}
          </div>
        ))}
      </div>

      <div className="mt-5">
        <Link
          href={href}
          onClick={() => {
            if (analyticsEvent) {
              trackFunnelEvent(analyticsEvent, { href, ctaText });
            }
          }}
          className="inline-flex rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
        >
          {ctaText}
        </Link>
      </div>
    </div>
  );
}
