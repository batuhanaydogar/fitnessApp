-- 001_basic_schema.sql
-- Basit fitness uygulaması için minimal Supabase şeması

-- Uzantı
create extension if not exists "pgcrypto";

-- 1) Kullanıcı profili (auth.users ile ilişki)
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- 2) Antrenman kayıtları
-- Uygulamada göstermek için yeterli olacak basit yapı:
-- - tarih
-- - kategori / başlık
-- - süre (dakika)
-- - tahmini kalori
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  performed_on date not null,
  title text not null,
  -- Form alanlari
  exercise_name text,
  exercise_sets int,
  exercise_reps int,
  exercise_target_kg numeric,
  exercise_rest_seconds int,
  exercise_notes text,
  -- Opsiyonel ozet alanlari
  duration_min int,
  calories numeric,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  logged_on date not null,
  weight_kg numeric not null,
  note text,
  created_at timestamptz not null default now()
);

-- 4) RLS politikaları
-- Kullanıcı sadece kendi verisini görebilsin / güncelleyebilsin

alter table public.users enable row level security;
alter table public.workouts enable row level security;
alter table public.weight_entries enable row level security;

create policy "users_select_own"
  on public.users
  for select
  using (id = auth.uid());

create policy "workouts_all_own"
  on public.workouts
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "weight_entries_all_own"
  on public.weight_entries
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 5) Auth tetikleyici: kullanıcı kayıt olduğunda public.users içine kayıt aç

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


