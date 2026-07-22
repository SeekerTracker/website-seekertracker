---
name: seekertracker
description: >
  Query Seeker Tracker (seekertracker.com) for Solana Mobile ecosystem data:
  .skr SeekerID domains, Seeker dApp Store catalog, SKR token stats, and SOL/SKR
  prices via public JSON APIs. Use when the user mentions Seeker Tracker,
  seekertracker, SeekerID, .skr domains, Solana Seeker dApps, SKR vault/staking
  stats, or wants agent-friendly Solana Mobile data without scraping HTML.
  Prefer API-first access (llms.txt, /api, OpenAPI). Use when the user runs
  /seekertracker.
---

# Seeker Tracker

Unofficial Solana Mobile ecosystem data for agents. **Prefer JSON APIs over HTML.**

| Resource | URL |
|----------|-----|
| Base | `https://seekertracker.com` |
| Agent discovery | `https://seekertracker.com/llms.txt` |
| API index | `https://seekertracker.com/api` |
| OpenAPI | `https://seekertracker.com/openapi.json` |
| Human docs | `https://seekertracker.com/developers` |

**Auth:** none for public reads.  
**CORS:** open on public read paths.  
**Do not:** bulk-scrape HTML or use the site as a training corpus substitute for these APIs.

For full endpoint tables and examples, see [references/api.md](references/api.md).

## Workflow

### 0. Orient (first use in a session)

```bash
curl -sS https://seekertracker.com/llms.txt
curl -sS https://seekertracker.com/api
```

If these fail, report outage and stop inventing data.

### 1. Pick the right call

| User intent | Call |
|-------------|------|
| Site health / domain count | `GET /api/health` |
| SOL + SKR USD price | `GET /api/price` |
| Search/list `.skr` names | `GET /api/domains?query=&page=&pageSize=&sortBy=` |
| One domain profile data | `GET /api/domain?domain=name.skr` |
| Domains owned by wallet | `GET /api/lookup?wallet=<base58>` |
| Full Seeker dApp catalog | `GET /api/dappstore` (large; prefer filters) |
| One dApp by package | `GET /api/dappstore?package=com.example.app` |
| Search dApps | `GET /api/dappstore?q=wallet` or `?action=search&q=` |
| Active/removed apps | `GET /api/dappstore?status=active\|removed\|all` |
| SKR vault / supply / mcap | `GET /api/skr/vault` |
| SKR summary / stakers / report | `GET /api/skr/summary`, `/stakers`, `/report` |
| Registration activity | `GET /api/activations?view=day\|week\|month` |
| TRACKER fund fees (shell) | `GET /api/seeker-fund` |

Human pages (secondary): `/apps`, `/apps/{package}`, `/id/{name.skr}`, `/skr`.

### 2. Execute with curl (or fetch)

Always use absolute URLs. Prefer small `pageSize` on domains. Prefer `?package=` over full catalog when possible.

```bash
# Health
curl -sS https://seekertracker.com/api/health

# Prices
curl -sS https://seekertracker.com/api/price

# Domain search
curl -sS 'https://seekertracker.com/api/domains?page=1&pageSize=20&sortBy=newest&query=meta'

# Single domain
curl -sS 'https://seekertracker.com/api/domain?domain=metasal.skr'

# Wallet reverse lookup
curl -sS 'https://seekertracker.com/api/lookup?wallet=YOUR_WALLET'

# Single dApp
curl -sS 'https://seekertracker.com/api/dappstore?package=com.seekertracker'

# SKR vault
curl -sS https://seekertracker.com/api/skr/vault
```

POST alternatives (legacy-compatible):

```bash
curl -sS -X POST https://seekertracker.com/api/domain \
  -H 'content-type: application/json' \
  -d '{"domain":"metasal.skr"}'

curl -sS -X POST https://seekertracker.com/api/domains \
  -H 'content-type: application/json' \
  -d '{"page":1,"pageSize":20,"sortBy":"newest","query":"meta"}'
```

### 3. Present results

- Quote numbers from the JSON (rank, totals, prices). Do not invent ranks or listings.
- For domains: show `subdomain` + `.skr`, `rank`, `owner`, `created_at` when present.
- For dApps: show `displayName`, package, rating, status (`active`/`removed`).
- For prices: show `solPrice` and `skrPrice` (and `source` if useful).
- Link human pages when the user wants a browser UI:
  - Domain: `https://seekertracker.com/id/{name.skr}`
  - App: `https://seekertracker.com/apps/{androidPackage}`

### 4. Etiquette and limits

- Cache when reasonable; poll health/price at most every ~30s unless asked for live spam.
- Do **not** hammer `?refresh=1` on dappstore.
- Full `/api/dappstore` without filters can be **large (~MB)**; prefer `package`, `q`, or status filters.
- Domain list `pageSize` can be high; default to 20–50 unless the user needs bulk.
- **Not public / not for this skill:** `/api/cron/*`, `/api/dapps/claim`, `/api/dapps/manage`, `/api/export` (wallet-gated), `/api/unsubscribe`.

## Error handling

| Symptom | Action |
|---------|--------|
| Non-JSON / 5xx | Retry once; then report Seeker Tracker API error |
| Domain 404 | Say not found; suggest search via `/api/domains?query=` |
| Empty catalog | Report empty/partial; do not invent apps |
| Rate / slow | Reduce page size; avoid full catalog |

## Out of scope

- Claiming or editing publisher listings (claim flow is human email auth).
- Guaranteeing official Solana Mobile affiliation (product is unofficial).
- On-chain writes, wallet signing, or paid pay.sh wrappers (public free reads only).

## Quick checklist

1. Start from `llms.txt` or `/api` if unsure of paths.
2. Prefer GET with query params for agents.
3. Prefer filtered dApp/domain calls over bulk dumps.
4. Cite API JSON; link UI pages optionally.
5. Stay on public read endpoints only.
