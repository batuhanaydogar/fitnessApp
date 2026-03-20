-- 004_drop_workout_exercise_reps.sql
-- Takip ekranındaki "Tekrar" alanını kaldırdığımız için workouts tablosundan exercise_reps kolonunu siliyoruz.

alter table public.workouts
  drop column if exists exercise_reps;

