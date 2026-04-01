import Link from "next/link";
import type { StrategyPageContent } from "@/lib/insights/strategyPages";

type InsightNavCardProps = {
  page: StrategyPageContent;
  isPro: boolean;
};

export default function InsightNavCard({ page, isPro }: InsightNavCardProps) {
  return (
    <Link
      href={`/insights/${page.slug}`}
      className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
          Strategy path
        </div>
        <div
          className={[
            "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            isPro
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
              : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
          ].join(" ")}
        >
          {isPro ? "Premium ready" : "Preview"}
        </div>
      </div>

      <div className="mt-3 text-xl font-semibold text-white transition group-hover:text-cyan-100">
        {page.title}
      </div>
      <div className="mt-3 text-sm leading-6 text-white/64">{page.description}</div>

      <div className="mt-5 flex flex-wrap gap-2">
        {page.previewBullets.slice(0, 2).map((bullet) => (
          <span
            key={bullet}
            className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-white/68"
          >
            {bullet}
          </span>
        ))}
      </div>

      <div className="mt-5 text-sm font-semibold text-white/80">
        {isPro ? "Open strategy" : "Preview strategy"}
      </div>
    </Link>
  );
}
