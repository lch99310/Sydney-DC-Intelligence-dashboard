import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import type { Facility, SubRegion } from "../types";
import SubRegionLayer from "./SubRegionLayer";
import type { Weights } from "../utils/scoreCalculator";

const STATUS_COLOR: Record<string, string> = {
  operational: "#16a34a",
  under_construction: "#ea580c",
  planned: "#2563eb",
};

interface Props {
  facilities: Facility[];
  selectedFacilityId: string | null;
  selectedSubRegion: SubRegion | null;
  weights: Weights;
  onFacilitySelect: (f: Facility) => void;
  onSubRegionSelect: (id: SubRegion) => void;
}

export default function SydneyMap({
  facilities, selectedFacilityId, selectedSubRegion, weights,
  onFacilitySelect, onSubRegionSelect,
}: Props) {
  return (
    <MapContainer
      center={[-33.83, 150.95]}
      zoom={10}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <SubRegionLayer
        weights={weights}
        selectedId={selectedSubRegion}
        onSelect={onSubRegionSelect}
      />
      {facilities.map((f) => {
        const isSelected = f.id === selectedFacilityId;
        const radius = Math.max(6, Math.min(22, Math.sqrt(f.capacity_mw) * 1.4));
        return (
          <CircleMarker
            key={f.id}
            center={[f.lat, f.lng]}
            radius={radius}
            pathOptions={{
              color: isSelected ? "#000" : STATUS_COLOR[f.status],
              fillColor: STATUS_COLOR[f.status],
              fillOpacity: 0.85,
              weight: isSelected ? 3 : 1,
            }}
            eventHandlers={{ click: () => onFacilitySelect(f) }}
          >
            <Tooltip>{f.operator} — {f.name} ({f.capacity_mw}MW)</Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
