import type { SubRegion } from "../types";

/** Hand-crafted bounding polygons for Sydney DC sub-regions.
 *  Coordinates are [lat, lng] pairs (Leaflet convention, not GeoJSON).
 *  These are approximate hull shapes, not legal boundaries. */
export const SUB_REGION_POLYGONS: Record<SubRegion, [number, number][]> = {
  // Western Sydney DC corridor: Huntingwood → Eastern Creek → Erskine Park → Horsley Park
  western_sydney: [
    [-33.745, 150.805],
    [-33.745, 150.890],
    [-33.780, 150.905],
    [-33.815, 150.900],
    [-33.860, 150.870],
    [-33.870, 150.820],
    [-33.830, 150.785],
    [-33.785, 150.790],
  ],
  // North Shore tech cluster: Macquarie Park → Lane Cove West → Artarmon
  north_shore: [
    [-33.760, 151.100],
    [-33.760, 151.150],
    [-33.780, 151.200],
    [-33.815, 151.215],
    [-33.825, 151.185],
    [-33.815, 151.140],
    [-33.790, 151.100],
  ],
  // South Sydney / CBD fringe: Ultimo → Alexandria → Mascot
  south_sydney: [
    [-33.875, 151.185],
    [-33.880, 151.220],
    [-33.910, 151.215],
    [-33.940, 151.205],
    [-33.945, 151.175],
    [-33.915, 151.170],
    [-33.890, 151.175],
  ],
  // Outer Western Sydney: Marsden Park, Minchinbury
  outer_west: [
    [-33.680, 150.785],
    [-33.680, 150.870],
    [-33.715, 150.885],
    [-33.745, 150.865],
    [-33.745, 150.810],
    [-33.720, 150.780],
  ],
};
