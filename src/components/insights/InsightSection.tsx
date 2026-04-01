import type { ReactNode } from "react";

type InsightSectionProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export default function InsightSection({
  eyebrow,
  title,
  description,
  children,
}: InsightSectionProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-7">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
        {eyebrow}
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">{title}</h2>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/66">{description}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
