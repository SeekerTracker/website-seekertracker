# seekertracker skill

Agent skill for [Seeker Tracker](https://seekertracker.com) — public JSON APIs for Solana Mobile (`.skr` SeekerIDs, Seeker dApps, SKR, prices).

## Install

```bash
# From this monorepo (after publish to GitHub)
npx skills add SeekerTracker/website-seekertracker@seekertracker

# Global install (skip prompts)
npx skills add SeekerTracker/website-seekertracker@seekertracker -g -y
```

Browse the ecosystem: https://skills.sh/

## Use

In a compatible agent, invoke when the user asks about SeekerIDs, Seeker Tracker, Seeker dApps, or SKR stats. Slash-style: `/seekertracker`.

## Docs on the live site

- https://seekertracker.com/llms.txt
- https://seekertracker.com/api
- https://seekertracker.com/openapi.json
- https://seekertracker.com/developers

## Files

- `SKILL.md` — agent instructions
- `references/api.md` — endpoint table
