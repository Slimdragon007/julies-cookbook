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

GitHub Actions deploy reads from repo secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The Marketplace fallback names (`NEXT_PUBLIC_Juliescookbook_*`) are not populated in this environment. See project CLAUDE.md Rule 5 and TASK-004.

## Cron

Currently **none.** The prior `vercel.json` cron for `/api/audit` was never firing (no Vercel deploy was bound). Restoring it under Cloudflare (Cron Trigger Worker, GH Actions schedule, or external scheduler) is **TASK-003.**

## What Got Removed (2026-04-25)

- `vercel.json` (deleted via `git rm`, ADR-001)

## Future Infra Changes

Any change to deploy target, build pipeline, vendor (auth / DB / hosting / image / payment), env-var contract, or `wrangler.toml` requires a new ADR before code lands (Law 4). No "quick experiments" on `main` — use a worktree, write the ADR if it succeeds, delete the worktree if it doesn't.
