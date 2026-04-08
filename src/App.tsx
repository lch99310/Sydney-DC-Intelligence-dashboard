import { useEffect, useState } from "react";
import SydneyMap from "./components/SydneyMap";
import FacilityCard from "./components/FacilityCard";
import type { Facility, NewsData, NewsItem, ElectricityData } from "./types";

export default function App() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [electricity, setElectricity] = useState<ElectricityData | null>(null);
  const [selected, setSelected] = useState<Facility | null>(null);

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

  return (
    <div className="h-full flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow">
        <div>
          <h1 className="text-lg font-bold">Sydney DC Intelligence</h1>
          <div className="text-xs text-slate-400">Greater Sydney data center market — MVP</div>
        </div>
        <div className="text-xs text-slate-400">{facilities.length} facilities tracked</div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <SydneyMap
            facilities={facilities}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
        </div>
        <aside className="w-[400px] border-l border-slate-200 bg-white overflow-hidden">
          <FacilityCard facility={selected} news={news} electricity={electricity} />
        </aside>
      </div>
    </div>
  );
}
