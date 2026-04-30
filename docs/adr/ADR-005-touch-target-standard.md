# ADR-005: Touch-target standard for Hearth interactive controls

**Date:** 2026-04-30
**Status:** accepted + implemented
**Decider:** Michael Haslim

## Context

Julie reported on 2026-04-29 that the `−` / `+` buttons on the recipe ingredient scaler did not respond to taps on her phone — in her words, "white space was covering the whole thing." Bench analysis (TASK-013) found two causes: a header layout that overlapped on narrow viewports, and `w-9 h-9` (36px) buttons that fall below the iOS Human Interface Guidelines and WCAG 2.5.5 minimum tappable size of 44×44 CSS px.

The Hearth design system spec at `docs/design/component-specs.md:170` then made the situation worse for the in-flight Phase 2 reskin: it called for `w-8 h-8` (32px) buttons in `ServingsScaler` — smaller than the broken 36px. Shipping Phase 2 as specced would have deployed a regression of a known bug. This ADR resolves the underlying standards question so Phase 2 (Recipe Detail) and the future +/- patterns in Phase 4 (Food Log) inherit a consistent rule.

The Hearth visual language is built around restraint — small icon circles, generous whitespace, deliberate typographic rhythm. The accessibility constraint and the design intent are in tension only if "tap target = visible element." If we separate the visible element from the hit area, both can be honored.

## Options considered

### Option A — Direct 44px (`w-11 h-11` visual)

- Pros: simplest mental model; matches iOS HIG verbatim; visible target = actual hit target; no wrapper layer.
- Cons: enlarges the visual element away from the Hearth restraint intent; in `ServingsScaler` specifically, widens the right-pill to ~228px which makes the existing header overlap problem worse, not better; aesthetic cost compounds across many small icon buttons in the app.

### Option B — Hit-area padding (visual ≤ 36px, hit area 44×44)

- Pros: preserves the Hearth design intent; meets iOS HIG and WCAG 2.5.5; established industry pattern (Apple's own apps in iOS Mail / Messages use ≤24-32px visual icons with 44pt hit areas); composes with adjacent layout — narrower visual elements wrap more gracefully on small viewports; encodable as a primitive variant for consistency.
- Cons: requires care that adjacent hit areas don't collide (in `ServingsScaler` the count label between `−` and `+` has `gap-3` (12px), so 6px hit-area extension each side fills exactly the gap with no overlap — verified); slight indirection (caller renders visual as a child, not as the button itself).

### Option C — Native `<input type="number">` stepper on mobile

- Pros: free 44pt hit area from the platform; free accessibility (VoiceOver knows it's a stepper); no custom styling needed.
- Cons: native steppers look completely different per OS (iOS pill, Android underline, web spinbox) — breaks the Hearth design rule of "one signature per surface"; would mean shipping a meaningfully different mobile experience than desktop, doubling the design surface.

## Decision

**Option B (hit-area padding).** Visual ≥ 32px, hit area ≥ 44×44, achieved via padding extension on the outer `<button>` element rather than enlarging the visual.

This is encoded in the existing `Button` primitive at `src/components/ui/Button.tsx` as a new variant: `<Button variant="icon">`. The "icon" variant produces a `w-11 h-11` (44×44) invisible hit area. The caller renders the visible element (typically a `w-8 h-8` rounded circle span carrying bg/hover/active styles) as the child of the Button. Disabled state is carried by the outer button (via `disabled:opacity-40`) and cascades visually to the child.

## Consequences

**Immediate:**

- `Button` primitive gains an `icon` variant (this commit).
- `docs/design/component-specs.md` updated so `ServingsScaler` and any other +/- controls reference `<Button variant="icon">` in their reference snippets.
- `docs/design/hearth-reskin-plan.md` Phase 2 BLOCKER callout marked resolved, pointing here.
- Phase 2 (Recipe Detail) is unblocked and can be implemented against the unified standard.

**This locks us into:**

- All icon-only / circular interactive elements in Hearth use the `Button variant="icon"` outer + visual-child-span pattern. Inline raw `<button class="w-9 h-9 …">` is now an anti-pattern in new code.
- Visual element styling lives on the inner span, not on the button. Hover / active animations target the visible circle.
- Adjacent tap targets must consider the 44×44 bounds when computing layout collisions, not the visual circle bounds.

**What we give up:**

- One-line raw `<button>` markup for icon controls. The new pattern is two elements (button wrapper + visual span) instead of one.
- The option of using the existing `Button` `loading` prop on icon variant cleanly — `Loader2` would render alongside the visual child, which looks awkward. Acceptable trade since icon buttons are typically discrete actions without loading state.

**What does NOT change:**

- Existing textual `Button` variants (`primary` / `secondary` / `ghost`) remain the standard for any text-bearing CTA. Their padding-based sizing already meets the 44pt minimum for the visible button, no separate hit-area treatment needed.
- The TASK-013 fix on PR #21 (off `main`) uses raw inline classes with the same hit-area pattern, since the `Button` primitive doesn't exist on `main` yet. When PR #20 + this branch merge, that inline code will be refactored to use `<Button variant="icon">` as part of the Phase 2 IngredientsTab reskin.

## Rollback plan

If the hit-area-padding pattern proves problematic in practice (e.g. if accessibility audits flag the inner span confusing for screen readers, or if adjacent tap-area collisions surface in unanticipated layouts), rollback is incremental:

1. Decide whether the issue is the pattern itself or this specific implementation. If implementation: tweak the icon variant's class (e.g. `min-w-[44px] min-h-[44px]` instead of fixed `w-11 h-11`).
2. If the pattern itself is wrong: revisit Option A (direct 44px). The migration is mechanical — for each `<Button variant="icon"><span class="w-N h-N …">…</span></Button>` callsite, change to `<button class="w-11 h-11 … bg-… text-… hover:… active:…">…</button>` with styling inlined and the wrapper span removed. ~5 minutes per callsite. ServingsScaler is the only Phase 2 callsite at decision time; food-log and other Phase 4 callsites would also need refactoring.
3. Update this ADR with `Status: superseded by ADR-MMM` and write the new ADR.
