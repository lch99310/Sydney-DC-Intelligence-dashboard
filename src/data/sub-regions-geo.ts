import type { SubRegion } from "../types";

/** Hand-crafted bounding polygons for Sydney DC sub-regions.
 *  Coordinates are [lat, lng] pairs (Leaflet convention, not GeoJSON).
 *  These are approximations, not legal boundaries. */
export const SUB_REGION_POLYGONS: Record<SubRegion, [number, number][]> = {
  western_sydney: [
    [-33.740, 150.790],
    [-33.740, 150.910],
    [-33.860, 150.910],
    [-33.860, 150.790],
  ],
  north_shore: [
    [-33.760, 151.080],
    [-33.760, 151.230],
    [-33.830, 151.230],
    [-33.830, 151.080],
  ],
  south_sydney: [
    [-33.870, 151.170],
    [-33.870, 151.230],
    [-33.950, 151.230],
    [-33.950, 151.170],
  ],
  outer_west: [
    [-33.680, 150.780],
    [-33.680, 150.880],
    [-33.740, 150.880],
    [-33.740, 150.780],
  ],
};
