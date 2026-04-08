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

export interface DailyPrice { date: string; price: number; }
export interface MonthlyPrice { month: string; price: number; }
export interface GenerationMixDay {
  date: string;
  coal_pct: number;
  gas_pct: number;
  hydro_pct: number;
  wind_pct: number;
  solar_pct: number;
  other_pct: number;
  renewable_total_pct: number;
}
export interface RenewableTrendPoint {
  date: string;
  renewable_pct: number;
  spot_price: number;
}
export interface CostModel {
  wholesale_avg_12m: number;
  network_charge_estimate: number;
  lgc_price_estimate: number;
  total_all_in_estimate: number;
  notes: string;
}
export interface ElectricityData {
  last_updated: string;
  nsw_spot_price: {
    current_rrp: number;
    daily_avg: DailyPrice[];
    monthly_avg: MonthlyPrice[];
  };
  generation_mix: GenerationMixDay[];
  renewable_trend: RenewableTrendPoint[];
  cost_model: CostModel;
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
