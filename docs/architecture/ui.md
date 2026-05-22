# Architecture: UI

> Load trigger: any UI work. See base handbook Law 3.

**Status:** Mixed historical/current. Populated 2026-04-27 for Liquid Glass, then partially superseded by the Paper Editorial and MISE migration stack. Current-state notes below take precedence when they conflict with older Liquid Glass guidance.

## Current state: Paper Editorial + MISE

As of TASK-034 (2026-05-22), established app surfaces are no longer pure Liquid Glass. The active visual direction is Paper Editorial with MISE details:

- Paper/card/rule tokens: `bg-paper`, `bg-card`, `border-rule`, `text-ink`, `text-ink-soft`, `text-accent`.
- Typography: display-serif italic for major recipe headings, sans for controls and labels, mono/tabular numerals for measurements and macro values.
- Recipe Detail tabs use ARIA tab semantics with a segmented pill shell. Active tab is `bg-ink text-card`; inactive tabs are quiet `text-ink-soft` controls.
- Recipe Detail ingredient display units are a visible `Original / US / Metric` segmented control. Units are normalized before render, so slash-prefixed source units like `/cup` display as `cup`.
- Recipe Detail keeps backend contracts unchanged. Data fetch, slug fallback, auth, nutrition math, scraper, and env naming are not part of UI migration work.

The older Liquid Glass section remains as project history and for untouched surfaces that still carry those classes. When editing a migrated surface, prefer the current Paper/MISE tokens above.

## Design system: Liquid Glass (warm)

The visual language is "Liquid Glass" — warm-tinted, frosted, low-contrast surfaces floating over an animated cream background. Not a blue / cool design.

**Palette** (defined in `src/app/globals.css:5-11`):

| Token               | Hex       | Use                                                 |
| ------------------- | --------- | --------------------------------------------------- |
| `--warm-cream`      | `#FAF8F4` | Page background                                     |
| `--warm-gold`       | `#C4952E` | Primary accent (focus rings, viewport `themeColor`) |
| `--warm-gold-light` | `#D4A853` | Secondary accent                                    |
| `--warm-brown`      | `#8B7355` | Body text low-emphasis, ambient orb tint            |
| `--warm-dark`       | `#2D2417` | Body text                                           |

In Tailwind class space the palette is expressed via the `amber-*` and `orange-*` scales (closest matches), with semantic accent colors per stat: `emerald-*` (servings, success), `rose-*` (calories), `purple-*` (fat), `sky-*` (rare, used for chat affordances). Never reach for arbitrary blues — there is no canonical blue here.

**Font:** Inter (loaded via `next/font/google` in `src/app/layout.tsx`, exposed as `--font-inter`). Both `font-display` and `font-body` map to Inter in `tailwind.config.ts`.

**Tailwind:** v3.4. No plugin set; the theme is extended only with the Inter font family. Everything else is utility-first plus the four custom CSS classes below.

## Custom CSS utilities (in `src/app/globals.css`)

These are the only non-Tailwind classes in the codebase. Use them; do not re-implement the glass effect with raw `backdrop-blur` + `bg-white/N` since they encode the warm tint and the consistent border + shadow.

| Class          | Purpose                                                                                                                               | Backdrop blur |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `glass`        | Default frosted card. Cream-tinted, soft border + tiny shadow.                                                                        | `20px`        |
| `glass-strong` | Heavier blur for floating chrome / drawers.                                                                                           | `40px`        |
| `glass-input`  | Form input glass with `:focus` ring in warm-gold.                                                                                     | `12px`        |
| `ambient-bg`   | Fixed full-viewport background with two animated radial-gradient orbs and a faint grid overlay. Used in the root `(main)/layout.tsx`. | —             |
| `no-scrollbar` | Hides scrollbar while preserving scroll. Used on horizontal carousels.                                                                | —             |

Page-level `fadeIn` keyframe on `main` gives every navigation a 200ms opacity + translateY transition.

## Component patterns

### 1. Server-renders-shell, client-renders-state

Pages are server components by default. A `"use client"` component is only introduced where local state, event handlers, or browser APIs are needed (`RecipeTabs`, `IngredientsTab`, `NutritionTab`, `ChatDrawer`, all forms).

The recipe detail page (`src/app/(main)/recipe/[id]/page.tsx`) is the canonical example: the server component fetches the recipe, computes the per-serving calorie summary once, and renders the chrome (hero, title, stat row). It then mounts `<RecipeTabs>` as a client island for tab state and the live serving-scaler. **Do not promote a parent to `"use client"` to add interactivity to a leaf — extract the leaf instead.**

### 2. Stat-row pattern (consolidated 4-cell summary)

Used at the top of recipe detail. `grid-cols-2 sm:grid-cols-4 gap-4`, each cell is `glass p-4 rounded-3xl flex flex-col items-center text-center`. Each cell has a colored swatch (`w-10 h-10 ${bg} rounded-2xl`) holding a Lucide icon, a `text-[10px] uppercase tracking-tighter` label, and a `text-sm font-bold` value.

The reflow `grid-cols-2 sm:grid-cols-4` is deliberate: at narrow viewports four cells crammed into one row become unreadable; the 2×2 fallback is the better mobile shape.

### 3. Tab bar patterns

Current Recipe Detail uses the TASK-034 MISE segmented control in `src/components/RecipeTabs.tsx`: `sticky top-0`, `grid grid-cols-3`, `rounded-pill`, `border-rule`, `bg-card`, with the active tab styled `bg-ink text-card`. Keep `role="tablist"` / `role="tab"` / `aria-selected` semantics intact so Playwright and assistive tech can target the tabs reliably.

Older Liquid Glass tab bars used a glass underline pattern. Treat that as historical when touching migrated Paper/MISE surfaces.

### 4. Mobile/desktop hero responsive split

Recipe detail uses a 2-column desktop layout that collapses to a single-column mobile stack. The hero image is `aspect-[4/3] lg:aspect-auto lg:h-screen lg:sticky lg:top-0` — mobile gets a 4:3 photo, desktop gets a full-height sticky panel. The content section uses `lg:overflow-y-auto lg:max-h-screen` so the image stays put while the content scrolls.

The mobile content panel "wraps" up over the image with `-mt-8 rounded-t-[3rem] glass shadow-[0_-8px_40px_rgba(0,0,0,0.05)]`, plus a centered drag-indicator strip — a deliberate iOS-sheet aesthetic.

### 5. Numbered-step instruction list

`src/components/InstructionsTab.tsx` — `space-y-8` with a `before:` pseudo-element rendering a vertical rail behind the step circles. Each step is a `flex gap-6` row: a `w-10 h-10 rounded-2xl bg-white` circle with the step number, then a `flex-1 glass p-5 rounded-3xl` card containing the body text. Body is `text-base` (16px) per the TASK-007 typography bump — do not regress to `text-[15px]`.

The step parser strips leading `1.`, `1)`, `1-` numerals from each line so source text that already includes its own numbering renders correctly.

### 6. Servings scaler

`IngredientsTab` exposes a `−` / `+` stepper that lifts state via `onServingsChange`. The parent `RecipeTabs` owns `servings` state and passes the scale factor (`servings / baseServings`) down to both `IngredientsTab` (to scale quantities via `formatQuantity`) and `NutritionTab` (to scale macros). One state, two consumers — keeps the scale propagation explicit.

### 7. Type scale

| Slot                | Class                                              |
| ------------------- | -------------------------------------------------- |
| H1 (recipe)         | `text-4xl xl:text-5xl font-bold`                   |
| H1 (mobile overlay) | `text-3xl sm:text-4xl font-bold`                   |
| Section header      | `text-2xl font-bold text-slate-800`                |
| Subsection          | `text-sm font-bold text-slate-800`                 |
| Body                | `text-base font-medium`                            |
| Stat value          | `text-sm font-bold`                                |
| Stat label          | `text-[10px] font-bold uppercase tracking-tighter` |

## Routing

- Recipe URLs use slugs, not UUIDs (project CLAUDE.md Rule 2). `getRecipeById()` falls back to UUID for back-compat — the back-compat branch is load-bearing for existing bookmarks; do not remove it.
- App Router. All page and API routes carry `export const runtime = "edge"` because the Cloudflare Pages adapter (`@cloudflare/next-on-pages`) requires the Edge runtime — Node-runtime routes will not deploy. Keep this when adding new routes.
- Auth runs in middleware (`src/middleware.ts`); cookie reads force dynamic rendering. The audit endpoint is the only route that explicitly sets `dynamic = "force-dynamic"`; the rest inherit dynamism from cookie use.
- Layout: `src/app/(main)/layout.tsx` mounts the `ambient-bg` background and `MainNav`. Public routes (`/login`, `/signup`) live outside the `(main)` group and don't get the background or nav.

## Net-new surfaces: use the frontend-design skill

Established surfaces (recipes, food log, profile, chat, summary, grocery list) are part of the existing app fabric and **must stay on the Liquid Glass system documented above** — visual consistency for the family using the app daily matters more than expressive variety.

For genuinely **net-new** surfaces — a marketing landing page, an onboarding flow, a stats / insights view, a share-out / printable recipe card, a public recipe gallery, etc. — invoke the `frontend-design` skill instead of cloning glass-card patterns. The skill picks a bold per-context aesthetic (typography, palette, motion language) appropriate to the surface's purpose and audience. Do not default to Inter, do not default to amber/gold, do not default to `glass` cards.

The split rule: if a future user of the app would expect this screen to "feel like the cookbook," it's Liquid Glass. If they'd expect it to feel like a different artifact (a landing page, a print-out, an onboarding moment, a share card), it gets its own creative direction.

Slim's directive 2026-04-27: net-new surfaces use the frontend-design skill; existing surfaces stay Liquid Glass.

## Conventions

- **Border radius vocabulary:** small chips `rounded-full`, controls `rounded-xl` / `rounded-2xl`, cards `rounded-3xl`, large content panels `rounded-[3rem]`. The escalation telegraphs surface importance.
- **Icons:** `lucide-react`. Always size with `w-N h-N` Tailwind utilities; never inline `width=`.
- **Loading states:** every route group has a sibling `loading.tsx` server component. Keep them lightweight — the `fadeIn` animation on `main` already cushions transitions.
- **Image hosting:** all recipe images go through Cloudinary. Use `next/image` with explicit `sizes`; never reference raw external URLs.
- **Lint gate:** `next lint` runs strict in the deploy build. `@typescript-eslint/no-unused-vars` and `prefer-const` are blocking — Husky catches them locally.

## When to update this doc

Any of the following triggers a docs refresh per Recursive Learning Loop §5:

- A new custom CSS utility lands in `globals.css`.
- A new shared component pattern is introduced (something other components will copy).
- The palette tokens in `globals.css:5-11` change.
- A routing convention shifts (e.g. dropping the edge runtime, adding a new route group).
- The net-new-vs-established split rule (above) is challenged or refined.

Append-rather-than-rewrite where possible; the current shape reflects post-TASK-007 reality.
