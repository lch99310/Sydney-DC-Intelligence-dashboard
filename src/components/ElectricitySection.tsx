import { useMemo } from "react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { ElectricityData } from "../types";

interface Props {
  data: ElectricityData | null;
}

const FUEL_COLORS: Record<string, string> = {
  coal_pct: "#6b7280",
  gas_pct: "#f97316",
  hydro_pct: "#0284c7",
  wind_pct: "#14b8a6",
  solar_pct: "#facc15",
  other_pct: "#94a3b8",
};

const FUEL_LABELS: Record<string, string> = {
  coal_pct: "Coal",
  gas_pct: "Gas",
  hydro_pct: "Hydro",
  wind_pct: "Wind",
  solar_pct: "Solar",
  other_pct: "Other",
};

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function rollingAvg(prices: { date: string; price: number }[], window: number) {
  return prices.map((p, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = prices.slice(start, i + 1);
    const avg = slice.reduce((s, x) => s + x.price, 0) / slice.length;
    return { date: p.date, price: p.price, rolling: +avg.toFixed(1) };
  });
}

export default function ElectricitySection({ data }: Props) {
  const priceSeries = useMemo(
    () => (data ? rollingAvg(data.nsw_spot_price.daily_avg, 7) : []),
    [data]
  );

  const genSeries = useMemo(
    () =>
      (data?.generation_mix ?? []).map((d) => ({
        ...d,
        label: shortDate(d.date),
      })),
    [data]
  );

  const renewSeries = useMemo(
    () =>
      (data?.renewable_trend ?? []).map((d) => ({
        ...d,
        label: shortDate(d.date),
      })),
    [data]
  );

  if (!data) {
    return <div className="text-xs text-slate-500 italic">Loading electricity data…</div>;
  }

  const cm = data.cost_model;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-800 text-sm">NSW Electricity Intelligence</h3>

      {/* Cost summary */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-slate-50 rounded p-2">
          <div className="text-slate-500">Current RRP</div>
          <div className="font-bold text-slate-900">${data.nsw_spot_price.current_rrp}/MWh</div>
        </div>
        <div className="bg-slate-50 rounded p-2">
          <div className="text-slate-500">12m Wholesale</div>
          <div className="font-bold text-slate-900">${cm.wholesale_avg_12m}/MWh</div>
        </div>
        <div className="bg-slate-50 rounded p-2">
          <div className="text-slate-500">All-in Est.</div>
          <div className="font-bold text-slate-900">${cm.total_all_in_estimate}/MWh</div>
        </div>
      </div>

      {/* Chart 1: Spot Price Trend */}
      <div>
        <div className="text-xs font-semibold text-slate-700 mb-1">NSW Spot Price (last 30 days)</div>
        <div className="h-40 bg-white rounded border border-slate-200 p-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceSeries.map((p) => ({ ...p, label: shortDate(p.date) }))}
                       margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={4} />
              <YAxis tick={{ fontSize: 9 }} unit="" />
              <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v) => `$${v}`} />
              <Line type="monotone" dataKey="price" stroke="#94a3b8" strokeWidth={1.2}
                    dot={false} name="Daily $/MWh" />
              <Line type="monotone" dataKey="rolling" stroke="#2563eb" strokeWidth={2}
                    dot={false} name="7d avg" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Generation Mix */}
      <div>
        <div className="text-xs font-semibold text-slate-700 mb-1">Generation Mix (% by fuel)</div>
        <div className="h-44 bg-white rounded border border-slate-200 p-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={genSeries} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={4} />
              <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 9 }} iconSize={8} />
              {(["coal_pct", "gas_pct", "hydro_pct", "wind_pct", "solar_pct", "other_pct"] as const).map((k) => (
                <Area key={k} type="monotone" dataKey={k} stackId="1"
                      stroke={FUEL_COLORS[k]} fill={FUEL_COLORS[k]} name={FUEL_LABELS[k]} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Renewable % vs Price */}
      <div>
        <div className="text-xs font-semibold text-slate-700 mb-1">Renewable % vs Spot Price</div>
        <div className="h-40 bg-white rounded border border-slate-200 p-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={renewSeries} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={4} />
              <YAxis yAxisId="left" tick={{ fontSize: 9 }} domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 9 }} iconSize={8} />
              <Line yAxisId="left" type="monotone" dataKey="renewable_pct"
                    stroke="#16a34a" strokeWidth={2} dot={false} name="Renewable %" />
              <Line yAxisId="right" type="monotone" dataKey="spot_price"
                    stroke="#dc2626" strokeWidth={2} dot={false} name="$/MWh" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-[10px] text-slate-500 italic leading-snug">{cm.notes}</p>
    </div>
  );
}
