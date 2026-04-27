# REFERENCE

> Project facts. Agent-maintained. Stale after 14 days = bug. See base handbook Law 3.

**Status:** Env-var section reconciled 2026-04-26 against live Cloudflare Pages production env. Other sections still STUB — populate as work touches each surface. Do not bulk-fill from memory.

## Stack snapshot

See root `CLAUDE.md` §2 for the canonical table. Mirror changes here only when this file gains detail beyond the table.

## Schema

TBD. Populate from live Supabase introspection (`cqfszhxuvvsgusvjdyqx`, us-east-1) before next data work.

## Env var contract

Single naming scheme (Rule 5, post-TASK-004):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- Resolver: `src/lib/supabase/env.ts` (lazy for service role key, eager for public ones)

Required at runtime (audit endpoint enforces presence — `/api/audit` returns `fail` if any are missing):

- `ANTHROPIC_API_KEY` — Claude chat (`/api/chat`)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — image hosting
- `SCRAPINGBEE_API_KEY` — Cloudflare-bypass for recipe scraper
- `INVITE_CODE` — server-side gate for `/api/signup`. Fails closed if missing.

Optional at runtime (feature degrades gracefully if absent):

- `USDA_API_KEY` — USDA FoodData Central lookups in `src/lib/usda.ts` and `scripts/scrape-recipe.mjs`. Falls back to AI macro estimate (which itself needs `ANTHROPIC_API_KEY`) → hardcoded table → 0.
- `PEXELS_API_KEY` — image fallback in `src/app/api/scrape/route.ts:930` when scraped page has no usable image.
- `AUDIT_SECRET` — if set, gates `/api/audit` access (token query param or Bearer header). If unset, audit endpoint is publicly callable.
- `DISCORD_WEBHOOK_URL` — alert sink for audit failures.
- `APP_URL` — override target for audit's homepage + chat-API self-checks. Defaults to `https://julies-cookbook.pages.dev`.

Build-time only (set as GitHub Actions secrets, injected during `npx @cloudflare/next-on-pages`):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — also need to be set as Cloudflare Pages runtime secrets for server-rendered routes that import `src/lib/supabase/env.ts`.

## File index

TBD. Generate when first navigation aid is needed.

## Current state

See project `CLAUDE.md` §9.
