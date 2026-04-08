import { normalizeWeights, type Weights } from "../utils/scoreCalculator";

interface Props {
  weights: Weights;
  onChange: (w: Weights) => void;
}

const LABELS: Record<keyof Weights, string> = {
  power: "Power",
  connectivity: "Connectivity",
  land: "Land",
  climate: "Climate",
  regulatory: "Regulatory",
};

export default function WeightSliders({ weights, onChange }: Props) {
  const update = (key: keyof Weights, value: number) => {
    const next = { ...weights, [key]: value };
    onChange(normalizeWeights(next, key));
  };

  return (
    <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-2">
      <div className="font-semibold text-slate-800 text-sm">Score Weights (auto-normalizes to 100%)</div>
      {(Object.keys(LABELS) as (keyof Weights)[]).map((k) => (
        <label key={k} className="block">
          <div className="flex justify-between text-slate-600">
            <span>{LABELS[k]}</span>
            <span className="font-semibold text-slate-900">{weights[k].toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={weights[k]}
            onChange={(e) => update(k, +e.target.value)}
            className="w-full"
          />
        </label>
      ))}
    </div>
  );
}
