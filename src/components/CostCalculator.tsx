import { useState } from "react";

const WHOLESALE = 150; // $/MWh NSW 12-month avg estimate
const NETWORK = 50;
const LGC = 35;
const HOURS = 8760;

interface Props {
  defaultMw: number;
}

export default function CostCalculator({ defaultMw }: Props) {
  const [mw, setMw] = useState(defaultMw);
  const [pue, setPue] = useState(1.4);
  const [renewablePct, setRenewablePct] = useState(50);

  const totalLoadMwh = mw * pue * HOURS;
  const wholesale = totalLoadMwh * WHOLESALE;
  const network = totalLoadMwh * NETWORK;
  const lgc = totalLoadMwh * (renewablePct / 100) * LGC;
  const total = wholesale + network + lgc;

  const fmt = (n: number) => `A$${(n / 1_000_000).toFixed(1)}M`;

  return (
    <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-2">
      <div className="font-semibold text-slate-800">Power Cost Calculator</div>
      <label className="block">
        <span className="text-slate-600">Capacity (MW): {mw}</span>
        <input type="range" min={1} max={700} value={mw}
          onChange={(e) => setMw(+e.target.value)} className="w-full" />
      </label>
      <label className="block">
        <span className="text-slate-600">PUE: {pue.toFixed(2)}</span>
        <input type="range" min={1.1} max={2.0} step={0.05} value={pue}
          onChange={(e) => setPue(+e.target.value)} className="w-full" />
      </label>
      <label className="block">
        <span className="text-slate-600">Renewable target: {renewablePct}%</span>
        <input type="range" min={0} max={100} value={renewablePct}
          onChange={(e) => setRenewablePct(+e.target.value)} className="w-full" />
      </label>
      <div className="pt-2 border-t border-slate-200 space-y-1">
        <div className="flex justify-between"><span>Wholesale</span><span>{fmt(wholesale)}</span></div>
        <div className="flex justify-between"><span>Network</span><span>{fmt(network)}</span></div>
        <div className="flex justify-between"><span>LGC (renewables)</span><span>{fmt(lgc)}</span></div>
        <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
          <span>Annual total</span><span>{fmt(total)}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 italic">
        Estimate using NSW wholesale ~$150/MWh, network ~$50/MWh, LGC ~$35/MWh.
      </p>
    </div>
  );
}
