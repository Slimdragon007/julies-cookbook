# ADR-004: Track Supabase migrations in the repo

**Date:** 2026-04-27
**Status:** accepted + implemented (2026-04-27, Option A — recommended)
**Decider:** Slim (blanket "go ahead" given for TASK-008)

## Context

Discovered while scoping TASK-008 (DB UNIQUE constraints, Issue #8): two migrations have already been applied to the production Supabase project (`cqfszhxuvvsgusvjdyqx`) but **zero migration files exist in the repo**.

```
remote migrations on cqfszhxuvvsgusvjdyqx:
  20260328025710_create_cookbook_tables
  20260329033633_add_portion_unit_columns_to_food_log

repo:
  $ find . -name "*.sql"
  (no results)
```

The schema lives only in Supabase's tracking table and in implicit knowledge ("just run `list_tables`"). This is the gap Issue #8 surfaced when it said "stand up Supabase migration infrastructure" — the assumption was no migrations had ever run, which is wrong; the actual gap is that they ran without being tracked in the codebase.

TASK-008 needs a third migration to land. Without an ADR, the same pattern — apply via dashboard / MCP, never commit — will repeat. This ADR closes that gap going forward.

## Constraints

- **Production is live.** Cannot reset migration history. Whatever convention lands must coexist with the two already-applied migrations.
- **Single-developer workflow.** Slim is the only one running migrations; CI does not currently apply schema changes.
- **Cloudflare Pages deploy.** App is decoupled from DB at deploy time — no `prisma migrate deploy` style step exists in the build.
- **Supabase MCP server is available** and already in use for schema introspection + queries.
- **Husky pre-commit gate exists** (lint + tsc); doesn't currently lint SQL.
- **No npm test step touches the DB.** Vitest tests mock Supabase. Migrations are not exercised by CI.

## Options

### Option A: Supabase CLI conventions (recommended)

Adopt the Supabase CLI directory layout: `supabase/migrations/<timestamp>_<name>.sql`. Apply via `supabase db push` locally or via the MCP `apply_migration` tool. New migrations land as PR commits. Existing remote migrations are documented in a `supabase/migrations/README.md` rather than backfilled (we don't have the original SQL — reconstructing it from the schema introspection is high-risk and low-value).

Pros:

- Standard Supabase convention; future devs / agents recognize it instantly.
- File names match the timestamp format Supabase already uses, so the local repo's migration list reads in the same order as `list_migrations` against the remote.
- Works whether migrations are applied via CLI, MCP, or dashboard — the repo file is the source of truth, the application channel is implementation detail.
- No new tooling to install in CI; husky doesn't need to run anything new.

Cons:

- The two already-applied migrations are not in the repo. Future agents reading `supabase/migrations/` will see only TASK-008 onward and could be confused. Mitigated by a `README.md` stub explaining the gap.
- Drift detection is manual. Nothing automatically alerts if a migration in the repo hasn't been applied to production, or vice versa. Daily `/api/audit` could be extended later if this becomes a real risk.

### Option B: Drizzle Kit / Prisma migrate

Install a TypeScript ORM/migration tool. Generate migrations from schema diffs.

Pros:

- Type-safe schema definitions in TS, automatic migration generation.
- Better story for staging environments if we ever add one.

Cons:

- Brings a new dependency, a new mental model, and a new "source of truth" question (schema.ts vs DB vs Supabase types). Cost-benefit poor for a 27-recipe family app with one developer.
- Requires translating the two existing migrations into the new tool's format, or accepting a hybrid state. Either way, churn for marginal benefit.
- Conflicts with the Supabase MCP workflow that's already working.

### Option C: SQL files in repo with no convention

Just commit `.sql` files somewhere arbitrary (e.g. `db/`, `migrations/`). Apply manually.

Pros:

- Zero overhead.

Cons:

- Loses the Supabase CLI compatibility. Future "let's use the CLI for that" requires a reorg.
- No timestamp convention → ordering ambiguity if two migrations land in the same week.

### Option D: Status quo (no repo tracking)

Keep applying via MCP / dashboard. Never commit migration SQL.

Pros:

- Zero work.

Cons:

- Schema history is invisible from the codebase. Reviewers can't see a constraint change in a PR. New agents repeat the discovery I just did.
- The very situation Issue #8 flagged ("first migration ever" assumption) will keep happening.

## Decision

**Option A.** Adopt the Supabase CLI directory layout. New migrations land in `supabase/migrations/<timestamp>_<snake_case_name>.sql`. The two already-applied migrations are documented in `supabase/migrations/README.md` as historical context but not reconstructed.

Apply path for this session: write the SQL file → review with Slim → apply via the Supabase MCP `apply_migration` tool (or `supabase db push` if Slim has the CLI installed locally). The MCP tool records the migration in Supabase's history table under the same naming convention, so the file name and the remote record line up.

## Consequences

- Future schema changes are visible in PRs and reviewable like any other code.
- The repo can be cloned to a fresh Supabase project and brought up to date by replaying migrations in order — once the two pre-history migrations are also in the directory (deferred work; not blocking TASK-008).
- A new "definition of done" item lands in CLAUDE.md §6 for any task that touches the schema: "If schema touched: migration committed under `supabase/migrations/` AND applied to production."
- The `supabase/migrations/README.md` stub flags the two pre-history migrations as "applied directly to remote, not backfilled." If ever needed (staging env, fresh-DB onboarding) they can be reconstructed from `list_tables` introspection.

## Rollback

If Option A becomes burdensome (e.g. CI starts failing on migration drift), drop back to Option D by ignoring the `supabase/migrations/` directory. The migration files themselves remain valid SQL; they just stop being treated as a source of truth. No code is coupled to the directory's existence.

## Open questions

- ~~Should we backfill the two pre-history migrations?~~ **No** for now — high-risk reconstruction, low-value while production is the only environment. Revisit if a staging env appears.
- ~~Do we need a CI check that the latest repo migration matches the latest remote migration?~~ **No** — single-developer workflow makes drift detection a manual concern. Daily `/api/audit` could be extended to spot-check schema invariants if drift becomes a real failure mode.
- ~~Does this require changes to `wrangler.toml` or the Cloudflare Pages build?~~ **No** — migrations are out-of-band from the app deploy.
