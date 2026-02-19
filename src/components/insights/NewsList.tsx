// src/components/insights/NewsList.tsx
import type { NewsItem } from "@/lib/insights/types";

export default function NewsList({ items }: { items: NewsItem[] }) {
  if (!items || items.length === 0) {
    return <div className="text-sm text-white/60">No news yet.</div>;
  }

  return (
    <ul className="space-y-3">
      {items.slice(0, 8).map((n, i) => {
        const key = n.id ?? `${n.title}-${i}`;
        const date = n.publishedAt ?? "";
        const tag = n.tag ?? "";

        return (
          <li key={key} className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {n.url ? (
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm font-medium text-white hover:underline"
                  >
                    {n.title}
                  </a>
                ) : (
                  <div className="truncate text-sm font-medium text-white">{n.title}</div>
                )}

                <div className="mt-1 text-xs text-white/60">
                  {n.source ?? "Source"}
                  {date ? ` • ${date}` : ""}
                </div>
              </div>

              {tag ? (
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
                  {tag}
                </span>
              ) : n.url ? (
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
                  Open
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}