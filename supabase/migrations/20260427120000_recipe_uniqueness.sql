-- TASK-008 / Issue #8 — Per-user uniqueness on the recipes table.
--
-- Three problems this solves:
--
-- 1. TOCTOU race in src/lib/scraper/persist.ts — the dup-check + insert is
--    two round-trips, so two concurrent scrapes of the same source URL can
--    both pass the check and both insert. The in-code 23505 catch already
--    landed in PR #7 commit 0c414f1 but is dormant until a constraint exists.
--
-- 2. Bad multi-user behavior on `slug` — the existing global `recipes_slug_key`
--    UNIQUE constraint blocks user A's "Goulash" from coexisting with user B's
--    "Goulash". Routing is already per-user, so the constraint should be too.
--
-- 3. Sentinel string source_url values — the seed data has 4 rows with
--    source_url='preloaded' for the same user, and the persist code writes
--    'manual entry' literally. Both should be NULL so the partial UNIQUE
--    works without sentinel carve-outs in the WHERE clause.
--
-- See docs/adr/ADR-004-migration-tooling.md for the migration workflow
-- decision; this is the first migration to land under the new convention.

BEGIN;

-- 1. Normalize sentinel source_url values to NULL.
--    Affects 4 'preloaded' rows for user 62ba2003-... at migration time.
--    Idempotent — re-running this UPDATE is a no-op once converted.
UPDATE recipes
SET source_url = NULL
WHERE source_url IN ('manual entry', 'preloaded');

-- 2. Replace the global slug UNIQUE constraint with a per-user one.
--    The global constraint name is `recipes_slug_key` (Supabase default for
--    the `unique` column option). Drop conditionally so this migration is
--    safe to re-run.
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_slug_key;

CREATE UNIQUE INDEX IF NOT EXISTS recipes_user_slug_uniq
  ON recipes (user_id, slug);

-- 3. Per-user uniqueness on (user_id, source_url) for non-null URLs.
--    The partial WHERE makes service-role inserts (CLI, user_id NULL) and
--    legacy 'manual entry' / 'preloaded' rows immune from this constraint.
CREATE UNIQUE INDEX IF NOT EXISTS recipes_user_source_url_uniq
  ON recipes (user_id, source_url)
  WHERE source_url IS NOT NULL;

-- 4. Per-user uniqueness on (user_id, name).
--    With this in place, slug collisions within a user become impossible
--    (same name → same slugify output → fails name check first), so no
--    retry-on-slug-collision logic is needed in persist.ts.
CREATE UNIQUE INDEX IF NOT EXISTS recipes_user_name_uniq
  ON recipes (user_id, name);

COMMIT;
