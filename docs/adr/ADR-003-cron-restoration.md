# ADR-003: Restore `/api/audit` cron under Cloudflare

**Date:** 2026-04-26
**Status:** accepted (2026-04-26, Slim chose Option B — recommended)
**Decider:** Slim

## Context

`/api/audit` (`src/app/api/audit/route.ts`) is the project's runtime health check. It verifies:

1. Required env vars present (Supabase, Anthropic, Cloudinary, ScrapingBee, INVITE_CODE).
2. Recipe count ≥ 15, ingredient count ≥ 100.
3. All recipes have image URLs and those URLs are reachable.
4. No orphan ingredients (FK pointing to deleted recipe).
5. No recipes without ingredients.
6. Homepage reachable.
7. Chat API responds.
8. Optionally (`?usage=true`): ScrapingBee credits, Supabase row counts + DB size, Cloudinary storage / bandwidth / transformation usage, Anthropic key presence.

If anything fails and `DISCORD_WEBHOOK_URL` is set, a Discord alert fires.

The endpoint is gated by `AUDIT_SECRET` (token query param or `Authorization: Bearer …`), set in Cloudflare Pages production env as of 2026-04-26.

**The endpoint exists. Nothing is calling it on a schedule.**

History: prior `vercel.json` defined a daily 08:00 UTC Vercel cron pointing at `/api/audit`. The cron was never bound to an active Vercel deploy, so it never fired. ADR-001 chose Cloudflare Pages and removed `vercel.json`. The audit feature has been silent end-to-end since the migration; arguably since before.

This ADR picks a scheduler. Per handbook Law 4, the choice lands as an ADR before any code or workflow file is added.

## Constraints

- The endpoint is HTTPS, idempotent, fast on the happy path (~1–2 sec; up to ~10 sec if many image-URL HEAD requests time out).
- Schedule: daily is enough; hourly is overkill and would waste image-URL HEAD bandwidth + chat-API quota.
- AUDIT_SECRET must be available to whatever scheduler we pick.
- Cloudflare Pages does not natively support cron triggers — Cron Triggers are a Workers-platform feature, distinct from Pages. To use them with Pages we'd run a separate Worker that issues a `fetch` to the Pages URL.
- The cron should fail loudly if the audit endpoint returns non-200, not silently. Discord alert fires only if the endpoint **runs** and overall status is "fail" — if the endpoint is unreachable entirely, nothing alerts.
- Solo-developer project. Operational complexity matters.

## Options considered

### Option A — Cloudflare Cron Trigger Worker

Create a tiny Worker (separate from the Pages project) with a Cron Trigger that fires daily and `fetch`es `https://julies-cookbook.pages.dev/api/audit?token=$AUDIT_SECRET`. The Worker logs the response status and, if the fetch fails, posts to the same Discord webhook directly.

- **Pros:** Stays in the Cloudflare ecosystem; no new vendor. Low cost (free tier covers it). Fires even if GH Actions is down. Worker can do a follow-up alert if the fetch itself errors (covers the "endpoint unreachable" gap that the audit's own Discord alert can't cover).
- **Cons:** Adds a second Cloudflare resource (Worker) to maintain. Two `wrangler.toml` files (Pages config + Worker config) or a single multi-target one. AUDIT_SECRET has to be set in two places (Pages runtime + Worker secrets) or the Worker reads it from a Pages-shared store. Slight cognitive overhead.

### Option B — GitHub Actions `schedule:` workflow

Add `.github/workflows/audit.yml` with `on: schedule: - cron: '0 8 * * *'`. The workflow uses a stored `AUDIT_SECRET` GH secret to call the endpoint, fails the run if status ≠ "pass", and (optionally) posts a Discord message via webhook on failure.

- **Pros:** No new infra. Reuses GH secrets the project already manages. GH Actions UI shows run history and pass/fail without extra observability tooling. Failed runs are visible on the Actions tab and can be configured to email the repo owner. Single repo, single config, one secret store.
- **Cons:** GH Actions cron is best-effort — runs can be delayed up to ~15 min during peak GH load. Daily timing isn't business-critical, so delay is fine. Couples a runtime health check to a CI provider; some shops avoid this on principle. If the GH org is paused or repo is archived, audit silently stops.

### Option C — External scheduler (cron-job.org, Better Stack, Healthchecks.io)

Sign up for a free tier of an HTTP-pinging service. Configure it to GET `/api/audit?token=$AUDIT_SECRET` daily. Service emails on non-200.

- **Pros:** Best uptime visibility — services like Better Stack and Healthchecks.io explicitly track "expected ping cadence" and alert if the schedule itself slips. No infra to maintain.
- **Cons:** New vendor in the trust chain (sees AUDIT_SECRET in URL or header). Free tiers have limits (number of monitors, alert channels). One more dashboard. Account ownership becomes a bus-factor concern (if Slim's email lapses, monitoring vanishes).

### Option D — No cron, manual check only

Slim hits `/api/audit?token=…` from a browser bookmark or curl when he remembers.

- **Pros:** Zero setup.
- **Cons:** No alerting. Defeats the purpose of having an audit endpoint with Discord webhook integration. This is the current state and it's why TASK-003 exists.

## Decision

**Option B — GitHub Actions schedule.** Chosen by Slim 2026-04-26. Lowest operational cost, reuses existing secret-management surface, makes scheduling visible in the same place CI deploy lives, and the project is already deeply integrated with GitHub Actions for deploy. The "endpoint unreachable" gap (which only Option A explicitly closes) is acceptable for a family-scale app — if Cloudflare Pages goes fully down, Slim will notice without a cron.

Option A remains the right call if the project ever moves toward serious uptime SLA. Option C remains the right call if the project ever needs SOC-2-style external attestation. Today, neither applies.

Implementation landed in the same commit that accepted this ADR: `.github/workflows/audit.yml`, daily 08:00 UTC schedule, `workflow_dispatch` for manual runs, `AUDIT_SECRET` added as a GitHub repo secret. Schedule preserves the original `vercel.json` intent (08:00 UTC). The workflow uses `jq` to parse the JSON response and exits non-zero on `status != "pass"`, surfacing failures in the Actions tab and (on email-on-failure config) to Slim's inbox. Existing `DISCORD_WEBHOOK_URL` integration in the audit endpoint itself continues to alert on logical failures.

## Consequences

If B (GitHub Actions schedule):

- Add `AUDIT_SECRET` to GitHub repository secrets (currently only in Cloudflare Pages env).
- Create `.github/workflows/audit.yml`:
  - `on: schedule: - cron: '0 8 * * *'` (and `workflow_dispatch` for manual runs).
  - One step: `curl -fsS -H "Authorization: Bearer $AUDIT_SECRET" "https://julies-cookbook.pages.dev/api/audit"`.
  - `-f` makes curl exit non-zero on HTTP ≥ 400 (audit returns 200 on pass and 200 on fail with body status — needs a body-parse step for proper failure detection).
  - Better: `jq -e '.status == "pass"'` after the curl.
- Update `docs/architecture/infra.md` to document the scheduler.
- Project CLAUDE.md §9 Current State: TASK-003 → done; remove from "Mid-build / unresolved".
- TASK-003 progress entry in `progress.md`.

If A (Cloudflare Cron Worker):

- Create `workers/audit-cron/` with its own `wrangler.toml` and an `index.ts` that handles `scheduled()` events.
- Add Worker secret: `AUDIT_SECRET` (`wrangler secret put`).
- Deploy via `wrangler deploy` — needs a separate `.github/workflows/audit-worker-deploy.yml` if Slim wants this auto-deployed, otherwise manual.
- Worker code does `fetch` + alert-on-fetch-failure path.
- Two cron schedules to keep aligned (the Worker's, and any future Pages-side scheduling) — pick one source of truth.

If C (external scheduler):

- Sign up; document account location in `docs/REFERENCE.md` external services section.
- Add monitor for `https://julies-cookbook.pages.dev/api/audit?token=…`.
- Configure alert recipient (Slim's email, Discord webhook, etc.).
- Add a reference memory entry pointing to which dashboard owns audit alerting.

Either A, B, or C:

- AUDIT_SECRET is now load-bearing. Document rotation procedure: rotate via `wrangler pages secret put AUDIT_SECRET`, then update wherever the scheduler stores it (GH secret / Worker secret / external dashboard) in the same change.
- Audit endpoint should remain backward compatible with both `?token=` and `Authorization: Bearer` so any scheduler choice works without route changes.

## Rollback plan

- Option B: delete `.github/workflows/audit.yml`. Zero side effect.
- Option A: `wrangler delete` the Worker. The Pages project is untouched.
- Option C: cancel the external monitor. No code changes to revert.
- AUDIT_SECRET stays in Cloudflare Pages env regardless — it gates the endpoint from anonymous traffic, which is valuable independent of scheduling.

## Open questions before acceptance

1. Slim picks A vs B vs C.
2. Schedule: daily 08:00 UTC matches the original `vercel.json` intent. Confirm or change.
3. Alert routing: existing `DISCORD_WEBHOOK_URL` on the audit endpoint covers logical-fail cases; for endpoint-unreachable cases (Pages down, secret rotated, network blip), do we add a separate alert path? Affects A vs B vs C tradeoff.
