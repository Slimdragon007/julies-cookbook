# ADR-006: Persistence layer for the tweaks panel (Voice / Imagery / Paper / Palette)

**Date:** 2026-05-20
**Status:** proposed (awaiting Slim's accept)
**Decider:** Slim

## Context

The Paper Editorial reskin (TASK-018 → TASK-025) ships a single palette + typography preset. The original Omelette handoff includes a **tweaks panel** (a user-facing preferences surface) that the reskin tasks have all deferred to TASK-026. Per the handoff:

- **Voice** preset: `Editorial` (default, Instrument Serif italic + Inter + JetBrains Mono) | `Notebook` (Caveat + Lora + JetBrains Mono) | `Studio` (Space Grotesk all-sans)
- **Imagery** filter: `Photographic` (none) | `Filmic` (warm low-contrast) | `Mono` (grayscale)
- **Paper** texture: `Smooth` (none) | `Linen` | `Newsprint` (SVG overlay via `.__paper-grain`)
- **Palette**: `Paper` (default terracotta) | `Bone & Sage` (sage `#5A7045`) | `Ink` (dark mode, amber `#E8A26A`) | `Terra wash` (burnt sienna)

These are four orthogonal settings. The state has to be persisted somewhere. This ADR decides where.

The plan at `~/.claude/plans/the-cookbook-modular-moore.md` mandates this ADR before any TASK-026 code lands, per handbook Law 1 (schema-first) and Law 4 (vendor-touching changes require an ADR).

## Constraints

- **Multi-user, multi-device.** Invite-only family app. Julie uses iPhone + iPad in the kitchen; Slim uses desktop. Cross-device consistency is meaningful UX.
- **Per-user state.** Tweaks are Julie's tweaks, not the family's. RLS-scoped.
- **Existing Supabase tables follow the convention** `(id uuid pk, user_id uuid fk, ...rest, created_at, updated_at)` with RLS policies of the form `auth.uid() = user_id`.
- **ADR-004 (migration tooling) is accepted.** Any new table lands as `supabase/migrations/<timestamp>_<snake_case_name>.sql`.
- **Tweaks panel doesn't exist yet.** No legacy state to migrate. v1 is greenfield.
- **Backend invariant for the reskin work.** The reskin PRs (#29, #30) deliberately do NOT touch backend. This ADR is the _separate_ track that explicitly does touch backend, gated by the ADR.
- **No SSR hydration mismatch tolerated.** Whatever the server renders for `data-voice` / `data-paper` etc. on `<html>` has to match what the client renders. Cookies or server-readable storage matter for the first paint.

## Options

### Option A: localStorage only

`window.localStorage.setItem('tweaks', JSON.stringify({...}))`. Read on `useEffect` mount, write on any control change. A React context exposes the values + setters.

**Pros:**

- Zero backend work. Ships in one PR.
- No RLS policy, no migration, no API surface to test.
- Per-device by default (some users prefer this: "my phone is for kitchen mode, my desktop is for meal planning").

**Cons:**

- No cross-device sync. Julie sets Bone & Sage on iPad, opens iPhone, sees terracotta. Confusing for a coherent-aesthetic family app.
- Mobile Safari evicts localStorage aggressively when storage pressure hits (iOS 13.4+ "7-day cap" on script-set storage for apps that aren't installed as PWAs). Settings could vanish weekly.
- SSR mismatch risk: server has no access to localStorage, so the first paint is always default, then client hydrates to the actual preference. Visible flicker.
- Doesn't compose with future per-user preferences (daily calorie target, preferred meal times, etc.). Would require a second "where do I store this?" decision.

### Option B: Supabase `user_preferences` table

New table:

```sql
create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  voice text not null default 'editorial',
  imagery text not null default 'photographic',
  paper text not null default 'smooth',
  palette text not null default 'paper',
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "users read own prefs"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "users upsert own prefs"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "users update own prefs"
  on public.user_preferences for update
  using (auth.uid() = user_id);
```

Read via `createSupabaseServer().from('user_preferences').select().single()` in `(main)/layout.tsx`, pass values down via a `<TweaksProvider>` context. Write via the browser client on control change.

**Pros:**

- Cross-device sync. Julie's preferences follow her between iPhone, iPad, desktop.
- Server-readable: the `(main)/layout.tsx` server component can fetch preferences and emit the correct `data-*` attributes on `<html>` for the first paint, no flicker.
- Follows the established schema convention. Future per-user state (calorie targets, meal-time defaults) lands as additional columns or sibling tables.
- Auditable: `updated_at` column gives "when did Julie last touch her settings" for debugging.
- RLS-scoped naturally per the existing per-user isolation pattern.

**Cons:**

- One migration file + one new code path (`src/lib/supabase/preferences.ts` or similar).
- Adds a database read to every authenticated layout render. Caching via SWR + revalidate-on-focus mitigates.
- One more table to remember to back up / restore if Supabase project is recreated.

### Option C: Hybrid (localStorage cache + Supabase source of truth)

Write to both on every change. Read localStorage first (instant), then revalidate against Supabase in the background. Last-write-wins on conflict.

**Pros:**

- Best UX: zero-flicker first paint AND cross-device sync.
- Resilient to network: works offline, syncs when reconnected.

**Cons:**

- Most code. Sync logic, conflict resolution, "what if localStorage has stale data from a since-deleted device" edge cases.
- Two sources of truth → reasoning overhead. Bugs that only surface on one device are harder to reproduce.
- Premature optimization for a settings surface Julie hits ~once per device-setup-day. The latency win over Option B is invisible in practice.

### Option D: Supabase `auth.users.raw_user_meta_data` (user_metadata JSONB)

The Supabase Auth schema already has a `raw_user_meta_data` JSONB column on `auth.users` that's user-writable via `supabase.auth.updateUser({ data: { tweaks: {...} } })`. No new table.

**Pros:**

- Truly zero schema. The column exists.
- Cross-device sync because it's on the user record.
- One JSONB blob covers all four settings without per-column migrations.

**Cons:**

- Couples app preferences to auth state. `user_metadata` is intended for user-controlled identity-adjacent data ("display_name," "avatar_url"). Cramming app preferences in there blurs the boundary (every future per-user setting will need to choose "table or metadata?") and the answer drifts arbitrarily.
- Schema-less: nothing enforces the shape of the JSONB blob. A typo in `voice: 'editorrial'` silently breaks the UI with no DB-level error.
- Harder to query/aggregate across users ("how many people picked Notebook?" requires a JSONB scan). Unlikely we'll need this for a 5-person family app, but the table option keeps it cheap.
- Already used for `display_name` (signup flow); piling more in here grows risk of accidental overwrite if `updateUser({ data: {...} })` is called without merging.

## Decision

**Option B: dedicated `user_preferences` table.**

One-line reason: it matches the existing per-user table convention, fixes Option A's cross-device + flicker problems, and gives a typed schema for future per-user state to grow into without re-deciding storage for every new setting.

Option C is the long-term endpoint if/when offline support matters; Option B → Option C is a non-breaking upgrade (add localStorage cache layer in a future ADR). Option D's "no schema" appeal isn't enough to overcome the lack of column-level type safety on something Julie will see crash if a typo lands.

## Consequences

**Immediate (TASK-026 PR train):**

1. **PR 1: migration + types** (~30 min). New file: `supabase/migrations/<timestamp>_create_user_preferences.sql` with the table + RLS policies above. Apply via Supabase MCP `apply_migration`. Regenerate types (`generate_typescript_types` tool). Commit the migration SQL + the updated types. No app code yet.
2. **PR 2: provider + plumbing** (~1 hour). New: `src/lib/preferences.ts` with `getPreferences(userId)` server-side fetcher + `setPreferences(partial)` browser writer. New: `src/components/TweaksProvider.tsx` client component that hydrates context from server-fetched values. Modify: `src/app/(main)/layout.tsx` to fetch preferences and emit `data-voice`, `data-imagery`, `data-paper`, `data-palette` on the wrapper. Modify: `src/app/globals.css` to react to those attributes with CSS variable overrides (e.g. `html[data-palette="bone-sage"] { --accent: #5A7045; ... }`). No UI to control them yet: verify via DevTools attribute toggling.
3. **PR 3: settings UI** (~1.5 hours). New: `/settings/page.tsx` route (route doesn't exist) with the panel layout. Trigger from MainNav sidebar "Settings" link (no entry exists yet either). Pick: drawer overlay (matches ChatDrawer pattern) or full-page route. Recommend full-page for the simpler implementation. Updates write through the provider; visible change on save.

**Locks in:**

- `user_preferences` table as the home for _future_ per-user app state. Daily calorie target, default meal-time, "show metric by default" overriding the device-level `MeasurementSystemProvider`: all land as columns here.
- `data-*` attributes on the layout wrapper as the styling-override mechanism. CSS variables drive everything; React component code doesn't read tweaks directly: it just renders, and the cascade does the work.
- One database read per `/` and per `(main)/*` page navigation. Performance budget acceptable: Supabase reads are sub-50ms in us-east-1, and SWR + Next.js caching collapse repeat fetches.

**We give up:**

- The pure "localStorage v1 then upgrade later" path. Option B _is_ the v1.
- The "no backend touch for the reskin work" invariant: but only for TASK-026, which is explicitly outside that invariant. The other 5 reskin tasks (TASK-020 / 021 / 022 / 023 / 025) remain visual-only.

## Rollback

If Option B turns out wrong (e.g. RLS policy interactions surprise, or Julie says "actually I want per-device settings"):

1. Drop the `user_preferences` table: `drop table public.user_preferences;` migration. No data lost beyond Julie's chosen settings (resets to defaults).
2. Revert the layout + provider + globals.css changes via `git revert` on PRs 2 + 3.
3. Re-ship TASK-026 under Option A (localStorage). The provider shape stays roughly the same; only the storage backend swaps.

Reversal is one migration + 3 PR reverts. Well under one sprint.

## Open questions

- **Should preferences also drive `MeasurementSystemProvider` (imperial / metric toggle)?** Currently `useMeasurementSystem` is a separate context with no persistence (re-defaults on every load). Folding it into `user_preferences` is a reasonable v1.1 enhancement but out of scope for this ADR. Open.
- **Default values: who sets them?** The migration sets defaults at the column level (`default 'editorial'`, etc.): meaning a fresh signup gets a row only when they first touch a setting (or we INSERT a row on user creation via a trigger). Picking: rely on column defaults + lazy insert on first write. If a user has no row, the layout reads defaults from a constants file `src/lib/preferences.defaults.ts`. Document in PR 2.
- **Should the `data-*` attribute mechanism support `prefers-color-scheme` for the Ink palette?** The handoff says "no dark mode" but `Ink` IS dark mode under a different name. v1: treat Ink as an explicit user choice, ignore system preferences. Revisit if Julie complains about glare at night.
- **Caching invalidation:** when a user updates preferences in one tab, do other open tabs need to react? v1: no: they'll pick up the change on next navigation. Realtime subscription via Supabase channels would solve it but adds complexity. Open.
