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

# Static cost-model estimates (reviewed manually; not from live source)
NETWORK_CHARGE = 50  # $/MWh, Ausgrid/Endeavour zone estimate
LGC_PRICE = 35       # $/MWh


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

    return {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "nsw_spot_price": {
            "current_rrp": round(current_rrp, 2),
            "daily_avg": daily_avg,
            "monthly_avg": monthly_avg,
        },
        "generation_mix": [],
        "renewable_trend": [],
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
