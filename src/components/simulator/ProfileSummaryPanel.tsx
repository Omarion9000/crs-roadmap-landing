"use client";

import Link from "next/link";
import type { RefObject } from "react";
import type {
  ExpressEntryEligibilityItem,
  ExpressEntryEligibilityStatus,
} from "@/lib/expressEntryEligibility";

type ProfileSummaryItem = {
  label: string;
  value: string;
};

type OpportunityItem = {
  key: string;
  scenarioId: string;
  title: string;
  description: string;
};

type ProfileSummaryPanelProps = {
  profileSummaryItems: ProfileSummaryItem[];
  expressEntryEligibility: ExpressEntryEligibilityItem[];
  eligibilityAnchorRef?: RefObject<HTMLDivElement | null>;
  highlightEligibility?: boolean;
  availableOpportunities: OpportunityItem[];
  scenarioToggles: Record<string, boolean>;
  activeToggleCount: number;
  onToggleOpportunity: (key: string) => void;
  onClearPreviews: () => void;
};

function statusClasses(status: ExpressEntryEligibilityStatus) {
  switch (status) {
    case "eligible":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    case "needs_review":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    default:
      return "border-white/10 bg-white/5 text-white/75";
  }
}

function statusLabel(status: ExpressEntryEligibilityStatus) {
  switch (status) {
    case "eligible":
      return "Likely eligible";
    case "needs_review":
      return "Needs review";
    default:
      return "Not currently eligible";
  }
}

export default function ProfileSummaryPanel({
  profileSummaryItems,
  expressEntryEligibility,
  eligibilityAnchorRef,
  highlightEligibility = false,
  availableOpportunities,
  scenarioToggles,
  activeToggleCount,
  onToggleOpportunity,
  onClearPreviews,
}: ProfileSummaryPanelProps) {
  return (
    <div className="space-y-4">
      <div
        ref={eligibilityAnchorRef}
        className={[
          "rounded-[28px] border bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-300",
          highlightEligibility
            ? "border-cyan-400/35 ring-1 ring-cyan-400/25"
            : "border-white/10",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/75">Profile state</div>
            <div className="mt-2 text-lg font-semibold text-white">Your current CRS profile</div>
            <div className="mt-1 text-xs text-white/55">Based on your calculator results.</div>
          </div>

          <Link
            href="/crs-calculator"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/75 transition hover:bg-white/10"
          >
            Edit base profile
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {profileSummaryItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {item.label}
              </div>
              <div className="mt-2 text-sm font-semibold text-white">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/75">
            Express Entry eligibility
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            Your eligible Express Entry programs
          </div>
          <div className="mt-1 text-xs text-white/55">
            Based on your current profile, this is a product guidance layer for CEC, FSW, and FST. Review official IRCC requirements before making final decisions.
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {expressEntryEligibility.map((program) => {
            const blocker = program.unmetRequirements[0] ?? program.reasons[0] ?? "";

            return (
              <div
                key={program.id}
                className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{program.label}</div>
                    <div className="mt-1 text-xs leading-5 text-white/62">
                      {program.summary}
                    </div>
                  </div>

                  <span
                    className={[
                      "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      statusClasses(program.status),
                    ].join(" ")}
                  >
                    {statusLabel(program.status)}
                  </span>
                </div>

                {blocker ? (
                  <div className="mt-3 text-xs leading-5 text-white/54">{blocker}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/75">Control module</div>
            <div className="mt-2 text-lg font-semibold text-white">Simulate improvements</div>
            <div className="mt-1 text-xs text-white/55">
              Turn on only the missing opportunities you want to preview.
            </div>
          </div>

          {activeToggleCount > 0 ? (
            <button
              type="button"
              onClick={onClearPreviews}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70 transition hover:bg-white/10"
            >
              Clear previews
            </button>
          ) : null}
        </div>

        {availableOpportunities.length ? (
          <div className="mt-4 space-y-3">
            {availableOpportunities.map((opportunity) => {
              const active = scenarioToggles[opportunity.scenarioId];

              return (
                <button
                  key={opportunity.scenarioId}
                  type="button"
                  onClick={() => onToggleOpportunity(opportunity.scenarioId)}
                  className={[
                    "w-full rounded-[22px] border px-4 py-4 text-left transition duration-300",
                    active
                      ? "border-cyan-400/30 bg-linear-to-br from-cyan-400/10 via-white/[0.04] to-transparent shadow-[0_18px_48px_-30px_rgba(34,211,238,0.45)]"
                      : "border-white/10 bg-white/5 hover:border-white/15 hover:bg-white/10",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{opportunity.title}</div>
                      <div className="mt-1 text-xs leading-5 text-white/60">{opportunity.description}</div>
                    </div>

                    <span
                      className={[
                        "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                        active
                          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
                          : "border-white/10 bg-black/20 text-white/60",
                      ].join(" ")}
                    >
                      {active ? "Previewing" : "Available"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            Your current profile already covers the main opportunity set in this simulator.
          </div>
        )}

        <div className="mt-4 text-xs leading-6 text-white/50">
          Scenarios are based on your current profile and official CRS rules.
        </div>
      </div>
    </div>
  );
}
