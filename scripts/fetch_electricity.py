#!/usr/bin/env python3
"""Fetch NSW electricity price data from AEMO public CSVs.

Downloads the last 13 months of NSW1 PRICE_AND_DEMAND CSVs, computes daily
and monthly averages, and writes public/data/electricity.json.

If AEMO is unreachable or returns bad data, the existing JSON file is left
untouched (never overwrite with empty data).
"""
from __future__ import annotations

import io
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd
import requests
from dateutil.relativedelta import relativedelta

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "public" / "data"
ELEC_PATH = DATA_DIR / "electricity.json"
META_PATH = DATA_DIR / "metadata.json"

AEMO_URL = (
    "https://aemo.com.au/aemo/data/nem/priceanddemand/"
    "PRICE_AND_DEMAND_{yyyymm}_NSW1.csv"
)

# OpenElectricity API (free, key from platform.openelectricity.org.au)
OE_BASE = "https://api.openelectricity.org.au/v4"
OE_KEY = os.environ.get("OE_API_KEY")

# Static cost-model estimates (reviewed manually; not from live source)
NETWORK_CHARGE = 50  # $/MWh, Ausgrid/Endeavour zone estimate
LGC_PRICE = 35       # $/MWh

# Map OpenElectricity fueltech_group to our schema keys
FUELTECH_MAP = {
    "coal": "coal_pct",
    "gas": "gas_pct",
    "hydro": "hydro_pct",
    "wind": "wind_pct",
    "solar": "solar_pct",
}
RENEWABLE_KEYS = {"hydro_pct", "wind_pct", "solar_pct"}


def fetch_month(yyyymm: str) -> pd.DataFrame | None:
    url = AEMO_URL.format(yyyymm=yyyymm)
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        df = pd.read_csv(io.StringIO(resp.text))
        return df
    except Exception as exc:
        print(f"[warn] fetch {yyyymm} failed: {exc}", file=sys.stderr)
        return None


def collect_frames(months: int = 13) -> pd.DataFrame:
    now = datetime.now(timezone.utc)
    frames: list[pd.DataFrame] = []
    for i in range(months):
        dt = now - relativedelta(months=i)
        yyyymm = dt.strftime("%Y%m")
        df = fetch_month(yyyymm)
        if df is not None and not df.empty:
            frames.append(df)
    if not frames:
        raise RuntimeError("No AEMO data fetched")
    combined = pd.concat(frames, ignore_index=True)
    # Filter only TRADE period rows when column exists
    if "PERIODTYPE" in combined.columns:
        combined = combined[combined["PERIODTYPE"].astype(str).str.upper() == "TRADE"]
    combined["SETTLEMENTDATE"] = pd.to_datetime(combined["SETTLEMENTDATE"])
    combined["RRP"] = pd.to_numeric(combined["RRP"], errors="coerce")
    combined = combined.dropna(subset=["RRP"])
    return combined


def fetch_generation_mix(days: int = 30) -> tuple[list[dict], list[dict]]:
    """Fetch NSW1 generation by fueltech group from OpenElectricity API.

    Returns (generation_mix, renewable_trend) lists. Empty lists on failure.
    """
    if not OE_KEY:
        print("[info] OE_API_KEY not set; skipping fueltech fetch", file=sys.stderr)
        return [], []

    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=days)
    url = f"{OE_BASE}/data/network/NEM"
    params = {
        "metrics": "energy",
        "secondary_grouping": "fueltech_group",
        "network_region": "NSW1",
        "interval": "1d",
        "date_start": start.isoformat(),
        "date_end": end.isoformat(),
    }
    try:
        resp = requests.get(
            url, params=params,
            headers={"Authorization": f"Bearer {OE_KEY}"},
            timeout=30,
        )
        resp.raise_for_status()
        body = resp.json()
    except Exception as exc:
        print(f"[warn] OpenElectricity fetch failed: {exc}", file=sys.stderr)
        return [], []

    # Pivot the response into per-day dicts
    by_date: dict[str, dict[str, float]] = {}
    results = body.get("data", body).get("results", []) if isinstance(body, dict) else []
    for series in results:
        ft = (series.get("columns", {}) or {}).get("fueltech_group") or series.get("name", "")
        key = FUELTECH_MAP.get(str(ft).lower())
        if not key:
            continue
        for ts, val in series.get("data", []) or []:
            if val is None:
                continue
            day = str(ts)[:10]
            by_date.setdefault(day, {})[key] = float(val)

    gen_mix: list[dict] = []
    renew_trend: list[dict] = []
    for day in sorted(by_date.keys()):
        row = by_date[day]
        total = sum(row.values()) or 1.0
        pcts = {k: round(100 * row.get(k, 0) / total, 1) for k in FUELTECH_MAP.values()}
        renewable_total = round(sum(pcts[k] for k in RENEWABLE_KEYS), 1)
        other = round(max(0.0, 100 - sum(pcts.values())), 1)
        gen_mix.append({
            "date": day, **pcts,
            "other_pct": other,
            "renewable_total_pct": renewable_total,
        })
        renew_trend.append({
            "date": day,
            "renewable_pct": renewable_total,
            "spot_price": 0.0,  # filled in below from price data
        })
    return gen_mix, renew_trend


def merge_renewable_with_price(renew_trend: list[dict], daily_prices: list[dict]) -> list[dict]:
    price_by_day = {p["date"]: p["price"] for p in daily_prices}
    merged: list[dict] = []
    for r in renew_trend:
        price = price_by_day.get(r["date"])
        if price is not None:
            merged.append({**r, "spot_price": price})
    return merged


def build_payload(df: pd.DataFrame) -> dict:
    df = df.sort_values("SETTLEMENTDATE")
    current_rrp = float(df["RRP"].iloc[-1])

    daily = (
        df.set_index("SETTLEMENTDATE")
        .resample("1D")["RRP"].mean()
        .dropna()
        .reset_index()
    )
    daily_avg = [
        {"date": row.SETTLEMENTDATE.strftime("%Y-%m-%d"), "price": round(float(row.RRP), 2)}
        for row in daily.itertuples(index=False)
    ][-365:]

    monthly = (
        df.set_index("SETTLEMENTDATE")
        .resample("1MS")["RRP"].mean()
        .dropna()
        .reset_index()
    )
    monthly_avg = [
        {"month": row.SETTLEMENTDATE.strftime("%Y-%m"), "price": round(float(row.RRP), 2)}
        for row in monthly.itertuples(index=False)
    ][-24:]

    cutoff = df["SETTLEMENTDATE"].max() - pd.Timedelta(days=365)
    wholesale_12m = float(df[df["SETTLEMENTDATE"] >= cutoff]["RRP"].mean())

    gen_mix, renew_trend = fetch_generation_mix(days=30)
    renew_trend = merge_renewable_with_price(renew_trend, daily_avg)

    return {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "nsw_spot_price": {
            "current_rrp": round(current_rrp, 2),
            "daily_avg": daily_avg,
            "monthly_avg": monthly_avg,
        },
        "generation_mix": gen_mix,
        "renewable_trend": renew_trend,
        "cost_model": {
            "wholesale_avg_12m": round(wholesale_12m, 2),
            "network_charge_estimate": NETWORK_CHARGE,
            "lgc_price_estimate": LGC_PRICE,
            "total_all_in_estimate": round(wholesale_12m + NETWORK_CHARGE + LGC_PRICE, 2),
            "notes": (
                "NSW 12-month wholesale avg from AEMO PRICE_AND_DEMAND CSV. "
                "Network and LGC are static estimates (manually reviewed)."
            ),
        },
    }


def update_metadata(timestamp: str) -> None:
    meta: dict = {}
    if META_PATH.exists():
        try:
            meta = json.loads(META_PATH.read_text())
        except json.JSONDecodeError:
            meta = {}
    meta["electricity_last_updated"] = timestamp
    meta.setdefault("data_sources", {})
    meta["data_sources"]["electricity"] = "AEMO NEM PRICE_AND_DEMAND CSV"
    META_PATH.write_text(json.dumps(meta, indent=2) + "\n")


def main() -> int:
    try:
        df = collect_frames()
        payload = build_payload(df)
    except Exception as exc:
        print(f"[error] electricity fetch failed: {exc}", file=sys.stderr)
        print("[info] keeping existing electricity.json unchanged", file=sys.stderr)
        return 1

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ELEC_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    update_metadata(payload["last_updated"])
    print(f"[ok] wrote {ELEC_PATH} ({len(payload['nsw_spot_price']['daily_avg'])} days)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
