#!/usr/bin/env python3
"""Fetch Sydney DC / NSW energy news from public RSS feeds.

Parses a handful of free RSS feeds, filters for relevance to Sydney data
centers, auto-tags each item with operator slugs and sub-regions, dedupes,
and writes the result to public/data/news.json.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import feedparser
import requests

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "public" / "data"
NEWS_PATH = DATA_DIR / "news.json"
META_PATH = DATA_DIR / "metadata.json"

FEEDS: list[tuple[str, str]] = [
    ("Data Centre Dynamics", "https://www.datacenterdynamics.com/en/rss/"),
    ("The Urban Developer", "https://www.theurbandeveloper.com/feed"),
    ("Google News: AirTrunk", "https://news.google.com/rss/search?q=AirTrunk+Australia&hl=en-AU&gl=AU&ceid=AU:en"),
    ("Google News: NEXTDC", "https://news.google.com/rss/search?q=NEXTDC+Sydney&hl=en-AU&gl=AU&ceid=AU:en"),
    ("Google News: Sydney DC", "https://news.google.com/rss/search?q=%22data+center%22+Sydney&hl=en-AU&gl=AU&ceid=AU:en"),
    ("AEMO Newsroom", "https://aemo.com.au/rss/news"),
]

# NSW Planning Portal major-projects search. Returns HTML; we scrape listing
# tiles with a forgiving regex. Best-effort — if the page format changes we
# silently fall back to zero items rather than breaking the whole run.
NSW_PLANNING_URL = (
    "https://www.planningportal.nsw.gov.au/major-projects/find-a-major-project"
    "?searchTerm=data+centre"
)
NSW_PLANNING_SOURCE = "NSW Planning Portal"

OPERATOR_TAGS = {
    "airtrunk": ["airtrunk"],
    "nextdc": ["nextdc", "next dc"],
    "cdc": ["cdc data centres", "cdc data centers", "cdc"],
    "equinix": ["equinix"],
    "globalswitch": ["global switch"],
    "stack": ["stack infrastructure"],
    "dci": ["dci data"],
    "telstra": ["telstra"],
}

SUB_REGION_TAGS = {
    "western_sydney": [
        "huntingwood", "eastern creek", "horsley park", "erskine park",
        "western sydney",
    ],
    "north_shore": ["macquarie park", "lane cove", "artarmon", "north shore"],
    "south_sydney": ["alexandria", "ultimo", "mascot", "south sydney"],
    "outer_west": ["marsden park", "minchinbury", "outer west"],
}

POLICY_KEYWORDS = ["aemo", "aer", "nsw planning", "ppa", "renewable", "grid"]
SYDNEY_KEYWORDS = ["sydney", "nsw", "new south wales"]

MAX_ITEMS = 100
MAX_AGE_DAYS = 90


def make_id(title: str, source: str) -> str:
    return hashlib.sha1(f"{source}::{title}".encode()).hexdigest()[:12]


def parse_date(entry) -> datetime | None:
    for attr in ("published_parsed", "updated_parsed"):
        tup = getattr(entry, attr, None)
        if tup:
            try:
                return datetime(*tup[:6], tzinfo=timezone.utc)
            except (TypeError, ValueError):
                continue
    return None


def clean_summary(raw: str) -> str:
    text = re.sub(r"<[^>]+>", "", raw or "")
    text = re.sub(r"\s+", " ", text).strip()
    return text[:200]


def tag_item(text: str) -> tuple[list[str], float]:
    lowered = text.lower()
    tags: list[str] = []
    score = 0.0

    for slug, keywords in OPERATOR_TAGS.items():
        if any(k in lowered for k in keywords):
            tags.append(slug)
            score += 0.3

    for sub, keywords in SUB_REGION_TAGS.items():
        if any(k in lowered for k in keywords):
            tags.append(sub)
            score += 0.2

    if any(k in lowered for k in POLICY_KEYWORDS):
        tags.append("energy_policy")
        score += 0.1

    if any(k in lowered for k in SYDNEY_KEYWORDS):
        tags.append("nsw")
        score += 0.2

    return tags, min(score, 1.0)


def fetch_nsw_planning() -> list[dict]:
    """Scrape NSW Planning Portal for data-centre major project applications.

    The portal doesn't expose a stable public JSON feed, so we hit the HTML
    search page and pull project titles + links with regex. Anything goes
    wrong → log, return empty list, main run continues.
    """
    try:
        resp = requests.get(
            NSW_PLANNING_URL,
            headers={"User-Agent": "Mozilla/5.0 (sydney-dc-dashboard)"},
            timeout=20,
        )
        resp.raise_for_status()
    except Exception as exc:
        print(f"[warn] NSW Planning fetch failed: {exc}", file=sys.stderr)
        return []

    html = resp.text
    # Look for links of the form /major-projects/projects/<slug> with a title.
    pattern = re.compile(
        r'href="(/major-projects/projects/[^"#?]+)"[^>]*>\s*([^<]{5,200})',
        re.IGNORECASE,
    )
    now = datetime.now(timezone.utc).isoformat()
    items: list[dict] = []
    seen_local: set[str] = set()

    for match in pattern.finditer(html):
        path = match.group(1).strip()
        title = re.sub(r"\s+", " ", match.group(2)).strip()
        if not title or len(title) < 10:
            continue
        if path in seen_local:
            continue
        seen_local.add(path)

        lowered = title.lower()
        if "data" not in lowered and "centre" not in lowered and "center" not in lowered:
            continue

        url = f"https://www.planningportal.nsw.gov.au{path}"
        tags, score = tag_item(title)
        # NSW Planning items are inherently NSW-relevant
        if "nsw" not in tags:
            tags.append("nsw")
            score += 0.2
        tags.append("planning")
        score = min(score + 0.2, 1.0)

        items.append({
            "id": make_id(title, NSW_PLANNING_SOURCE),
            "title": title,
            "summary": "NSW State Significant Development — data centre application.",
            "url": url,
            "source": NSW_PLANNING_SOURCE,
            "published_at": now,
            "tags": sorted(set(tags)),
            "relevance_score": round(score, 2),
        })
        if len(items) >= 20:
            break

    print(f"[ok] NSW Planning: {len(items)} items", file=sys.stderr)
    return items


def fetch_all() -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=MAX_AGE_DAYS)
    seen: set[str] = set()
    items: list[dict] = []

    for source_name, url in FEEDS:
        try:
            parsed = feedparser.parse(url)
        except Exception as exc:
            print(f"[warn] {source_name} failed: {exc}", file=sys.stderr)
            continue

        for entry in parsed.entries:
            title = getattr(entry, "title", "").strip()
            if not title:
                continue
            item_id = make_id(title, source_name)
            if item_id in seen:
                continue

            published = parse_date(entry)
            if not published or published < cutoff:
                continue

            summary = clean_summary(getattr(entry, "summary", ""))
            tags, score = tag_item(f"{title} {summary}")

            # Skip items with zero relevance unless they mention Sydney/NSW
            if score == 0 and not any(k in title.lower() for k in SYDNEY_KEYWORDS):
                continue

            seen.add(item_id)
            items.append({
                "id": item_id,
                "title": title,
                "summary": summary,
                "url": getattr(entry, "link", ""),
                "source": source_name,
                "published_at": published.isoformat(),
                "tags": sorted(set(tags)),
                "relevance_score": round(score, 2),
            })

    # Extra pass: NSW Planning Portal scrape (HTML, not RSS).
    for p_item in fetch_nsw_planning():
        if p_item["id"] in seen:
            continue
        seen.add(p_item["id"])
        items.append(p_item)

    items.sort(key=lambda x: x["published_at"], reverse=True)
    return items[:MAX_ITEMS]


def update_metadata(timestamp: str) -> None:
    meta: dict = {}
    if META_PATH.exists():
        try:
            meta = json.loads(META_PATH.read_text())
        except json.JSONDecodeError:
            meta = {}
    meta["news_last_updated"] = timestamp
    meta.setdefault("data_sources", {})
    meta["data_sources"]["news"] = (
        "RSS: DCD, Urban Developer, Google News, AEMO; HTML: NSW Planning Portal"
    )
    META_PATH.write_text(json.dumps(meta, indent=2) + "\n")


def main() -> int:
    try:
        items = fetch_all()
    except Exception as exc:
        print(f"[error] news fetch failed: {exc}", file=sys.stderr)
        return 1

    if not items:
        print("[warn] no items collected; keeping existing news.json", file=sys.stderr)
        return 1

    timestamp = datetime.now(timezone.utc).isoformat()
    payload = {"last_updated": timestamp, "items": items}

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    NEWS_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    update_metadata(timestamp)
    print(f"[ok] wrote {NEWS_PATH} ({len(items)} items)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
