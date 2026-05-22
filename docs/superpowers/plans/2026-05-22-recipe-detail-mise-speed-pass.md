# Recipe Detail MISE Speed Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Recipe Detail closer to the accepted MISE design language in a fast, frontend-only pass.

**Architecture:** Keep this frontend-only. Reuse existing Recipe Detail data, tabs, nutrition math, ingredient scaling, and action APIs. Styling changes stay in existing Recipe Detail components.

**Tech Stack:** Next.js 14 App Router, React client components, Tailwind 3, Playwright e2e.

---

### File Structure

- Modify: `src/components/RecipeTabs.tsx`
  - Convert recipe tabs from underline/glass to MISE segmented tabs.
  - Fix touched numeric fallback from `||` to `??`.
- Modify: `src/app/(main)/recipe/[id]/page.tsx`
  - Tighten Recipe Detail shell, stats, and content rhythm toward MISE.
- Modify: `src/components/IngredientsTab.tsx`
  - Light polish only if needed for spacing after new tab shell.
- Modify: `src/components/InstructionsTab.tsx`
  - Retone method steps to MISE card/rule language.
- Modify: `src/components/NutritionTab.tsx`
  - Retone nutrition panels and fix touched numeric fallbacks.
- Create: `e2e/recipe-detail-mise.spec.ts`
  - Regression coverage for MISE tab styling, tab interaction, and nutrition panel availability.
- Update: `task_plan.md`, `progress.md`, `docs/architecture/ui.md`
  - Record task state and UI reality.

### Task 1: Red E2E Coverage

- [x] Add `e2e/recipe-detail-mise.spec.ts`.
- [x] Assert Recipe Detail Ingredients tab uses the MISE active tab class.
- [x] Assert Instructions and Nutrition tabs switch content.
- [x] Run `npm run test:e2e -- e2e/recipe-detail-mise.spec.ts`.
- [x] Expected: fail before implementation.

### Task 2: Recipe Detail MISE Styling

- [x] Update Recipe Detail shell, stat row, tabs, ingredient header, instructions, and nutrition panel tone.
- [x] Keep action APIs and nutrition math untouched.
- [x] Fix touched numeric fallbacks to avoid `||` on numeric values.

### Task 3: Verification

- [x] Run the targeted e2e spec.
- [x] Run lint, TypeScript, unit tests, production build, and targeted e2e coverage.
- [x] Verify in the in-app browser at mobile width.
