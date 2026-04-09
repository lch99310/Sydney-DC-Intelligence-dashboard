import { lazy, Suspense } from "react";
import type { Facility, NewsItem, ElectricityData } from "../types";
import { SUB_REGION_SCORES } from "../data/scorecard-static";
import CostCalculator from "./CostCalculator";
import NewsSection from "./NewsSection";

const ElectricitySection = lazy(() => import("./ElectricitySection"));
const ChartsFallback = (
  <div className="text-xs text-slate-500 italic py-4">Loading charts…</div>
);

const STATUS_LABEL: Record<string, string> = {
  operational: "Operational",
  under_construction: "Under Construction",
  planned: "Planned",
};

const STATUS_BG: Record<string, string> = {
  operational: "bg-green-100 text-green-800",
  under_construction: "bg-orange-100 text-orange-800",
  planned: "bg-blue-100 text-blue-800",
};

interface Props {
  facility: Facility | null;
  news: NewsItem[];
  electricity: ElectricityData | null;
}

export default function FacilityCard({ facility, news, electricity }: Props) {
  if (!facility) {
    return (
      <div className="p-6 text-slate-500 overflow-y-auto h-full space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Sydney DC Intelligence</h2>
          <p className="text-sm">Click any facility marker on the map to see details.</p>
          <div className="mt-4 text-xs space-y-1">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-600"></span> Operational</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-600"></span> Under Construction</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-600"></span> Planned</div>
          </div>
        </div>
        <Suspense fallback={ChartsFallback}>
          <ElectricitySection data={electricity} />
        </Suspense>
        <NewsSection items={news} />
      </div>
    );
  }

  const region = SUB_REGION_SCORES[facility.sub_region];

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">{facility.operator}</div>
        <h2 className="text-xl font-bold text-slate-900">{facility.name}</h2>
        <div className="text-sm text-slate-600">{facility.suburb}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-50 rounded p-2">
          <div className="text-xs text-slate-500">Capacity</div>
          <div className="font-bold text-slate-900">{facility.capacity_mw} MW</div>
        </div>
        <div className="bg-slate-50 rounded p-2">
          <div className="text-xs text-slate-500">Status</div>
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${STATUS_BG[facility.status]}`}>
            {STATUS_LABEL[facility.status]}
          </span>
        </div>
        <div className="bg-slate-50 rounded p-2">
          <div className="text-xs text-slate-500">{facility.year_opened ? "Opened" : "Planned"}</div>
          <div className="font-bold text-slate-900">{facility.year_opened ?? facility.year_planned ?? "—"}</div>
        </div>
        <div className="bg-slate-50 rounded p-2">
          <div className="text-xs text-slate-500">Sub-region</div>
          <div className="font-semibold text-slate-900 text-xs">{region.display_name}</div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-800 text-sm mb-2">Sub-region Scorecard</h3>
        <div className="space-y-1.5">
          {Object.entries(region.scores).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 text-xs">
              <div className="w-24 capitalize text-slate-600">{k}</div>
              <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full" style={{ width: `${(v / 5) * 100}%` }} />
              </div>
              <div className="w-6 text-right font-semibold text-slate-700">{v}/5</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2 italic">{region.summary}</p>
      </div>

      <CostCalculator defaultMw={facility.capacity_mw} />

      <Suspense fallback={ChartsFallback}>
        <ElectricitySection data={electricity} />
      </Suspense>

      <NewsSection items={news} operatorSlug={facility.operator_slug} subRegion={facility.sub_region} />

      <a href={facility.url} target="_blank" rel="noreferrer"
         className="block text-center text-sm text-blue-600 hover:underline">
        Visit operator website ↗
      </a>
    </div>
  );
}
