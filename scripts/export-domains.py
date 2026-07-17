#!/usr/bin/env python3
"""Export .skr domains from legacy charity API into data/seeker-domains.jsonl.gz"""
import json, urllib.request, gzip, time
from pathlib import Path

SOURCE = "https://api.seeker.solana.charity"
PAGE_SIZE = 1000
ROOT = Path(__file__).resolve().parents[1]
out = ROOT / "data" / "seeker-domains.jsonl.gz"

def fetch_page(page):
    req = urllib.request.Request(
        f"{SOURCE}/allDomains",
        data=json.dumps({"pageSize": PAGE_SIZE, "page": page}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())

def main():
    out.parent.mkdir(exist_ok=True)
    first = fetch_page(1)
    total_pages = first["pagination"]["totalPages"]
    count = 0
    with gzip.open(out, "wt", encoding="utf-8") as f:
        for page in range(1, total_pages + 1):
            data = first if page == 1 else fetch_page(page)
            for d in data["data"]:
                f.write(json.dumps({
                    "rank": int(d["rank"]),
                    "domain": d.get("domain") or ".skr",
                    "subdomain": d["subdomain"],
                    "owner": d["owner"],
                    "created_at": d["created_at"],
                }, separators=(",", ":")) + "\n")
                count += 1
            if page % 20 == 0 or page == total_pages:
                print(f"page {page}/{total_pages} count={count}", flush=True)
    meta = ROOT / "data" / "seeker-domains.meta.json"
    meta.write_text(json.dumps({
        "count": count,
        "exported_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source": SOURCE,
    }, indent=2) + "\n")
    print(f"wrote {count} -> {out} ({out.stat().st_size} bytes)")

if __name__ == "__main__":
    main()
