# Julie's Cookbook App

## Project Overview
Recipe cookbook web app for Julie. Displays 21 recipes with ingredients, preparation instructions, nutritional facts, food logging, and an AI chat assistant.

## Tech Stack
- **Framework:** Next.js 14 App Router (ISR, `revalidate = 60`)
- **Database:** Supabase (PostgreSQL) — replaced Airtable as of March 2026
- **Styling:** Tailwind CSS with custom Magnolia theme (cream `#FAF8F4`, linen `#F0EAE0`, warm `#8B7355`, gold `#C4952E`)
- **Fonts:** Playfair Display (display) + Lora (body) via `next/font/google`
- **Chat AI:** Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- **Images:** Cloudinary-hosted
- **Hosting:** Vercel (auto-deploy from `main` branch)
- **Repo:** github.com/Slimdragon007/julies-cookbook

## Supabase Schema

### recipes table
Columns: id (UUID PK), slug (TEXT UNIQUE), name, preparation, servings, cook_time_minutes, prep_time_minutes, source_url, cuisine_tag, dietary_tags (TEXT[]), julie_rating, image_url, manual_calorie_override, total_batch_weight_g, created_at

### ingredients table
Columns: id (UUID PK), recipe_id (UUID FK → recipes.id ON DELETE CASCADE), name, quantity (DECIMAL), unit, category, calories (INT), protein_g (INT), carbs_g (INT), fat_g (INT)

### food_log table
Columns: id (UUID PK), recipe_id (UUID FK → recipes.id), log_date (DATE), meal (TEXT: Breakfast/Lunch/Dinner/Snack), portion_g, calories, protein_g, carbs_g, fat_g, notes, created_at

### RLS Policies
- Public read on all three tables
- Service role full access on all three tables

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)
- `ANTHROPIC_API_KEY` — For Claude chat API
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Image uploads
- `SCRAPE_PASSWORD` — For /add-recipe page

All must be set in Vercel project settings for production.

## Key Files
- `src/lib/supabase.ts` — Supabase client (service role key)
- `src/lib/data.ts` — Data layer: getAllRecipes(), getRecipeById(), getRecipeContext(), getAllRecipeIds()
- `src/lib/types.ts` — Recipe and Ingredient TypeScript interfaces
- `src/app/recipe/[id]/page.tsx` — Recipe detail page (slug-based routing, SSG with ISR)
- `src/app/log/page.tsx` — Food log page
- `src/app/summary/page.tsx` — Weekly nutrition summary
- `src/app/api/chat/route.ts` — Chat API endpoint using Claude
- `src/app/api/log-meal/route.ts` — Food log API (GET + POST)
- `src/app/api/scrape/route.ts` — Web scraper API (writes to Supabase)
- `src/components/RecipeTabs.tsx` — Tab controller (Ingredients | Instructions | Nutrition)
- `src/components/NutritionTab.tsx` — Nutrition tab with portion calculator
- `src/components/FoodLogForm.tsx` — Food log form + today's entries
- `src/components/WeeklySummary.tsx` — 7-day summary with averages

## Scripts
- `scripts/scrape-recipe.mjs` — CLI recipe scraper (writes to Supabase)
- `scripts/migrate-to-supabase.mjs` — One-time Airtable → Supabase migration
- `scripts/audit.mjs` — Supabase data audit (recipes, ingredients, images, food log)

## Key Architecture Decisions

### Slug-based routing
Recipe URLs use slugs (e.g., `/recipe/best-goulash`) instead of UUIDs. `getRecipeById()` looks up by slug first, falls back to UUID for backwards compat.

### Portion calculator
Uses `total_batch_weight_g` for exact macro calculation: `(portion_g / total_batch_weight_g) * total_recipe_macros`. Falls back to per-serving estimate if batch weight is null.

### Nullish coalescing
Use `??` (not `||`) for numeric fields. `0 || null` returns `null` (wrong), `0 ?? null` returns `0` (correct).

## Common Pitfalls

### 1. ESLint strict on unused vars
Vercel builds fail on `@typescript-eslint/no-unused-vars` and `prefer-const` errors. Always check before pushing.

### 2. Google Fonts unreachable in sandboxed environments
`next build` fails locally if `fonts.googleapis.com` is blocked. Builds work fine on Vercel.

### 3. ISR caching
Recipe pages revalidate every 60 seconds. After database changes, wait up to 60s to see updates on the live site.

### 4. Map iterator downlevelIteration
`for...of` on `Map.entries()` fails TypeScript compilation. Use `map.forEach()` instead.

## Current State (as of March 14, 2026)
- 21 recipes with slug-based URLs, all with ingredients, macros, Cloudinary images
- 233 ingredient records, 0 orphans
- Tab redesign complete: Ingredients | Instructions | Nutrition with gold (#C4952E) active underline
- Portion calculator in Nutrition tab
- Food log page (/log) with meal logging and daily totals
- Weekly summary page (/summary) with 7-day averages
- Chatbot working with portion scaling and macro calculations
- Data source: Supabase (migrated from Airtable)

## Notion
- Project plan page: `31e16230-665c-8107-91e5-ee03d6cbd636`
- Progress log: `31e16230-665c-8117-bf62-d04b14ed8c1e`
