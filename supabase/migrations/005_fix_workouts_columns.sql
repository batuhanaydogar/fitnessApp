-- 005_fix_workouts_columns.sql
-- tracking.tsx / tracking.service.ts'in beklediği kolonlar yoksa ekler.

alter table public.workouts
  add column if not exists exercise_name text;

alter table public.workouts
  add column if not exists exercise_sets int;

alter table public.workouts
  add column if not exists exercise_target_kg numeric;

alter table public.workouts
  add column if not exists exercise_rest_seconds int;

alter table public.workouts
  add column if not exists exercise_notes text;

