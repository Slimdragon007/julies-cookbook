# Julie's Cookbook App

## Project Overview
Recipe cookbook web app for Julie. Displays 15 recipes from Airtable with ingredients, preparation instructions, nutritional facts, and an AI chat assistant.

## Tech Stack
- **Framework:** Next.js 14 App Router (ISR, `revalidate = 60`)
- **CMS:** Airtable REST API (via `airtable` npm package)
- **Styling:** Tailwind CSS with custom Magnolia theme (cream `#FAF8F4`, linen `#F0EAE0`, warm `#8B7355`)
- **Fonts:** Playfair Display (display) + Lora (body) via `next/font/google`
- **Chat AI:** Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- **Images:** Cloudinary-hosted
- **Hosting:** Vercel (auto-deploy from `main` branch)
- **Repo:** github.com/Slimdragon007/julies-cookbook

## Airtable Schema

### Recipes table (`tblcDuujfu1rokjSU`)
Fields: Recipe Name, Attachments, Preparation, Servings, Cook Time (Minutes), Ready Time, Prep Time (Minutes), Source URL, Step-by-Step Instructions (AI), Cuisine Tag, Dietary Tags, Image URL, Manual Calorie Override, Total Calories, Calories Per Serving, Ingredients (linked from Ingredients table — `fldecNLyMaPGVhDvZ`)

**CRITICAL:** The Recipes table's "Ingredients" field (`fldecNLyMaPGVhDvZ`) is a REVERSE LOOKUP — it exists because the Ingredients table links TO recipes. Airtable omits this field from API responses when empty. NEVER try to read ingredients from recipe records. Always query the Ingredients table instead.

### Ingredients table (`tblbly81hGxUaEgM2`)
Fields: Ingredient Summary (`fld5GOiXj9ZPLnssp` — formula), Category (`fldg5uYGPex1K3uJ9`), Recipe QTY, Unit, Name, Recipes (`fldwub0ugkvMTHX2P` — linked → Recipes), Calories, Protein_g, Carbs_g, Fat_g

**Data flow is Ingredients → Recipes** (not Recipes → Ingredients). Each ingredient record links to its recipe via `fldwub0ugkvMTHX2P`.

### Ingredient Field IDs (use with `returnFieldsByFieldId: true`)
- Name: `fld39u3mmhVCvMG1O`
- Recipe QTY: `fldQBvNRyFEKNB9eV`
- Unit: `fldhovLVfCHfba1nM` (singleSelect: /cup, /each, /oz, /lb, /can, /bag, /box, /slice, /block, /tbsp)
- Recipes link: `fldwub0ugkvMTHX2P`
- Category: `fldg5uYGPex1K3uJ9`
- Calories: `fldoXpPm8rZwPWxQY`
- Protein: `fldSWy4Feb88MMqxy`
- Carbs: `fldp7QNxNMpXzkBIU`
- Fat: `fldx8AY3eOHavt5r6`

### Creating ingredient records
When adding ingredients, always include: Name, Recipe QTY, Unit, Recipes link (recipe record ID), Category, Calories, Protein_g, Carbs_g, Fat_g. Use `typecast: true` for singleSelect fields.

## Key Architecture Decisions

### Airtable field access
Always use `returnFieldsByFieldId: true` for the Ingredients table. Field names can be renamed in Airtable; field IDs are stable.

### Ingredient-recipe linking
The `extractRecipeIds()` function in `data.ts` auto-detects the linked record field by scanning for arrays of strings starting with "rec" (Airtable record ID format). This avoids hardcoding the link field ID.

### Nullish coalescing
Use `??` (not `||`) for numeric fields from Airtable. `0 || null` returns `null` (wrong), `0 ?? null` returns `0` (correct).

## Environment Variables
- `AIRTABLE_API_KEY` — Airtable personal access token
- `AIRTABLE_BASE_ID` — Airtable base ID (`appzynj6dYXpWEoKi`)
- `ANTHROPIC_API_KEY` — For Claude chat API

All must be set in Vercel project settings for production.

## Key Files
- `src/lib/data.ts` — Airtable data layer (all fetching logic)
- `src/lib/types.ts` — Recipe and Ingredient TypeScript interfaces
- `src/components/IngredientsSection.tsx` — Client component: servings scaler, ingredients list, preparation, nutritional facts
- `src/app/recipe/[id]/page.tsx` — Recipe detail page (SSG with ISR)
- `src/app/api/chat/route.ts` — Chat API endpoint using Claude
- `src/components/ChatWidget.tsx` — Floating chat widget (client component)

## Common Pitfalls & Hard-Won Lessons

### 1. Airtable linked records are directional
Always check WHICH table owns the link field. Airtable creates a reverse lookup field on the other table, but it's empty when no records are linked — and Airtable OMITS empty fields from API responses entirely. This caused a silent failure where `record.get("Ingredients")` returned `undefined`, and the `|| []` fallback hid the bug completely.

### 2. Silent failures are the worst bugs
`record.get("Ingredients") || []` silently returns an empty array whether the field is empty OR doesn't exist. Always validate that fields exist in the schema before relying on them. Use diagnostic endpoints or MCP tools to inspect raw API responses.

### 3. Orphan data accumulates
Unlinked ingredient records (no recipe link, no macros) pile up from manual Airtable edits and testing. Run periodic cleanup: query ingredients where the recipe link field is empty and delete them.

### 4. ESLint strict on unused vars
Vercel builds fail on `@typescript-eslint/no-unused-vars` errors. Always check before pushing. Debug endpoints left behind will break the build.

### 5. Google Fonts unreachable in sandboxed environments
`next build` fails locally if `fonts.googleapis.com` is blocked. Builds work fine on Vercel.

### 6. ISR caching
Recipe pages revalidate every 60 seconds. After Airtable changes, wait up to 60s to see updates on the live site. Don't panic if changes aren't immediate.

### 7. TypeScript `as const` strictness
`Object.values(ING_FIELDS).includes(key)` fails type-check when ING_FIELDS uses `as const`. Fix: cast to `(Object.values(ING_FIELDS) as string[]).includes(key)`.

### 8. Airtable API returns field names differently than displayed
The "Recipe Names..." field in the UI has a different internal representation. Use field IDs, not names, whenever possible.

## Current State (as of March 9, 2026)
- 15 recipes, all with: ingredients (with full macros), preparation, cook/prep times, calories per serving, total calories, Cloudinary images
- 122 ingredient records, all linked to recipes with complete macro data
- 30 orphan ingredients cleaned up
- "Easy Vegan Fried Rice" deleted (was a test recipe)
- Chatbot working with portion scaling and macro calculations
- All code deployed and live on Vercel

## Notion
- Project plan page: `31e16230-665c-8107-91e5-ee03d6cbd636`
- Progress log: `31e16230-665c-8117-bf62-d04b14ed8c1e`


## NEXT BUILD: Recipe Detail Tab Redesign (Approved March 10, 2026)

### What
Replace the single-scroll recipe detail page with a horizontal tabbed layout. Three tabs: Ingredients, Instructions, Nutrition. Only one section visible at a time. Mockup approved by Slim.

### Why
Current page forces Julie to scroll through 3+ screen lengths on mobile. Ingredients, preparation text, and nutrition table all stacked vertically. Hard to read (14px serif on mobile). Overwhelming.

### Design Spec (from approved mockup)

**Tab bar:**
- Three horizontal tabs: Ingredients | Instructions | Nutrition
- Sticky to top when scrolling past the title
- Active tab: warm-dark text (#6B5740) + warm underline accent (#8B7355), 2.5px bottom border
- Inactive tabs: warm-light text (#A89279), no underline
- Font: Lora, 0.95rem, font-weight 500 (active: 600)

**Typography changes (global):**
- Ingredient names: text-sm (14px) -> text-base (16px)
- Instruction steps: text-sm -> text-base, line-height 1.75
- Nutrition table cells: keep text-sm but add more padding (0.65rem vertical)
- Tab labels: text-base (0.95rem), font-medium

**Layout changes:**
- Hero image: aspect-[4/3] on mobile, aspect-[16/9] on md+ (was 16/9 everywhere)
- Stats + calorie badge: consolidated into one flex row (was two separate blocks)
- Tags + rating: sit between stats and tabs
- Source link: stays at bottom, below tab content

**Ingredients tab:**
- Servings scaler (already built, moves here)
- Ingredient list with qty/unit/name at 16px
- Each item: flex row with 0.65rem vertical padding, border-bottom

**Instructions tab:**
- Numbered steps with circle badges (linen background, 2rem diameter)
- Step text at 16px, line-height 1.75
- Parse preparation text by splitting on newlines or numbered patterns
- Each step: flex row with 1rem gap, 1.5rem bottom margin

**Nutrition tab:**
- Macro summary grid (4 columns: Calories, Protein, Carbs, Fat) in linen card
- Per-ingredient breakdown table below

### Component Refactor

```
DELETE: src/components/IngredientsSection.tsx (170 lines)

CREATE:
  src/components/RecipeTabs.tsx        <- Tab controller (client component, manages active tab state)
  src/components/IngredientsTab.tsx    <- Ingredients list + servings scaler (client component for scaler)
  src/components/InstructionsTab.tsx   <- Numbered preparation steps (can be server component)
  src/components/NutritionTab.tsx      <- Macro totals + per-ingredient table (can be server component)
```

### page.tsx Changes (src/app/recipe/[id]/page.tsx)

```
BEFORE:
  Hero -> Title -> Stats row -> Calorie badge -> Tags -> <IngredientsSection> -> Rating -> Source

AFTER:
  Hero (4:3 mobile / 16:9 desktop)
  -> Title
  -> Compact stats row (prep, cook, total, servings, calorie badge all in one flex row)
  -> Tags + Rating row
  -> <RecipeTabs ingredients={} preparation={} defaultServings={} />
  -> Source link
```

### Tailwind Changes (tailwind.config.ts)
No new colors or fonts needed. Existing Magnolia tokens work.

### Test Checklist
- [ ] Tabs switch correctly on tap (mobile) and click (desktop)
- [ ] Sticky tab bar works when scrolling past title
- [ ] Servings scaler still works in Ingredients tab
- [ ] Instructions are numbered with circle badges
- [ ] Nutrition table renders correctly with scaled values
- [ ] Body text is 16px and readable on iPhone
- [ ] Hero is 4:3 on mobile, 16:9 on desktop
- [ ] All 16 recipes render without errors
- [ ] Chat FAB still visible and functional
- [ ] Vercel build passes (no TS errors, no ESLint errors)
