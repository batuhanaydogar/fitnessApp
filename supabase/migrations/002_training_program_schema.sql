-- 002_training_program_schema.sql
-- "Antrenman Programı" ekranındaki yapıya birebir uyan tablo şeması
-- (Günler + her güne ait egzersizler)

create extension if not exists "pgcrypto";

-- 1) Kullanıcının program günleri (Pazartesi, Salı, Gün 1, Gün 2, ...)
create table if not exists public.training_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,          -- Ekrandaki gun adi (Pazartesi, Gun 3, vb.)
  day_order int not null,      -- Sıralama icin
  created_at timestamptz not null default now()
);

-- 2) Her güne ait egzersizler
create table if not exists public.training_day_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  day_id uuid not null references public.training_days (id) on delete cascade,
  exercise_name text not null,       -- Egzersiz adi
  exercise_sets int not null,        -- Set
  exercise_reps int not null,        -- Tekrar
  exercise_target_kg numeric,        -- Hedef (kg)
  exercise_rest_seconds int,         -- Dinlenme (sn)
  exercise_notes text,               -- Notlar
  created_at timestamptz not null default now()
);

-- 3) RLS politikaları (kullanıcı sadece kendi verisini görebilir/dokunabilir)

alter table public.training_days enable row level security;
alter table public.training_day_exercises enable row level security;

create policy "training_days_all_own"
  on public.training_days
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "training_day_exercises_all_own"
  on public.training_day_exercises
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

