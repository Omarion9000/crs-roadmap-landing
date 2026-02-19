"use client";

type Accent = "indigo" | "blue" | "violet" | "emerald";

type Props = {
  title: string;
  value: string;
  sub?: string;
  chip?: string;
  accent?: Accent;
};

const ACCENT: Record<Accent, { ring: string; dot: string; text: string }> = {
  indigo: { ring: "ring-indigo-500/20", dot: "bg-indigo-400", text: "text-indigo-200" },
  blue: { ring: "ring-blue-500/20", dot: "bg-blue-400", text: "text-blue-200" },
  violet: { ring: "ring-violet-500/20", dot: "bg-violet-400", text: "text-violet-200" },
  emerald: { ring: "ring-emerald-500/20", dot: "bg-emerald-400", text: "text-emerald-200" },
};

export default function KpiCard({
  title,
  value,
  sub,
  chip,
  accent = "indigo",
}: Props) {
  const a = ACCENT[accent];

  return (
    <div
      className={[
        "rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur",
        "ring-1",
        a.ring,
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white/80">{title}</div>

        {chip ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
            <span className={`h-2 w-2 rounded-full ${a.dot}`} />
            <span className={a.text}>{chip}</span>
          </span>
        ) : null}
      </div>

      <div className="mt-3 text-3xl font-bold tracking-tight text-white">{value}</div>

      {sub ? <div className="mt-1 text-sm text-white/60">{sub}</div> : null}
    </div>
  );
}