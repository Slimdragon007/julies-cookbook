# Trust Contract: julies-cookbook

> **Purpose:** A pre-flight checklist the agent runs before any change to this repo. Consolidates the binding rules from `flowstateai-claude-md-base` and the local `CLAUDE.md` into a single gate.
> **What this file is not:** It does not introduce new rules. New rules land in their source-of-truth file (the base handbook or `CLAUDE.md`); this file links to them.
> **Last updated:** 2026-04-30. **Owner:** Michael Haslim.

---

## When to read this

1. At session start, after the base handbook and local `CLAUDE.md` are loaded.
2. Before any tool call that writes, edits, moves, or deletes a file in this repo.
3. Whenever the user says "review the trust contract" or "what are the rules here."

---

## Compliance gate (run top-to-bottom; one failed check halts the change)

### 1. Linguistic check (base handbook §2)

- [ ] No em dashes anywhere in output. Use commas, colons, periods, parentheses.
- [ ] No sycophantic openers ("Great", "Certainly", "Of course", "Good call").
- [ ] No filler words ("genuinely", "honestly", "straightforward").
- [ ] Peer-to-peer tone, no assistant fluff.
- [ ] Outbound sign-off is "Michael Haslim", never "Slim". (Chat replies are not outbound comms.)
- [ ] Last name is Haslim, not Haslam.
- [ ] Arrows (`->` or `→`) for sequential logic, not paragraphs.
- [ ] Why and Goal stated before any structured plan.

### 2. Schema-First Ordering (base handbook Law 1)

Build sequence is **DB → API → UI → E2E**. Reverse order = rework.

- [ ] If schema or RLS is touched, a migration file lands first. ADR if structural.
- [ ] No API code written before its schema is committed.
- [ ] No UI built against an unfinalized API contract.
- [ ] New features ship with E2E coverage.

**Exception:** Standalone design prototypes that consume mock data only. These must live OUTSIDE this repo (e.g. `~/Projects/julies-cookbook-design/`).

### 3. Parallelization Lock (base handbook Law 2)

This change is locked to a single agent or worktree if it touches:

- [ ] Auth client modules (Supabase server / admin / browser, env loaders)
- [ ] Auth middleware or route protection
- [ ] DB schema migrations or RLS policies
- [ ] Env var contracts (`NEXT_PUBLIC_*`, fallback chains, naming schemes)
- [ ] Infra config (`vercel.json`, `wrangler.toml`, `.github/workflows/*`, `next.config.mjs`)
- [ ] The base handbook or this project's local `CLAUDE.md`

If yes to any: serial work only, no worktrees.

### 4. Shared Memory Contract (base handbook Law 3)

- [ ] `@task_plan.md` was read before starting.
- [ ] This task is declared in `@task_plan.md`. If not, declare it (architect) or stop and ask.
- [ ] Mid-task, only the status field of `@task_plan.md` is updated by the executor.
- [ ] Post-task, `@progress.md` is appended (date header, executor, changed, verified).
- [ ] If reality changed (schema, env var, route, doc state), the affected `@docs/*.md` is updated.

### 5. Infra ADR Gate (base handbook Law 4)

ADR required before code lands if changing:

- [ ] Deploy target
- [ ] Vendor (auth, DB, hosting, image, payment)
- [ ] Env var naming scheme (a second scheme is the trigger)
- [ ] CI/CD structure
- [ ] Top-level dependency that changes the build pipeline

ADR template at `@docs/adr/_TEMPLATE.md`. Numbered sequentially.

### 6. Project-Specific Rules (`CLAUDE.md` §3)

- [ ] **Rule 1:** `??` not `||` for numeric fields (calories, macros, portions). Linter does not catch this.
- [ ] **Rule 2:** Slug-based recipe routing. `getRecipeById()` slug-first, UUID fallback. Don't break the fallback.
- [ ] **Rule 3:** USDA → Claude AI estimate → hardcoded → 0. Never reverse the order.
- [ ] **Rule 5:** Single Supabase env-var naming scheme (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). A second scheme requires an ADR.

### 7. Pitfall Awareness (`CLAUDE.md` §4)

- [ ] **Pitfall 2:** `npm run lint` before push. Strict mode breaks the Cloudflare Pages build.
- [ ] **Pitfall 4:** No `for...of` on `Map.entries()` (downlevelIteration breaks tsc). Use `map.forEach()`.
- [ ] **Pitfall 5:** Tasks declared in `@task_plan.md` before execution. Fix-within-24h-of-feat triggers a doc update.
- [ ] **Pitfall 6:** No "quick experiments" with infra on `main`. ADR first, worktree if exploring.

### 8. Agent Behavior (base handbook §6)

- [ ] Cowork architects, Claude Code executes. Don't blur the line.
- [ ] One clarifying question beats a wasted build. Ask if scope is unclear.
- [ ] Push back at level 3 of 5: direct, no fluff, no harshness. Flag bad patterns.
- [ ] Confirm before logging to Notion or sending Gmail drafts.
- [ ] Token discipline: don't reload context already loaded, don't reread unchanged files.

### 9. Definition of Done (`CLAUDE.md` §6)

- [ ] 0 lint errors (`npm run lint`)
- [ ] 0 TypeScript errors (`tsc --noEmit`)
- [ ] Unit tests pass (`npm run test`, currently 93 tests)
- [ ] E2E tests pass (`npm run test:e2e`, requires dev server running)
- [ ] Husky pre-commit passes
- [ ] `@progress.md` appended
- [ ] Affected `@docs/*.md` updated if reality changed
- [ ] If scraper logic changed, both callers (`scripts/scrape-recipe.ts` + `src/app/api/scrape/route.ts`) exercised mentally
- [ ] If infra touched, ADR written and committed before code

---

## Failure mode (what to do when a check fails)

1. Stop the in-flight tool call. Do not push through.
2. Surface the failing check to the user. Name the law or rule.
3. Propose a remediation path (move work to a worktree, write the ADR first, declare the task in `@task_plan.md`, etc.).
4. Wait for sign-off. Power-user mode is not a license to skip the gate.

---

## Update protocol

- This file derives from upstream rules. To change a rule, edit the source-of-truth (base handbook or `CLAUDE.md`) first; this file follows.
- Edits to this file should follow the same single-agent discipline as `CLAUDE.md` edits (no parallel worktrees, no "while I'm here" cleanup).
- Pure-narrative edits (no rule added or tightened) get rejected per the anti-bloat rule (base handbook §5).

---

## Read order on session start

`flowstateai-claude-md-base` (skill) → local `CLAUDE.md` → `docs/trust-contract.md` (this file) → `@task_plan.md` → relevant `@docs/*.md`.

_End of trust contract._
