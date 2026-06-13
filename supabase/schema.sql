create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  purpose text not null default '',
  region text not null default 'nigeria',
  language text not null default 'en',
  tone text not null default 'professional',
  keep_voice boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.history_items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('chat', 'grammar', 'translate')),
  label text,
  title text,
  original_text text,
  result text,
  messages jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  analysis jsonb,
  target_lang text,
  day text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  score_before int,
  score_after int,
  improvement int,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  history_item_id text references public.history_items(id) on delete set null,
  file_name text not null,
  file_type text not null,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lingualai-files',
  'lingualai-files',
  false,
  10485760,
  array[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.profiles enable row level security;
alter table public.history_items enable row level security;
alter table public.progress_events enable row level security;
alter table public.user_files enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "history_select_own" on public.history_items;
create policy "history_select_own" on public.history_items
  for select using (auth.uid() = user_id);

drop policy if exists "history_insert_own" on public.history_items;
create policy "history_insert_own" on public.history_items
  for insert with check (auth.uid() = user_id);

drop policy if exists "history_update_own" on public.history_items;
create policy "history_update_own" on public.history_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "history_delete_own" on public.history_items;
create policy "history_delete_own" on public.history_items
  for delete using (auth.uid() = user_id);

drop policy if exists "progress_select_own" on public.progress_events;
create policy "progress_select_own" on public.progress_events
  for select using (auth.uid() = user_id);

drop policy if exists "progress_insert_own" on public.progress_events;
create policy "progress_insert_own" on public.progress_events
  for insert with check (auth.uid() = user_id);

drop policy if exists "files_select_own" on public.user_files;
create policy "files_select_own" on public.user_files
  for select using (auth.uid() = user_id);

drop policy if exists "files_insert_own" on public.user_files;
create policy "files_insert_own" on public.user_files
  for insert with check (auth.uid() = user_id);

drop policy if exists "storage_files_select_own" on storage.objects;
create policy "storage_files_select_own" on storage.objects
  for select using (
    bucket_id = 'lingualai-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_files_insert_own" on storage.objects;
create policy "storage_files_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'lingualai-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_files_update_own" on storage.objects;
create policy "storage_files_update_own" on storage.objects
  for update using (
    bucket_id = 'lingualai-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'lingualai-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_files_delete_own" on storage.objects;
create policy "storage_files_delete_own" on storage.objects
  for delete using (
    bucket_id = 'lingualai-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
