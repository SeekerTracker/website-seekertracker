# Seeker Tracker public API reference

Base URL: `https://seekertracker.com`

Live machine-readable sources (source of truth if this file drifts):

- https://seekertracker.com/llms.txt
- https://seekertracker.com/api
- https://seekertracker.com/openapi.json

## Discovery

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api` | Index (rewritten to `/api/index`) |
| GET | `/api/index` | Same index |
| GET | `/llms.txt` | Agent discovery text |
| GET | `/llms-full.txt` | Extended discovery |
| GET | `/openapi.json` | OpenAPI 3.1 |

## Core data

| Method | Path | Query / body |
|--------|------|----------------|
| GET | `/api/health` | — |
| GET, POST | `/api/price` | — → `{ solPrice, skrPrice, usdPrice, source }` |
| GET, POST | `/api/domains` | `page`, `pageSize`, `sortBy` (`newest`\|`oldest`\|`name`\|`name-reverse`\|`length`), `query`, `rank` |
| GET, POST | `/api/domain` | GET `?domain=name.skr` · POST `{"domain":"name.skr"}` |
| GET | `/api/lookup` | `wallet` (base58) |
| GET | `/api/dappstore` | `package`, `q`, `status` (`active`\|`removed`\|`all`), `action=search` |
| GET | `/api/skr/vault` | SKR price, supply, vault balances |
| GET | `/api/skr/summary` | Summary stats |
| GET | `/api/skr/stakers` | Stakers |
| GET | `/api/skr/report` | Report payload |
| GET | `/api/activations` | `view=day`\|`week`\|`month` |
| GET | `/api/competitors` | Snapshot |
| GET | `/api/seeker-fund` | TRACKER lifetime fees + 24h volume (soft timeouts) |
| GET | `/api/snake/config` | Game config |
| GET | `/api/snake/leaderboard` | Leaderboard |
| GET | `/api/snake/prize` | Prize pool |
| GET | `/api/sweep/contestants` | Sweep contestants |
| GET | `/api/allocation/{wallet}` | Allocation |

## Human pages

| Path | Purpose |
|------|---------|
| `/apps` | dApp catalog UI |
| `/apps/{androidPackage}` | dApp detail |
| `/id/{name.skr}` | Domain profile |
| `/skr` | SKR stats UI |
| `/developers` | API docs |

## Private (do not use from this skill)

- `/api/cron/*` (auth)
- `/api/dapps/claim`, `/api/dapps/manage` (publisher auth)
- `/api/export` (wallet signature gated)
- `/api/unsubscribe`

## Example responses (shapes)

### Health

```json
{ "status": "ok", "domains": 120093, "source": "turso", "turso": true, "loadedAt": 0 }
```

### Price

```json
{
  "usdPrice": 78.0,
  "solPrice": 78.0,
  "skrPrice": 0.0083,
  "ticker": "SOLUSDC",
  "source": "jupiter-v3"
}
```

### Domain (single)

Fields commonly include: `owner`, `createdAt`, `rank`, `domain`, `subdomain`.

### Domains (list)

Paginated payload with `data` / domain rows, `pagination`, totals (exact keys may include `totalDomains`, `indexedCount`).
