export type SubRegion = "western_sydney" | "north_shore" | "south_sydney" | "outer_west";
export type Status = "operational" | "under_construction" | "planned";

export interface Facility {
  id: string;
  name: string;
  operator: string;
  operator_slug: string;
  suburb: string;
  sub_region: SubRegion;
  lat: number;
  lng: number;
  capacity_mw: number;
  status: Status;
  year_opened?: number;
  year_planned?: number;
  url: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  published_at: string;
  tags: string[];
  relevance_score: number;
}

export interface NewsData {
  last_updated: string;
  items: NewsItem[];
}

export interface SubRegionScore {
  id: SubRegion;
  display_name: string;
  scores: {
    power: number;
    connectivity: number;
    land: number;
    climate: number;
    regulatory: number;
  };
  summary: string;
}
