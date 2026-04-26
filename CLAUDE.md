# 🧬 ENGINEERING LAW: julies-cookbook

> **Read `flowstateai-claude-md-base` skill first.** This file is the project-specific layer.
> **Owner:** Michael Haslim | **Client:** Internal (Julie + family) | **Last updated:** 2026-04-25

---

## 🎯 1. PROJECT IDENTITY

**One-sentence purpose:** Multi-user recipe cookbook with nutritional tracking, food logging, and AI chat assistant. Invite-only family app.

**Audience:** Slim, Julie, family members on invite

**Stage:** Production (Mar 2026 launch), active iteration

**Repo:** `github.com/Slimdragon007/julies-cookbook`

**Production URL:** [verify and fill in]

**Deploy target:** **Cloudflare Pages** (ADR-001 accepted 2026-04-25). GitHub Actions builds with `@cloudflare/next-on-pages` and deploys on push to `main`. `vercel.json` removed. See `@docs/adr/ADR-001-deploy-target.md` and `@docs/architecture/infra.md`.

---

## 🏗️ 2. STACK

| Layer     | Tool                | Version | Notes                                                                           |
| --------- | ------------------- | ------- | ------------------------------------------------------------------------------- |
| Framework | Next.js             | 14.2.35 | App Router, dynamic rendering via cookie auth                                   |
| Database  | Supabase            | —       | Project: `cqfszhxuvvsgusvjdyqx`, us-east-1, replaced Airtable Mar 2026          |
| Auth      | Supabase Auth       | —       | Email/password, middleware-enforced, invite-only signup                         |
| Styling   | Tailwind            | 3.4     | Liquid Glass theme, Inter font, sky-blue accent (`#0ea5e9`)                     |
| Hosting   | Cloudflare Pages    | —       | `@cloudflare/next-on-pages`, deployed via GH Action on push to `main` (ADR-001) |
| AI        | Anthropic SDK       | 0.78    | `claude-sonnet-4-20250514` for chat                                             |
| Storage   | Cloudinary          | —       | Image hosting                                                                   |
| Tests     | Vitest + Playwright | —       | 53 unit + 28 e2e                                                                |
| Hooks     | Husky               | —       | Pre-commit lint + tsc                                                           |

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

### Rule 4 — Dual scraper paths must stay synced _(temporary, see Pitfall 1)_

`scripts/scrape-recipe.mjs` (CLI) and `src/app/api/scrape/route.ts` (web API) have independent USDA + macro estimation code. The `.mjs` cannot import TS modules. Until the shared-logic refactor lands, changes to scraping or nutrition logic **must apply to both paths.** This is a documented architectural defect, not a feature.

### Rule 5 — Single Supabase env-var naming scheme

One naming scheme only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, lazy-evaluated via `getSupabaseServiceRoleKey()`)

Wired in `.github/workflows/deploy.yml` GH secrets. Resolved in `src/lib/supabase/env.ts`. **Do not introduce a second naming scheme.** The prior Marketplace fallback (`NEXT_PUBLIC_Juliescookbook_*`) was removed 2026-04-25 (TASK-004) as part of the Cloudflare migration. Any new fallback or alias requires an ADR per Law 4 — env-var contracts are parallelization-locked under Law 2.

---

## 🚧 4. KNOWN PITFALLS

### Pitfall 1 — Dual scraper paths drift

**Symptom:** Bug fixes applied to one scraper but not the other; CLI scrape and web scrape produce different ingredient data.
**Cause:** `.mjs` file cannot import TypeScript shared modules.
**Rule:** Until shared logic is extracted to a third module (tracked task), every scraper change touches both files in the same commit. PR rejected if only one is touched.

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
@task_plan.md                  → current task state (architect-owned)
@progress.md                   → completed work log (append-only)
@docs/REFERENCE.md             → schema, env vars, file index, current state
@docs/architecture/ui.md       → Liquid Glass design system, component patterns
@docs/architecture/api.md      → API routes, scraper architecture, chat endpoint
@docs/architecture/data.md     → Supabase schema, RLS, fallback chain
@docs/architecture/infra.md    → Cloudflare Pages deploy state, GH Action CI/CD
@docs/adr/ADR-001-deploy-target.md     → accepted (Cloudflare Pages)
@docs/adr/ADR-002-dual-scraper-paths.md → pending, tracks Rule 4 / Pitfall 1 resolution
```

**Load triggers:**

- UI work → `@docs/architecture/ui.md`
- API or schema work → `@docs/architecture/api.md` + `@docs/architecture/data.md`
- Scraper work → `@docs/architecture/api.md` + ADR-002
- Infra or deploy → `@docs/architecture/infra.md` + ADR-001
- Auth or middleware → `@docs/architecture/data.md` (RLS) + base handbook Law 2

---

## 🧪 6. DEFINITION OF DONE

- [ ] 0 lint errors (`npm run lint`)
- [ ] 0 TypeScript errors (`tsc --noEmit`)
- [ ] Unit tests pass (`npm run test`, 53 tests)
- [ ] E2E tests pass (`npm run test:e2e`, 28 tests, requires dev server)
- [ ] Husky pre-commit passes
- [ ] `@progress.md` appended with task summary
- [ ] Affected `@docs/*.md` updated if reality changed
- [ ] If scraper touched: BOTH `.mjs` and route.ts updated (Rule 4)
- [ ] If infra touched: ADR written and committed before code

---

## 🛠️ 7. COMMANDS

```bash
npm run dev              # localhost:3000
npm run build            # Next.js production build
npm run build:cf         # Cloudflare next-on-pages build (canonical deploy build)
npm run preview          # Local preview of the Cloudflare build via wrangler
npm run lint             # ESLint
npm run test             # Vitest, 53 tests
npm run test:watch       # Vitest watch mode
npm run test:e2e         # Playwright, 28 tests, needs dev server running
npm run scrape <url>     # CLI recipe scraper, writes to Supabase
```

---

## 📓 8. NOTION POINTERS (humans only)

Agents do not read Notion as source of truth.

- Project plan page: `31e16230-665c-8107-91e5-ee03d6cbd636`
- Progress log: `31e16230-665c-8117-bf62-d04b14ed8c1e`

---

## 🚦 9. CURRENT STATE

_(Last edit: 2026-04-25, audit-driven snapshot)_

**Working in production:** Multi-user with per-user recipes, ingredients, food logs. Invite-only signup. Liquid Glass UI. Portion calculator with USDA macros. Weekly summary page. Chatbot with per-user context. 53 unit tests + 28 E2E.

**Mid-build / unresolved:** Dual scraper paths divergence risk (ADR-002 pending, TASK-002). `/api/audit` cron currently not running on any platform — was dead in `vercel.json` (no Vercel deploy bound), now needs Cloudflare wiring (TASK-003). Marketplace env-var fallback is dead code on Cloudflare, scheduled for removal (TASK-004). `@docs/` scaffold landed 2026-04-25 with stub architecture files; populate as work touches each surface.

**Blocked:** Scraper changes require ADR-002 first. Any new infra change requires its own ADR per Law 4. UI work and isolated API work can proceed in worktrees.

---

_End of project handbook. Read `@task_plan.md` next._
