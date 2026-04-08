import { useEffect, useState } from "react";
import SydneyMap from "./components/SydneyMap";
import FacilityCard from "./components/FacilityCard";
import SubRegionCard from "./components/SubRegionCard";
import type { Facility, NewsData, NewsItem, ElectricityData, SubRegion } from "./types";
import { DEFAULT_WEIGHTS, type Weights } from "./utils/scoreCalculator";

export default function App() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [electricity, setElectricity] = useState<ElectricityData | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedSubRegion, setSelectedSubRegion] = useState<SubRegion | null>(null);
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/facilities.json`)
      .then((r) => r.json())
      .then(setFacilities)
      .catch((e) => console.error("Failed to load facilities", e));
    fetch(`${import.meta.env.BASE_URL}data/news.json`)
      .then((r) => r.json())
      .then((d: NewsData) => setNews(d.items))
      .catch((e) => console.error("Failed to load news", e));
    fetch(`${import.meta.env.BASE_URL}data/electricity.json`)
      .then((r) => r.json())
      .then((d: ElectricityData) => setElectricity(d))
      .catch((e) => console.error("Failed to load electricity", e));
  }, []);

  const handleFacilitySelect = (f: Facility) => {
    setSelectedFacility(f);
    setSelectedSubRegion(null);
  };

  const handleSubRegionSelect = (id: SubRegion) => {
    setSelectedSubRegion(id);
    setSelectedFacility(null);
  };

  return (
    <div className="h-full flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow">
        <div>
          <h1 className="text-lg font-bold">Sydney DC Intelligence</h1>
          <div className="text-xs text-slate-400">Greater Sydney data center market</div>
        </div>
        <div className="text-xs text-slate-400">{facilities.length} facilities tracked</div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <SydneyMap
            facilities={facilities}
            selectedFacilityId={selectedFacility?.id ?? null}
            selectedSubRegion={selectedSubRegion}
            weights={weights}
            onFacilitySelect={handleFacilitySelect}
            onSubRegionSelect={handleSubRegionSelect}
          />
        </div>
        <aside className="w-[400px] border-l border-slate-200 bg-white overflow-hidden">
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
