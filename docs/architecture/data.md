# Architecture: Data

> Load trigger: schema, RLS, auth, env-var work. See base handbook Law 3.

**Status:** STUB. Populate on next data-touching task.

## Supabase project

- Project ref: `cqfszhxuvvsgusvjdyqx`
- Region: us-east-1
- Replaced Airtable Mar 2026.

## Schema

TBD. Introspect and document on next schema-touching task.

## RLS

- Invite-only signup. Email/password auth.
- Per-user isolation: recipes, ingredients, food logs scoped by `user_id`.
- Detailed policy table TBD.

## Env var resolver

`src/lib/supabase/env.ts` resolves the dual-naming fallback (project CLAUDE.md Rule 5). Do not introduce a third scheme without ADR.

## Nutrition pipeline

USDA → Claude AI estimate → hardcoded lookup → 0. Order is fixed (project CLAUDE.md Rule 3).
