# 📋 TASK PLAN: Hearth Reskin

> **Read `CLAUDE.md` first.** This task plan is the architect-owned source of truth for the current branch.
> **Branch:** `feat/hearth-reskin`
> **Owner:** Michael Haslim
> **Started:** 2026-04-30
> **Status:** Phase 0 ready to execute

---

## 🎯 OBJECTIVE

Apply the Hearth aesthetic (Magnolia warmth + Liquid Glass polish) as a UI reskin across all 11 production screens of Julie's Cookbook. No new features. No new routes. No copy rewrites. Visual layer only.

Reference assets:
- `docs/design/hearth-prototype.html` — visual target, all 11 screens
- `docs/design/component-specs.md` — 19 components with anatomy, states, Tailwind class examples
- `tailwind.config.ts` — drop-in token foundation (already in repo)

---

## 🚧 PRE-FLIGHT BLOCKERS

These must clear before Phase 1 can merge to main. Phase 0 work can proceed on the branch in parallel.

### Blocker 1 — ADR-001 deploy target ambiguity
**Status:** OPEN. `vercel.json` and `wrangler.toml` both present. Cloudflare GitHub Action deploys on push to main.
**Required:** Decide Vercel or Cloudflare Pages. Decommission losing infra. Write `docs/adr/ADR-001-deploy-target.md`.
**Why blocking:** Reskin pushes will trigger preview deploys. Without resolution we chase two preview URLs and risk env var drift.
**Owner:** Slim.

### Blocker 2 — Husky / lint compatibility check
**Status:** UNVERIFIED. New `tailwind.config.ts` adds many custom utilities (`bg-glass-base`, `animate-fab-pulse`, `text-h2`, etc.).
**Required:** Run `npm run lint && npm run build` on Mac Studio after Phase 0. Confirm zero new errors.
**Why blocking:** Pitfall 2 — ESLint strict failures break Cloudflare/Vercel builds. We catch it locally now or we catch it in CI later.

---

## 📐 PHASES

Four phases plus Phase 0 foundation. One PR per phase. Each phase merges before the next starts.

### Phase 0 — Foundation (no UI changes yet)

**PR title:** `feat(design): Hearth tokens + reference assets`

Drop in the design system. App still looks identical to production after this merges; only the toolkit is in place.

**Tasks:**
1. Replace `tailwind.config.ts` at repo root with the Hearth version
2. Create `docs/design/` directory
3. Add `docs/design/hearth-prototype.html` (reference only, not served)
4. Add `docs/design/component-specs.md` (reference only)
5. Run `npm run dev`, confirm app still renders without console errors
6. Run `npm run lint`, fix any new utility-class lint complaints
7. Run `npm run build`, confirm production build succeeds
8. Run `npm run test`, confirm all 53 unit tests pass
9. Commit with message: `feat(design): add Hearth tokens + reference prototype`
10. Push, open PR, verify Cloudflare preview builds

**Acceptance criteria:**
- [ ] `tailwind.config.ts` extends with cream, linen, ink, brown, leaf, ember, rust, gold colors
- [ ] Three font families registered: Playfair Display, Lora, Inter
- [ ] Custom keyframes registered: fab-pulse, macro-bounce, drift-up, dot-pulse
- [ ] Husky pre-commit passes
- [ ] 0 lint errors
- [ ] 0 TypeScript errors
- [ ] All 53 unit tests pass
- [ ] Cloudflare preview deploy succeeds
- [ ] Visual diff: production vs preview should be IDENTICAL (no components touched yet)

**Estimated effort:** 30 minutes if Husky passes cleanly, up to 2 hours if utility class linting needs sorting.

---

### Phase 1 — Public surface

**PR title:** `feat(design): reskin public surface (Login, Signup, Reset, Demo)`

Lowest-stakes screens. Establish the aesthetic on flows that can be tested without auth.

**Screens redesigned:**
1. `/login` — splash particle convergence, staggered title reveal, form drift-up
2. `/signup` — invite code field gets gold accent treatment
3. `/auth/reset` — calmest screen, single input + CTA
4. `/demo` — 4-step ribbon, step-aware copy, demo-cta-row

**Components introduced (build first, before screens):**
- Button (primary, secondary, ghost)
- Input + InputLabel
- StepRibbon (demo only)

**Tasks:**
1. Build base components in `src/components/ui/` per `component-specs.md`
2. Reskin `src/app/login/page.tsx`
3. Reskin `src/app/signup/page.tsx`
4. Reskin `src/app/auth/reset/page.tsx`
5. Reskin `src/app/demo/page.tsx` and child step components
6. Loading + error states for each screen per inventory
7. Run full DOD checklist
8. Update `progress.md`
9. Update `docs/architecture/ui.md` with the new Button/Input/StepRibbon patterns

**Acceptance criteria:**
- [ ] All 4 screens visually match `docs/design/hearth-prototype.html` (mobile + desktop where applicable)
- [ ] Particle splash plays on first session only (sessionStorage flag) — see decision log entry below
- [ ] Login form preserves existing copy: "A meditative space to organize your recipes and simplify your kitchen workflow."
- [ ] Signup invite-code field has gold accent treatment
- [ ] Demo step ribbon advances state on click and updates body copy
- [ ] All Lucide icons in `--brown`, no emoji in chrome
- [ ] All e2e tests for `/login`, `/signup`, `/auth/reset`, `/demo` still pass
- [ ] Husky pre-commit passes
- [ ] 0 lint errors, 0 TS errors
- [ ] `progress.md` updated
- [ ] Cloudflare preview deploy: visual diff vs hearth-prototype.html is acceptable

**Decision log entry needed during this phase:**
- **First-session-only particle splash.** Per Slim's pushback in build session, splash plays once per session via `sessionStorage`, subsequent logins use a quieter fade-only intro. Document in `docs/adr/ADR-003-login-splash-frequency.md`.

**Estimated effort:** 4-6 hours.

---

### Phase 2 — Recipe Detail (the hero screen)

**PR title:** `feat(design): reskin Recipe Detail with Hearth aesthetic`

Highest component density. Build this second so the rest of the app inherits the heaviest lifting.

**Screens redesigned:**
- `/recipe/[slug]` — hero, meta block, stat row, scaler, tab bar, all 3 tab contents

**Components introduced:**
- Card
- Chip
- StatRow
- ServingsScaler (live, no Apply button — Rule 7)
- TabBar (sticky, frosted on scroll)
- IngredientList (grouped by category)
- InstructionList (numbered)
- MacroGrid (with bounce animation)
- PortionCalculator (the killer feature — Rule 8)
- ChatFAB (with first-load pulse animation)
- ErrorState

**Tasks:**
1. Build the 11 new components in `src/components/ui/` and `src/components/recipe/`
2. Reskin `src/app/recipe/[slug]/page.tsx`
3. Wire up live servings scaler with crossfade animation
4. Wire up portion calculator with live macro updates and bounce animation
5. Verify USDA macros pipeline still works (Rule 3, no reverse of fallback chain)
6. Sticky tab bar with backdrop-blur on scroll
7. Empty + error states for missing photos (fallback pattern)
8. Run full DOD checklist
9. Update `progress.md`
10. Update `docs/architecture/ui.md` with all new component patterns

**Acceptance criteria:**
- [ ] Recipe Detail visually matches `docs/design/hearth-prototype.html`
- [ ] Servings scaler is live (no Apply button)
- [ ] Servings scaler crossfades quantity values over 200ms
- [ ] Tab bar becomes glass-frosted on scroll past hero
- [ ] Portion calculator updates macros in real time as grams are typed
- [ ] Macro values bounce on change (180ms scale-up)
- [ ] Chat FAB pulses 3.5s after page settle, twice, then rests
- [ ] Photo fallback pattern works for recipes without images
- [ ] Recipe `getRecipeById` slug→UUID fallback still works (Rule 2)
- [ ] All e2e tests for `/recipe/[slug]` still pass
- [ ] Husky pre-commit passes, 0 lint, 0 TS errors
- [ ] `progress.md` updated
- [ ] Cloudflare preview: visual diff acceptable on mobile + desktop

**Estimated effort:** 8-12 hours. This is the heaviest phase.

---

### Phase 3 — Authenticated app

**PR title:** `feat(design): reskin authenticated screens (Gallery, Food Log, Weekly, Admin, Settings)`

Most components already exist after Phase 2. This phase is mostly assembly.

**Screens redesigned:**
- `/` (Recipe Gallery) — uses Card, RecipeCard, Chip
- `/food-log` — uses WeekStrip, MealCard, MacroGrid, LogMealSheet
- `/weekly` — uses BarChart, MacroGrid, Card
- `/admin/import` (or current path) — uses 6 state cards, Button, Input
- `/settings` — uses Card, ListRow

**New components introduced:**
- RecipeCard
- WeekStrip
- MealCard
- BarChart
- LogMealSheet
- AppHeader (frosted-glass top bar)
- EmptyState

**Tasks:**
1. Build the 7 new components
2. Reskin Gallery first (most-visited screen)
3. Reskin Food Log + LogMealSheet bottom sheet
4. Reskin Weekly Summary
5. Reskin Admin Import with all 6 states (idle, loading, success, partial, blocked, error)
6. Reskin Settings (quietest screen)
7. Empty states for Gallery, Food Log, Weekly per inventory
8. Run full DOD
9. Update `progress.md`

**Acceptance criteria:**
- [ ] Gallery grid is 2-col mobile, 4-col desktop
- [ ] RecipeCards lift on hover (desktop only, translate-y -2px)
- [ ] Filter chips work and active state is visible
- [ ] Food Log week strip highlights today, shows dot indicator on logged days
- [ ] LogMealSheet slides up from bottom, snap points at 60% and 90%
- [ ] LogMealSheet drag-to-dismiss enabled
- [ ] Weekly bar chart highlights today in `--leaf`, future days in `--linen-dim`
- [ ] Bar chart taps drill to that day's food log
- [ ] Admin Import shows correct state per scrape result (success / partial / blocked / error)
- [ ] If scraper code is touched: BOTH `.mjs` and `route.ts` updated (Rule 4)
- [ ] All e2e tests pass
- [ ] Husky pre-commit passes, 0 lint, 0 TS errors
- [ ] `progress.md` updated
- [ ] Cloudflare preview acceptable

**Estimated effort:** 6-9 hours.

---

### Phase 4 — Global overlays + motion polish

**PR title:** `feat(design): Chat drawer, motion pass, empty/error/loading audit`

Final polish phase. Chat ships last because it overlays every other screen.

**Components introduced:**
- ChatDrawer (frosted-glass slide-up overlay)
- Web search loading indicator (3 sequential dots)
- LoadingState variants per screen

**Tasks:**
1. Build ChatDrawer overlay component
2. Wire up to ChatFAB on every screen except Login
3. Quick-prompt chips at bottom of drawer
4. Web-search loading state (three-dot pulse sequence)
5. Citation rendering (source URLs as chips below message)
6. Motion audit pass: every signature interaction in `docs/design/component-specs.md` motion section
7. Empty/error/loading audit: every list-based screen has all three states
8. Verify Chat drawer doesn't trap focus on close (a11y)
9. Run full DOD
10. Update `progress.md`
11. Final QA pass on every screen, mobile + desktop

**Acceptance criteria:**
- [ ] ChatDrawer slides up over 320ms ease-hearth from bottom
- [ ] Backdrop fades in to 0.32 opacity
- [ ] Drag-to-dismiss enabled
- [ ] Quick prompts scroll horizontally, no scrollbar visible
- [ ] Web search loading state shows three sequential dots at 600ms intervals
- [ ] Citations render as chips below bot messages
- [ ] All 4 signature interactions tested on real device:
  - [ ] Login splash particle convergence (first session only)
  - [ ] Servings scaler live recalc
  - [ ] Portion calculator live macro updates with bounce
  - [ ] Chat FAB pulse at 3.5s
- [ ] Every list-based screen has empty + error + loading states
- [ ] No emoji in chrome (Pitfall 2)
- [ ] No dark mode added (Pitfall 4)
- [ ] All e2e tests pass
- [ ] Husky pre-commit passes
- [ ] 0 lint, 0 TS errors
- [ ] `progress.md` updated with final summary
- [ ] Visual QA sign-off from Slim

**Estimated effort:** 4-6 hours.

---

## 🧪 PER-PHASE DEFINITION OF DONE

Inherits the project DOD from `CLAUDE.md` Section 6. Every phase PR must satisfy:

- [ ] 0 lint errors (`npm run lint`)
- [ ] 0 TypeScript errors (`tsc --noEmit`)
- [ ] All 53 unit tests pass (`npm run test`)
- [ ] All 28 e2e tests pass (`npm run test:e2e`)
- [ ] Husky pre-commit passes
- [ ] `progress.md` appended with task summary
- [ ] Affected `docs/*.md` updated if reality changed
- [ ] If scraper touched: BOTH `.mjs` and `route.ts` updated (Rule 4)
- [ ] Cloudflare preview deploy: green build
- [ ] Visual diff vs `docs/design/hearth-prototype.html` reviewed by Slim

---

## 🎬 MOTION SPECS QUICK REFERENCE

(Detailed in `docs/design/component-specs.md` and `tailwind.config.ts` keyframes.)

| Interaction | Duration | Easing | Trigger |
|---|---|---|---|
| Login particles | 1.4s | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Page load (first session only) |
| Login title drift-up | 600ms | ease-hearth | Staggered after particles |
| FAB pulse | 1.6s × 2 | ease-in-out | 3.5s after page settle |
| Servings crossfade | 200ms | linear | On scaler click |
| Macro bounce | 180ms | ease-out | On value change |
| Tab bar frost | 240ms | ease-hearth | On scroll past hero |
| Sheet slide | 320ms | ease-hearth | Open/close |
| Drawer slide | 320ms | ease-hearth | Open/close |
| Chat dot pulse | 1800ms loop | ease-in-out | While searching |
| Card hover lift | 180ms | ease | Hover (desktop only) |

---

## 🚫 OUT OF SCOPE (do not do in this branch)

- Adding new screens not in Section 7 of design CLAUDE.md (Pitfall 7)
- Changing routes, copy structure, or information architecture
- Rewriting copy beyond the warmth pass (Rule 9)
- Adding dark mode (Pitfall 4)
- Refactoring the dual scraper paths (tracked in ADR-002, separate effort)
- Migrating to a different deploy target (tracked in ADR-001, must clear before Phase 1)
- Adding analytics, tracking, or observability tooling

---

## 📊 OVERALL ESTIMATE

| Phase | Hours (low) | Hours (high) |
|---|---|---|
| 0 — Foundation | 0.5 | 2 |
| 1 — Public surface | 4 | 6 |
| 2 — Recipe Detail | 8 | 12 |
| 3 — Authenticated app | 6 | 9 |
| 4 — Polish | 4 | 6 |
| **Total** | **22.5** | **35** |

Realistic ship window: **3 to 5 working days** at focused-block pace, longer if interrupted.

---

## 🗒️ NOTES

- **Cowork architects, Claude Code executes.** This task plan is the architecture artifact. Hand it to Claude Code with the design assets and let it execute one phase at a time. Don't let Claude Code re-architect mid-build.
- **First merge to main = Phase 0.** Foundation merges first. The reskin lives behind it on the branch and merges phase-by-phase.
- **Recursive Learning Loop applies (base handbook §5).** If a fix-within-24h-of-feat happens during any phase, that pattern triggers a doc update in `docs/architecture/ui.md` or a new pitfall in `CLAUDE.md` §4.
- **No same-day fix-after-feat clusters.** Pitfall 5 from `CLAUDE.md`. Tasks are declared here before execution. Period.

---

*End of task plan. Read `progress.md` for completed work, `CLAUDE.md` for engineering laws.*
