# TRACKER Drip Rewards — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.  
> **Mode:** Planning only (this doc). Do not ship code until Metasal approves.

**Goal:** Evolve Seeker Tracker rewards from one-shot / lumpy payouts toward **sustained drip rewards** that keep holders engaged without dumping TRACKER supply or scaring buyers with overhang.

**Architecture:** Map the Ansem/gum “Airdrop Design Without Token Damage” playbook onto **existing TRACKER revenue rails** (fee → treasury → Sweep / Snake / Staking / SKR buyback). Prefer **revenue-funded drips** over minting new TRACKER. Stretch loyalty over time; weight engaged users; buy time until fee revenue covers ongoing rewards.

**Tech stack:** Existing CF Workers (`tracker-sweep-bot`, `snake-airdrop-api`), Turso (snake + domains), site `seekertracker.com` (`/sweep`, `/snake`, whitepaper), Telegram `@Seeker_Tracker`, optional Typefully for narrative.

**Source framing (Gum @gumsays / Ansem playbook):**

| Dimension | One-time drop | Drip rewards (target) |
|-----------|---------------|------------------------|
| Unlock | Single event, large float | Staggered, predictable |
| Market signal | Supply pressure / exit | Controlled flow, lower overhang |
| User incentive | Farm snapshot | Earn via activity, loyalty compounds |
| Team leverage | One launch moment | Many reward moments |
| Token health | Sell pressure dominates | Longer value window |

Playbook bullets to encode:
1. Drip rewards — keep people engaged as long as supply/budget lasts  
2. Buy time until **revenue** can replace pure airdrop/buyback  
3. Don’t create fear of massive overhang  
4. Stretch loyalty; avoid 1-shot farm-and-dump  
5. Small teams can iterate — not all-in on first try  
6. Heavier weight for **engaged** users (marketing + retention)

---

## Current context (what we already have)

| Rail | What it is today | Already drip-like? | Gap vs playbook |
|------|------------------|--------------------|-----------------|
| **Sweep** | Hourly SOL to eligible TRACKER holders (1M–20M band); fee-funded; TG winners | **Yes** — staggered, recurrent | Band/eligibility opaque to new users; no “engagement weight” beyond balance; messaging is prize not loyalty |
| **Snake** | Leaderboard + TRACKER prize pool; **1M TRACKER** min to earn | Partial — skill + hold gate | Still feels like episodic prizes, not continuous drip schedule |
| **Staking** | Whitepaper 10% “staking rewards” wallet | Unclear product surface | Need live claim UX + APR narrative or drop from plan |
| **SKR buyback** | Fee → buy SKR | Demand support, not holder drip | Keep as floor; not a substitute for holder engagement |
| **Export / TokenGate** | 100k TRACKER gates (site) | Hold gate only | Not a reward loop |

**Assumption:** We do **not** mint new TRACKER for drips. Budget = fee revenue split (whitepaper: ~30% community-facing rails) + existing treasury wallets.

**Product north star:** “Hold TRACKER → stay eligible → get **predictable small rewards over time** for **holding + using** Seeker Tracker products.”

---

## Proposed approach

### 1. Unify narrative: “TRACKER Earn”

One public story, three engines:

```
Fee volume → Revenue → Earn budget
                         ├─ Sweep drip (hold band, hourly SOL)
                         ├─ Snake drip (hold + play, TRACKER prizes)
                         └─ Activity boost (engagement multiplier)
```

### 2. Design principles (non-negotiable)

1. **No mega unlock day** — never dump a large TRACKER inventory into wallets at once  
2. **Schedule is public** — cadence, eligibility, next window on site + TG  
3. **Revenue-backed** — if fee revenue drops, drip rate drops (transparent), don’t print  
4. **Engagement > pure bag** — within band, weight by *use* (Snake games, app opens, SeekerID, shares)  
5. **Cap per wallet** — keep 20M-style caps so whales don’t vacuum the pot  
6. **Buy time** — drips buy months of retention while bags/fees mature  

### 3. Phased rollout

| Phase | Name | Outcome |
|-------|------|---------|
| **0** | Audit & scoreboard | Know exact wallets, rates, APY-ish numbers |
| **1** | Messaging + transparency | Site/TG/whitepaper speak “drip” not lottery only |
| **2** | Sweep v2 (engagement weight) | Still hourly SOL; score = f(balance, activity) |
| **3** | Snake continuous drip | Smaller daily TRACKER stream + weekly climax |
| **4** | Earn dashboard | `/earn` single pane of glass |
| **5** | Optional staking claim | Only if staking wallet is real & funded |

---

## Step-by-step plan

### Phase 0 — Audit (1–2 days)

**Objective:** Facts before redesign.

| # | Task | Owner | Output |
|---|------|--------|--------|
| 0.1 | Inventory treasuries: Sweep SOL wallet `rwdk…`, Snake `snkTE…`, Staking `86Ce…`, fee path | Ops | Sheet: balance, inflow 7/30d, outflow 7/30d |
| 0.2 | Pull last 30d Sweep winners + avg SOL/hr + unique wallets | `tracker-sweep-bot` KV + TG | CSV |
| 0.3 | Snake prize pool spend rate vs 1M eligibility count | `snake-airdrop-api` + leaderboard | Burn rate weeks of runway |
| 0.4 | Fee revenue 30d (Bags / seeker-fund) vs 30% community allocation | Site APIs | “Months of drip runway” estimate |
| 0.5 | Decide: **SOL-only drips** vs **TRACKER drips** vs hybrid | Metasal | Written decision |

**Decision default (recommend):**  
- Sweep stays **SOL** (no TRACKER sell pressure)  
- Snake stays **TRACKER** but **smaller, more frequent**  
- Never large one-time TRACKER airdrop

---

### Phase 1 — Narrative & transparency (2–3 days)

**Objective:** Market understands drips = token health, not farm.

**Files (site):**
- `app/(pages)/whitepaper/page.tsx` — add “Drip vs one-time” section (table from Gum)  
- `app/(pages)/sweep/page.tsx` + `layout.tsx` — copy: *hourly drip funded by fees*  
- `app/(pages)/snake/page.tsx` — copy: *continuous prize drip, 1M gate*  
- New: `app/(pages)/earn/page.tsx` — stub “TRACKER Earn” hub linking Sweep + Snake + rules  
- `app/sitemap.ts` — add `/earn`

**TG / X:**
- One Seeker_Tracker X Article: “Why we drip instead of dump” (cite playbook, link `/earn`)  
- Pin short TG explainer under winners stream

**Success:** New holder can answer in 30s: *how do I earn, how often, what do I need to hold?*

---

### Phase 2 — Sweep v2: engagement-weighted drip (1–2 weeks)

**Objective:** Keep hourly SOL cadence; reduce pure-bag farming; reward *users*.

**Current:** eligibility by TRACKER balance band → random/weight by balance → SOL.

**Proposed score:**

```
eligible = balance ∈ [1M, 20M]  // keep band to limit overhang fear
raw = clamp(balance, 1M, 20M)

activity_7d = snake_games + (export_used?1:0) + (seeker_id?1:0) + tg_bonus?
// start simple — only snake_games if data easy

weight = raw * (1 + k * normalize(activity_7d))
// k ~ 0.25–0.5 so activity matters but whales with 0 play don’t dominate forever
```

**Workers / code:**
- Modify: `tracker-sweep-bot` (CF) selection logic  
- Optional Turso table: `earn_activity(wallet, day, snake_games, …)`  
- Site: `/api/sweep/contestants` expose weight breakdown for transparency  
- TG winner message: show “drip #N · fee-funded” not only jackpot vibe

**Guardrails:**
- Min payout floor stays (0.01 SOL)  
- Max share per wallet per hour  
- If pot < threshold, skip hour (no dust spam)  
- Publish “next drip in mm:ss” on `/sweep`

**Tests:**
- Unit: weight function with fixtures (1M idle vs 1M active vs 20M idle)  
- Dry-run mode: log winners without send  
- 48h shadow mode vs old algo before cutover

---

### Phase 3 — Snake continuous drip (1–2 weeks)

**Objective:** Stretch Snake TRACKER so loyalty compounds; avoid one fat prize dump.

**Proposed schedule:**

| Cadence | Pool slice | Who |
|---------|------------|-----|
| Daily drip | ~60% of weekly Snake budget | Top N eligible (≥1M) by score+games that day |
| Weekly finale | ~40% | Top leaderboard eligible |

**Or simpler v1:**  
- Daily small TRACKER to top 10 eligible players that day  
- Keep weekly larger pot  

**Code:**
- `snake-airdrop-api` — cron daily + weekly  
- Config: `minBalance = 1_000_000` unchanged  
- Site `/snake` — “Today’s drip” + “Weekly pot” cards  
- Leaderboard already shows TRACKER balance + eligible ✓

**Token health:**  
- Daily amounts small enough that DEX impact is noise  
- Optional: pay Snake prizes in **SOL** fraction if TRACKER inventory is strategic (Metasal call)

---

### Phase 4 — Earn dashboard `/earn` (3–5 days)

**Objective:** Single pane: eligibility, next drips, history.

**UI blocks:**
1. Your TRACKER balance + band status  
2. Sweep: next hour ETA, your weight tier  
3. Snake: eligible?, today’s rank, drip ETA  
4. Lifetime earned (SOL + TRACKER)  
5. CTA: Play Snake · Hold band · Join TG  

**APIs:**
- `GET /api/earn/me?wallet=` — aggregate (or client fan-out to existing APIs)  
- History from Sweep KV + Snake claim logs  

**Brand:** Seeker Cyan, bare logo rules, real stats text in share cards.

---

### Phase 5 — Staking (optional / later)

Only if `86Ce…` is funded and claim path exists:

- Document APR source  
- Claim UI or link external staker  
- Else: remove/soft-pedal whitepaper “staking rewards” until real — **don’t fake a drip**

---

## Files likely to change (when executing)

| Area | Paths |
|------|--------|
| Site copy | `app/(pages)/sweep/*`, `snake/*`, `whitepaper/page.tsx`, new `earn/*` |
| APIs | `app/api/sweep/*`, `app/api/snake/*`, new `app/api/earn/*` |
| Sweep bot | CF Worker `tracker-sweep-bot` (repo under metasal1 / SeekerTracker) |
| Snake API | CF `snake-airdrop-api` |
| Sitemap/nav | `app/sitemap.ts`, `app/(components)/navbar.tsx` |
| Comms | Typefully Seeker set `322334`; TG channel |

---

## Tests / validation

1. **Runway math:** 30d fee revenue × community % ≥ projected drip outflows × 3 months  
2. **Shadow Sweep:** 48h dual-score, compare Gini of winners (want more unique wallets over time)  
3. **No overhang event:** zero one-time TRACKER drops > X% of daily volume (set X with Metasal)  
4. **Eligibility UX:** connect wallet on `/earn` → correct eligible/ineligible in <2s  
5. **Live:** cron fires; TG posts; SOL/TRACKER tx on Solscan; site 200  

---

## Risks, tradeoffs, open questions

| Risk | Mitigation |
|------|------------|
| Engagement weight gamed (wash Snake games) | Cap games/day; require min duration/score; anomaly flags |
| Fee revenue drought | Auto scale drip down; never mint TRACKER |
| Whale anger at activity weight | Soft k; publish formula; grandfather period |
| Complexity kills trust | Phase 1 transparency before Phase 2 formula |
| Staking line is vapor | Audit wallet or remove claim from whitepaper |
| Legal/comms “lottery” framing | Prefer “fee share drip” language |

**Open questions for Metasal:**

1. **Budget split** of community 30%: Sweep vs Snake vs future Earn boost?  
2. **Pay currency:** Keep Sweep SOL-only forever? Any TRACKER drip outside Snake?  
3. **Activity signals v1:** Snake only, or also SeekerID / TG join / app open?  
4. **Is staking live?** Funded? Claim path?  
5. **Public formula?** Full transparency vs approximate tiers?  
6. **Target runway** months before drip rate may drop?  

---

## Suggested decision checklist (approve before build)

- [ ] Confirm no large one-time TRACKER airdrop  
- [ ] Confirm Sweep stays fee-funded SOL hourly drip  
- [ ] Approve engagement weight (k) band or “balance-only v1 + narrative first”  
- [ ] Approve Snake daily+weekly split vs status quo  
- [ ] Approve `/earn` hub  
- [ ] Treasury runway numbers signed off  

---

## Minimal viable path (if we only do one thing)

**MVP (1 week):**  
1. Phase 0 runway sheet  
2. Phase 1 `/earn` + whitepaper drip table + TG pin  
3. Sweep copy + public next-drip countdown  
4. X Article: drip playbook applied to TRACKER  

**Then** Phase 2 weight only if unique-wallet concentration is too high.

---

## Success metrics (30–90d)

| Metric | Direction |
|--------|-----------|
| Unique Sweep winners / week | ↑ |
| % winners with Snake activity | ↑ |
| TRACKER holders in 1M–20M band | ↑ or stable |
| One-day sell spikes after reward events | ↓ |
| Fee revenue vs drip spend | Drip ≤ policy ceiling |
| `/earn` + `/sweep` retention visits | ↑ |

---

## Execution handoff

After Metasal answers open questions:

1. Execute Phase 0 audit (ops, no code)  
2. PR site Phase 1 (`/earn` + copy)  
3. Worker PRs for Sweep v2 / Snake drip with dry-run flags  
4. Ship via branch → PR → merge → CF deploy + live verify  

**Related skills when building:** `seekertracker-site`, `nextjs-opennext-workers`, `subagent-driven-development`, `test-driven-development`.
