-- TASK-026 PR A: tweaks-panel persistence (ADR-006, Option B)
--
-- Per-user preferences row backing the runtime tweaks panel (Voice /
-- Imagery / Paper / Palette). user_id is the PK and a FK to auth.users so
-- deletion cascades cleanly. Column-level defaults guarantee any SELECT
-- returns the documented defaults even when the row is missing; callers
-- can also rely on a constants file in app code (see ADR-006 "Open
-- questions" for the lazy-insert vs. trigger discussion deferred to PR B).
--
-- Database-level validation: CHECK constraints on each preference column
-- restrict writes to the documented value sets. Chose CHECK over ENUM so
-- future additions are an in-place ALTER + drop/recreate constraint pair
-- rather than an ALTER TYPE ADD VALUE migration.
--
-- RLS: per-user read/insert/update via auth.uid() = user_id, matching the
-- existing recipes/ingredients/food_log policy shape. DELETE is
-- intentionally not exposed: "reset to defaults" is an UPDATE back to the
-- column defaults, and account deletion is handled by the
-- ON DELETE CASCADE on the user_id FK.

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  voice text not null default 'editorial'
    check (voice in ('editorial', 'notebook', 'studio')),
  imagery text not null default 'photographic'
    check (imagery in ('photographic', 'filmic', 'mono')),
  paper text not null default 'smooth'
    check (paper in ('smooth', 'linen', 'newsprint')),
  palette text not null default 'paper'
    check (palette in ('paper', 'bone & sage', 'ink', 'terra wash')),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "users read own prefs"
  on public.user_preferences for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users upsert own prefs"
  on public.user_preferences for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users update own prefs"
  on public.user_preferences for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-refresh updated_at on every row modification. Without this trigger
-- the column's `default now()` only fires on INSERT, which makes the
-- "last touched" audit signal lie. Function is generic enough that
-- future tables with the same column can reuse it via another trigger.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row
  execute function public.set_updated_at();

comment on table public.user_preferences is 'TASK-026 / ADR-006: per-user runtime preferences for the tweaks panel (voice / imagery / paper / palette). Cross-device sync via Supabase, RLS per-user.';
