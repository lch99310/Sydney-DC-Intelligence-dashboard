import { lazy, Suspense } from "react";
import type { SubRegion, Facility, NewsItem, ElectricityData } from "../types";
import { SUB_REGION_SCORES } from "../data/scorecard-static";
import { weightedScore, type Weights } from "../utils/scoreCalculator";
import WeightSliders from "./WeightSliders";
import NewsSection from "./NewsSection";

const ElectricitySection = lazy(() => import("./ElectricitySection"));

interface Props {
  subRegion: SubRegion;
  weights: Weights;
  onWeightsChange: (w: Weights) => void;
  facilities: Facility[];
  news: NewsItem[];
  electricity: ElectricityData | null;
  onClose: () => void;
}

export default function SubRegionCard({
  subRegion, weights, onWeightsChange, facilities, news, electricity, onClose,
}: Props) {
  const region = SUB_REGION_SCORES[subRegion];
  const score = weightedScore(region, weights);
  const regionFacilities = facilities.filter((f) => f.sub_region === subRegion);
  const totalMw = regionFacilities.reduce((s, f) => s + f.capacity_mw, 0);
  const opCount = regionFacilities.filter((f) => f.status === "operational").length;

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Sub-region</div>
          <h2 className="text-xl font-bold text-slate-900">{region.display_name}</h2>
        </div>
        <button onClick={onClose}
          className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-slate-50 rounded p-2">
          <div className="text-slate-500">Weighted score</div>
          <div className="font-bold text-slate-900">{score.toFixed(2)}/5</div>
        </div>
        <div className="bg-slate-50 rounded p-2">
          <div className="text-slate-500">Facilities</div>
          <div className="font-bold text-slate-900">{regionFacilities.length} ({opCount} op)</div>
        </div>
        <div className="bg-slate-50 rounded p-2">
          <div className="text-slate-500">Total capacity</div>
          <div className="font-bold text-slate-900">{totalMw} MW</div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-800 text-sm mb-2">Factor Scores</h3>
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

      <WeightSliders weights={weights} onChange={onWeightsChange} />

      <div>
        <h3 className="font-semibold text-slate-800 text-sm mb-2">Facilities in region</h3>
        <div className="space-y-1">
          {regionFacilities.length === 0 && (
            <div className="text-xs text-slate-500 italic">No facilities listed.</div>
          )}
          {regionFacilities.map((f) => (
            <div key={f.id} className="flex justify-between text-xs bg-slate-50 rounded px-2 py-1">
              <span className="text-slate-700">{f.operator} — {f.name}</span>
              <span className="font-semibold text-slate-900">{f.capacity_mw}MW</span>
            </div>
          ))}
        </div>
      </div>

      <Suspense fallback={<div className="text-xs text-slate-500 italic py-4">Loading charts…</div>}>
        <ElectricitySection data={electricity} />
      </Suspense>

      <NewsSection items={news} subRegion={subRegion} />
    </div>
  );
}
