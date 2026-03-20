-- 006_cleanup_workouts_columns.sql
-- Takip ekranındaki ihtiyaçlara göre workouts tablosunu sadeleştirir.
-- (Tracking ekranında kullanılmayan) şu kolonları kaldırıyoruz:
-- - exercise_sets
-- - exercise_rest_seconds
-- - duration_min
-- - calories
-- - note

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

