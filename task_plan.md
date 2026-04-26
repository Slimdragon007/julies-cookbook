# Task Plan

> Architect-owned. Executors update status only. See base handbook Law 3.

## Active

### TASK-002 — Resolve dual scraper paths (ADR-002)

**Owner:** unassigned
**Status:** queued
**Notes:** Extract shared scraping/macro logic to a third module so `.mjs` CLI and `route.ts` web API stop drifting. Rule 4 + Pitfall 1. ADR-002 to be drafted before code.

### TASK-003 — Restore `/api/audit` cron under Cloudflare

**Owner:** unassigned
**Status:** queued
**Notes:** Cron was dead in `vercel.json` (no Vercel deploy ever bound). Pick one of: Cloudflare Cron Trigger Worker that fetches the audit endpoint, GH Actions `schedule:` workflow with shared-secret call, or external scheduler. Decision goes in ADR-003 (lightweight — single sub-system, but per Law 4 still needs the ADR because it touches the build pipeline).

### TASK-005 — Residual Vercel string cleanup

**Owner:** unassigned
**Status:** queued
**Notes:** Remove leftover Vercel-specific strings now that Cloudflare is canonical. In `src/app/api/audit/route.ts`: Discord webhook footer at ~line 267 says `julies-cookbook.vercel.app/api/audit`; comment at ~line 15 says "Vercel cron secret header"; comment at ~line 196 references "VERCEL_URL". Pure string/comment cleanup, no code-behavior change, no ADR. Bundle with the next audit-route touch to avoid a churn commit.

## Backlog

- Populate `@docs/architecture/{ui,api,data}.md` with real content as each surface gets touched (currently stubs; `infra.md` is now real).
- Populate `@docs/REFERENCE.md` with full schema, env var contract, and file index from the live repo (currently stub).

## Done

- **TASK-001 — Resolve deploy target (ADR-001).** Done 2026-04-25. Decision: Cloudflare Pages. `vercel.json` removed via `git rm`. Project CLAUDE.md and `@docs/architecture/infra.md` updated. Pitfall 6 marked resolved with institutional-memory note. See `@progress.md`.
- **TASK-004 — Remove dead Marketplace env-var fallback.** Done 2026-04-25. Refactored `src/lib/supabase/env.ts` (single naming scheme, kept lazy service-role accessor) and `src/app/api/audit/route.ts` (env check uses plain string list). Rule 5 rewritten in project CLAUDE.md. `@docs/REFERENCE.md` env section populated with the full runtime env-var list. Lint clean, tsc clean, 46/53 unit tests pass (7 pre-existing skips). E2E not run (needs dev server). Spawned TASK-005 for residual Vercel string cleanup found during the audit. See `@progress.md`.
