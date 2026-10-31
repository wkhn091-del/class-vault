-- =====================================================================
--  Class Vault — database schema
--  Run this once in Supabase → SQL Editor → New query → Run.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- folders
-- ---------------------------------------------------------------------
create table if not exists public.folders (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  is_pinned   boolean not null default false,
  color       text,
  created_at  timestamptz not null default now(),
  constraint folders_color_hex check (color is null or color ~* '^#[0-9a-f]{6}$')
);

create unique index if not exists folders_name_unique
  on public.folders (lower(name));

-- Pinned folders first, then alphabetical.
create index if not exists folders_sort_idx
  on public.folders (is_pinned desc, name asc);

-- ---------------------------------------------------------------------
-- files
-- ---------------------------------------------------------------------
create table if not exists public.files (
  id           uuid primary key default gen_random_uuid(),
  folder_id    uuid not null references public.folders(id) on delete cascade,
  name         text not null,          -- original filename shown in the UI
  storage_path text not null unique,   -- path inside the storage bucket
  mime_type    text,
  size_bytes   bigint not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists files_folder_id_idx on public.files (folder_id);
create index if not exists files_created_at_idx on public.files (created_at desc);

-- ---------------------------------------------------------------------
-- Row Level Security
--
-- The API talks to Supabase with the SERVICE ROLE key, which bypasses RLS.
-- We still enable RLS so that a leaked anon key gives nobody write access.
-- ---------------------------------------------------------------------
alter table public.folders enable row level security;
alter table public.files   enable row level security;

drop policy if exists "folders are readable by anyone" on public.folders;
create policy "folders are readable by anyone"
  on public.folders for select using (true);

drop policy if exists "files are readable by anyone" on public.files;
create policy "files are readable by anyone"
  on public.files for select using (true);

-- No insert/update/delete policies on purpose: only the service role
-- (i.e. your Express server, after checking the admin token) can write.

-- ---------------------------------------------------------------------
-- Storage bucket
-- Create it here, or in the dashboard: Storage → New bucket → "vault".
-- Keep it PRIVATE. The API hands out short-lived signed URLs instead.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('vault', 'vault', false)
on conflict (id) do nothing;
