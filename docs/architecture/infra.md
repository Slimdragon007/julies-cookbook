# Architecture: Infra

> Load trigger: deploy, CI, env, build-pipeline work. Read every infra ADR before edits. See base handbook Law 3 + Law 4.

**Status:** Resolved — Cloudflare Pages per ADR-001 (accepted 2026-04-25).

## Deploy

- **Target:** Cloudflare Pages, project `julies-cookbook`.
- **Trigger:** every push to `main` via `.github/workflows/deploy.yml`.
- **Build:** `npx @cloudflare/next-on-pages` (output to `.vercel/output/static`).
- **Config:** `wrangler.toml` at repo root — `compatibility_date = 2024-09-23`, `nodejs_compat` flag enabled.
- **Local preview:** `npm run preview` (runs `build:cf` then `wrangler pages dev`).

## Secrets

GitHub Actions reads from repo secrets:

- `NEXT_PUBLIC_SUPABASE_URL` — deploy build-time
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — deploy build-time
- `CLOUDFLARE_API_TOKEN` — wrangler auth
- `CLOUDFLARE_ACCOUNT_ID` — wrangler auth
- `AUDIT_SECRET` — daily audit workflow auth (added 2026-04-26 per ADR-003)

Cloudflare Pages production environment holds the runtime secrets — see `@docs/REFERENCE.md` env section for the canonical list.

The Marketplace fallback names (`NEXT_PUBLIC_Juliescookbook_*`) were removed from code 2026-04-25 (TASK-004) and are no longer read anywhere.

## Cron

Daily 08:00 UTC via `.github/workflows/audit.yml` (ADR-003, accepted 2026-04-26).

- Calls `https://julies-cookbook.pages.dev/api/audit` with `Authorization: Bearer $AUDIT_SECRET`.
- `jq` parses the response; workflow exits non-zero on `status != "pass"`.
- Manual trigger: GitHub Actions tab → "Daily Audit" → Run workflow.
- Logical-failure alerts come from the audit endpoint itself via `DISCORD_WEBHOOK_URL`. Endpoint-unreachable alerts surface in the GitHub Actions tab (and via configured email-on-failure).

## What Got Removed (2026-04-25 → 2026-04-26)

- `vercel.json` (deleted via `git rm`, ADR-001)
- Marketplace env-var fallback in `src/lib/supabase/env.ts` and `src/app/api/audit/route.ts` (TASK-004)
- Residual Vercel strings in audit route (TASK-005)
- Legacy `VERCEL` env var from Cloudflare Pages production (TASK-006)

## Future Infra Changes

Any change to deploy target, build pipeline, vendor (auth / DB / hosting / image / payment), env-var contract, or `wrangler.toml` requires a new ADR before code lands (Law 4). No "quick experiments" on `main` — use a worktree, write the ADR if it succeeds, delete the worktree if it doesn't.
