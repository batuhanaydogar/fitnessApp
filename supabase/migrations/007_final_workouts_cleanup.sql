-- 007_final_workouts_cleanup.sql
-- workouts tablosunda kullanılmayan alanları kökten temizler (idempotent).

alter table public.workouts
  drop column if exists exercise_reps;

alter table public.workouts
  drop column if exists exercise_sets;

alter table public.workouts
  drop column if exists exercise_rest_seconds;

alter table public.workouts
  drop column if exists duration_min;

alter table public.workouts
  drop column if exists calories;

alter table public.workouts
  drop column if exists note;

