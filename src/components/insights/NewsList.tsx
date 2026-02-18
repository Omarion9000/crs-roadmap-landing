"use client";

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  dateISO: string;
  url?: string;
  tag?: string;
};

export default function NewsList({ items }: { items: NewsItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">
        News module is ready ✅ — next step is wiring a real feed (/api/news).
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="text-sm font-semibold text-white">Latest news</div>

      <div className="mt-4 space-y-3">
        {items.map((n) => (
          <a
            key={n.id}
            href={n.url ?? "#"}
            className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-black/30 transition"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white">{n.title}</div>
              {n.tag ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/70">
                  {n.tag}
                </span>
              ) : null}
            </div>
            <div className="mt-2 text-xs text-white/60">
              {n.source} • {n.dateISO}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}