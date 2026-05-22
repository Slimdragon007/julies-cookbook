# Ingredient Display Units Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Superseded 2026-05-22 by `docs/superpowers/plans/2026-05-22-recipe-detail-mise-speed-pass.md` / TASK-034. The ingredient unit work shipped as part of the Recipe Detail MISE speed pass, along with Recipe Detail visual cleanup and e2e coverage.

**Goal:** Add a recipe-ingredient display control that lets the user switch ingredient quantities between Original, US, and Metric without changing stored recipe data or nutrition math.

**Architecture:** Extend the existing display-only measurement system. `unit-conversions.ts` remains the only conversion helper, `measurement-system.tsx` remains the local preference provider, and `IngredientsTab.tsx` remains the only recipe-detail surface changed.

**Tech Stack:** Next.js 14 App Router, React client components, Tailwind 3, Vitest.

---

### File Structure

- Modify: `src/lib/unit-conversions.ts`
  - Expand `MeasurementSystem` from two options to `original | us | metric`.
  - Preserve `toGrams()` and macro math behavior.
  - Add bidirectional display conversions for common metric and US volume/weight units.
- Modify: `src/lib/measurement-system.tsx`
  - Accept the new `original` and `us` stored values.
  - Default to `original` so the recipe first shows source units.
  - Keep localStorage persistence only.
- Modify: `src/components/ui/MeasurementToggle.tsx`
  - Render three compact choices: Original, US, Metric.
  - Keep the existing shared primitive name so call sites do not churn.
- Modify: `src/components/IngredientsTab.tsx`
  - Use `convertForDisplay()` for all three modes.
  - Fix numeric fallback from `||` to `??` in the touched servings code.
  - Add a tiny label so users understand the control changes ingredient units.
- Test: `src/lib/__tests__/unit-conversions.test.ts`
  - Add red tests for Original mode, US conversion from metric source units, and Metric conversion from US source units.
- Docs: `task_plan.md`, `progress.md`, `docs/architecture/ui.md`
  - Record the active/completed task and the new UI behavior.

### Task 1: Red Tests

- [x] Add tests proving `convertForDisplay()` supports `original`, `us`, and `metric`.
- [x] Run `npx vitest run src/lib/__tests__/unit-conversions.test.ts`.
- [x] Expected result: TypeScript/test failure because `original` and `us` are not implemented yet.

### Task 2: Conversion Helper

- [x] Expand the `MeasurementSystem` type.
- [x] Keep macro helpers untouched.
- [x] Implement display-only conversions:
  - `metric`: `cup/tbsp/tsp -> ml`, `oz/lb -> g`.
  - `us`: `ml/l -> tsp/tbsp/cup`, `g/kg -> oz/lb`.
  - `original`: scaled amount with normalized source label.
- [x] Run `npx vitest run src/lib/__tests__/unit-conversions.test.ts`.
- [x] Expected result: pass.

### Task 3: UI Control

- [x] Update `MeasurementSystemProvider` to read/write all three values.
- [x] Update `MeasurementToggle` labels to Original / US / Metric.
- [x] Update `IngredientsTab` copy and display logic.
- [x] Run `npm run lint` and `npx tsc --noEmit`.

### Task 4: Browser QA

- [x] Run targeted tests and build checks.
- [x] Start or reuse `http://localhost:3000`.
- [x] Open the recipe detail route in Chrome.
- [x] Confirm the ingredient unit control visually appears and changes row quantities.
