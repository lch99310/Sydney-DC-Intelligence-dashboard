import type { SubRegionScore } from "../types";

export interface Weights {
  power: number;
  connectivity: number;
  land: number;
  climate: number;
  regulatory: number;
}

export const DEFAULT_WEIGHTS: Weights = {
  power: 30,
  connectivity: 20,
  land: 20,
  climate: 15,
  regulatory: 15,
};

/** Compute weighted 0-5 score for a sub-region given percentage weights (0-100). */
export function weightedScore(region: SubRegionScore, weights: Weights): number {
  const total =
    weights.power +
    weights.connectivity +
    weights.land +
    weights.climate +
    weights.regulatory;
  if (total === 0) return 0;

  const { scores } = region;
  const weighted =
    scores.power * weights.power +
    scores.connectivity * weights.connectivity +
    scores.land * weights.land +
    scores.climate * weights.climate +
    scores.regulatory * weights.regulatory;

  return weighted / total;
}

/** Map score 0-5 to a blue-scale hex color. */
export function scoreToColor(score: number): string {
  const clamped = Math.max(0, Math.min(5, score));
  const palette = ["#eff6ff", "#dbeafe", "#93c5fd", "#60a5fa", "#3b82f6", "#1d4ed8"];
  const idx = Math.min(palette.length - 1, Math.floor(clamped));
  return palette[idx];
}

/** Normalize weights so they sum to 100, holding the one just changed. */
export function normalizeWeights(next: Weights, changedKey: keyof Weights): Weights {
  const changed = next[changedKey];
  const othersKeys = (Object.keys(next) as (keyof Weights)[]).filter((k) => k !== changedKey);
  const othersSum = othersKeys.reduce((s, k) => s + next[k], 0);
  const remaining = 100 - changed;

  if (othersSum === 0) {
    const even = remaining / othersKeys.length;
    const result = { ...next };
    othersKeys.forEach((k) => (result[k] = even));
    return result;
  }

  const result = { ...next };
  othersKeys.forEach((k) => {
    result[k] = (next[k] / othersSum) * remaining;
  });
  return result;
}
