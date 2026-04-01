import type { StrategyCard } from "@/lib/insights/strategyPages";

type InsightSnapshotGridProps = {
  cards: StrategyCard[];
};

export default function InsightSnapshotGrid({ cards }: InsightSnapshotGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={`${card.label}-${card.title}`}
          className="rounded-[26px] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {card.label}
          </div>
          <div className="mt-3 text-lg font-semibold text-white">{card.title}</div>
          <div className="mt-3 text-sm leading-6 text-white/64">{card.description}</div>
        </div>
      ))}
    </div>
  );
}
