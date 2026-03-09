# Julie's Cookbook App

## Project Overview
Recipe cookbook web app for Julie. Displays recipes from Airtable with ingredients, preparation instructions, nutritional facts, and an AI chat assistant.

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
Fields: Recipe Name, Attachments, Preparation, Servings, Cook Time (Minutes), Ready Time, Prep Time (Minutes), Source URL, Step-by-Step Instructions (AI), Cuisine Tag, Dietary Tags, Image URL, Manual Calorie Override, Total Calories, Calories Per Serving

**IMPORTANT:** The Recipes table has NO "Ingredients" linked field. The link is owned by the Ingredients table (see below).

### Ingredients table (`tblbly81hGxUaEgM2`)
Fields: Ingredient Summary, Category, Recipe QTY, Unit, Name, Recipe Names... (linked → Recipes), Calories, Protein g, Carbs, Fat

**Data flow is Ingredients → Recipes** (not Recipes → Ingredients). To get ingredients for a recipe, query the Ingredients table and filter by the linked record field pointing to that recipe.

### Ingredient Field IDs (use with `returnFieldsByFieldId: true`)
- Name: `fld39u3mmhVCvMG1O`
- Recipe QTY: `fldQBvNRyFEKNB9eV`
- Unit: `fldhovLVfCHfba1nM`
- Calories: `fldoXpPm8rZwPWxQY`
- Protein: `fldSWy4Feb88MMqxy`
- Carbs: `fldp7QNxNMpXzkBIU`
- Fat: `fldx8AY3eOHavt5r6`

## Key Architecture Decisions

### Airtable field access
Always use `returnFieldsByFieldId: true` for the Ingredients table. Field names can be renamed in Airtable; field IDs are stable.

### Ingredient-recipe linking
The `extractRecipeIds()` function in `data.ts` auto-detects the linked record field by scanning for arrays of strings starting with "rec" (Airtable record ID format). This avoids hardcoding the field ID for the link.

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

## Common Pitfalls
1. **Airtable linked records are directional** — Always check which table owns the link field. Don't assume the direction.
2. **ESLint strict on unused vars** — Vercel builds fail on `@typescript-eslint/no-unused-vars` errors. Always check before pushing.
3. **Google Fonts unreachable in sandboxed environments** — `next build` fails locally if `fonts.googleapis.com` is blocked. Builds work fine on Vercel.
4. **ISR caching** — Recipe pages revalidate every 60 seconds. After Airtable changes, wait up to 60s to see updates on the live site.

## Current State (as of March 9, 2026)
- Ingredients display is WORKING for recipes that have ingredients linked in Airtable
- Only 3/16 recipes have ingredients linked: Best Lentil Soup, Easy Vegan Fried Rice, Homemade Pasta
- The remaining 13 recipes need ingredients added in Airtable

## Pending Tasks
- [ ] Link ingredients to remaining 13 recipes in Airtable
- [ ] Delete "Vega Fried Rice" from Airtable (`scripts/delete-fried-rice.mjs`)
- [ ] Run audit script (`scripts/audit.mjs`)
