# ADR-002: Resolve dual scraper paths

**Date:** 2026-04-26
**Status:** proposed
**Decider:** Slim (pending)

## Context

Two parallel scraper implementations exist:

1. `scripts/scrape-recipe.mjs` — CLI scraper. Run via `npm run scrape <url>`. Writes directly to Supabase via service role key. Used by Slim locally to bulk-add recipes.
2. `src/app/api/scrape/route.ts` — Web scraper. Authenticated user calls `POST /api/scrape` with a URL; route writes to Supabase scoped to `auth.uid()`.

Both independently implement: HTML fetch (with optional ScrapingBee bypass), recipe-block parsing (cheerio), ingredient name normalization, USDA FoodData Central lookup, Claude AI macro fallback, hardcoded ingredient lookup table, and ingredient/recipe insertion. No shared module.

`.mjs` cannot import TypeScript modules without a build step or transpiler. The CLI was written first, the web route was written later by copy-paste-modify. Drift risk:

- Bug fix applied to web route, not CLI: CLI scrapes go bad on next bulk import.
- Bug fix applied to CLI, not web route: production users hit the bug.
- New ingredient added to hardcoded fallback lookup: must be added in two places.

Captured as project CLAUDE.md **Rule 4** (temporary) and **Pitfall 1** in the handbook install. Every scraper change has to touch both files in the same commit, or the PR is rejected.

This is a documented architectural defect, not a feature. The handbook install explicitly says Rule 4 is temporary "until the shared-logic refactor lands" — i.e. this ADR.

## Constraints

- Service role key access pattern differs: CLI authenticates as service role direct; web route authenticates as the user (RLS-scoped) and writes via the user-scoped client. Any shared module must accept the Supabase client as a parameter, not import a singleton.
- CLI is run with `node --env-file=.env.local`. No Next.js runtime available.
- Web route runs in Cloudflare Pages edge runtime (per `export const runtime = "edge"` if present, otherwise Node). Some Node APIs aren't available; the shared module must avoid them or branch.
- `cheerio`, `ANTHROPIC_API_KEY`, USDA fetch, and ScrapingBee fetch all need to work in both runtimes. Already do in current duplicated form.
- ~600 lines of duplicated logic to consolidate.

## Options considered

### Option A — Shared `.mjs` module, both paths import it

Move all duplicated logic into `src/lib/scraper/core.mjs` (or `scripts/lib/scraper-core.mjs`). Both CLI and web route `import` from it.

- **Pros:** Single source of truth. CLI keeps zero build step. Web route can import `.mjs` from TypeScript via Next.js's normal module resolution. Smallest code reorg.
- **Cons:** No type safety in the shared module — TypeScript callers get `any`. JSDoc types help but are advisory. Future contributors will be tempted to add `.ts` next to `.mjs` and re-fork.

### Option B — Convert CLI to TypeScript via `tsx`

Rewrite `scripts/scrape-recipe.mjs` as `scripts/scrape-recipe.ts`. Run via `tsx scripts/scrape-recipe.ts <url>` (or `npm run scrape`). Shared logic extracted to `src/lib/scraper/core.ts`. Both paths import the same TS module.

- **Pros:** Full type safety end to end. Single `.ts` source. Aligned with the rest of the codebase.
- **Cons:** Adds `tsx` (or `ts-node`) as a dev dependency. CLI is now slower to start (~200ms transpile overhead, negligible for batch use). One more build tool to keep current.

### Option C — Pre-build a shared `.js` artifact

Add a build step that compiles `src/lib/scraper/core.ts` to `dist/scraper-core.js`. CLI imports from `dist/`. Web route imports from `src/lib/scraper/core.ts` directly (bundled by Next).

- **Pros:** Type-safe shared source. CLI runtime stays vanilla Node, no runtime transpiler.
- **Cons:** Requires a build step before CLI runs (`npm run build:scraper` or similar). Another artifact to keep in sync. Worst of both worlds for daily-use ergonomics.

### Option D — Drop the CLI, make scraping web-only

Delete `scripts/scrape-recipe.mjs`. Slim authenticates as himself in the web app (or a dedicated admin user) and uses `/api/scrape` for all imports.

- **Pros:** No dual maintenance ever again. One code path. Same auth model as everything else.
- **Cons:** Bulk operations now go through the browser or a curl loop. No quick local debugging without spinning up the dev server. Bulk imports lose service-role write speed (RLS-scoped writes are slower for many rows). Removes a workflow Slim actively uses.

### Option E — Drop the web API, make scraping CLI-only

Delete `src/app/api/scrape/route.ts`. Recipes are scraped locally by Slim and committed to Supabase; users can only browse.

- **Pros:** Single code path. No need to authenticate scraping in the browser. Slim controls what enters the dataset.
- **Cons:** Removes a feature users currently have. Family members can't add their own recipes. Major product regression.

## Decision

Pending. Recommended: **Option B (TypeScript CLI via `tsx`)**. Highest type safety, aligned with the rest of the codebase, low build complexity, minor runtime overhead acceptable for a CLI that's run on demand. Option A is the cheaper alternative if `tsx` is rejected.

Options D and E are listed for completeness — both would be product decisions, not architectural ones.

## Consequences

If B (TypeScript CLI):

- Add `tsx` to `devDependencies`.
- `scripts/scrape-recipe.mjs` → `scripts/scrape-recipe.ts`. `package.json` `scrape` script: `tsx --env-file=.env.local scripts/scrape-recipe.ts`.
- Extract: `src/lib/scraper/core.ts`, `src/lib/scraper/usda.ts` (likely already lives in `src/lib/usda.ts`, verify), `src/lib/scraper/macros.ts`, `src/lib/scraper/normalize.ts`, `src/lib/scraper/fallback-table.ts`. Both paths import these.
- Web route shrinks to: parse request, call `core.scrapeRecipe(url, userId, userClient)`, return result. No inline parsing logic.
- CLI shrinks to: parse argv, call `core.scrapeRecipe(url, null, adminClient)`, log result. No inline parsing logic.
- Project CLAUDE.md: **Rule 4 deleted** (no longer applicable). **Pitfall 1 marked Resolved** with institutional-memory note. Pre-commit / Definition of Done: scraper change checklist becomes "shared module updated, both callers exercised".
- Add a vitest test for `core.scrapeRecipe` that mocks the Supabase client. Currently neither path is unit-tested end-to-end.

If A (.mjs shared module):

- Same extraction shape, but files end in `.mjs` and types are JSDoc-only.
- Cheaper but leaves a soft fork seam — likely revisited within 6 months.

If C (pre-built artifact):

- Add `npm run build:scraper` step. Document in CLAUDE.md §7 commands.
- CLI runs `node dist/scraper-cli.js`. Forgetting to rebuild produces silent staleness — needs CI check.

If D or E:

- Product decision, not architectural. Out of scope for this ADR; would supersede it.

## Rollback plan

- The refactor is one PR, one commit. `git revert` restores the dual-path state.
- The `tsx` dependency can be removed if Option B is reverted; the runtime behavior of CLI is identical.
- Web route behavior is unchanged from the user's perspective — same request shape, same response, same Supabase writes.
- No database schema change, no migration to roll back.

## Open questions before acceptance

1. Slim picks A vs B vs C vs (D or E as product decisions).
2. Is `src/lib/usda.ts` already shared, or does the CLI have its own copy? (Verify before extraction list is final.)
3. Does the scraper currently have **any** tests? If not, the refactor PR adds at least one happy-path test before merge.
