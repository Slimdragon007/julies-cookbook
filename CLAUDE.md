# Julie's Cookbook App

## Project Overview
Multi-user recipe cookbook web app. Each user has their own recipes, ingredients, and food logs. Features include recipe scraping, nutritional tracking, food logging, and an AI chat assistant. Registration is invite-only (family members).

## Tech Stack
- **Framework:** Next.js 14 App Router (dynamic rendering via cookie-based auth)
- **Database:** Supabase (PostgreSQL) — replaced Airtable as of March 2026
- **Styling:** Tailwind CSS with Liquid Glass theme (cream `#FDFCFB`, sky-blue `#0ea5e9`, slate text, glassmorphic cards with backdrop-blur)
- **Fonts:** Inter (display + body) via `next/font/google`
- **Chat AI:** Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- **Images:** Cloudinary-hosted
- **Hosting:** Vercel (auto-deploy from `main` branch)
- **Repo:** github.com/Slimdragon007/julies-cookbook

## Supabase Schema

### recipes table
Columns: id (UUID PK), user_id (UUID FK → auth.users, per-user scoping), slug (TEXT UNIQUE), name, preparation, servings, cook_time_minutes, prep_time_minutes, source_url, cuisine_tag, dietary_tags (TEXT[]), julie_rating, image_url, manual_calorie_override, total_batch_weight_g, created_at

### ingredients table
Columns: id (UUID PK), recipe_id (UUID FK → recipes.id ON DELETE CASCADE), name, quantity (DECIMAL), unit, category, calories (INT), protein_g (INT), carbs_g (INT), fat_g (INT)

### food_log table
Columns: id (UUID PK), user_id (UUID FK → auth.users, per-user scoping), recipe_id (UUID FK → recipes.id), log_date (DATE), meal (TEXT: Breakfast/Lunch/Dinner/Snack), portion_g, portion_amount (DECIMAL), portion_unit (TEXT), calories, protein_g, carbs_g, fat_g, notes, created_at

### RLS Policies
- Per-user CRUD on recipes and food_log (`auth.uid() = user_id`)
- Per-user CRUD on ingredients (via recipe FK join to check ownership)
- Service role full access on all three tables

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key (client-side)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)
- `ANTHROPIC_API_KEY` — For Claude chat API
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Image uploads
- `SCRAPINGBEE_API_KEY` — Optional: Cloudflare bypass for recipe scraper (free tier: 1000 calls/month)
- `USDA_API_KEY` — USDA FoodData Central API key for accurate nutritional data (free: https://fdc.nal.usda.gov/api-key-signup)
- `INVITE_CODE` — Server-side invite code for signup (no fallback — fails closed if missing)

All must be set in Vercel project settings for production.

## Commands
- `npm run dev` — start dev server on port 3000
- `npm run build` — production build
- `npm run lint` — ESLint check
- `npm run test` — run unit tests (Vitest, 53 tests)
- `npm run test:e2e` — run e2e tests (Playwright, 28 tests — needs dev server running)
- `npm run test:watch` — Vitest in watch mode
- `npm run scrape <url>` — CLI recipe scraper (writes to Supabase)

## Key Files
- `src/lib/supabase/admin.ts` — Supabase admin client (service role key)
- `src/lib/supabase/server.ts` — Supabase server client (anon key, cookie-based auth)
- `src/lib/supabase/client.ts` — Supabase browser client (anon key)
- `src/middleware.ts` — Supabase auth middleware (protects all routes except /login, /signup, /demo)
- `src/lib/supabase/middleware.ts` — Auth middleware helper (redirects, session refresh)
- `src/app/signup/page.tsx` — Invite-only sign-up page
- `src/app/api/signup/route.ts` — Server-side signup with invite code validation
- `src/lib/data.ts` — Data layer: getAllRecipes(), getRecipeById(), getRecipeContext(), getAllRecipeIds()
- `src/lib/usda.ts` — USDA FoodData Central API: lookupNutrition(), calculateIngredientMacros()
- `src/lib/unit-conversions.ts` — Portion unit conversion: toGrams(), PORTION_UNITS (servings/cups/oz/tbsp/tsp/g)
- `src/lib/types.ts` — Recipe and Ingredient TypeScript interfaces
- `src/app/recipe/[id]/page.tsx` — Recipe detail page (slug-based routing, dynamic rendering)
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

## Testing
- **Unit tests:** Vitest — `src/lib/__tests__/` (macros, fractions, unit-conversions, USDA API)
- **E2E tests:** Playwright — `e2e/` (auth, demo, pages, nutrition unit picker, food log unit picker)
- **Config:** `vitest.config.mts` (excludes e2e/), `playwright.config.ts` (chromium, port 3000)
- **E2E test user:** `e2e-test@julies-cookbook.test` / `E2eTestPass2026!` (created via Supabase admin API)
- **E2E test recipe:** `e2e-test-pasta` with 4 ingredients, batch weight 800g (seeded in Supabase)
- **Pre-commit hooks:** Husky runs `next lint` + `tsc --noEmit` before every commit

## Key Architecture Decisions

### Slug-based routing
Recipe URLs use slugs (e.g., `/recipe/best-goulash`) instead of UUIDs. `getRecipeById()` looks up by slug first, falls back to UUID for backwards compat.

### Portion calculator
Supports multiple units: servings, cups, oz, tbsp, tsp, grams. Converts to grams via `src/lib/unit-conversions.ts` for macro math. Uses `total_batch_weight_g` for exact calculation: `(portion_g / total_batch_weight_g) * total_recipe_macros`. Falls back to per-serving estimate if batch weight is null. "Servings" unit works without batch weight via per-serving math.

### Nutritional data accuracy
Ingredient macros sourced from USDA FoodData Central API (exact per 100g values). Scraper pipeline: USDA API → Claude AI estimate → hardcoded lookup table → 0. Both scraper paths (CLI + web API) use the same USDA-first approach.

### Nullish coalescing
Use `??` (not `||`) for numeric fields. `0 || null` returns `null` (wrong), `0 ?? null` returns `0` (correct).

## Common Pitfalls

### 1. ESLint strict on unused vars
Vercel builds fail on `@typescript-eslint/no-unused-vars` and `prefer-const` errors. Always check before pushing.

### 2. Google Fonts unreachable in sandboxed environments
`next build` fails locally if `fonts.googleapis.com` is blocked. Builds work fine on Vercel.

### 3. Dynamic rendering
Pages render dynamically via cookie-based auth (`createSupabaseServer()` reads cookies, which opts into dynamic rendering automatically). No `force-dynamic` needed — the Next.js Router Cache handles client-side caching (30s).

### 4. Map iterator downlevelIteration
`for...of` on `Map.entries()` fails TypeScript compilation. Use `map.forEach()` instead.

### 5. Dual scraper paths must stay in sync
Both `scripts/scrape-recipe.mjs` (CLI) and `src/app/api/scrape/route.ts` (web API) have independent USDA lookup + macro estimation code. The `.mjs` file cannot import TypeScript modules. Changes to scraping, nutrition, or ingredient normalization logic must be applied to BOTH paths.

## Current State (as of March 28, 2026)
- Multi-user with per-user recipes, ingredients, and food logs
- Invite-only registration (INVITE_CODE env var, server-side validation)
- Auth: Supabase email/password, middleware-enforced
- Supabase project: cqfszhxuvvsgusvjdyqx (us-east-1)
- UI: "Liquid Glass" theme — light bg (#FDFCFB), sky-blue accents, Inter font, glassmorphic cards
- Desktop sidebar nav + mobile bottom nav (5 items) with elevated Add button
- Tabs: Ingredients | Instructions | Nutrition with sky-blue pill-style tab switcher
- Portion calculator with customizable units (servings, cups, oz, tbsp, tsp, grams)
- USDA FoodData Central API for accurate nutritional data (replaces AI estimation)
- Food log page (/log) with meal logging, daily totals, and user-friendly unit display
- Weekly summary page (/summary) with 7-day averages
- Chatbot working with per-user recipe context
- 53 unit tests (Vitest) + 28 e2e tests (Playwright)
- Husky pre-commit hooks (lint + type-check)
- Data source: Supabase (Airtable permanently retired)

## Notion
- Project plan page: `31e16230-665c-8107-91e5-ee03d6cbd636`
- Progress log: `31e16230-665c-8117-bf62-d04b14ed8c1e`
