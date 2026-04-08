import type { NewsItem } from "../types";

interface Props {
  items: NewsItem[];
  operatorSlug?: string | null;
  subRegion?: string | null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffDays = Math.floor((now - d.getTime()) / 86400000);
  if (diffDays < 1) return "today";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export default function NewsSection({ items, operatorSlug, subRegion }: Props) {
  let filtered = items;
  if (operatorSlug || subRegion) {
    filtered = items.filter((i) =>
      (operatorSlug && i.tags.includes(operatorSlug)) ||
      (subRegion && i.tags.includes(subRegion))
    );
  }
  const toShow = filtered.length > 0 ? filtered : items.slice(0, 5);
  const isFiltered = filtered.length > 0 && (operatorSlug || subRegion);

  return (
    <div>
      <h3 className="font-semibold text-slate-800 text-sm mb-2">
        News Feed
        {isFiltered && (
          <span className="ml-2 text-xs font-normal text-slate-500">
            (filtered: {operatorSlug || subRegion})
          </span>
        )}
      </h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {toShow.length === 0 && (
          <div className="text-xs text-slate-500 italic">No news items available.</div>
        )}
        {toShow.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="block bg-slate-50 hover:bg-slate-100 rounded p-2 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wide font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                {item.source}
              </span>
              <span className="text-[10px] text-slate-500">{formatDate(item.published_at)}</span>
            </div>
            <div className="text-xs font-semibold text-slate-900 leading-snug">{item.title}</div>
            <div className="text-[11px] text-slate-600 mt-1 line-clamp-2">{item.summary}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
