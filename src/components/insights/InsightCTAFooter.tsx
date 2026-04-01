import Link from "next/link";
import { trackFunnelEvent } from "@/lib/funnel";
import { buildLoginHref } from "@/lib/upgrade";

type InsightCTAFooterProps = {
  isPro: boolean;
  isAuthenticated: boolean;
  upgradeHref?: string;
};

export default function InsightCTAFooter({
  isPro,
  isAuthenticated,
  upgradeHref = "/billing",
}: InsightCTAFooterProps) {
  return (
    <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
          Continue your roadmap
        </div>
        <div className="mt-3 text-xl font-semibold text-white">
          {isPro ? "Keep building with the simulator and dashboard." : "Preview now, unlock the full workflow when you’re ready."}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/simulator"
          className="rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Back to simulator
        </Link>
        <Link
          href={isPro ? "/dashboard" : isAuthenticated ? upgradeHref : buildLoginHref({ returnTo: "/insights" })}
          onClick={() => {
            if (!isPro) {
              trackFunnelEvent("locked_strategy_clicked", {
                href: isAuthenticated ? upgradeHref : "/insights",
              });
            }
          }}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          {isPro ? "Open dashboard" : "Unlock full strategy"}
        </Link>
      </div>
    </section>
  );
}
