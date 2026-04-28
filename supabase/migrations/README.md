# Supabase Migrations

Source of truth for schema changes. Naming convention: `<timestamp>_<snake_case_name>.sql` (matches Supabase CLI defaults).

## Apply path

For this single-developer setup migrations are applied via the Supabase MCP `apply_migration` tool against the production project (`cqfszhxuvvsgusvjdyqx`). The remote tracking table records the file under the same name. `supabase db push` from the local CLI also works if you have it installed.

See `@docs/adr/ADR-004-migration-tooling.md` for the decision rationale.

## Pre-history (not in this directory)

Two migrations were applied to production before this directory was established. They live only in the Supabase remote and are **not** reconstructed here:

- `20260328025710_create_cookbook_tables` — initial `recipes`, `ingredients`, `food_log` schema
- `20260329033633_add_portion_unit_columns_to_food_log` — `portion_amount` / `portion_unit` on `food_log`

If ever needed for a fresh-DB onboarding or staging environment, they can be reconstructed from a `list_tables` introspection of the remote. Doing so is deferred — production is currently the only environment.

## Definition of done (for any schema-touching task)

1. Migration committed here, named per the convention.
2. Migration applied to production via MCP / CLI.
3. Verify the new constraint / column / index appears in `list_tables`.
4. Update `@docs/architecture/data.md` if the change is structurally significant.
