-- =====================================================================
--  Migration 002 — pinning and custom folder colours
--  Run once in Supabase → SQL Editor → New query → Run.
--  Safe to run more than once.
-- =====================================================================

alter table public.folders
  add column if not exists is_pinned boolean not null default false;

alter table public.folders
  add column if not exists color text;

-- Only six-digit hex, so a bad value can never reach a style attribute.
alter table public.folders drop constraint if exists folders_color_hex;
alter table public.folders
  add constraint folders_color_hex
  check (color is null or color ~* '^#[0-9a-f]{6}$');

-- Pinned folders first, then alphabetical.
create index if not exists folders_sort_idx
  on public.folders (is_pinned desc, name asc);
