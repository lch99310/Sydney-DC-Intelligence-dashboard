import { useState } from "react";
import SydneyMap from "./components/SydneyMap";
import FacilityCard from "./components/FacilityCard";
import SubRegionCard from "./components/SubRegionCard";
import LastUpdated from "./components/LastUpdated";
import MapLegend from "./components/MapLegend";
import type { Facility, NewsData, ElectricityData, SubRegion } from "./types";
import { DEFAULT_WEIGHTS, type Weights } from "./utils/scoreCalculator";
import { useJsonData } from "./hooks/useJsonData";

export default function App() {
  const facilitiesQ = useJsonData<Facility[]>("data/facilities.json");
  const newsQ = useJsonData<NewsData>("data/news.json");
  const electricityQ = useJsonData<ElectricityData>("data/electricity.json");

  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedSubRegion, setSelectedSubRegion] = useState<SubRegion | null>(null);
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [panelOpen, setPanelOpen] = useState(false);

  const facilities = facilitiesQ.data ?? [];
  const news = newsQ.data?.items ?? [];
  const electricity = electricityQ.data;

  const handleFacilitySelect = (f: Facility) => {
    setSelectedFacility(f);
    setSelectedSubRegion(null);
    setPanelOpen(true);
  };

  const handleSubRegionSelect = (id: SubRegion) => {
    setSelectedSubRegion(id);
    setSelectedFacility(null);
    setPanelOpen(true);
  };

  const anyLoading = facilitiesQ.loading || newsQ.loading || electricityQ.loading;
  const anyError = facilitiesQ.error || newsQ.error || electricityQ.error;

  return (
    <div className="h-full flex flex-col">
      <header className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow flex-wrap gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-bold">Sydney DC Intelligence</h1>
          <div className="text-[11px] text-slate-400">Greater Sydney data center market</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-[11px] text-slate-400">{facilities.length} facilities tracked</div>
          <LastUpdated />
        </div>
      </header>

      {anyError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-700">
          Some data failed to load: {[facilitiesQ.error, newsQ.error, electricityQ.error].filter(Boolean).join("; ")}
        </div>
      )}
      {anyLoading && !anyError && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-1 text-xs text-blue-700">
          Loading data…
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="flex-1 relative min-h-[50vh]">
          <SydneyMap
            facilities={facilities}
            selectedFacilityId={selectedFacility?.id ?? null}
            selectedSubRegion={selectedSubRegion}
            weights={weights}
            onFacilitySelect={handleFacilitySelect}
            onSubRegionSelect={handleSubRegionSelect}
          />
          <MapLegend />
          <button
            onClick={() => setPanelOpen(true)}
            className="md:hidden absolute bottom-4 right-4 z-[500] bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg"
          >
            Open panel
          </button>
        </div>

        <aside
          className={`bg-white border-slate-200 overflow-hidden
            md:w-[420px] md:border-l md:relative md:translate-y-0 md:block
            fixed inset-x-0 bottom-0 h-[70vh] border-t z-[1000]
            transition-transform duration-300
            ${panelOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"}`}
        >
          <div className="md:hidden flex justify-end px-3 pt-2">
            <button
              onClick={() => setPanelOpen(false)}
              className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
              aria-label="Close panel"
            >
              ×
            </button>
          </div>
          {selectedSubRegion ? (
            <SubRegionCard
              subRegion={selectedSubRegion}
              weights={weights}
              onWeightsChange={setWeights}
              facilities={facilities}
              news={news}
              electricity={electricity}
              onClose={() => setSelectedSubRegion(null)}
            />
          ) : (
            <FacilityCard
              facility={selectedFacility}
              news={news}
              electricity={electricity}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
