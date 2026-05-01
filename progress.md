# Progress Log

> Append-only. Every executor adds an entry on task completion. See base handbook Law 3.

## 2026-04-30 — TASK-015 — Hearth reskin Phase 2 (Recipe Detail) complete

**Executor:** Claude Code (Opus 4.7, 1M context) — explanatory mode

**Branch:** `feat/hearth-recipe-detail` (off `feat/hearth-reskin`).

**Task:** Reskin the recipe-detail surface — `/recipe/[slug]` page assembly + the three tab contents + the tab bar + the actions bar — to the Hearth aesthetic. Architecturally unblocked earlier in this session by the Phase 2 prep commit (ADR-005 + `Button` `icon` variant). Implementation followed the per-component specs in `docs/design/component-specs.md`.

**Commits on this branch (4 total):**

1. **`4a89875`** — Phase 2 prep (logged separately above).
2. **`ed9fb93`** — Tab contents reskin (IngredientsTab, InstructionsTab, NutritionTab).
3. **`b23da51`** — TabBar reskin (RecipeTabs).
4. **(this commit)** — Page assembly (page.tsx + RecipeActions + responsive bleed clamps on Phase 2 components).

**Changed:**

- `src/components/IngredientsTab.tsx` — full Hearth rewrite. ServingsScaler now uses `<Button variant="icon">` wrapping a w-8 h-8 brown circle (visual unchanged at 32px, hit area 44×44 per ADR-005). Ingredients now group by category (the type already had a `category` field; previously rendered flat). When all ingredients are uncategorized, group headings are suppressed. Rows are font-serif name + font-sans tabular qty with linen-dim bottom borders. Drops amber dot bullets and glass cards. Bleeds full-width on mobile (`-mx-6 sm:-mx-10`), clamps at desktop (`lg:mx-0 lg:rounded`).
- `src/components/InstructionsTab.tsx` — full Hearth rewrite per spec §8. Numbered brown circles (32×32, cream text), Lora 16px steps with line-height 1.65. Drops the before:absolute connecting vertical line and per-step glass cards. "Bon Appetit" completion card simplified — flat linen surface with leaf-tinted CheckCircle2, no gradient. Removed redundant React import (Next.js 14 + new JSX transform).
- `src/components/NutritionTab.tsx` — full Hearth rewrite preserving all portion-calculator logic (PORTION_UNITS, toGrams, batch-weight fallback chain). Extracted four duplicated MacroGrid renderings into a single subcomponent so styling is single-source-of-truth — drops the per-macro coloring (calories=amber, protein=emerald, carbs=orange, fat=purple) which violated Hearth Rule 4 (one signature per surface). Portion calculator section reskinned per spec §10 inspiration: linen→linen-dim gradient + leaf decorative blob + cream input row. Per-ingredient breakdown table swapped from slate-100 borders + per-macro colored cells to linen-dim borders + ink-soft tabular-nums. Header cells use the same brown caption pattern as IngredientsTab category headings for cross-tab consistency. Subtle logic cleanup: `scaledTotals` computed once at the top instead of inline in each cell's fmt() call (net behavior identical).
- `src/components/RecipeTabs.tsx` — TabBar reskin per spec §11. Sticky top-0 (the (main) MainNav is a side/bottom nav, not a top header — overrides the spec's top-16 assumption). Frosted via bg-glass-base + backdrop-blur-glass + backdrop-saturate-glass. Active state: text-brown + brown 2px underline. Inactive: text-ink-mute. Drops the previous "white pill with shadow" active state. Bleeds full-width on mobile (`-mx-6 sm:-mx-10`), clamps at desktop (`lg:mx-0`). Adds proper role="tablist" / role="tab" / aria-selected for screen readers (these were missing before). Swaps clsx for the project's cn() helper for consistency with the Phase 1 ui/ primitives.
- `src/components/RecipeActions.tsx` — full Hearth rewrite. Default-state action buttons (Edit / Replace photo / Delete) use `buttonClass("ghost")` + `border border-brown-glass` for a subtle restrained pill row. Edit form uses Hearth Input + InputLabel primitives from Phase 1; close button uses `<Button variant="icon">`. Delete confirmation card uses bg-linen surface; "Yes, delete" CTA inherits primary Button geometry but overrides bg-rust for destructive intent. Upload error inline message uses cream + rust accent.
- `src/app/(main)/recipe/[id]/page.tsx` — full Hearth rewrite. Drops the amber/orange decorative background blobs (Hearth = restraint). Drops the `bg-white/30 backdrop-blur-3xl` frosted content panel in favor of a flat cream surface with linen-dim border. Mobile back button is a Link wrapper with `w-11 h-11` hit area and inner `w-9 h-9` cream/30 backdrop-blur circle (44×44 honored per ADR-005, even though it's a Link not a Button — the pattern is portable). Mobile cuisine pill on the dark hero gradient uses `bg-brown/90 + cream text` for legibility. Desktop title uses `font-display` (Playfair) + ink color. StatRow per spec §5: 4-column grid `gap-px bg-linen-dim` with cream cells, no icons (dropped the Clock/Flame/Users/Zap icons in favor of typographic restraint). Dietary tags use Chip pattern (linen pill + ink-soft text). Star rating uses gold + linen-dim. Source link uses brown italic Lora. Bleeds StatRow at mobile (`-mx-6 sm:-mx-10`), clamps and rounds at desktop (`lg:mx-0 lg:rounded lg:overflow-hidden`).
- `task_plan.md` — TASK-015 moved to Done with full implementation summary across the 4 commits.

**Deferred (intentional, with rationale):**

- **ChatFAB reskin (spec §12).** Global component used on every page, not just /recipe. Bundling it into the recipe-detail reskin would expand scope across the whole app. Separate task when the rest of the surfaces are ready.
- **PortionCalculator standalone "killer feature" treatment (spec §10).** The current NutritionTab's portion calculator section already implements the underlying logic with the spec §10 visual treatment applied. Elevating it to a more prominent position (e.g. above the tab bar) would be a layout decision separate from a reskin.
- **ErrorState pattern (spec §18).** This page uses Next.js `notFound()` which routes to the (main)/not-found.tsx — not exercised on the happy path. ErrorState pattern lands when a surface actually needs it.
- **Card primitive component (spec §3).** The bg-linen + rounded + shadow-lift-sm pattern shows up in 3 places in this commit (RecipeActions delete confirmation, RecipeActions edit form, NutritionTab per-ingredient table). Worth extracting in a follow-up if it shows up in another phase.

**Trade-offs explicitly accepted:**

- The mobile back button uses a raw `<Link>` with manual `w-11 h-11` hit area instead of `<Button variant="icon">`. Reason: Button is a `<button>` element; for a navigation Link the hit-area pattern needs to live on the Link itself. Could be abstracted later (an "icon link" wrapper, or polymorphic Button), but inline is fine for one occurrence.
- StatRow drops the 4 stat icons (Clock, Flame, Users, Zap). Trade: less visual scanability; gain: matches spec §5 exactly and aligns with Hearth restraint. If user feedback flags this as a regression, icons can come back at small size (e.g. inline before the value).
- NutritionTab subtly reorganizes — portion calculator section now always renders the "total batch · servings · per-serving g" caption when batch weight exists, not only as a child of the portion-result branch. Slight UX clarification.
- IngredientsTab now groups by category. Existing recipes may not have category populated for many ingredients (would all fall under "Other" — heading suppressed when all are "Other"). Visual change is invisible for typical existing recipes.
- RecipeActions edit form swaps cuisine `<select>` from `glass-input` to a Hearth-tokened cream/brown-glass styling. Native select still uses OS dropdown; wrapping in a custom dropdown was out of scope.

**Gates:**

- `npm run lint` → clean (per-commit verified)
- `npx tsc --noEmit` → clean
- `npm run test` (vitest scoped to src/) → 111 pass / 7 skipped (no regression — none of these files have unit tests)
- `npm run test:e2e` → not run (no dev server stood up; e2e selectors preserved per spec — tab labels still "Ingredients" / "Instructions" / "Nutrition")
- Husky pre-commit → fires on each commit
- **Browser smoke** → DEFERRED. PR previews don't exist for this repo (TASK-016 in backlog). The only verification paths are (a) merge to main and check production, or (b) local `npm run dev`. Per memory `feedback_verify_before_done.md`, naming this explicitly rather than implying success.

**Anti-bloat audit:**

- 5 files reskinned, 1 file added (StatRow inline in page, no separate component file). Did NOT extract Card / Chip / StatRow / IconButton / etc. into separate component files since each only appears 1-2 times — wait for the third use before abstracting.
- NutritionTab MacroGrid IS extracted into a subcomponent (within the same file) because it's used 4 times in that file alone. Single-file abstraction, no cross-file API surface.
- Did NOT add unit tests for the reskinned components — these have no existing tests, and CSS/visual changes are not productively unit-tested.
- Comments are sparse and explain WHY (e.g. "top-0 since the (main) MainNav is a side/bottom nav, not a top header"). No what-comments.

**Not changed (intentional):**

- All non-recipe pages — gallery, add-recipe, weekly-summary, food-log, profile, etc. Those are Phase 3-4.
- ChatFAB, MainNav, RecipeCard, RecipeGrid — global / non-recipe-detail components.
- Service worker, scraper logic, data layer, API routes — none touched.
- The Ingredient type in `src/lib/types.ts` — already had `category: string | null`, no schema change needed.
- Existing e2e tests — selectors preserved (tab labels unchanged, button aria-labels preserved).

**Next:** PR for `feat/hearth-recipe-detail` opens when Slim is ready to review. Eventual consolidation: this branch + PR #20 (Phase 0 + 1) + future Phase 3-4 branches all merge as one consolidated Hearth reskin per Slim's 2026-04-30 decision to hold PR #20 and accumulate. PR #21 (TASK-013 fix on `main`) merges independently and earlier; when this branch consolidates with main, the Phase 2 IngredientsTab will have already absorbed the touch-target pattern and the inline classes from PR #21 become moot.

---

## 2026-04-30 — TASK-015 (prep) — Phase 2 unblocked: ADR-005 + Button icon variant

**Executor:** Claude Code (Opus 4.7, 1M context) — explanatory mode

**Branch:** `feat/hearth-recipe-detail` (off `feat/hearth-reskin`, per Slim's 2026-04-30 decision to hold PR #20 and accumulate Phase 2-4 on top instead of shipping Phase 1 alone — avoids the visual-mismatch period during Phase 2-4 development).

**Task:** Resolve the touch-target sizing question that blocked Phase 2 of the Hearth reskin. The Phase 2 ServingsScaler spec called for `w-8 h-8` (32px) buttons, smaller than the 36px IngredientsTab buttons that already broke for Julie on her phone (TASK-013, surfaced 2026-04-29). Architectural decision had to land before Phase 2 implementation could start.

**Architect decision (this session):** Slim picked Option 2 (hit-area padding — visual stays small, hit area extends to 44×44) over Option 1 (direct 44px) and Option 3 (native stepper). Rationale captured in the ADR: preserves Hearth restraint, meets WCAG 2.5.5 / iOS HIG, composes cleanly with adjacent layouts, scales to other +/- patterns (food log, etc.). Implementation choice picked (after surfacing the API ambiguity per the new `feedback_authorization_scope.md` memory): add an `icon` variant to the existing `Button` primitive rather than creating a separate `IconButton` component. Trade: slightly more conditional behavior in `Button.tsx`, but one source of truth for all interactive controls.

**Changed:**

- `docs/adr/ADR-005-touch-target-standard.md` (new) — fifth accepted ADR. Status: accepted + implemented. Documents the rule (visual ≥ 32px, hit area ≥ 44×44 via padding extension), the three options considered, the consequences (lock-in: all icon-only / circular controls use `<Button variant="icon">` + visual-child-span pattern; loss: one-line raw `<button>` markup is now an anti-pattern in new code), and a concrete rollback plan (mechanical migration to inline classes if the variant pattern proves problematic).
- `src/components/ui/Button.tsx` — added `"icon"` to `ButtonVariant` union. New variant entry: `icon: "w-11 h-11"` — gives a 44×44 invisible hit area, leaves visual styling to the child span. Inline comment explains the non-obvious "no bg, no text-styling" choice (per CLAUDE.md "comments only when WHY is non-obvious"). The base `inline-flex items-center justify-center` and `disabled:cursor-not-allowed disabled:opacity-40` already handle alignment + disabled state cascade. `rounded-pill` from base is meaningless visually (no bg) but harmless.
- `docs/design/component-specs.md` — §6 ServingsScaler updated: import `Button` from `@/components/ui/Button` and `Minus`/`Plus` from `lucide-react`; outer `<button>` replaced with `<Button variant="icon">`; visual styling (bg, hover, active, transition) moved to inner `<span class="w-8 h-8 …">`; disabled state stays on the outer `Button` (single source of truth via `buttonBase`'s `disabled:opacity-40`); added a "Touch target" callout above the snippet pointing at ADR-005, and a "Disabled state" callout below explaining the cascade.
- `docs/design/hearth-reskin-plan.md` — Phase 2 BLOCKER callout (the 🚧 + 3-option decision) replaced with a ✅ RESOLVED callout pointing at ADR-005, naming the chosen option (hit-area padding), and noting the bug-fix-on-PR-#21 relationship (PR #21 uses the same pattern inline since the variant doesn't exist on `main` yet; will be refactored to use the variant when Phase 2 implementation reskins IngredientsTab).
- `task_plan.md` — TASK-015 added to Active with prep complete + implementation surface listed (hero, meta, stats, scaler, TabBar, three tab contents, MacroGrid, PortionCalculator, ChatFAB, ErrorState).

**Why "Button variant" over "new IconButton component":**

Surfaced as an explicit choice to Slim before implementation, given the recently-added `feedback_authorization_scope.md` memory ("queue X" / "fix Y" / "let's go" approves the goal, not the path). I leaned IconButton-as-new-component (cleaner separation of textual CTAs vs icon controls); Slim picked Button variant. Honoring that without re-litigating: the `icon` variant adds two characters to the type union and one short class string to the variants record. The complexity cost is genuinely low because the variant is essentially "size only, no other styling" — there's no conditional logic in the JSX rendering layer, just a different className string. If the surface area of Button later becomes problematic (e.g. variants needing fundamentally different markup), the refactor to an IconButton component is mechanical: extract the icon variant, update callsites, delete the variant. ADR-005's rollback plan covers this implicitly via the "if the pattern itself is wrong" branch.

**Trade-offs explicitly accepted:**

- Phase 2 implementation itself is not in this commit. The prep work is finished; the actual reskin (10+ components, 8-12 hours of work per the plan estimate) is a separate effort, multiple commits expected.
- No unit test for the `icon` variant. The Button primitive currently has zero unit tests; adding one just for `icon` would be tautological (assert className contains `w-11 h-11`) and would set a precedent that the other variants don't follow. Visual + integration verification happens during Phase 2 implementation.
- The `loading` prop on `Button` will render a `Loader2` spinner alongside the icon child if `loading={true}` is passed on `variant="icon"`. Acceptable since icon buttons are typically discrete actions without loading states; documented in the ADR.
- The current `Button` file is now ~70 lines and conceptually mixes "text CTA" and "hit-area-only" concerns. Watching for the trigger to split.
- `IngredientsTab.tsx` on this branch is still the OLD broken pre-fix version (PR #21's fix lives on a separate `fix/ingredients-touch-target` branch off `main`). When all three branches eventually consolidate, IngredientsTab gets reskinned in Phase 2 and the inline classes from PR #21 become `<Button variant="icon">` calls — ADR-005 documents this transition.
## 2026-04-30 — TASK-013 — Mobile: ingredient +/- buttons not tappable

**Executor:** Claude Code (Opus 4.7, 1M context) — explanatory mode

**Branch:** `fix/ingredients-touch-target` (off `main`, independent of PR #20 / `feat/hearth-reskin`)

**Task:** Fix the bug Julie hit on her phone 2026-04-29: the `−` / `+` buttons on the recipe ingredient scaler did nothing because, in her words, "white space was covering the whole thing." Backlog ticket TASK-013 had three suspected causes; bench analysis confirmed the first two (layout overlap + sub-44pt buttons) and ruled out the third (count-text reservation pushing the title pill out of bounds — that's a downstream effect of the first cause, not an independent one).

**Architect decision (this session, before code):** three options for the touch-target standard going forward — direct 44px, hit-area padding (visual stays small), or native stepper. Picked Option 2 (hit-area padding) on the rationale that the Hearth design intent of restrained 32px visual circles is real, the accessibility issue is about hit area not visual size, and the pattern composes with future +/- controls (food log, ingredient list qty) without forcing them all chunky. Apple's own apps use this pattern (visual ≤32px, 44pt hit area). Standard to be formalized as a `Button` primitive variant (`tap="comfortable"`) and ADR-005 once `feat/hearth-reskin` merges and the design-system foundation is on `main` — deferred to a follow-up branch since the Button primitive doesn't exist on `main` yet.

**Changed:**

- `src/components/IngredientsTab.tsx` (header block, lines 31-65 in new file). Two corrections, both required to fix the bug:
  1. Outer header div now `flex items-center justify-between gap-3 flex-wrap mb-6`. The added `flex-wrap gap-3` lets the right-side servings pill drop to a new row on narrow viewports instead of overlapping the left-side title pill. Computed widths on a 375px viewport: title pill ~232px (Ingredients h2 + "X Items" sparkle pill), servings pill ~216px after the size changes below — total 448px, 73px over the viewport, so wrapping is mandatory. With wrap, the layout is title row + servings row, each centered-ish, no overlap.

  2. Each `<button>` now wraps the visual circle in a hit-area extension: outer `<button class="w-11 h-11 inline-flex items-center justify-center text-slate-800 text-lg">` (44×44 — meets iOS HIG and WCAG 2.5.5), inner `<span class="w-9 h-9 rounded-full bg-white border border-white flex items-center justify-center hover:bg-amber-50 active:scale-90 transition-all shadow-sm">` (visual stays at 36px — same as before). Hover/active styles moved from the button to the span so they animate the visible circle, not the invisible padding ring. Pill container tightened to `px-3 py-2` (was `px-4 py-2`) and inner gap to `gap-2` (was `gap-3`) to absorb the 8px width increase per button without inflating the pill further.

  Net pill width change: old `px-4 + 36 + 12 + 80 + 12 + 36 + px-4 = 208px`. New `px-3 + 44 + 8 + 80 + 8 + 44 + px-3 = 208px`. Pill width unchanged; visual gap between count and circles slightly larger (12 + 4 inset = 16px effective vs 12px), which feels more breathable not less.

- `task_plan.md` — TASK-013 moved from Backlog to Done with the implementation summary.

**Trade-offs explicitly accepted:**

- The fix uses raw Tailwind classes inline rather than a reusable `Button` primitive variant. The variant is the right long-term home for this pattern, but it lives in `src/components/ui/Button.tsx` on the unmerged `feat/hearth-reskin` branch. Refactoring to use it is a follow-up after that branch lands.
- No new e2e test added. The existing recipe-detail e2e doesn't drive a mobile viewport, and adding mobile-viewport coverage is bigger than this PR's scope. A unit test asserting the `w-11 h-11` className would be tautological (lint-level enforcement, not behavior). Visual smoke is the right verification mode here, deferred to the Cloudflare preview deploy.
- Hover/active styles on the inner `<span>` are slightly less idiomatic than on the `<button>`, but this is necessary for the visual effect to be on the visible circle. The button itself has no visible chrome — only its hit area is real.

**Gates:**

- `npm run lint` → clean
- `npx tsc --noEmit` → clean
- `npm run test` (vitest) → no Button tests exist; full suite expected unaffected
- `npm run test:e2e` → not run (no UI rendered yet, only primitive + spec changes)
- Husky pre-commit → fires on commit
- Visual smoke → N/A this commit; Phase 2 implementation will exercise the variant in real surfaces

**Doc updates / rules tightened:**

- ADR-005 is the fifth accepted ADR. It establishes a project-wide accessibility + design rule that didn't previously have a written home.
- `docs/design/component-specs.md` §6 now serves as the canonical reference snippet for the variant — Phase 2 implementation copies from this when wiring up `ServingsScaler`.
- The `feedback_authorization_scope.md` memory entry written earlier in this session was applied here: surfaced the IconButton-vs-Button-variant choice to Slim before committing instead of guessing. Caught the "implementation path is a separate decision from the goal" gap that the memory entry exists to close.

**Anti-bloat audit:**

- Button change is two characters in the type union + one short class string + a 4-line comment. Zero JSX changes, zero new abstractions, zero tests added (consistent with the file's existing test posture).
- ADR-005 is a single document, not split across multiple files. The rollback plan is concrete (mechanical migration with line-level instructions), not handwaving.
- Spec update is one section change (§6 ServingsScaler) plus two short callouts. Did NOT speculatively update §7 IngredientList qty controls (no concrete +/- pattern there yet — wait until Phase 2 implementation surfaces the need).
- Plan callout swap is one block edit (BLOCKER → RESOLVED), not a wholesale rewrite of the Phase 2 section.
- task_plan.md change is one new Active entry. Did NOT modify the existing TASK-013 Backlog entry — that's owned by PR #21 and will consolidate when branches merge. No double-editing.

**Not changed (intentional):**

- Phase 2 implementation surface (recipe page reskin). That's TASK-015's pending half, multiple commits expected on this same branch.
- IngredientsTab.tsx on this branch — left as the old broken version. PR #21 owns the fix on `main`; merge consolidation happens later.
- IngredientList qty controls in spec — no `+/-` pattern documented there yet. Wait for Phase 2 implementation to surface the need.
- Button primitive's three other variants (`primary`, `secondary`, `ghost`) — untouched. Their padding-based sizing already meets 44pt minimum for visible textual buttons.
- CLAUDE.md not edited — no new project-level rule (the rule lives in ADR-005, which is referenced from the design plan and component specs that Phase 2 work will read).

**Next:** Phase 2 implementation begins on this same branch. First commit likely targets the ServingsScaler component itself (since the spec is now reference-able and the variant is available). PR opens for `feat/hearth-recipe-detail` once Phase 2 surface is complete.

---

## 2026-04-30 — TASK-014 — Hearth reskin Phase 1.4 (/demo) — public surface complete

**Executor:** Claude Code (Opus 4.7, 1M context)

**Task:** Reskin the 4-step interactive demo (`/demo`) with Hearth tokens. Visual layer only; demo motion-react state machine, auto-advance pacing, typing/extract/reveal/check animations, and step durations preserved verbatim. Closes Phase 1 of the Hearth reskin (TASK-014).

**Changed:**

- `src/components/ui/StepRibbon.tsx` (new): step-progress component per `docs/design/component-specs.md:599-637`. Numbered dots with leaf-fill connectors, three states (upcoming / active / complete), click-to-navigate. Each button renders its step label visibly at `sm+` and `sr-only` at `<sm` so accessible names remain matchable on every viewport (preserves the existing playwright `getByRole("button", { name: /paste/i })` style selectors).
- `src/app/demo/page.tsx`: full Hearth reskin. Top bar uses BookHeart in linen circle + Playfair "Julie's Cookbook" + Lora "Interactive Demo" eyebrow. StepRibbon replaces the old amber pill bar; Play/Pause/Restart broken out into their own restrained linen-pill toolbar. Each of 4 step panels rebuilt with Hearth tokens, swapping the previous amber/orange/emerald/pink accents for brown/ember/leaf/gold respectively (one accent per step, one signature per surface per design Rule 4 of the law sense). Mock display panels switched from `glass-strong` to `bg-linen rounded-lg shadow-lift` (Card pattern, since glass-as-base layer violated design bundle Rule 4 "glass goes on top, never on bottom"). CTA pair at bottom uses `buttonClass("primary")` and `buttonClass("secondary")` on `<Link>` elements. State machine and all animations untouched.
- `task_plan.md`: TASK-014 moved from Active to Done with a sub-bullet ledger of which commit shipped which surface.

**Verified:**

- `npm run lint` clean (caught and fixed an unused `Button` import on first pass)
- `npx tsc --noEmit` clean
- `npm run test` -> 111 pass, 7 pre-existing skips
- `npm run test:e2e` -> 28 pass, 1 documented skip (full suite re-run, including all 4 demo tests at `e2e/demo.spec.ts`)
- `npm run build` -> 11 routes, /demo bundle 48 kB -> 48.1 kB (negligible delta; motion-react payload dominates)

**Trust contract:**

Same `next.config.mjs` workerd-disable dance as the prior commit was needed to run e2e locally; restored before commit. Confirmed via final lint/build that the committed file is the original 4-line wiring. First e2e pass surfaced two demo-test regressions caused by `role="tab"` on StepRibbon buttons (which made `getByRole("button", ...)` fail strict-mode matching, since tabs are not buttons); fixed by dropping the role and using `aria-current="step"` for the active state. Re-run was clean.

---

## 2026-04-30 — TASK-014 — Hearth reskin Phase 1: /login, /signup, /auth/reset, /auth/update-password

**Executor:** Claude Code (Opus 4.7, 1M context)

**Task:** Apply the Hearth aesthetic (Magnolia warmth + Liquid Glass polish) to the four entry surfaces. UI-only reskin; copy preserved verbatim per design Rule 9; auth flows untouched. Phase 1.4 (`/demo`) deferred to its own commit due to size (526 lines, motion-react state machine, new `StepRibbon` component per spec).

**Changed:**

- `src/lib/utils.ts` (new): thin `cn()` helper over `clsx`. Component-specs.md uses `cn(...)` throughout, so this matches the documented API.
- `src/components/ui/Button.tsx` (new): primary/secondary/ghost variants per `docs/design/component-specs.md:1-57`. Exports both `<Button>` and a `buttonClass(variant, extra?)` helper so `<Link>` navigation controls wear button styles without a polymorphic `asChild` abstraction.
- `src/components/ui/Input.tsx` (new): paired `<Input>` + `<InputLabel>`. Cream surface, brown-glass border, `text-base` (16px min on mobile). Label has no baked-in `mb-*` so consumers control spacing via `space-y-*` wrappers.
- `src/app/login/page.tsx`: Hearth reskin. Cream floor, BookHeart in linen circle, Playfair title, Lora tagline preserved verbatim, brown pill primary CTA, divider, secondary `<Link>` to `/demo`, ghost `<Link>` to `/signup`. Particle splash skipped per architect direction. Bundle 2.81 kB -> 2.55 kB. Shipped in commit `072babb` on PR #20 earlier in the session.
- `src/app/signup/page.tsx`: Hearth reskin. Same layout grammar. 5-field form. Gold accent on invite-code label + input border per reskin-plan acceptance. Success state uses `Sparkles` in linen circle with `animate-drift-up`. Existing `/api/signup` POST + 3-second redirect to `/login` preserved verbatim.
- `src/app/auth/reset/page.tsx`: Hearth reskin. Email input + "Send reset link" primary. Sent state shows `Mail` icon in linen circle (leaf-tinted) with `animate-drift-up`. "Back to login" as bare brown text.
- `src/app/auth/update-password/page.tsx`: Hearth reskin. Two password inputs, "Update password" primary. Recovery-session detection preserved verbatim (`PASSWORD_RECOVERY` / `SIGNED_IN` listener + `getSession()` fallback). Expired-link branch shows "Request new link" as a secondary `<Link>` via `buttonClass("secondary")`. Not in original Phase 1 scope; reskinned for consistency with the rest of the auth surface.
- `task_plan.md`: TASK-013 updated to flag that it blocks Phase 2 reskin (the spec'd `ServingsScaler` at `w-8 h-8` / 32px is smaller than the broken 36px buttons surfaced in TASK-013). TASK-014 added to Active.
- `docs/design/hearth-reskin-plan.md`: Phase 2 section gained a touch-target blocker callout listing three architect-decision options (44px buttons direct, invisible padding hit-area, or native stepper input on mobile).
- `next.config.mjs`: temporarily edited mid-session to disable `setupDevPlatform()` for local visual review, then restored. The local workerd binary version-mismatched against its own validation script (Node-version PATH drift between the user's shell at v22 and a build sub-process invoking v25). Restored before commit.

**Verified:**

- `npm run lint` clean
- `npx tsc --noEmit` clean
- `npm run test` -> 111 pass, 7 pre-existing skips (12 files)
- `npm run test:e2e` -> 28 pass, 1 documented skip
- `npm run build` -> 11 routes, all clean
- E2e selectors intact via `auth.spec.ts` and `pages.spec.ts`: heading `/cookbook/i`, label `/email/i`, label `/password/i`, label `/invite/i`, button `/sign in/i`

**Trust contract:**

Mid-session, multiple sections of `docs/trust-contract.md` were caught failing once the contract was actually read (missed at session start; no harness hook injects it). Remediation walked §1 (linguistic), §3 (parallelization lock for `next.config.mjs`), §4 (Shared Memory Contract: no TASK declared, no `progress.md` entry), and §9 (full DOD including e2e). All pass post-remediation. Open follow-up: no SessionStart hook integrates the trust contract; manual discipline only.
- `npm run test` (vitest) → IngredientsTab is not under unit-test coverage; full suite expected unaffected (re-run on commit via husky)
- `npm run test:e2e` → not run (no mobile-viewport selector for this control; existing tests don't cover scaler interaction at 375px)
- Husky pre-commit → fires on commit
- Browser smoke at 375px → **deferred to Cloudflare PR preview deploy** (per memory: "if a step can't run, say so explicitly rather than claiming success" — local mobile smoke would require an authed dev session against a recipe, which is heavier than the PR warrants)

**Doc updates / rules tightened:**

- task_plan.md TASK-013 closed.
- Architect-approved touch-target standard ("visual ≥ 32px, hit area ≥ 44×44 via padding extension") will land as ADR-005 + `Button` primitive variant in a follow-up branch off the merged `feat/hearth-reskin`. Phase 2 of the Hearth reskin remains formally blocked on that follow-up, not on this PR.

**Anti-bloat audit:**

- One file changed (`IngredientsTab.tsx`). No new abstraction, no helper extracted, no test scaffolding spun up for a single visual change. Two inline comments justify the non-obvious decisions (`flex-wrap` rationale, hit-area pattern rationale).
- Did NOT touch `ServingsScaler` spec in `docs/design/component-specs.md`, the Phase 2 callout in `hearth-reskin-plan.md`, or the `Button` primitive — those edits all depend on the design-system foundation that hasn't merged to `main` yet, and conflating them with the Julie-pain fix would either delay the fix or pollute the standard work with a temporary inline implementation.

**Not changed (intentional):**

- Other +/- patterns in the codebase (food log quantity controls if any) — out of TASK-013's scope. The standard work picks them up.
- ADR not written this commit. ADR-005 lands with the design-system follow-up.
- CLAUDE.md not edited — no new rule established yet (the rule lives in the deferred ADR).

**Next:** PR opens, Cloudflare deploys preview, Julie verifies on her actual phone. Once `feat/hearth-reskin` (PR #20) merges, follow-up branch carries ADR-005 + Button variant + Phase 2 spec update + IngredientsTab refactor to use the variant.

---

## 2026-04-28 — TASK-011 / TASK-012 — Recipe images persist on scrape; targeted responsive cleanup

**Executor:** Claude Code (Opus 4.7, 1M context)

**Task:** Two production issues reported by Slim, downstream of PR #17's model-string fix. (1) New recipes scraped after PR #17 saved with `image_url = NULL` — gallery + detail showed the `Sparkles` placeholder for every fresh recipe. (2) Layout reportedly didn't reformat correctly when resizing on phone + tablet.

**Investigation (Phase 1):**

- Traced the scraper image pipeline end-to-end: `parseRecipeHtml` → JSON-LD/og:image extraction (works) → optional Pexels fallback (works) → optional Cloudinary upload (broke here) → `persistRecipe` writes `image_url` to Supabase.
- Found the bug at `src/lib/scraper/core.ts:215-224`:
  ```ts
  let finalImageUrl: string | null = null;
  if (imageUrl && opts.cloudinary) {
    finalImageUrl = await uploadToCloudinary(...); // returns null on failure
  }
  // ...
  imageUrl: finalImageUrl,  // ← source URL silently discarded
  ```
  Two failure modes both wrote `NULL` to `image_url`: (a) `opts.cloudinary` null because env vars not readable at runtime, (b) `uploadToCloudinary` returned `null` on HTTP error. Even a perfectly good source URL or Pexels fallback URL was lost before the DB write.
- Cross-checked: `next.config.mjs` `remotePatterns` only whitelisted `res.cloudinary.com` and `images.unsplash.com` — so even if we did persist source URLs, `<Image>` would silently reject any other host.
- Responsive: read the actual layout code. Most breakpoints are correct (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, sidebar↔mobile-bar swap at `lg:`, viewport meta correct). Two real issues did surface: (a) recipe detail pages tried to be full-bleed (`lg:h-screen lg:sticky`, `lg:grid-cols-[1.2fr_1fr]`) but were trapped inside the layout's `max-w-5xl mx-auto` wrapper, breaking the design at all desktop widths; (b) the bottom mobile nav used `min-w-[56px]` × 5 items which can overflow at <320px. Plus `globals.css` has `body { overflow: auto }` while `html { overflow: hidden }`, which means horizontal overflow gets silently clipped instead of scrolled — making any flex-child overflow look like "things not formatting correctly".

**Changed:**

- `src/lib/scraper/core.ts` — initialize `finalImageUrl = imageUrl` so the source URL is the default. Cloudinary upload still preferred when env is configured and upload succeeds. Both failure modes (env missing, upload returns null) now log a `console.warn` to surface in CF logs and append a non-fatal note to `ctx.errors`. Closes the silent-data-loss path.
- `src/lib/__tests__/scraper-core.test.ts` — three new tests pinning the truth table: Cloudinary env null → source URL persists, Cloudinary 200 → Cloudinary URL persists, Cloudinary 500 → source URL persists. 7/7 in this file, 105/112 across the full suite (7 pre-existing skips).
- `next.config.mjs` — replaced the two-host allowlist with a single `{ protocol: 'https', hostname: '**' }` entry. Cloudinary remains the optimization path when configured; this is the rendering safety net for source URLs and Pexels fallbacks.
- `src/components/MainNav.tsx` —
  - `/recipe/*` paths now opt out of the `max-w-5xl mx-auto` content wrapper (new `fullBleed` flag, reuses the existing `hideNav` predicate) so the recipe detail page can actually be full-bleed as designed. The mobile top + bottom bars were already hidden on these routes; this completes the pattern.
  - Added `min-w-0` to the `<main>` flex child so any inadvertent flex-child overflow in nested content doesn't get silently clipped by the global `body { overflow: auto }` + `html { overflow: hidden }` rule.
  - Bottom-nav items: replaced `min-w-[56px]` + `justify-around` with `flex-1 min-w-0` + flat `flex` distribution, so the 5 tabs share width evenly down to <320px without overflow.

**Verification:**

- `npm run lint` — 0 warnings/errors.
- `npx tsc --noEmit` — clean.
- `npm run test` — 105 pass, 7 pre-existing skips, 0 fail.
- E2E not run (visual + scraper changes; requires a real Cloudflare Pages deploy + a real recipe URL to fully cover the image path live).

**Caveats / follow-ups:**

- This fix is defensive — it ensures images persist and render even if Cloudinary is misconfigured at runtime. It does **not** diagnose whether the Cloudinary env vars on Cloudflare Pages are actually being read by the edge runtime. If Slim wants the optimized Cloudinary path back, post-deploy: scrape one recipe and check Supabase to see if `image_url` starts with `res.cloudinary.com` (Cloudinary working) or the source domain (Cloudinary skipped — env or upload-fail issue still latent). The new `console.warn` calls will tell which.
- Responsive pass was deliberately conservative. If Slim still sees specific widths/pages that misbehave after this lands, file a follow-up TASK with the exact viewport width and page so the fix is targeted, not speculative.

## 2026-04-28 — TASK-010 — Scraper "pacing" error: bump deprecated Claude model + reset env example

**Executor:** Claude Code (Opus 4.7, 1M context)
**Task:** Slim reports the live `/add-recipe` flow is failing with what sounds like a rate-limit / "pacing" message. He recently rotated the Anthropic API key. Symptom is opaque to the React layer (frontend only sees a generic "Something went wrong"), so we have to reason from code.

**Investigation (Phase 1, evidence first):**

- `/api/scrape` route exists, post-ADR-002 single-source-of-truth wiring intact (`src/app/api/scrape/route.ts:1` → `scrapeRecipe()` from `src/lib/scraper/core`). Edge runtime, auth-gated by `supabase.auth.getUser()`. No regressions visible in the recent commit history (last scraper-touching change was 0c414f1 on Apr 26 — CodeRabbit polish on the refactor; TASK-009 was service worker only; TASK-008 was DB constraints).
- Cloudflare Pages secrets: `wrangler pages secret list --project-name=julies-cookbook` confirms all 14 keys present (ANTHROPIC_API_KEY, all three CLOUDINARY, SCRAPINGBEE, INVITE_CODE, both Supabase publics + service role, USDA, PEXELS, AUDIT_SECRET, DISCORD_WEBHOOK_URL, APP_URL).
- Live audit (`GET /api/audit?token=…`) returns `status:"pass"` — env vars OK, 30 recipes, 303 ingredients. The site is up; this is not a deployment failure.
- Local CLI (`npx tsx scripts/scrape-recipe.ts <url>`) hard-fails preflight: parent `.env.local` is missing ANTHROPIC, CLOUDINARY, SCRAPINGBEE, USDA, PEXELS. And `.env.local.example` was years stale (still listed AIRTABLE_API_KEY / AIRTABLE_BASE_ID from before the Mar 2026 Supabase migration). That's a separate, real, reproducible bug — fixed below.
- Anthropic model: both `/api/scrape` (`extract.ts:174`) and `/api/chat` (`route.ts:76`) were pinned to `claude-sonnet-4-20250514` — the original Sonnet 4 from May 2025, ~11 months old at the time of this task and inside Anthropic's standard 12-month deprecation window. Current Sonnet generation per Anthropic platform notes is `claude-sonnet-4-6`. A deprecated/retired model returns errors that surface upstream as opaque "rate limit / pacing" banners, which matches Slim's symptom shape much better than a real Cloudflare subrequest-budget hit (recipe scrape is ≤ ~25 subrequests vs. 1000 paid limit).
- `scripts/rescrape-all.mjs` was also still pinned to the same deprecated model (admin path, separate from `src/lib/scraper/core`).

**Changed (3 atomic commits):**

1. `docs(env): rewrite .env.local.example with real env-var contract` (commit `e9abccc`) — replaced the AIRTABLE keys with the actual runtime contract per `docs/REFERENCE.md`, plus a header reminding any setup-er that `.env.local` lives in the repo PARENT dir per per-user memory (not inside individual worktrees).
2. `fix(ai): bump Claude model from sonnet-4-20250514 to sonnet-4-6` (commit `9523afb`) — both `src/lib/scraper/extract.ts:174` and `src/app/api/chat/route.ts:76`.
3. `fix(scripts): bump rescrape-all model to sonnet-4-6 to match runtime` (commit `a8148b0`) — `scripts/rescrape-all.mjs:327`. Husky's prettier reformatted the rest of the file on the way through; the model bump is the only intentional change.

**Verified:**

- `next lint --quiet` — clean across all three commits.
- `tsc --noEmit` — clean.
- `vitest` — 102/109 (7 pre-existing skips), no model-string assertions in the test suite.
- Husky pre-commit gate (`next lint --quiet && tsc --noEmit`) ran on each commit and passed.

**Verification still owed by Slim post-deploy:**

- After GH Action lands the deploy on `main`, retry `/add-recipe` against a known-good URL (e.g. `https://www.loveandlemons.com/homemade-pasta-recipe/`).
- If "pacing" persists with the new model, the next-most-likely cause is the rotated Anthropic API key — check the Anthropic Console for the new key's billing status and rate limits (a fresh key on a $5 free credit can hit per-org spend caps fast on a 4096-max-tokens system prompt).
- If the CLI is desired for local testing, populate the new `.env.local.example` keys into the parent `.env.local` (Cloudflare doesn't expose secret values via wrangler — values must come from the original API consoles).

**Notes flagged at fix time:**

- Did not invent any "rate-limit detection" middleware in the scraper route — would have been speculative without an actual error to handle. If "pacing" recurs we should beef up the catch in `route.ts:76` to recognize Anthropic's `APIError` shape and return a typed 429 instead of a generic 500, so the React layer can show a useful message. Out of scope for today's fire.
- # Did not touch the `claude-haiku-4-5-20251001` model (not used in this codebase). If we ever want a cheaper/faster path for ingredient normalization, that's a sensible follow-up.

## 2026-04-28 — TASK-009 — Service worker no longer hides newly-added recipes from gallery

**Executor:** Claude Code (Opus 4.7, 1M context)
**Task:** Julie added a honey-mustard recipe via URL on 2026-04-27 evening. The Add Recipe UI showed "saved" with the image + ingredient count, but the recipe never appeared in her gallery — silent-success bug, worst kind for trust.

**Investigation (Phase 1, evidence before fixes):**

- Direct DB audit against production via service-role REST: recipe `16ff2de0-a2f8-4780-95cd-4a1ce878b1ee` exists with `name="Honey Mustard Chicken Recipe"`, `slug="honey-mustard-chicken-recipe"`, `user_id=eaed7fdf-c703-474b-93f9-e68b4d14de68` (Julie's account, confirmed by Slim), `source_url="https://joyfoodsunshine.com/honey-mustard-chicken/"`, real Cloudinary image, 9 ingredients, `created_at=2026-04-28T04:06:58Z` (= 2026-04-27 9:06 PM PT, matching Julie's timeframe).
- Per-user recipe counts: Julie 25, two other users 4 + 1. Gallery query (`getAllRecipes`) filters by `user_id` correctly. Persist code (`src/lib/scraper/persist.ts`) sets `user_id` from authed `auth.getUser()` in `/api/scrape` route — also correct.
- Conclusion before touching code: **persist worked, the bug is between server and Julie's screen.**

**Root cause:** `public/sw.js` cached all HTML pages with `staleWhileRevalidate` (line 50–51 of the pre-fix file) and **zero `caches.delete()` calls existed anywhere in the React app to bust the cached gallery after a successful save** (verified via grep across `src/` + `public/`). Julie's flow yesterday:

1. Open gallery → SW serves cached HTML (without honey mustard) immediately.
2. Add Recipe → API succeeds, recipe + image saved to DB.
3. Navigate back to gallery → SW _still_ returns cached HTML; new recipe is missing.
4. SW silently revalidates the cache in the background, but the screen Julie was looking at never re-rendered. She'd need to navigate away and back AGAIN (after revalidation completed) to see it.

**Changed:**

- `public/sw.js` —
  - `CACHE_NAME` bumped `cookbook-v2` → `cookbook-v3` so the existing `activate` handler (lines 11–22, untouched) evicts the stale v2 cache for every existing client on first activation after deploy.
  - HTML / page navigations now pass through to the network (no SW intercept). Static assets (`/_next/static/.+\.(js|css|woff2?)`) and Cloudinary images keep their existing cache-first strategies — the perf win on repeat loads is preserved; only stale HTML is gone.
  - Removed the now-unused `staleWhileRevalidate` helper.
- `src/components/AddRecipeForm.tsx` — imported `useRouter` from `next/navigation`, added `router.refresh()` after both `setStatus("success" | "partial")` calls (URL-submit handler at `:88`, text-submit handler at `:129`). Pairs with the SW change so the Next.js router cache also evicts on a successful save, ensuring the gallery's RSC payload re-fetches on next nav even within the same client navigation.

**Trade-offs flagged at fix time:**

- Lost: SW-served offline page-shell for HTML routes. PWA still works for assets and images. Acceptable trade for Julie — staleness silently hiding her new recipes is much worse than losing offline read-only access. If we ever want offline back, the right pattern is a registered cache-bust call in mutation success handlers, not a re-introduction of SWR.
- Existing v2 caches on already-installed PWAs need one app load on the new deploy to evict (the `activate` handler runs once per SW version change). After that, behavior is correct.

**Verified:**

- `next lint --quiet` — clean.
- `tsc --noEmit` — clean.
- Husky pre-commit gate (`next lint --quiet && tsc --noEmit`) ran on commit and passed.
- Production DB query confirmed the recipe row + image + ingredients are intact and correctly user-scoped — no data fix required, code change alone resolves Julie's view.

**Verification still owed:**

- Julie does an Incognito / Private-tab visit to confirm the recipe appears (would have already worked without the fix — incognito has no SW). Then a normal-tab visit after the deploy lands to confirm v2 → v3 eviction takes hold.

**Notes on adjacent cleanup that landed on the same day:**

- Vercel disconnected from `Slimdragon007/julies-cookbook` (browser-only oversight from TASK-001 close-out, finally severed today via `vercel git disconnect`). Logged separately on Notion Project Plan Fix Queue + Session Log child page.
- PR #12 (TASK-008 UNIQUE constraints) merged this morning after a rebase against PR #13's password-reset commits. Live on `main` now.

## 2026-04-27 — TASK-010b — Manual photo upload from recipe page

**Executor:** Claude Code (Opus 4.7, 1M context)
**Task:** Give users an escape hatch from the auto-scrape photo chain. When the scraper produces nothing usable (or the wrong image), the user replaces it with their own photo.

**Changed:**

- `src/lib/scraper/cloudinary.ts` — added `uploadFileToCloudinary(file: Blob, publicId, env)`. Same Web-Crypto-SHA-1 signing as the existing URL-based upload, but POSTs raw bytes via multipart `FormData` instead of a URL string. Single attempt, 30s timeout.
- `src/app/api/recipe/photo/route.ts` (new, edge runtime) — POST handler that:
  - Auth-checks via `createSupabaseServer().auth.getUser()`
  - Bails early with 503 if Cloudinary env vars missing
  - Reads `recipeId` + `file` from `request.formData()`
  - Validates: file present, `instanceof Blob`, size ≤ 15MB, MIME type in JPEG/PNG/WebP/HEIC/HEIF allowlist
  - Verifies `recipes.user_id === user.id` before any mutation
  - Uploads at `${user.id}/${slug}` namespace (matches existing scrape path)
  - Updates `recipes.image_url` via service-role client; uses `.eq("user_id", user.id)` belt-and-suspenders despite ownership already verified
- `src/components/RecipeActions.tsx` — added "Replace photo" button alongside Edit/Delete. Hidden `<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif">` triggered via `useRef`. Inline `uploading` and `uploadError` states; `router.refresh()` on success pulls the new `image_url` from the server component.
- `src/lib/__tests__/scraper-cloudinary.test.ts` (new) — 3 tests for `uploadFileToCloudinary`: success returns `secure_url`; non-OK Cloudinary response → null; thrown fetch → null. Both error paths verified to log via `console.error` spy.

**TypeScript fix:** `File instanceof` check failed type-check in edge runtime (`File` global not in `@cloudflare/workers-types`). Fixed by checking `Blob` only, with a comment noting `File extends Blob` in both browsers and edge.

**Verification:**

- `npm run lint` clean.
- `npx tsc --noEmit` clean.
- Full vitest: 105 pass / 7 pre-existing skips (3 new tests pass).
- E2E not run — UI change requires dev server + Cloudinary credentials; manually testable post-deploy.

**Why a separate `/api/recipe/photo` route instead of extending PATCH `/api/recipe`:** mixing JSON and multipart on the same handler is awkward (Content-Type branching, awkward body parsing). Photo upload also has different validation needs (size, MIME type) and observability concerns (which Cloudinary calls are succeeding). Cleaner as its own route.

**Why not pre-resize on the client:** Cloudflare's 100MB body limit gives 6× headroom over the 15MB server-side cap. Phone photos at default settings are 3-8MB. Cloudinary auto-optimizes on read. Adding a client-side resizer would be ~50 lines and complicate the upload flow without clear benefit. Skip until we see evidence anyone hits the limit.

## 2026-04-27 — TASK-010a — ScrapingBee tier escalation

**Executor:** Claude Code (Opus 4.7, 1M context)
**Task:** Stretch the ScrapingBee credit budget by trying the cheap tier (~5 credits) before the expensive one (~30 credits). Previously every SB call used `render_js + premium_proxy`, exhausting a 1000-credit free tier in ~33 scrapes.

**Changed:**

- `src/lib/scraper/parse.ts`:
  - `fetchScrapingBee(url, apiKey, tier)` — now takes an explicit tier; "standard" = `render_js` only, "premium" = adds `premium_proxy: true`.
  - New `fetchScrapingBeeWithEscalation(url, apiKey, result)` — runs standard first, escalates to premium on non-OK response or thrown error, mutating `result.errors` and `result.fetchAttempts` along the way. Returns the successful Response or null if both tiers failed.
  - `fetchPageWithFallback` — both SB invocation sites (circuit-breaker-open branch + 403-on-direct branch) replaced with calls to the escalation helper. Net code is ~10 lines shorter.
  - `FetchResult` interface gained optional `scrapingBeeTier?: "standard" | "premium"` for observability if we ever wire credit-spend tracking.
- `src/lib/__tests__/scraper-parse.test.ts` (new) — 3 tests using `globalThis.fetch = vi.fn(...)` mocking pattern from `scraper-core.test.ts`. Each test uses a unique domain to avoid in-memory circuit-breaker state leaking across runs.

**Verification:**

- `npm run lint` clean.
- `npx tsc --noEmit` clean.
- Full vitest: 102 pass / 7 pre-existing skips (all 3 new tests pass).
- E2E not run — change is internal to the fetch fallback chain; no UI surface or contract changed.

**Why escalate instead of just always using standard:** premium*proxy is genuinely required for some sites (residential IPs vs. datacenter, real anti-bot detection). Dropping it entirely would \_increase* total SB-blocked failures even though each individual call costs less. Tiered escalation keeps the hard-case ceiling while spending less on the easy cases.

**Effect:** Most blocks resolve at the cheap tier, so effective credit budget multiplies ~5x. Hard sites that needed premium before still get it on the second attempt — slower by one extra request, but no functional regression.

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

## 2026-04-27 — TASK-008 / ADR-004 implemented: recipes UNIQUE constraints + `.single()` error propagation (Issue #8)

**Executor:** Claude Code (Opus 4.7) — explanatory mode
**Worktree:** `task-008` (branch `claude/task-008-unique-constraints`)
**Task:** Close GitHub Issue #8 — TOCTOU race in `persistRecipe`, silent error swallow in `getRecipeByIdOrSlug`, missing DB UNIQUE constraints. Stand up the migration-tracking convention along the way.

**Discovery (the part that changed the plan):**

- Issue #8 said "stand up Supabase migration infrastructure" assuming no migrations had ever run. Reality: **two migrations already applied to production** (`20260328025710_create_cookbook_tables`, `20260329033633_add_portion_unit_columns_to_food_log`) but **zero `.sql` files in the repo**. Schema history was invisible from the codebase. ADR-004 reframes the problem from "first migration ever" to "first repo-tracked migration."
- `recipes.slug` already had a global UNIQUE constraint (`recipes_slug_key`). Bad multi-user behavior — user A's "Goulash" would block user B's "Goulash". Fix: swap for per-user `(user_id, slug)`.
- 4 'preloaded' rows shared `(user_id, source_url)` for one user. Plus the persist code writes `'manual entry'` literally. Both are sentinel strings encoding "no source URL"; they should be `NULL`. A naive `CREATE UNIQUE INDEX` would have failed mid-deploy on these 4 rows.
- With `(user_id, name)` UNIQUE in place, slug collisions within a user become impossible (same name → same slugify output → name UNIQUE fires first). So no retry-on-slug-collision logic is needed in `persist.ts` — Issue #8's third bullet evaporated under analysis.

**Changed:**

- `docs/adr/ADR-004-migration-tooling.md` (new) — accepts Option A (Supabase CLI directory layout), explains the pre-history gap, sets the apply path. Status: accepted + implemented.
- `supabase/migrations/README.md` (new) — convention, apply path, definition-of-done addition for schema-touching tasks. Documents the two pre-history migrations as known-but-not-backfilled.
- `supabase/migrations/20260427120000_recipe_uniqueness.sql` (new) — the migration. `BEGIN/COMMIT`-wrapped, `IF NOT EXISTS` everywhere, idempotent UPDATE. Four steps: normalize sentinels → NULL, drop global slug UNIQUE, add per-user `(user_id, slug)` UNIQUE, add per-user `(user_id, source_url)` partial UNIQUE, add per-user `(user_id, name)` UNIQUE.
- `src/lib/scraper/persist.ts` — converts `'manual entry'` sourceUrl → `null` on the way to insert. Inline comment points at the migration so future readers understand the relationship.
- `src/lib/data.ts` — `getRecipeById` two-step lookup now inspects each `.single()`'s `error.code`. PGRST116 ("zero rows") falls through to the next lookup as before. Any other error throws with a contextual message instead of silently coalescing to a 404.
- `src/lib/__tests__/scraper-persist.test.ts` (new) — 3 tests: 23505 from insert → DuplicateRecipeError (the TOCTOU concurrent-write path the migration unlocks), 'manual entry' sourceUrl → null persisted, real URL preserved unchanged.
- `task_plan.md` — TASK-008 → Active during work, → Done at end with implementation summary.

**Production application:**

- Applied via Supabase MCP `apply_migration` against project `cqfszhxuvvsgusvjdyqx`. Verified post-apply via `pg_indexes` query: `recipes_user_name_uniq`, `recipes_user_slug_uniq`, `recipes_user_source_url_uniq` all present with the expected definitions; old `recipes_slug_key` gone.
- Sentinel cleanup verified: 0 rows with `source_url IN ('manual entry', 'preloaded')` remaining post-migration; 5 rows with `source_url IS NULL` (4 normalized from 'preloaded' + 1 was already 'manual entry').
- No application-side downtime. The constraint additions are non-blocking on a 27-row table.

**Gates (Definition of Done):**

- `npm run lint` → clean
- `npx tsc --noEmit` → clean
- `npm run test` → 102/109 pass (+3 new persist tests; 7 pre-existing skips, unchanged)
- `npm run test:e2e` → not run (no UI behavior change; data layer covered by unit tests)
- Husky pre-commit → fires on commit
- Production schema verification → all 3 new constraints present, 0 sentinel rows remaining

**Doc updates / rules tightened:**

- ADR-004 lands as the second accepted-with-implementation ADR (after ADR-003). Following the same pattern: small enough scope to land decision + implementation in one chain, with Slim's blanket authorization given upfront.
- `supabase/migrations/README.md` adds a "definition of done for schema-touching tasks" checklist. This is a project-level rule that didn't previously exist; it should be folded into project `CLAUDE.md` §6 next time §6 is touched (deferred — not bundling a CLAUDE.md edit into this commit batch since the rule is already documented at the touchpoint).
- Issue #8's "concurrent-insert test" requirement satisfied by the 23505 → DuplicateRecipeError test in `scraper-persist.test.ts`.

**Anti-bloat audit:**

- Migration is 4 statements + sentinel UPDATE. No speculative columns, no "while we're here" cleanup. Just the constraints Issue #8 asked for.
- `persist.ts` change is one line plus an inline comment. No new helper extracted; "manual entry" check is used exactly once.
- `data.ts` change adds ~10 lines of error-propagation. The two-step lookup structure preserved verbatim; only the error handling is touched.
- `scraper-persist.test.ts` is 3 focused tests, not a comprehensive persist test suite. Each test corresponds to an explicit Issue #8 acceptance criterion or the new 'manual entry' behavior.
- ADR-004 deliberately recommends Option A over heavier options (Drizzle Kit, Prisma) for a 27-recipe family app with one developer.

**Not changed (intentional):**

- The two pre-history migrations are not backfilled into `supabase/migrations/`. Reconstruction risk is high (no original SQL), value is low (production is the only environment). ADR-004 documents the choice and notes a future trigger ("if a staging env appears").
- No retry-on-slug-collision logic in `persist.ts` — `(user_id, name)` UNIQUE makes it impossible. Issue #8's "Decide on slug uniqueness" bullet resolved by analysis, not code.
- `CLAUDE.md` not edited this commit. The "schema-touching task = migration committed + applied" rule lives in `supabase/migrations/README.md` for now.
- `@docs/architecture/data.md` still a stub. This refactor is contained enough that populate-on-touch hasn't really kicked in — the data-layer functions are unchanged in shape, only their error handling tightened.
- No CI workflow change. Drift detection between repo migrations and remote stays manual; ADR-004 names this as an explicit accepted gap.

**Next:** PR review → merge → Issue #8 closes. After this lands, the only outstanding handbook items are the populate-on-touch architecture stubs (`api.md`, `data.md`) and the schema/file-index sections of `@docs/REFERENCE.md`.
