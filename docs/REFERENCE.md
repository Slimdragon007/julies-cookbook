# REFERENCE

> Project facts. Agent-maintained. Stale after 14 days = bug. See base handbook Law 3.

**Status:** STUB. Populate as work touches each surface. Do not bulk-fill from memory.

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

Other known env vars used at runtime (audit endpoint enforces presence):

- `ANTHROPIC_API_KEY`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `SCRAPINGBEE_API_KEY`
- `AUDIT_SECRET` (optional; if set, gates `/api/audit` access)
- `DISCORD_WEBHOOK_URL` (optional; alert sink for audit failures)
- `APP_URL` (optional override; defaults to `https://julies-cookbook.pages.dev`)

Full list TBD — populate from Cloudflare Pages dashboard env audit on next env-touching task.

## File index

TBD. Generate when first navigation aid is needed.

## Current state

See project `CLAUDE.md` §9.
