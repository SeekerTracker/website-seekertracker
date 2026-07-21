# Seeker Tracker (website)

Unofficial Solana Mobile ecosystem explorer — SeekerIDs, dApps, analytics.

**Production:** [seekertracker.com](https://www.seekertracker.com) on **Cloudflare Workers** (OpenNext).

## Public API (bots and agents)

API-first surface — prefer JSON over HTML scraping:

| URL | What |
|-----|------|
| [/llms.txt](https://seekertracker.com/llms.txt) | Agent discovery |
| [/api](https://seekertracker.com/api) | Endpoint index (JSON) |
| [/openapi.json](https://seekertracker.com/openapi.json) | OpenAPI 3.1 |
| [/developers](https://seekertracker.com/developers) | Human docs |

No API key for public reads. Open CORS on those paths. See `app/(utils)/lib/publicApi.ts`.

## Dev

```bash
npm install
npm run dev   # http://localhost:8002
```

Copy `.env.example` / use `.dev.vars` for local secrets (Turso, Resend, Telegram, etc.).

## Deploy

```bash
npm run deploy   # opennextjs-cloudflare build + wrangler deploy
```

No Vercel. Git push does **not** auto-deploy a Vercel project; ship with `npm run deploy` (or your own CF pipeline).

## Useful scripts

| Script | What |
|--------|------|
| `npm run dev` | Next dev (Turbopack, port 8002) |
| `npm run build` | Next production build |
| `npm run deploy` | Build OpenNext + deploy Worker |
| `npm run preview` | Local OpenNext preview |
| `npm run cf-typegen` | Generate Cloudflare env types |
