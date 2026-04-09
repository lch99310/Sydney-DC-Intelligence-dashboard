import { useEffect, useState } from "react";

interface Metadata {
  electricity_last_updated?: string;
  news_last_updated?: string;
  facilities_last_updated?: string;
  data_sources?: Record<string, string>;
}

function formatRelative(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffHours = (Date.now() - d.getTime()) / 3_600_000;
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export default function LastUpdated() {
  const [meta, setMeta] = useState<Metadata | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/metadata.json`)
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => setMeta(null));
  }, []);

  if (!meta) return null;

  return (
    <div className="flex items-center gap-4 text-[10px] text-slate-400">
      <span>⚡ {formatRelative(meta.electricity_last_updated)}</span>
      <span>📰 {formatRelative(meta.news_last_updated)}</span>
      <span>🏢 {formatRelative(meta.facilities_last_updated)}</span>
    </div>
  );
}
