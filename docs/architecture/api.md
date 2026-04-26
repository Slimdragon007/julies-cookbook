# Architecture: API

> Load trigger: API route work, scraper work. See base handbook Law 3.

**Status:** STUB. Populate on next API-touching task.

## Routes

TBD. Index live routes under `src/app/api/` when first audited.

## Scraper architecture

Two paths exist and must stay synced (project CLAUDE.md Rule 4 / Pitfall 1):

- `scripts/scrape-recipe.mjs` — CLI
- `src/app/api/scrape/route.ts` — web API

`.mjs` cannot import TS modules, so USDA + macro estimation logic is duplicated. ADR-002 tracks the shared-module refactor that retires this duplication.

## Chat endpoint

- Provider: Anthropic SDK 0.78
- Model: `claude-sonnet-4-20250514`
- Per-user context loaded from Supabase.

## Cron

- `/api/audit` runs daily at 08:00 UTC. Currently configured in `vercel.json` — fate depends on ADR-001.
