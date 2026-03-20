-- 003_weekly_workout_exercises.sql
-- Günler tablosunu kaldır; sabit 7 gün (Pazartesi–Pazar) için hangi günde hangi antrenman yapılacak tek tabloda.

-- Eski politikaları ve tabloları kaldır
drop policy if exists "training_day_exercises_all_own" on public.training_day_exercises;
drop policy if exists "training_days_all_own" on public.training_days;
drop table if exists public.training_day_exercises;
drop table if exists public.training_days;

-- Haftalık antrenman planı: hangi günde (1=Pazartesi … 7=Pazar) hangi egzersizler
create table if not exists public.weekly_workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  day_of_week int not null check (day_of_week >= 1 and day_of_week <= 7),
  exercise_name text not null,
  exercise_sets int not null,
  exercise_reps int not null,
  exercise_target_kg numeric,
  exercise_rest_seconds int,
  exercise_notes text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.weekly_workout_exercises enable row level security;

create policy "weekly_workout_exercises_all_own"
  on public.weekly_workout_exercises
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
