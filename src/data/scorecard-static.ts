import type { SubRegion, SubRegionScore } from "../types";

export const SUB_REGION_SCORES: Record<SubRegion, SubRegionScore> = {
  western_sydney: {
    id: "western_sydney",
    display_name: "Western Sydney DC Corridor",
    scores: { power: 5, connectivity: 3, land: 5, climate: 3, regulatory: 4 },
    summary: "Huntingwood, Eastern Creek, Horsley Park. Major substations, abundant land, the heart of NSW hyperscale buildout.",
  },
  north_shore: {
    id: "north_shore",
    display_name: "North Shore / Macquarie Park",
    scores: { power: 4, connectivity: 5, land: 2, climate: 4, regulatory: 4 },
    summary: "Macquarie Park, Lane Cove West, Artarmon. Best connectivity and IX density, but constrained land.",
  },
  south_sydney: {
    id: "south_sydney",
    display_name: "South Sydney / CBD Fringe",
    scores: { power: 3, connectivity: 5, land: 1, climate: 3, regulatory: 3 },
    summary: "Alexandria, Mascot, Ultimo. Carrier-neutral hubs and submarine cable landing, premium land.",
  },
  outer_west: {
    id: "outer_west",
    display_name: "Outer Western Sydney",
    scores: { power: 4, connectivity: 2, land: 5, climate: 3, regulatory: 4 },
    summary: "Marsden Park, Minchinbury. Cheap land, growing power infrastructure, longer fibre paths.",
  },
};
