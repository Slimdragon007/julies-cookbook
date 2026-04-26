# Task Plan

> Architect-owned. Executors update status only. See base handbook Law 3.

## Active

### TASK-002 — Resolve dual scraper paths (ADR-002)

**Owner:** unassigned
**Status:** awaiting decision
**Notes:** ADR-002 drafted 2026-04-26 with options A–E. Recommended: Option B (TypeScript CLI via `tsx`). Slim picks option, then implementation PR extracts shared logic, deletes Rule 4, marks Pitfall 1 resolved. See `@docs/adr/ADR-002-dual-scraper-paths.md`.

### TASK-003 — Restore `/api/audit` cron under Cloudflare

**Owner:** unassigned
**Status:** awaiting decision
**Notes:** ADR-003 drafted 2026-04-26 with options A–D. Recommended: Option B (GitHub Actions `schedule:` workflow). Slim picks option, then implementation PR adds the workflow file (or Worker / external monitor) and updates `infra.md`. See `@docs/adr/ADR-003-cron-restoration.md`.

## Backlog

- Populate `@docs/architecture/{ui,api,data}.md` with real content as each surface gets touched (currently stubs; `infra.md` is now real).
- Populate `@docs/REFERENCE.md` with full schema, env var contract, and file index from the live repo (currently stub).

## Done

- **TASK-001 — Resolve deploy target (ADR-001).** Done 2026-04-25. Decision: Cloudflare Pages. `vercel.json` removed via `git rm`. Project CLAUDE.md and `@docs/architecture/infra.md` updated. Pitfall 6 marked resolved with institutional-memory note. See `@progress.md`.
- **TASK-004 — Remove dead Marketplace env-var fallback.** Done 2026-04-25. Refactored `src/lib/supabase/env.ts` (single naming scheme, kept lazy service-role accessor) and `src/app/api/audit/route.ts` (env check uses plain string list). Rule 5 rewritten in project CLAUDE.md. `@docs/REFERENCE.md` env section populated with the full runtime env-var list. Lint clean, tsc clean, 46/53 unit tests pass (7 pre-existing skips). E2E not run (needs dev server). Spawned TASK-005 for residual Vercel string cleanup found during the audit. See `@progress.md`.
- **TASK-005 — Residual Vercel string cleanup.** Done 2026-04-26. Three string/comment leftovers in `src/app/api/audit/route.ts` corrected: cron-secret comment de-Vercel'd, VERCEL_URL comment generalized to "runtime URL", Discord webhook footer updated to `julies-cookbook.pages.dev/api/audit`. Bundled per the original "next audit-route touch" guidance. Lint clean, tsc clean, 46/53 vitest pass. See `@progress.md`.
- **TASK-006 — Remove legacy `VERCEL` env var from Cloudflare Pages.** Done 2026-04-26. Deleted via `wrangler pages secret delete VERCEL --project-name=julies-cookbook`. Confirmed gone via `wrangler pages secret list`. `PEXELS_API_KEY` preserved (real code, not legacy). See `@progress.md`.
- **HUSKY — Pre-commit gate wired up.** Done 2026-04-26. `.husky/pre-commit` existed but was orphaned (husky not in package.json, hooksPath unset, hook not executable). Installed husky as devDependency, switched prepare script to modern `husky` invocation, hooksPath now `.husky/_`. Pre-commit (`next lint --quiet && tsc --noEmit`) confirmed firing on the install commit. Closes the gap between handbook §6 DoD and reality. Not previously tracked as a TASK because the handbook claimed this gate was already real. See `@progress.md`.
