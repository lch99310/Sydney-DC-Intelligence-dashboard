import { Polygon, Tooltip } from "react-leaflet";
import type { SubRegion } from "../types";
import { SUB_REGION_SCORES } from "../data/scorecard-static";
import { SUB_REGION_POLYGONS } from "../data/sub-regions-geo";
import { weightedScore, scoreToColor, type Weights } from "../utils/scoreCalculator";

interface Props {
  weights: Weights;
  selectedId: SubRegion | null;
  onSelect: (id: SubRegion) => void;
}

export default function SubRegionLayer({ weights, selectedId, onSelect }: Props) {
  return (
    <>
      {(Object.keys(SUB_REGION_POLYGONS) as SubRegion[]).map((id) => {
        const region = SUB_REGION_SCORES[id];
        const score = weightedScore(region, weights);
        const color = scoreToColor(score);
        const isSelected = id === selectedId;
        return (
          <Polygon
            key={id}
            positions={SUB_REGION_POLYGONS[id]}
            pathOptions={{
              color: isSelected ? "#0f172a" : "#64748b",
              weight: isSelected ? 3 : 1.5,
              fillColor: color,
              fillOpacity: 0.45,
            }}
            eventHandlers={{ click: () => onSelect(id) }}
          >
            <Tooltip sticky>
              <div className="text-xs">
                <div className="font-bold">{region.display_name}</div>
                <div>Weighted score: {score.toFixed(2)}/5</div>
              </div>
            </Tooltip>
          </Polygon>
        );
      })}
    </>
  );
}
