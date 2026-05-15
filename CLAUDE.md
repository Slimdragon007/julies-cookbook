# 🧬 ENGINEERING LAW: julies-cookbook

> **Read `flowstateai-claude-md-base` skill first.** This file is the project-specific layer.
> **Owner:** Michael Haslim | **Client:** Internal (Julie + family) | **Last updated:** 2026-05-15

---

## 🎯 1. PROJECT IDENTITY

**One-sentence purpose:** Multi-user recipe cookbook with nutritional tracking, food logging, and AI chat assistant. Invite-only family app.

**Audience:** Slim, Julie, family members on invite

**Stage:** Production (Mar 2026 launch), active iteration

**Repo:** `github.com/Slimdragon007/julies-cookbook`

**Production URL:** https://julies-cookbook.pages.dev (Cloudflare Pages default; custom domain TBD)

**Deploy target:** **Cloudflare Pages** (ADR-001 accepted 2026-04-25). GitHub Actions builds with `@cloudflare/next-on-pages` and deploys on push to `main`. `vercel.json` removed. See `@docs/adr/ADR-001-deploy-target.md` and `@docs/architecture/infra.md`.

---

## 🏗️ 2. STACK

| Layer     | Tool                | Version | Notes                                                                                                     |
| --------- | ------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| Framework | Next.js             | 14.2.35 | App Router, dynamic rendering via cookie auth                                                             |
| Database  | Supabase            | —       | Project: `cqfszhxuvvsgusvjdyqx`, us-east-1, replaced Airtable Mar 2026                                    |
| Auth      | Supabase Auth       | —       | Email/password, middleware-enforced, invite-only signup                                                   |
| Styling   | Tailwind            | 3.4     | Hearth theme (Magnolia palette + Liquid Glass surfaces), Playfair + Lora + Inter, gold accent (`#C9A96E`) |
| Hosting   | Cloudflare Pages    | —       | `@cloudflare/next-on-pages`, deployed via GH Action on push to `main` (ADR-001)                           |
| AI        | Anthropic SDK       | 0.78    | `claude-sonnet-4-20250514` for chat                                                                       |
| Storage   | Cloudinary          | —       | Image hosting                                                                                             |
| Tests     | Vitest + Playwright | —       | 14 unit test files (lib + api/__tests__/) + 5 e2e specs (auth, pages, demo, two unit-pickers)             |
| Hooks     | Husky               | —       | Pre-commit lint + tsc                                                                                     |

Full env var contract: see `@docs/REFERENCE.md`.

---

## 📜 3. PROJECT-SPECIFIC RULES

### Rule 1 — Nullish coalescing for numeric fields

Use `??`, not `||`. `0 || null` returns `null` (wrong). `0 ?? null` returns `0` (correct).
Macros, calories, portion math all rely on this. Linter does not catch it.

### Rule 2 — Slug-based recipe routing

URLs use slugs (`/recipe/best-goulash`), not UUIDs. `getRecipeById()` looks up by slug first, falls back to UUID for back-compat. Don't break the fallback.

### Rule 3 — USDA-first nutrition pipeline

Ingredient macros come from USDA FoodData Central API. Fallback chain: USDA → Claude AI estimate → hardcoded lookup → 0. Never reverse the order.

### Rule 5 — Single Supabase env-var naming scheme

One naming scheme only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, lazy-evaluated via `getSupabaseServiceRoleKey()`)

Wired in `.github/workflows/deploy.yml` GH secrets. Resolved in `src/lib/supabase/env.ts`. **Do not introduce a second naming scheme.** The prior Marketplace fallback (`NEXT_PUBLIC_Juliescookbook_*`) was removed 2026-04-25 (TASK-004) as part of the Cloudflare migration. Any new fallback or alias requires an ADR per Law 4 — env-var contracts are parallelization-locked under Law 2.

---

## 🚧 4. KNOWN PITFALLS

### Pitfall 1 — Dual scraper paths drift _(resolved 2026-04-26)_

**Symptom:** Bug fixes applied to one scraper but not the other; CLI scrape and web scrape produce different ingredient data.
**Cause:** `.mjs` file could not import TypeScript shared modules.
**Status:** Resolved 2026-04-26 (TASK-002 / ADR-002 implementation, Option B). Both paths now call `scrapeRecipe()` from `src/lib/scraper/core.ts`. The CLI is now a TypeScript file run via `tsx`. Discovery during the refactor surfaced that the `.mjs` was actually broken at parse time (an `await` in a non-async function); replacing the broken `validateRecipeData` with the shared async `normalizeIngredients` fixed it.
**Institutional memory:** Pitfall 1 stays in this list as a record of why we maintain a single source of truth for shared logic. The core lesson: when "edit both files" is the only thing keeping two paths in sync, drift is a matter of when, not if.

### Pitfall 2 — ESLint strict failures break the deploy build

**Symptom:** `npm run dev` works, deploy fails.
**Cause:** `next build` (invoked by `@cloudflare/next-on-pages`) runs `next lint` in strict mode. `@typescript-eslint/no-unused-vars` and `prefer-const` are blocking.
**Rule:** Run `npm run lint` before every push. Husky catches most of this; trust it.

### Pitfall 3 — Google Fonts unreachable in sandboxed environments

**Symptom:** `next build` fails locally with font fetch errors.
**Cause:** `fonts.googleapis.com` blocked in some sandboxed envs.
**Rule:** If local build fails on fonts, that's environment, not code. The CI build (Cloudflare Pages via GH Action) will succeed.

### Pitfall 4 — Map iterator downlevelIteration

**Symptom:** `for...of` on `Map.entries()` fails TypeScript compilation.
**Rule:** Use `map.forEach()` instead.

### Pitfall 5 — Same-day fix-after-feat clusters

**Symptom:** 10+ commits on a single day with multiple `fix:` entries patching `feat:` entries from hours earlier (Mar 16, Mar 28 in repo history).
**Cause:** No `task_plan.md` discipline, no PR review, work shipped directly to main.
**Rule:** Tasks declared in `@task_plan.md` before execution. Fix-within-24h-of-feat triggers a doc update per Recursive Learning Loop (base handbook §5).

### Pitfall 6 — Infra ping-pong

**Symptom:** Repo had `vercel.json` AND `wrangler.toml` AND a Cloudflare GitHub Action AND CLAUDE.md said Vercel. Apr 21 had 6 commits in 43 minutes migrating to Cloudflare with no ADR.
**Cause:** Infra change executed as exploration, not decision.
**Status:** Resolved 2026-04-25 by ADR-001 (Cloudflare Pages chosen, `vercel.json` removed). Pitfall 6 stays in this list as institutional memory; the rule below remains active for future infra changes.
**Rule:** Base handbook Law 4 applies. Any future deploy-target, vendor-swap, or build-pipeline change requires an ADR before code lands. No "quick experiments" on `main`.

---

## 📂 5. POINTER TABLE

```
@task_plan.md                                 → current task state (architect-owned)
@progress.md                                  → completed work log (append-only)
@docs/trust-contract.md                       → pre-flight compliance gate (read at session start + before any file write)
@docs/REFERENCE.md                            → schema, env vars, file index, current state
@docs/architecture/ui.md                      → Liquid Glass + Hearth design system, component patterns
@docs/architecture/api.md                     → API routes, scraper architecture, chat endpoint
@docs/architecture/data.md                    → Supabase schema, RLS, fallback chain
@docs/architecture/infra.md                   → Cloudflare Pages deploy state, GH Action CI/CD
@docs/design/julies-cookbook-design-bundle.md → Hearth design language source-of-truth
@docs/design/hearth-reskin-plan.md            → Phase-by-phase reskin execution plan
@docs/design/component-specs.md               → Hearth component specs (Button, Input, MacroGrid, EmptyState, ...)
@docs/adr/ADR-001-deploy-target.md            → accepted (Cloudflare Pages)
@docs/adr/ADR-002-dual-scraper-paths.md       → accepted + implemented 2026-04-26 (Option B, src/lib/scraper/*)
@docs/adr/ADR-003-cron-restoration.md         → accepted (GitHub Actions schedule for /api/audit)
@docs/adr/ADR-004-migration-tooling.md        → accepted (Supabase migration tooling decision)
@docs/adr/ADR-005-touch-target-standard.md    → accepted (44px min touch target, Button icon variant)
```

**Load triggers:**

- UI / reskin work → `@docs/architecture/ui.md` + `@docs/design/hearth-reskin-plan.md` + `@docs/design/component-specs.md`
- API or schema work → `@docs/architecture/api.md` + `@docs/architecture/data.md`
- Scraper work → `@docs/architecture/api.md` + `src/lib/scraper/core.ts` (single source of truth)
- Infra or deploy → `@docs/architecture/infra.md` + ADR-001
- Auth or middleware → `@docs/architecture/data.md` (RLS) + base handbook Law 2
- New shared component → `@docs/design/component-specs.md` + check 3rd-use threshold before extracting

---

## 🧪 6. DEFINITION OF DONE

- [ ] 0 lint errors (`npm run lint`)
- [ ] 0 TypeScript errors (`tsc --noEmit`)
- [ ] Unit tests pass (`npm run test`)
- [ ] E2E tests pass (`npm run test:e2e`, requires dev server)
- [ ] Husky pre-commit passes (`npx next lint --quiet && npx tsc --noEmit`)
- [ ] `@progress.md` appended with task summary
- [ ] Affected `@docs/*.md` updated if reality changed
- [ ] If scraper logic changed: shared module in `src/lib/scraper/` updated, both callers (`scripts/scrape-recipe.ts` + `src/app/api/scrape/route.ts`) exercised mentally
- [ ] If a UI primitive crossed 3 in-tree uses: extract per `@docs/design/component-specs.md` instead of copy-paste
- [ ] If infra touched: ADR written and committed before code

---

## 🛠️ 7. COMMANDS

```bash
npm run dev              # localhost:3000
npm run build            # Next.js production build
npm run build:cf         # Cloudflare next-on-pages build (canonical deploy build)
npm run preview          # Local preview of the Cloudflare build via wrangler
npm run lint             # ESLint (next lint)
npm run test             # Vitest, src/lib/__tests__/* and src/app/api/__tests__/*
npm run test:watch       # Vitest watch mode
npm run test:e2e         # Playwright, e2e/*.spec.ts, needs dev server running
npm run scrape <url>     # CLI recipe scraper (scripts/scrape-recipe.ts via tsx), writes to Supabase
```

---

## 📓 8. NOTION POINTERS (humans only)

Agents do not read Notion as source of truth.

- Project plan page: `31e16230-665c-8107-91e5-ee03d6cbd636`
- Progress log: `31e16230-665c-8117-bf62-d04b14ed8c1e`

---

## 🚦 9. CURRENT STATE

_(Last edit: 2026-05-15, mid-Hearth-reskin)_

**Working in production:** Multi-user with per-user recipes, ingredients, food logs. Invite-only signup gated by `INVITE_CODE`. Hearth design language rolling out (Magnolia palette, Playfair display + Lora body + Inter UI, gold accent `#C9A96E`) — the Liquid Glass system is being progressively replaced surface by surface. Portion calculator with USDA-first macro pipeline. Weekly summary page. Chatbot with per-user context (`/api/chat`). Single-source-of-truth scraper module at `src/lib/scraper/`; CLI (`scripts/scrape-recipe.ts` via `tsx`) and web route (`src/app/api/scrape/route.ts`) both wrap `scrapeRecipe()`. ScrapingBee tiered escalation for ~5x credit budget. Manual photo upload escape hatch on the recipe page. Self-serve password reset wired (`/auth/reset` + `/auth/update-password`). Daily `/api/audit` cron via `.github/workflows/audit.yml`.

**Test surface:** 14 unit test files under `src/lib/__tests__/` and `src/app/api/__tests__/` (scraper core/parse/extract/macros/normalize/persist/cloudinary, USDA, fractions, unit conversions, macros, plus API route tests for signup, recipe PATCH/DELETE, log-meal POST/GET). 5 Playwright specs in `e2e/` (auth, pages, demo, nutrition-unit-picker, food-log-unit-picker).

**Mid-build / unresolved:**

- **Hearth reskin Phase 3+** in flight. Phase 0/1/2 (foundation, auth, recipe detail) and Phase 3 Gallery + Food Log slices have landed. Outstanding within Phase 3: WeekStrip + LogMealSheet behavioral work (drag-gesture lib, snap points), Weekly Summary surface, EmptyState component extraction (now at 3 inline uses — next surface should pull it out per `@docs/design/component-specs.md`).
- `@docs/architecture/api.md` and `@docs/architecture/data.md` still partial stubs; populate as work touches each surface. `ui.md` was filled in 2026-04-27 alongside the reskin.
- `@docs/REFERENCE.md` schema + file index sections still stubs.
- CLI live smoke test (`npm run scrape <real-url>`) remains a manual post-merge step — automated coverage lives in `src/lib/__tests__/scraper-*.test.ts`.

**Recently closed (2026-04-25 → 2026-05):** ADR-001/TASK-001 (Cloudflare Pages canonical, `vercel.json` removed). TASK-004 (Marketplace env-var fallback removed). TASK-005, TASK-006 (Vercel strings + `VERCEL` env var cleaned up). TASK-003/ADR-003 (`/api/audit` cron restored via GH Actions). TASK-002/ADR-002 (scraper extracted to `src/lib/scraper/`, CLI migrated to TS, web route shrunk 1,113 → ~95 lines). TASK-007 (recipe detail tab redesign). TASK-008 (self-serve password reset). TASK-009 (service worker no longer hides newly-added recipes). TASK-010 (deprecated Claude model bumped, env example reset). TASK-010a (ScrapingBee tier escalation). TASK-010b (manual photo upload). TASK-011/TASK-012 (image persistence on scrape + responsive cleanup). TASK-013/ADR-005 (44px touch-target standard, Button icon variant). TASK-014 (Hearth Phase 1: login/signup/reset/update-password + Phase 1.4 `/demo`). TASK-015 (Hearth Phase 2: recipe detail). TASK-017 (Hearth Phase 3 Gallery + Food Log slices, MacroGrid extracted). TASK-024 (API test coverage for `/api/recipe` PATCH/DELETE + `/api/log-meal` POST/GET). ADR-004 (migration tooling). UI mockups bundled under `public/mockups/{editorial,liquid-glass}.html`.

**Blocked:** Any new infra change requires its own ADR per Law 4. UI reskin work continues per `@docs/design/hearth-reskin-plan.md`; pull EmptyState out before adding a 4th inline use. API and scraper work can proceed in worktrees freely.

---

_End of project handbook. Read `@task_plan.md` next._
