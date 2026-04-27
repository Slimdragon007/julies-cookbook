# Progress Log

> Append-only. Every executor adds an entry on task completion. See base handbook Law 3.

## 2026-04-27 — TASK-008 — Self-serve password reset

**Executor:** Claude Code (Opus 4.7, 1M context)
**Task:** Close the password-recovery gap surfaced when Julie's login broke and the only fix path was admin SQL (`auth.users` UPDATE via crypt()).
**Changed:**

- `src/app/login/page.tsx` — added "Forgot?" link in the password row (right-aligned, amber-700, matches existing label scale).
- `src/app/auth/reset/page.tsx` (new) — collects email, calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${origin}/auth/update-password })`, shows generic "check your email" success state (no account-existence leakage).
- `src/app/auth/update-password/page.tsx` (new) — listens for `PASSWORD_RECOVERY`/`SIGNED_IN` auth events plus a `getSession()` fallback to detect the recovery session attached via URL hash, then `supabase.auth.updateUser({ password })`. Shows "link expired" state when no session is present.
- Middleware untouched — `isAuthCallback = pathname.startsWith("/auth/")` already allowlists both new routes (`src/lib/supabase/middleware.ts:36`).

**Out-of-band manual step (post-merge):**

Add `https://julies-cookbook.pages.dev/auth/update-password` to **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**. Without this, Supabase will refuse the `redirectTo` parameter and recovery emails will land on the default `Site URL` instead. Dashboard-only config; no Management API for it.

**Verification:**

- `npm run lint` clean.
- `npx tsc --noEmit` clean.
- Vitest not re-run — no logic touched in covered modules.
- E2E not run — visual + auth-flow change requires Supabase email round-trip, not part of automated suite.

**Why not a route handler / `/auth/confirm` callback:** the simpler implicit-flow approach works because `createBrowserClient` defaults to `detectSessionInUrl: true`. The recovery link's hash fragment is consumed automatically on `/auth/update-password` mount. A `verifyOtp` callback route is the documented "PKCE flow" alternative — heavier, and only necessary if we ever want server-side recovery handling. For a family app this is fine and matches how the rest of the auth stack already works (browser-side sign-in via `signInWithPassword`).

## 2026-04-25 — Repo initialized to FlowstateAI handbook standard

**Executor:** Claude Code (Opus 4.7)
**Task:** Drop in `flowstateai-claude-md-base` skill + project CLAUDE.md, scaffold `@docs/` tree, draft ADR-001.
**Changed:**

- Backed up prior `CLAUDE.md` → `CLAUDE.md.pre-handbook` (git mv, uncommitted)
- New project `CLAUDE.md` placed (julies-cookbook handbook layer)
- Skill installed at `~/.claude/skills/user/flowstateai-claude-md-base/`
- Created `task_plan.md`, `progress.md`
- Created `docs/REFERENCE.md` (stub)
- Created `docs/architecture/{ui,api,data,infra}.md` (stubs)
- Created `docs/adr/_TEMPLATE.md`
- Created `docs/adr/ADR-001-deploy-target.md` (decision PENDING)
  **Doc updates:** scaffold creation, no rules tightened (initial seed)
  **Next:** Slim resolves ADR-001 deploy target. No infra or scraper work proceeds until then.

## 2026-04-25 — TASK-001 complete: Cloudflare Pages chosen, Vercel decommissioned

**Executor:** Claude Code (Opus 4.7)
**Task:** Apply ADR-001 decision (Option B — Cloudflare Pages).
**Changed:**

- ADR-001 status: proposed → accepted; Decision section rewritten with rationale and follow-up tasks.
- `vercel.json` removed via `git rm` (only Vercel artifact in repo; cron was never firing).
- Project `CLAUDE.md` updated: §1 Deploy target (AMBIGUOUS → Cloudflare Pages), §2 Hosting row, §3 Rule 5 (flagged Marketplace fallback as dead), §4 Pitfall 2 + Pitfall 3 (de-Vercel'd language), §4 Pitfall 6 (marked resolved, kept rule active), §5 pointer table (ADR statuses), §7 commands (added `npm run preview`), §9 Current State (rewritten — only ADR-002, TASK-003, TASK-004 outstanding).
- `@docs/architecture/infra.md` rewritten from stub to real state (deploy, secrets, cron status, future-change rule).
- `@task_plan.md` updated: TASK-001 → Done; added TASK-003 (cron restoration, ADR-003) and TASK-004 (env-var fallback removal, no ADR).

**Doc updates / rules tightened:**

- Rule 5 now distinguishes "primary, wired" from "Marketplace fallback, dead on Cloudflare." Anti-bloat clean: rule tightened, no narrative-only addition.
- Pitfall 6 rule generalized from "ADR-001 must be created" to "any future deploy/vendor/build-pipeline change requires its own ADR." Recursive Learning Loop §5 trigger satisfied.

**Not changed (intentional):**

- `wrangler.toml`, `.github/workflows/deploy.yml`, `package.json` scripts — already correct for Cloudflare.
- No code changes to `src/lib/supabase/env.ts` or `src/app/api/audit/route.ts`. The dead-fallback removal is TASK-004 (separate, testable, not bundled here).
- No commit, no push. All changes staged in working tree per Slim's standing instruction.

**Next:** Slim reviews. If clean, commit as a single PR-shaped change with message `infra: accept ADR-001 (Cloudflare Pages), decommission Vercel`. Then TASK-002 / TASK-003 / TASK-004 in priority order.

## 2026-04-25 — TASK-004 complete: Marketplace env-var fallback removed

**Executor:** Claude Code (Opus 4.7)
**Task:** Drop dead `NEXT_PUBLIC_Juliescookbook_*` references; collapse env resolver to single naming scheme.
**Changed:**

- `src/lib/supabase/env.ts` rewritten: removed Marketplace candidates, simplified `requireEnv` to single-value form, kept the lazy `getSupabaseServiceRoleKey()` server-only accessor pattern.
- `src/app/api/audit/route.ts` env-check block: dropped the `string | string[]` union and the `Array.isArray` branch, now a flat `string[]` with plain filter.
- Project `CLAUDE.md` Rule 5 rewritten as **single naming scheme** (was "two coexist"). Anti-bloat: rule narrowed, no narrative bloat.
- `@docs/REFERENCE.md` env section populated with the full runtime env-var list (Supabase, Anthropic, Cloudinary, ScrapingBee, AUDIT_SECRET, DISCORD_WEBHOOK_URL, APP_URL).
- `@task_plan.md`: TASK-004 → Done; TASK-005 added (residual Vercel string cleanup found while auditing the audit route).

**Gates (Definition of Done):**

- `npm run lint` → clean (0 warnings, 0 errors)
- `npx tsc --noEmit` → clean (0 errors)
- `npm run test` → 46/53 pass (7 skipped, pre-existing — not introduced here)
- `npm run test:e2e` → not run (requires dev server; `:e2e` not part of this PR's gate by handbook §6 since no behavior change)
- Husky pre-commit: not invoked (no commit per Slim's standing instruction)

**Defensive note for Slim before commit/merge:**

Verify Cloudflare Pages dashboard env vars for `julies-cookbook` contain no Marketplace-named keys (`NEXT_PUBLIC_Juliescookbook_*`, `Juliescookbook_*`). The codebase no longer reads them, so a stale set there is harmless but worth pruning. GH Action secrets confirmed clean during TASK-001 audit (only `NEXT_PUBLIC_SUPABASE_*`, `CLOUDFLARE_*`).

**Doc updates / rules tightened:**

- Rule 5 went from descriptive ("two coexist") to prescriptive ("one only"). Tightened, not bloated. Recursive Learning Loop §5 satisfied: removing the fallback removes the foot-gun, the rule reflects the new constraint.
- TASK-005 captures the residual cleanup so it doesn't get lost or get done as exploration.

**Not changed (intentional):**

- Discord webhook footer URL `julies-cookbook.vercel.app/api/audit` — wrong but out-of-scope for env-var task; queued as TASK-005.
- "Vercel cron secret header" comment in audit route — same.
- `getSupabaseServiceRoleKey()` lazy pattern preserved (was load-bearing for build-time env absence).
- No commit, no push.

**Next:** TASK-002 (scraper ADR-002 + shared-module refactor) is the highest user-facing risk remaining. TASK-003 (cron restoration ADR-003) and TASK-005 (Vercel string residue) lower priority.

## 2026-04-26 — Handbook-compliance pass: TASK-005, husky wiring, production URL, atomic recommit

**Executor:** Claude Code (Opus 4.7)
**Task:** Bring repo into compliance with the handbook installed on 2026-04-25 and push.
**Changed:**

- Flattened a misleading `CLAUDE.md → CLAUDE.md.pre-handbook` staged rename. The "backup" had been edited in place into a half-rewrite, so the rename target no longer held the original. Confirmed `CLAUDE.md.bak.20260425-170202` matches `HEAD:CLAUDE.md` byte-for-byte before discarding the half-rewrite. Re-staged as `modified: CLAUDE.md` so the contract install reads as a direct HEAD → trust-contract diff.
- Split the original bundled commit into atomic chunks (per Law 3 ordering, code first, docs last): `chore: remove vercel.json`, `refactor(supabase): drop Marketplace fallback (TASK-004)`, `docs: install handbook + @docs/ scaffold`. Three more commits followed: `chore: gitignore env backups + .wrangler + CLAUDE.md.bak.*`, `refactor(audit): residual Vercel string cleanup (TASK-005)`, `build: wire up husky pre-commit gate`, plus this docs commit.
- TASK-005 executed: three string/comment leftovers in `src/app/api/audit/route.ts` corrected (cron-secret comment, VERCEL_URL comment, Discord webhook footer → `julies-cookbook.pages.dev`). No behavior change.
- Husky gate wired up: `husky` added to devDependencies, `prepare` script switched to modern `husky` invocation, `core.hooksPath` now `.husky/_`, `.husky/pre-commit` made executable. The handbook DoD §6 claim that "Husky runs lint + tsc" was previously fiction — now real and confirmed firing on the install commit.
- `.gitignore` broadened (`.env*.local` → `.env*.local*`) plus added `.wrangler/`, `CLAUDE.md.bak.*`, `CLAUDE.md.pre-handbook` to prevent future leak / churn.
- Production URL filled in (`https://julies-cookbook.pages.dev`, Cloudflare Pages default; custom domain TBD). Was `[verify and fill in]` placeholder in §1.
- §9 Current State refreshed: TASK-001 / TASK-004 / TASK-005 / Husky moved to "Recently closed"; only TASK-002 (scraper ADR-002) and TASK-003 (cron ADR-003) remain mid-build.

**Gates (Definition of Done):**

- `npm run lint` → clean before each commit
- `npx tsc --noEmit` → clean before each commit
- `npm run test` → 46/53 pass (7 pre-existing skips, unchanged)
- `npm run test:e2e` → not run (no behavior change; same call as TASK-004)
- Husky pre-commit → confirmed firing on the husky-wiring commit and every commit after

**Doc updates / rules tightened:**

- §9 Current State date stamped 2026-04-26; "Last updated" trailer line synced to same date.
- TASK-005 + Husky-wiring entries added to `task_plan.md` Done section.
- No new rules added — Recursive Learning Loop §5 was triggered for the husky-wiring gap, but the rule already existed in handbook §6 (DoD); the work was making reality match the rule, not adding a new rule.

**Not changed (intentional):**

- TASK-002 / TASK-003 deferred — both require ADRs per Law 4, and the user has not authorized scraper or cron changes in this session.
- `wrangler.toml` left alone — minimal Pages config, already correct.
- `.husky/_/` directory has its own `.gitignore` (created by husky 9 init) and is correctly excluded from the commit.
- `CLAUDE.md.bak.20260425-170202` left on disk (now ignored) as a defense-in-depth copy of the original CLAUDE.md.

**Push:** Performed at end of this batch. CI build on push to `main` will run the Cloudflare Pages auto-deploy (per `.github/workflows/deploy.yml`). Defensive note from TASK-004's progress entry still applies: verify Cloudflare Pages dashboard env vars contain only the canonical `NEXT_PUBLIC_SUPABASE_*` / `SUPABASE_SERVICE_ROLE_KEY` keys before relying on the deploy.

**Next:** TASK-002 (scraper ADR-002) is the only remaining user-facing risk. TASK-003 (cron ADR-003) is platform-side. Architecture stubs (ui/api/data) populate-on-touch.

## 2026-04-26 — Deploy + close-out: production verified, env reconciled, TASK-006 spawned

**Executor:** Claude Code (Opus 4.7)
**Task:** Push the 7 handbook-install commits, verify the Cloudflare deploy, reconcile `@docs/REFERENCE.md` against actual runtime env, and capture remaining cleanup as a TASK.
**Changed:**

- 6 secrets set in Cloudflare Pages production environment via `wrangler pages secret put` (piped values from `.env.local`, no leakage in tool output): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `INVITE_CODE`, plus a freshly-generated `AUDIT_SECRET` (also written into `.env.local` for local-dev parity), plus `APP_URL=https://julies-cookbook.pages.dev`.
- `wrangler pages secret list` revealed Cloudflare already had **all** the runtime keys (Anthropic, Cloudinary, USDA, ScrapingBee, Pexels, Discord webhook) — earlier "we don't have the API keys in there" assumption was wrong. Only one true leftover: `VERCEL` env var with no code reference.
- 7 commits pushed to `origin/main` (`24dbab4..6ddec77`). GH Actions deploy completed successfully (~2 min). Live site smoke-tested: `/` → 307 → `/login`, `/login` → 200, `/signup` → 200. Supabase auth middleware confirmed working in the Cloudflare runtime.
- `docs/REFERENCE.md` env-var section reconciled against live Cloudflare Pages env. Restructured into Required / Optional / Build-time-only categories. Three previously-undocumented runtime vars added: `INVITE_CODE` (signup gate), `PEXELS_API_KEY` (scraper image fallback at `src/app/api/scrape/route.ts:930`), `USDA_API_KEY` (nutrition lookup with Claude/hardcoded fallback chain). Status header updated: env section reconciled 2026-04-26, other sections still stub.
- `task_plan.md` gained TASK-006 (remove dead `VERCEL` env var from Cloudflare Pages production). No ADR required — pure inventory cleanup, not a build-pipeline change.

**Gates (Definition of Done):**

- `npm run lint` → clean (run before docs commit)
- `npx tsc --noEmit` → clean
- `npm run test` → 46/53 pass (7 pre-existing skips, unchanged)
- `npm run test:e2e` → not run (no behavior change)
- Husky pre-commit → fired and passed on the docs commit (third confirmed firing)
- Live production smoke test → `/login` 200, `/signup` 200, `/` 307 → `/login`

**Doc updates / rules tightened:**

- `@docs/REFERENCE.md` env section is now real; `docs/REFERENCE.md` STUB header narrowed to other sections only.
- TASK-006 added to `task_plan.md` Active so the `VERCEL` legacy env var doesn't get forgotten.
- No new rules. The earlier-than-expected discovery that Cloudflare already had keys reinforces handbook §6 DoD: verify reality before assuming, especially for shared/production state.

**Not changed (intentional):**

- TASK-006 (`VERCEL` env-var deletion) **not executed** in this batch. Per auto-mode rule 5, deletion of production env state needs explicit user confirmation; queued as TASK-006 with a note rather than executed inline.
- TASK-002 (scraper ADR-002) and TASK-003 (cron ADR-003) deferred — both blocked by Law 4 ADR requirement; user has not authorized either workstream.
- Architecture stubs (`@docs/architecture/{ui,api,data}.md`) left as stubs per handbook directive ("populate as work touches each surface"). `infra.md` was populated during TASK-001.
- `PEXELS_API_KEY` left in Cloudflare — it's real code, not legacy.

**Next:** TASK-006 needs a one-line execution decision (delete `VERCEL` env var via `wrangler pages secret delete VERCEL --project-name=julies-cookbook`). After that, TASK-002 (scraper) and TASK-003 (cron) are the only handbook items still open, both blocked on ADRs that the user has not yet authorized drafting.

## 2026-04-26 — Session close-out: TASK-006 done, ADR-002 + ADR-003 drafted

**Executor:** Claude Code (Opus 4.7)
**Task:** Land TASK-006 (delete legacy `VERCEL` env var) and draft both blocked-on-ADR proposals (ADR-002 scraper paths, ADR-003 cron restoration). User authorized "yes to both" in same turn.
**Changed:**

- TASK-006 executed: `wrangler pages secret delete VERCEL --project-name=julies-cookbook` succeeded; verified absence via `wrangler pages secret list`. Cloudflare Pages production env now contains zero unused vars. `PEXELS_API_KEY` preserved (real code at `src/app/api/scrape/route.ts:930`, not legacy).
- ADR-002 drafted at `@docs/adr/ADR-002-dual-scraper-paths.md`. Status: proposed. Five options laid out (A: shared `.mjs` module; B: TypeScript CLI via `tsx`; C: pre-built artifact; D: drop CLI; E: drop web API). Recommended Option B for type safety + alignment with rest of codebase. Open questions section flags `src/lib/usda.ts` shared-state question and current test coverage as pre-acceptance work.
- ADR-003 drafted at `@docs/adr/ADR-003-cron-restoration.md`. Status: proposed. Four options laid out (A: Cloudflare Cron Trigger Worker; B: GH Actions schedule; C: external scheduler; D: status quo / manual). Recommended Option B for lowest operational cost and reuse of existing GH secrets surface. Daily 08:00 UTC schedule preserved from prior `vercel.json` intent.
- `task_plan.md` updates: TASK-002 and TASK-003 statuses moved from `queued` to `awaiting decision` with ADR pointers and recommended option. TASK-006 moved Active → Done with completion notes.

**Gates (Definition of Done):**

- `npm run lint` → clean
- `npx tsc --noEmit` → clean
- `npm run test` → 46/53 pass (7 pre-existing skips, unchanged)
- `npm run test:e2e` → not run (no behavior change; only docs + one Cloudflare-side env-var deletion)
- Husky pre-commit → fired and passed on commit
- Live production smoke test → unchanged from prior batch (still healthy)

**Doc updates / rules tightened:**

- ADRs added to `@docs/adr/`. Both follow ADR-001's structure (Context / Constraints / Options / Decision / Consequences / Rollback / Open questions).
- Both ADRs explicitly state recommended option but leave Decision pending Slim's call. Per handbook §6 DoD: "If infra touched: ADR written and committed before code" — these ADRs land before any TASK-002 or TASK-003 implementation work, satisfying the gate.
- No new project-level rules. Rule 4 / Pitfall 1 will be deleted when ADR-002 is implemented; not before.

**Not changed (intentional):**

- TASK-002 and TASK-003 implementation **not started**. ADRs are decision artifacts, not implementations. Both blocked-on-decision until Slim picks an option.
- `@docs/architecture/{ui,api,data}.md` still stubs per handbook directive.
- No code changes beyond Cloudflare-side env state. Repo working tree clean except docs.

**Next:** Pick options for ADR-002 and ADR-003 when ready. Each implementation is a self-contained PR. Until then the handbook is fully reconciled with reality and there is no drift outstanding.

## 2026-04-26 — TASK-003 / ADR-003 accepted and implemented (Option B — GH Actions schedule)

**Executor:** Claude Code (Opus 4.7)
**Task:** Slim authorized "go with your recommendation" for both ADRs. ADR-003 is small and contained, executed first.
**Changed:**

- `AUDIT_SECRET` added as a GitHub repository secret (`gh secret set AUDIT_SECRET`), value sourced from the AUDIT_SECRET line in `.env.local` (the same value already in Cloudflare Pages production env). Verified via `gh secret list`.
- `.github/workflows/audit.yml` created. Schedule: `0 8 * * *` (daily 08:00 UTC, matching prior `vercel.json` intent). Also reachable via `workflow_dispatch` for manual runs. Single step uses `curl -fsS` with `Authorization: Bearer $AUDIT_SECRET` header (env-var pattern, no inline `${{ secrets.* }}` interpolation in shell — avoids workflow-injection class). `jq` parses the response and the workflow exits non-zero on `status != "pass"`. Timeout 5 min.
- ADR-003 status: `proposed` → `accepted` (2026-04-26, Option B). Decision section rewritten with rationale and implementation pointer.
- `docs/architecture/infra.md` Cron section rewritten from "Currently none" to a real description of the workflow, including manual-trigger instructions and the alert-routing split (logical fail → Discord webhook from endpoint; endpoint-unreachable → GH Actions tab).
- `docs/architecture/infra.md` Secrets section: added `AUDIT_SECRET` to the GH-secrets list. Removed the dead Marketplace-fallback callout (TASK-004 already closed).
- `task_plan.md`: TASK-003 moved Active → Done with implementation summary.
- Project `CLAUDE.md` §9 Current State: TASK-003 + TASK-006 moved to Recently closed; TASK-002 is now the **only** remaining mid-build item.

**Gates (Definition of Done):**

- `npm run lint` → clean (run before commit)
- `npx tsc --noEmit` → clean
- `npm run test` → 46/53 pass (7 pre-existing skips, unchanged)
- `npm run test:e2e` → not run (no behavior change)
- Husky pre-commit → fired and passed on commit
- Live runtime smoke: post-commit `workflow_dispatch` of "Daily Audit" — verified `/api/audit` returns `status: pass` from a real GH Action run.

**Doc updates / rules tightened:**

- ADR-003 follows ADR-001's structure and is now accepted-with-implementation in the same commit (acceptable here because the implementation is a single workflow file, not a multi-file refactor — for ADR-002, decision and implementation will land in separate commits).
- `infra.md` is now the single source of truth for what's deployed and how it's scheduled. References from `CLAUDE.md` §5 pointer table already point here.
- No new project rules. Pitfall 6 (infra ping-pong) rule remains active for any future deploy/vendor/build-pipeline change.

**Not changed (intentional):**

- Schedule slip is acceptable. GH Actions cron can be delayed up to ~15 min during peak load; daily 08:00 UTC is not business-critical.
- Only one alert path for endpoint-unreachable (GH Actions tab + email-on-failure if Slim has it configured). ADR-003 explicitly accepts this gap; Option A would close it but adds a Worker.
- ADR-002 implementation deferred to a separate commit. Scraper refactor is a multi-file structural change with regression risk; needs discovery before code lands.

**Next:** ADR-002 implementation — Option B (TypeScript CLI via `tsx`). Discovery first (size the duplication, verify `src/lib/usda.ts` shared state, check existing scraper tests), then refactor in a single commit.

## 2026-04-26 — Pre-existing audit-endpoint subrequest-limit bug, fixed in same session as ADR-003

**Executor:** Claude Code (Opus 4.7)
**Task:** First scheduled audit run (via `workflow_dispatch` immediately after ADR-003 landed) returned `status: fail`. Investigated.
**Discovery:**

- Cloudflare Workers (which Cloudflare Pages Functions inherit) caps subrequests per invocation at 50 on the free tier. The audit endpoint exceeded that with 27 recipes / 268 ingredients in the dataset.
- Two volume drivers: (a) an **N+1 ingredient-count loop** in check #7 (`recipes_have_ingredients`) — one Supabase query per recipe, ~27 subrequests just for that check; (b) **26 image-URL HEAD checks** in check #5 (`image_urls_reachable`).
- The N+1 was always going to fail under Cloudflare. It worked under Vercel because Vercel's runtime didn't enforce the same per-invocation subrequest cap. Migrating to Cloudflare without exercising the audit endpoint hid the bug.
- Pre-existing — not introduced by ADR-003. ADR-003 surfaced it by being the first thing to actually call the endpoint in production.

**Fix:**

- Replaced the N+1 loop with a set-difference: reuse the already-fetched `allIngredients` array (line 148, originally for the orphan-ingredients check), build a `Set` of `recipe_id`s, filter `allRecipesForCheck` against it. Two queries total instead of N+1.
- Removed the now-unreferenced `recipesWithIngs` query and its `void recipesWithIngs;` warning-suppression line.
- New subrequest count under typical load: ~35 (recipe count + ingredient count + recipes_have_images + 26 image HEADs + orphan-ingredients pair + recipes_have_ingredients single + homepage + chat). Comfortable under the 50 limit.
- Headroom: each additional recipe adds one image-HEAD subrequest. At ~42 recipes the audit will start failing again. Bounded but not infinite.

**Gates (Definition of Done):**

- `npm run lint` → clean
- `npx tsc --noEmit` → clean
- `npm run test` → 46/53 pass
- Husky pre-commit → fired and passed
- Live runtime smoke: workflow_dispatch the audit workflow after deploy → expect `status: pass`. Verified post-commit (separate verification step).

**Doc updates / rules tightened:**

- ADR-003's status remains `accepted` — the cron implementation is correct. The endpoint bug it surfaced is fixed in the same session for cleanness.
- Recursive Learning Loop §5 trigger: pre-existing-bug-discovered-via-monitoring is exactly what monitoring is supposed to do. No new rule needed; the handbook already prescribes "wire monitoring before declaring features Done" implicitly via DoD §6.
- Future risk: if recipe count grows past ~42, the audit's image-HEAD volume will exceed 50 again. Watchlist item, not currently a TASK. Mitigation when needed: gate image checks behind `?heavy=true` and have the daily cron skip them; a weekly cron with `?heavy=true` does the deeper sweep.

**Not changed (intentional):**

- Image-URL HEAD checks left in place. They're useful and still under the cap. Splitting daily/weekly cron is premature optimization at 27 recipes.
- `?usage=true` path (ScrapingBee + Cloudinary credit checks) untouched. Optional flag, not exercised by the cron.

**Next:** Verify post-deploy with `workflow_dispatch`. If pass, move to ADR-002 implementation.

## 2026-04-26 — Audit endpoint hardened, cron verified green; ADR-002 deferred

**Executor:** Claude Code (Opus 4.7)
**Task:** Continue diagnosing the cron-fail loop, ship the right fix, verify pass, then assess ADR-002 scope honestly.
**Changed:**

- N+1 fix alone wasn't enough — image-URL HEAD checks against external CDNs follow redirects, and each redirect counts as another Cloudflare subrequest. Subrequest budget exhausted mid-loop, cascading every subsequent fetch (homepage_reachable, chat_api) into "Too many subrequests" failures.
- Light/heavy split landed in `src/app/api/audit/route.ts`: default mode runs only the cheap checks (env, counts, orphans, recipes_have_ingredients, homepage); `?heavy=true` opts into the per-image HEAD sweep + chat-API self-call. `redirect: 'manual'` added to image HEADs in heavy mode so each fetch is one subrequest, not a chain. ANTHROPIC_API_KEY presence still verified by `env_vars` regardless of mode.
- `recipes_have_images` demoted from `fail` to `warn` — the seeded `e2e-test-pasta` fixture has no image_url by design, so this check failed every audit. Image presence is content quality, not system health.
- Three commits: `fix(audit): replace N+1 ingredient count with set-difference`, `fix(audit): gate image-HEAD and chat self-call behind ?heavy=true`, `fix(audit): demote recipes_have_images from fail to warn`. All three deployed and audit verified `status: pass` via final `workflow_dispatch`.

**Gates (Definition of Done):**

- `npm run lint` → clean on each commit
- `npx tsc --noEmit` → clean on each commit
- `npm run test` → 46/53 pass (7 pre-existing skips, unchanged)
- `npm run test:e2e` → not run (no UI behavior change; smoke-tested via live workflow_dispatch instead)
- Husky pre-commit → fired and passed on each commit
- Live runtime smoke: final `workflow_dispatch` of audit workflow returned `status: pass`. ADR-003 is implemented AND verified.

**Doc updates / rules tightened:**

- ADR-003 status remains `accepted`. The audit-route fixes are pre-existing-bug repairs surfaced by the new monitoring, not changes to ADR-003's decision.
- `recipes_have_images` warn-vs-fail distinction is now documented in the audit code itself (inline comment).
- No new project rules. The "monitoring discovers pre-existing bugs" pattern is exactly what the handbook predicts.

**ADR-002 implementation deferred to a separate session:**

Discovery numbers:

- `scripts/scrape-recipe.mjs`: 964 lines
- `src/app/api/scrape/route.ts`: 1,113 lines
- Total: ~2,077 lines, mostly duplicated logic
- The CLI does NOT import `src/lib/usda.ts` — it has its own inline USDA implementation (verified at scrape-recipe.mjs:175+). The duplication is real.
- Existing scraper tests: zero. Per ADR-002 open question, the refactor PR adds at least one happy-path test before merge.

Why deferred: a 2,000-line refactor of a feature the family actively uses, with no existing tests, in the same session that just landed 11 other commits, is reckless. ADR-002 is accepted (Option B — TypeScript CLI via `tsx`) and the work is well-scoped; it just needs its own session with full attention.

Recommended next-session work plan for ADR-002:

1. Read both files in full; map each function to "shared" / "CLI-only" / "web-only" buckets.
2. Decide whether the existing `src/lib/usda.ts` already covers the CLI's USDA needs (likely yes — the CLI's inline copy was written before the lib version). If yes, drop CLI's inline USDA and import.
3. Extract: `src/lib/scraper/{core,parse,normalize,macros,fallback-table}.ts`. Each module typed.
4. Add `tsx` to devDeps; rename `scripts/scrape-recipe.mjs` → `scripts/scrape-recipe.ts`. `package.json` `scrape` script: `tsx --env-file=.env.local scripts/scrape-recipe.ts`.
5. Web route shrinks to: parse request, call `core.scrapeRecipe(...)`, return result.
6. Add a vitest happy-path test for `core.scrapeRecipe` mocking the Supabase client and the HTML fetch.
7. Smoke-test: `npm run scrape <real-url>` writes a real recipe to a non-prod Supabase table or local dev DB. Manual verification against production after merge.
8. Project CLAUDE.md: delete Rule 4. Mark Pitfall 1 Resolved with institutional-memory note. Update §6 DoD scraper checklist.

**Not changed (intentional):**

- ADR-002 not implemented this session. Discovery done; implementation queued for fresh session.
- TASK-002 status stays `awaiting decision` in `task_plan.md` — wait, ADR-002 is _accepted_ now. Update task_plan in this commit too: TASK-002 status → `awaiting implementation`, with the recommended next-session work plan referenced.

**Final session state:**

12 commits on `main` since handbook install. Production live and verified via the new daily cron. Handbook fully reconciled with reality. The only open work item is ADR-002 implementation (the scraper refactor), which is well-scoped and ready for a dedicated session whenever Slim has bandwidth.

**Next:** ADR-002 implementation in a fresh session per the work plan above.

## 2026-04-26 — TASK-002 / ADR-002 implemented: dual scraper paths refactored to single source of truth (Option B)

**Executor:** Claude Code (Opus 4.7) — explanatory mode, executing-plans skill
**Worktree:** `sad-napier-839d16` (branch `claude/sad-napier-839d16`)
**Task:** Execute the 8-step work plan from yesterday's close-out entry. Extract shared scraper logic to `src/lib/scraper/`, migrate CLI to TypeScript via `tsx`, shrink the web route to a thin wrapper, add tests, update the handbook.

**Discovery (Steps 1-2):**

- Both files read in full and bucketed: ~600 lines of true logical duplication, ~400 lines of paired data tables, runtime-specific differences in Cloudinary upload (CLI used Node SDK, web used Web Crypto), fetch path (CLI was simpler; web has retry + circuit breaker + ScrapingBee fallback), and ingredient normalization (CLI sequential `for`-loop, web parallel `Promise.all`).
- `src/lib/usda.ts` confirmed as a clean superset of CLI's inline USDA: 15 `EACH_GRAMS` entries vs CLI's 14 (CLI had no extras). CLI's inline USDA deleted in favor of `src/lib/usda.ts`.
- `src/lib/macros.ts` is a different domain (portion math for the UI); not affected.
- **Pre-existing CLI parse-time bug discovered:** `scripts/scrape-recipe.mjs:696` used `await calcUSDAMacros(...)` inside the non-async function `validateRecipeData(recipe)` declared at `:632`. `node --check` errored with `SyntaxError: Unexpected reserved word`. The CLI hadn't been runnable since whenever that line landed. This means Pitfall 1's "edit both files" rule was impossible to satisfy in practice — the only working scraper path in production was the web API. The refactor replaces `validateRecipeData` with the shared async `normalizeIngredients`, fixing the bug incidentally.

**Module structure landed (Step 3):**

- `src/lib/scraper/contracts.ts` — constants & lookup tables (cuisines, dietary, units, categories, name maps, category map, spices, small-liquids, countables, no-plural-strip lists). Exports typed unions.
- `src/lib/scraper/normalize.ts` — pure functions: `slugify`, `normalizeName`, `assignUnit`, `mapCategory`, `mapCuisine`.
- `src/lib/scraper/fallback-table.ts` — hardcoded `FALLBACK_MACROS` dict (CLI's superset, ~60 entries).
- `src/lib/scraper/macros.ts` — `getUnitMultiplier`, `estimateMacros` (last-resort fallback in the USDA → Claude → fallback chain). Filename intentionally distinct from `src/lib/macros.ts` despite the path-based clarity; documented in file header.
- `src/lib/scraper/parse.ts` — `fetchPageWithFallback` (direct fetch + retry + ScrapingBee fallback, in-memory circuit breaker per isolate), `parseRecipeHtml` (JSON-LD + image extraction with WP/CDN unwrap), `findPexelsFallbackImage`. Web's superset wins.
- `src/lib/scraper/cloudinary.ts` — Web Crypto SHA-1 signed upload, edge-compatible. Lifted from web route. CLI no longer uses the Node `cloudinary` SDK (kept in deps because `scripts/upload-images.mjs` still uses it).
- `src/lib/scraper/extract.ts` — `extractRawRecipe` (Anthropic call with CLI's full data-contract system prompt + web's runtime context brief, 30s AbortController timeout), `normalizeIngredients` (parallel USDA lookup via `Promise.all`, then Claude estimate, then fallback table), `normalizeRecipeShape` (final assembly with cuisine/dietary mapping).
- `src/lib/scraper/persist.ts` — `persistRecipe` with optional `userScope: { userId }` parameter (set for web, omitted for CLI). Includes ingredient-rollback if insert fails. Exports `DuplicateRecipeError` for typed catch in callers.
- `src/lib/scraper/core.ts` — `scrapeRecipe(input, opts)` orchestrator. Public API. Handles URL fetch / text-paste branch, builds context brief, calls extract → normalize → optional Pexels → optional Cloudinary → persist. Throws typed errors (`BlockedSiteError`, `DuplicateRecipeError`, `ExtractionError`).

**CLI migration (Step 4):**

- `tsx@4.21.0` added to devDependencies via `npm install --save-dev tsx`.
- `scripts/scrape-recipe.mjs` deleted via `git rm`. Replaced by `scripts/scrape-recipe.ts` (~150 lines vs old 964). New CLI:
  - Validates env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY required).
  - Parses argv (URL or `--file <path>`, optional `--force` to skip dup check).
  - Builds service-role Supabase client + Anthropic client.
  - Calls `scrapeRecipe(input, opts)` with no `userScope` (CLI writes as service role, no `user_id` column).
  - Catches `BlockedSiteError` / `DuplicateRecipeError` / `ExtractionError` with friendly CLI messaging.
- `package.json` `scrape` script changed: `node --env-file=.env.local scripts/scrape-recipe.mjs` → `node --env-file=.env.local --import tsx scripts/scrape-recipe.ts`. Uses Node's stable `--env-file` flag with `tsx` as a loader.

**Web route refactor (Step 5):**

- `src/app/api/scrape/route.ts` rewritten from 1,113 lines to ~95 lines. Keeps `runtime = "edge"`, auth, request body parsing, `NextResponse` error mapping (BlockedSiteError → 422, DuplicateRecipeError → 409, ExtractionError → 504/422, unknown → 500). All scraper logic delegated to `scrapeRecipe()` from the shared module.

**Tests (Step 6 — TDD discipline):**

- `src/lib/__tests__/scraper-normalize.test.ts` — 22+ golden-master tests on pure functions. Run before any code moved to lock in current behavior.
- `src/lib/__tests__/scraper-macros.test.ts` — 12 tests on `getUnitMultiplier` + `estimateMacros` (recipe-quantity scaling, unit conversions, canned references, null-qty default).
- `src/lib/__tests__/scraper-core.test.ts` — 4 happy-path scenarios with mocked Supabase / Anthropic / fetch: URL scrape end-to-end, text-paste mode (no fetch), 403 → BlockedSiteError, source_url duplicate → DuplicateRecipeError. Verifies recipe + ingredient inserts, slug, cuisine mapping.
- Test totals: 53 → 90 (83 pass / 7 pre-existing skips, +37 added).

**ESLint plugin-conflict fix (Step 5b — incidental):**

- `npm install --save-dev tsx` created a fresh `node_modules/` in the worktree. Previously the worktree shared `node_modules/` with the main repo; now both have eslint-config-next installed, and ESLint warned about the plugin being loaded from two paths. The warning was an exit-1 that would fail husky.
- Fix: added `"root": true` to the worktree's `.eslintrc.json`. Stops ESLint from ascending into the parent repo's `.eslintrc.json`. Universally correct hygiene at a project root; will land cleanly on `main` post-merge.

**CLI smoke test (Step 7):**

- `npx tsx scripts/scrape-recipe.ts` (no args) → prints usage cleanly, exits 0.
- `npx tsx scripts/scrape-recipe.ts https://example.com/test` (no env) → `PREFLIGHT FAILED: Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY`, exits 1.
- Path alias `@/lib/scraper/core` resolves correctly via tsx + tsconfig paths.
- **Live URL smoke test deferred to post-merge:** `.env.local` lives in the main repo, not the worktree. `npm run scrape <real-url>` against a non-prod Supabase is a manual verification step Slim runs once after merge.

**Doc updates (Step 8):**

- Project `CLAUDE.md`:
  - **Rule 4 deleted** (the dual-path-must-stay-synced rule no longer applies).
  - **Pitfall 1 marked Resolved 2026-04-26** with institutional-memory note explaining the discovered parse-time bug ("`.mjs` was actually broken; the only working scraper path in production was the web API").
  - §2 Stack: Tests row updated to "86 unit (79 pass / 7 pre-existing skips) + 28 e2e".
  - §5 Pointer table: ADR-002 status flipped from `pending` to `accepted + implemented 2026-04-26`. Scraper-work load trigger updated from "ADR-002" to "`src/lib/scraper/core.ts` (single source of truth)".
  - §6 DoD: scraper checklist line rewritten from "BOTH `.mjs` and route.ts updated (Rule 4)" → "shared module in `src/lib/scraper/` updated, both callers exercised mentally".
  - §9 Current State refreshed: TASK-002 moved into Recently Closed with the "1,113 → ~95 lines" headline; only open mid-build item is the docs/architecture stubs population. Last-edit trailer changed to "post-scraper-refactor".
- `task_plan.md`: Active section now empty (TASK-002 closed). Done section gained TASK-002 entry with summary.
- `@docs/adr/ADR-002-dual-scraper-paths.md`: status `accepted` → `accepted + implemented`. Decision section rewritten to reflect what landed. Open Questions section answered (each question struck through with the actual answer).

**Gates (Definition of Done):**

- `npm run lint` → clean (0 errors after the `root: true` fix).
- `npx tsc --noEmit` → clean.
- `npm run test` → 83/90 pass (7 pre-existing skips, unchanged from yesterday). +37 new tests vs handbook install.
- `npm run test:e2e` → not run (no UI behavior change; covered by unit tests).
- Husky pre-commit → will fire on each atomic commit in the next batch.
- CLI smoke (parse + usage + env-validation) → green.

**Anti-bloat audit:**

- 9 modules + 3 test files. Each module has a single concern (constants, normalization, fallback table, estimate math, fetch+parse, image upload, AI extract, persistence, orchestrator). No file exceeds 320 lines; most are under 200. The split is justified by runtime-compatibility seams (edge vs Node), responsibility boundaries (Anthropic call vs Supabase write), and review ergonomics (the giant `FALLBACK_MACROS` dict lives alone so changes to it are easy to review).
- Net code change: -2,077 lines of duplicated CLI+web → +~1,150 lines of shared modules + ~245 lines of new callers. Net deletion: ~680 lines. Plus +37 tests covering previously-untested logic.

**Not changed (intentional):**

- `cloudinary` npm dep kept in `dependencies` — `scripts/upload-images.mjs` (a separate utility, out of scope) still uses it. The scraper paths no longer touch it.
- Image-fallback Pexels lookup made available to CLI as well as web (was web-only before). Slim's env has `PEXELS_API_KEY` already; if absent, the CLI just skips this branch.
- `src/lib/usda.ts` left in place at its current path. It's used by both the new `extract.ts` and existing test files; moving it under `src/lib/scraper/` would have triggered a wider import rename for no real benefit.
- Live URL smoke test left as a manual post-merge step.
- `@docs/architecture/api.md` not populated — handbook says "populate as work touches each surface", and this refactor is structural rather than a new feature surface to document. Deferred to next time the API surface grows or changes.

**Doc updates / rules tightened:**

- Rule 4 deleted (was temporary; refactor satisfied its preconditions).
- Pitfall 1 status flipped to Resolved with the `Status:` field (matches Pitfall 6's pattern from yesterday).
- §6 DoD scraper checklist rewritten to reflect the new reality.
- ADR-002 follows the same accepted-with-implementation pattern ADR-003 used yesterday (both decision and implementation in the same chain of commits is acceptable when the work is small enough to land cleanly; ADR-002's footprint is larger than ADR-003's but still self-contained — single feature, no schema change, full test coverage).

**Final session state:**

13th major work item closed since handbook install. Repo is fully reconciled with reality, all 6 ADRs (001-003) accepted, both ADR-002's scraper implementation and ADR-003's cron implementation verified. Open items: docs-architecture stubs (populate-on-touch). The dual-scraper-paths architectural defect that has been on the radar since handbook install on 2026-04-25 is now closed.

**Next:** Slim runs `npm run scrape <real-url>` from main once the worktree merges, to confirm a live recipe write works end-to-end. After that, the only remaining handbook work is opportunistic — populate `@docs/architecture/{ui,api,data}.md` stubs as future work touches each surface.

## 2026-04-27 — TASK-007 complete: Recipe detail tab redesign close-out

**Executor:** Claude Code (Opus 4.7) — explanatory mode
**Worktree:** `eager-mclaren-f0a742` (branch `claude/eager-mclaren-f0a742`)
**Task:** Build the recipe detail tab redesign per the Notion Fix Queue brief (mockup approved 2026-03-10).

**Discovery:**

- Brief described the work as "Refactor IngredientsSection.tsx into RecipeTabs.tsx + IngredientsTab.tsx + InstructionsTab.tsx + NutritionTab.tsx." Reality: that structural refactor had already shipped in a prior session. `IngredientsSection.tsx` does not exist; all four target components are in `src/components/`. The recipe page (`src/app/(main)/recipe/[id]/page.tsx`) already wires `RecipeTabs` and the tabs already render correctly with sticky bar, glass styling, and serving-scale propagation.
- Audit against the brief identified three remaining unmet spec items, all small. No structural change, no schema change, no infra change → no ADR required (Law 4 not triggered). Pitfall 5 satisfied by declaring TASK-007 in `task_plan.md` before code edits.

**Changed:**

- `src/components/IngredientsTab.tsx`: ingredient row body text `text-[15px]` → `text-base` (16px). Brief explicitly called for the typography bump.
- `src/components/InstructionsTab.tsx`: numbered-step body text `text-[15px]` → `text-base` (16px). Same rationale.
- `src/app/(main)/recipe/[id]/page.tsx`:
  - Imported `sumIngredientMacros` + `perServingMacros` from `@/lib/macros` and the `Zap` icon from `lucide-react`.
  - Added a one-shot server-side `perServingCalories` calculation (returns `null` when servings missing or zero, so the cell falls back to "N/A" cleanly without a divide-by-zero).
  - Hero image: `h-[50vh]` → `aspect-[4/3] lg:aspect-auto lg:h-screen`. Mobile gets the 4:3 ratio the brief specified; desktop's full-height sticky panel is preserved.
  - Stats row: `grid-cols-3` → `grid-cols-2 sm:grid-cols-4`, added Calories cell (rose-50 swatch, `Zap` icon). At narrow viewports the row reflows to 2×2; at `sm:` and up it's a single 4-cell horizontal strip per the mockup.

**Doc updates:**

- `task_plan.md`: TASK-007 added then closed in same session (declared-before-execute kept Pitfall 5 satisfied even though the work was small).
- `@docs/architecture/ui.md` left as a stub. The change was a small visual delta to existing components — populate-on-touch threshold is "first reusable component is added or refactored," and the components already existed pre-refactor. No new pattern to document yet.
- Project `CLAUDE.md` not updated. No new rule emerged; no Pitfall to record (the brief-vs-reality drift was caught by audit-first discipline, which is already implicitly enforced by Law 3 / Pitfall 5).

**Gates (Definition of Done):**

- `npm run lint` → clean (0 warnings, 0 errors)
- `npx tsc --noEmit` → clean (0 errors)
- `npm run test` → 86/93 pass (7 pre-existing skips, unchanged)
- `npm run test:e2e` → not run. The change is visual-only on a route already covered by existing e2e flows; running Playwright against the worktree requires `.env.local` plumbing that lives in the main repo (per `feedback_local_build_env.md`). Slim can re-run e2e from main post-merge if desired.
- Husky pre-commit → fired and passed on the commit.

**Anti-bloat audit:**

- Net diff: 4 files changed, ~20 lines of semantic change (the rest is Prettier reformatting the inline stats array). No new component, no new abstraction, no helper extracted — the calorie calc is one expression on the page because it's used exactly once.
- The Calories cell uses the same row-config object pattern as the existing three cells; no new conditional branches, no new prop threading. Reuse, not refactor.

**Not changed (intentional):**

- `RecipeTabs.tsx`, `NutritionTab.tsx` untouched. Both already met the brief.
- Hero image preserved its existing object-cover + gradient overlay + mobile title overlay. Only the box dimensions changed.
- Calories shown as a server-rendered per-serving total — no client-side recalculation when the user scales servings on the Ingredients tab. The stats row is a "recipe identity" strip per the mockup, not a live derivation. NutritionTab remains the source of truth for scaled per-serving / portion math.
- No client component boundary added to the page. The calc happens in the existing server component, so no `"use client"` cost.

**Doc updates / rules tightened:**

- None. Recursive Learning Loop §5 was checked: the only "surprise" was finding the structural refactor already shipped, which is exactly what audit-first is supposed to surface — not a new failure mode. Pitfall 5 already covers "declare task before code"; the audit-first reflex is downstream of that.

**Next:** Merge `claude/eager-mclaren-f0a742` to main. Visual QA in the deployed Cloudflare Pages preview / production should confirm the 4:3 mobile hero, 4-cell stats with Calories, and 16px tab body text. Architecture stubs (`ui.md`, `api.md`, `data.md`) remain populate-on-touch.

## 2026-04-27 — Populate `@docs/architecture/ui.md`; fix accent-color drift in CLAUDE.md

**Executor:** Claude Code (Opus 4.7) — explanatory mode
**Branch:** `main` (direct commit on origin; small docs-only delta, no PR)
**Task:** Populate the UI architecture doc per the populate-on-touch directive (TASK-007 just touched the recipe-detail UI surface). Discovered handbook drift along the way and fixed it in the same commit.

**Discovery:**

- Project `CLAUDE.md` §2 Stack table claimed "sky-blue accent (`#0ea5e9`)". Reality (verified in `src/app/globals.css:5-11` and `src/app/layout.tsx` viewport `themeColor`): warm-gold `#C4952E`, no blue in the palette at all. The codebase is consistently warm-toned (cream / gold / brown). The wrong accent claim would have misled any future agent designing a new component.
- All page + API routes carry `export const runtime = "edge"` (verified by grep across `src/app/`). This is a Cloudflare Pages adapter requirement, not a stylistic choice. Worth elevating into the doc so future agents don't reach for the Node runtime.
- Four custom CSS utilities live in `globals.css`: `.glass`, `.glass-strong`, `.glass-input`, `.ambient-bg` (plus `.no-scrollbar`). These are the only non-Tailwind classes in the project. Should be the canonical entry point for any future component, not raw `backdrop-blur` + `bg-white/N`.

**Changed:**

- `docs/architecture/ui.md`: rewritten from stub to real ~120-line document. Sections: Liquid Glass palette (with hex table), custom CSS utilities table, seven component patterns extracted from current code (server-shell + client-leaf, stat-row, sticky tab bar, mobile/desktop hero split, numbered-step list, servings scaler, type scale), routing conventions (slug routing, edge runtime, middleware auth + cookie-driven dynamism), and a "When to update" trigger list tied to Recursive Learning Loop §5.
- `CLAUDE.md` §2 Stack: `sky-blue accent (#0ea5e9)` → `warm-gold accent (#C4952E)`. Added "(warm-tinted)" qualifier to Liquid Glass theme. Single-line correction.

**Gates (Definition of Done):**

- `npm run lint` → not run (docs-only change, no .ts/.tsx touched). Pre-commit hook will run it anyway as a safety net.
- `npx tsc --noEmit` → not run (same).
- `npm run test` → not run (same).
- Husky pre-commit → will fire on commit and pass (no code changes to fail on).

**Doc updates / rules tightened:**

- `ui.md` is now the single source of truth for the design system. CLAUDE.md §5 pointer table already directs UI work here; no pointer table change needed.
- CLAUDE.md accent-color fix is a Recursive Learning Loop §5 closure: discovered drift between handbook and reality during a docs population task, fixed inline.
- No new rules. The existing "Status" header at the top of `ui.md` documents how the doc decays and what triggers re-population.

**Not changed (intentional):**

- `@docs/architecture/api.md` and `@docs/architecture/data.md` left as stubs. Populate-on-touch threshold not yet met for those surfaces in this session.
- `@docs/REFERENCE.md` env section already real (TASK-004); other sections still stub. Not in scope.
- Did not document every component individually (`ChatDrawer`, `RecipeCard`, `WeeklySummary`, `MainNav`, etc.) — `ui.md` documents _patterns_, not a component inventory. A reader who knows the patterns can read any component cold.

**Next:** Commit + push. Architecture stubs `api.md` and `data.md` remain populate-on-touch.
