# ADR-001: Deploy target for julies-cookbook

**Date:** 2026-04-25
**Status:** accepted (2026-04-25, Slim chose Option B)
**Decider:** Slim

## Context

The repo currently carries three conflicting signals about where production runs:

1. `vercel.json` at root configures a Vercel cron (`/api/audit` daily 08:00 UTC). No Vercel deploy hook is wired.
2. `wrangler.toml` at root sets `pages_build_output_dir = ".vercel/output/static"` with `nodejs_compat`.
3. `.github/workflows/deploy.yml` runs on every push to `main`, builds with `@cloudflare/next-on-pages`, deploys to Cloudflare Pages project `julies-cookbook`. This is what actually ships to production.
4. The prior project CLAUDE.md asserted Vercel as the deploy target.

History: Apr 21 saw 6 commits in 43 minutes migrating toward Cloudflare with no ADR (logged as Pitfall 6 in project CLAUDE.md). Production has been on Cloudflare Pages since.

Until this ADR resolves, base handbook Law 4 blocks all infra work, and any cron, env-var, or build-pipeline changes are at risk of being applied to the wrong target.

## Options considered

### Option A — Commit to Vercel

- **Pros:** Native Next.js 14 App Router support including Image Optimization, ISR, Server Actions, Edge/Fluid Compute, native cron (already configured), simpler env-var management via Vercel Marketplace integrations (already in use for Supabase — see Rule 5), better debugging tools (logs, traces, observability), AI SDK and AI Gateway align natively. Handbook's stated target.
- **Cons:** Have to delete the Cloudflare deploy and tear out `wrangler.toml` + `.github/workflows/deploy.yml`. Need to set up Vercel project link, env vars in Vercel dashboard or via `vercel env`. Cost depends on traffic — Cloudflare free tier is more generous for static-heavy reads.

### Option B — Commit to Cloudflare Pages

- **Pros:** It's what actually deploys today (zero migration friction). Generous free tier. Workers KV / D1 / R2 ecosystem if storage needs grow.
- **Cons:** `@cloudflare/next-on-pages` lags real Next.js features (Image Optimization, ISR semantics, Server Actions edge cases, middleware Node APIs). Cron has to be set up separately via Cloudflare Cron Triggers — current `vercel.json` cron is dead code. Anthropic SDK and other Node libs need workers-compat shims. Less mature debugging. Conflicts with Vercel-native FlowstateAI tooling and the Vercel Marketplace Supabase integration.

### Option C — Stay split (Cloudflare deploy, Vercel for cron only)

- **Pros:** No work today.
- **Cons:** This is the current state and is exactly what Pitfall 6 / Law 4 prohibit. Two systems to reason about, two sets of env vars, two failure modes. Cron currently does nothing. Rejected on principle by base handbook §3 Law 4.

## Decision

**Option B — Cloudflare Pages.** Chosen by Slim 2026-04-25. The Cloudflare deploy is already what production runs and ships on every push to `main`; staying with the running system is lower-risk than a Vercel migration today.

Two consequences flagged at decision time and tracked as follow-up tasks (not in this PR):

- The Vercel cron in `vercel.json` was never firing (no Vercel deploy was bound). Decommissioning loses no functionality. **Restoring `/api/audit` cron under Cloudflare is TASK-003.**
- The Marketplace env-var fallback (`NEXT_PUBLIC_Juliescookbook_*`) is dead code on Cloudflare (only `NEXT_PUBLIC_*` are wired in `.github/workflows/deploy.yml` GH secrets). Code references in `src/lib/supabase/env.ts` and `src/app/api/audit/route.ts` survive until **TASK-004** removes them. Project CLAUDE.md Rule 5 updated to reflect this.

## Consequences

If A (Vercel):

- Delete `wrangler.toml`, `.github/workflows/deploy.yml`, any `next-on-pages` build scripts in `package.json`.
- Run `vercel link` and `vercel env pull` in repo. Sync env vars from GH secrets to Vercel.
- Vercel cron in `vercel.json` becomes live — confirm `/api/audit` is idempotent before activating.
- Update `docs/architecture/infra.md` to describe the new state.
- Update project CLAUDE.md §2 stack table (Hosting → Vercel) and §9 Current State.

If B (Cloudflare):

- Delete `vercel.json`, port the cron to Cloudflare Cron Triggers in `wrangler.toml` or via dashboard.
- Update project CLAUDE.md §2 stack table (Hosting → Cloudflare Pages) and §9.
- Update Rule 5 (env vars) — drop Marketplace fallback if no longer in use, or document why both schemes survive.
- Audit every Node API used in middleware and API routes for workers-compat (Anthropic SDK in particular).
- `npm run build:cf` becomes the canonical build command; remove `npm run build` Vercel reference.

Either way:

- ADR-001 is committed before any infra code changes.
- The losing infra is fully decommissioned in the same PR as the winning infra is finalized — no half-state on `main`.

## Rollback plan

Within one sprint of acceptance:

- All deletions are version-controlled — `git revert` of the decommission PR restores the loser.
- Both Vercel and Cloudflare projects can coexist as long as only one has a deploy webhook bound; the unused one becomes a parked project with no traffic cost.
- DNS is the only externally-visible cutover. Keep the prior provider's deployment pinned to a preview URL (e.g. `cf.julies-cookbook.app`) for 7 days post-cutover so a DNS flip can revert in <5 minutes if the new target misbehaves.

If rollback is needed past one sprint, that triggers ADR-001a (supersedes).
