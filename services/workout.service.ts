import { supabase } from '@/lib/supabase/client';

export type WorkoutProgram = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  last_performed_at: string | null;
  is_template: boolean;
  day_count?: number;
};

export type ProgramDay = {
  id: string;
  program_id: string;
  name: string;
  subtitle: string | null;
  day_order: number;
  exercise_count?: number;
};

export type ProgramDayExercise = {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  target_weight_kg: number | null;
  exercise_order: number;
};

/** Kullanicinin programlari + sablon programlar (user_id null) */
export async function getPrograms(): Promise<WorkoutProgram[]> {
  if (!supabase) {
    return [];
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id ?? null;

  const q = supabase
    .from('workout_programs')
    .select('id, user_id, name, description, is_active, last_performed_at')
    .eq('is_active', true);

  if (userId) {
    q.or('user_id.is.null,user_id.eq.' + userId);
  } else {
    q.is('user_id', null);
  }

  const { data: rows, error } = await q
    .order('last_performed_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  const programs = (rows ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    is_active: p.is_active,
    last_performed_at: p.last_performed_at,
    is_template: p.user_id == null,
  }));

  const programIds = programs.map((p) => p.id);
  if (programIds.length === 0) {
    return programs;
  }

  const { data: dayCounts } = await supabase
    .from('program_days')
    .select('program_id')
    .in('program_id', programIds);

  const countByProgram = (dayCounts ?? []).reduce<Record<string, number>>((acc, d) => {
    acc[d.program_id] = (acc[d.program_id] ?? 0) + 1;
    return acc;
  }, {});

  return programs.map((p) => ({
    ...p,
    day_count: countByProgram[p.id] ?? 0,
  }));
}

/** Bir programin gunlerini getirir (siralı). */
export async function getProgramDays(programId: string): Promise<ProgramDay[]> {
  if (!supabase) {
    return [];
  }

  const { data: days, error } = await supabase
    .from('program_days')
    .select('id, program_id, name, subtitle, day_order')
    .eq('program_id', programId)
    .order('day_order', { ascending: true });

  if (error) {
    throw error;
  }

  const dayIds = (days ?? []).map((d) => d.id);
  if (dayIds.length === 0) {
    return (days ?? []).map((d) => ({ ...d, exercise_count: 0 }));
  }

  const { data: exCounts } = await supabase
    .from('program_day_exercises')
    .select('program_day_id')
    .in('program_day_id', dayIds);

  const countByDay = (exCounts ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.program_day_id] = (acc[e.program_day_id] ?? 0) + 1;
    return acc;
  }, {});

  return (days ?? []).map((d) => ({
    ...d,
    exercise_count: countByDay[d.id] ?? 0,
  }));
}

/** Bir gunun egzersizlerini getirir (egzersiz adi ile). */
export async function getProgramDayExercises(
  programDayId: string
): Promise<ProgramDayExercise[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('program_day_exercises')
    .select(
      `
      id,
      exercise_id,
      sets,
      reps,
      target_weight_kg,
      exercise_order,
      exercises ( name )
    `
    )
    .eq('program_day_id', programDayId)
    .order('exercise_order', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: { exercises: { name: string } | null } & Record<string, unknown>) => ({
    id: row.id as string,
    exercise_id: row.exercise_id as string,
    exercise_name: row.exercises?.name ?? 'Egzersiz',
    sets: row.sets as number,
    reps: row.reps as number,
    target_weight_kg: row.target_weight_kg as number | null,
    exercise_order: row.exercise_order as number,
  }));
}

/** Son yapilan tarihi kisa metin (2 gun once, Dun, bugun vb.) */
export function formatLastPerformed(at: string | null): string {
  if (!at) return 'Henuz yapilmadi';
  const d = new Date(at);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Bugun';
  if (diffDays === 1) return 'Dun';
  if (diffDays < 7) return `${diffDays} gun once`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta once`;
  return `${Math.floor(diffDays / 30)} ay once`;
}

/** Yeni program olusturur (kullanici giris yapmis olmali). */
export async function createProgram(name: string): Promise<WorkoutProgram | null> {
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;

  const { data: program, error: programError } = await supabase
    .from('workout_programs')
    .insert({
      user_id: session.user.id,
      name: name.trim() || 'Yeni Program',
      is_active: true,
    })
    .select('id, user_id, name, description, is_active, last_performed_at')
    .single();

  if (programError || !program) return null;

  const { data: days } = await supabase
    .from('program_days')
    .insert([
      { program_id: program.id, name: 'Gun 1', subtitle: null, day_order: 1 },
      { program_id: program.id, name: 'Gun 2', subtitle: null, day_order: 2 },
      { program_id: program.id, name: 'Gun 3', subtitle: null, day_order: 3 },
    ])
    .select('id');

  return {
    id: program.id,
    name: program.name,
    description: program.description,
    is_active: program.is_active,
    last_performed_at: program.last_performed_at,
    is_template: false,
    day_count: days?.length ?? 3,
  };
}

/** Sablon programi kopyalayip kullaniciya ait yeni program olusturur. */
export async function copyTemplateProgram(
  templateProgramId: string
): Promise<WorkoutProgram | null> {
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;

  const { data: template } = await supabase
    .from('workout_programs')
    .select('name, description')
    .eq('id', templateProgramId)
    .is('user_id', null)
    .single();

  if (!template) return null;

  const { data: newProgram, error: programError } = await supabase
    .from('workout_programs')
    .insert({
      user_id: session.user.id,
      name: template.name + ' (Kopya)',
      description: template.description,
      is_active: true,
    })
    .select('id, user_id, name, description, is_active, last_performed_at')
    .single();

  if (programError || !newProgram) return null;

  const { data: templateDays } = await supabase
    .from('program_days')
    .select('name, subtitle, day_order')
    .eq('program_id', templateProgramId)
    .order('day_order', { ascending: true });

  if (templateDays?.length) {
    await supabase.from('program_days').insert(
      templateDays.map((d) => ({
        program_id: newProgram.id,
        name: d.name,
        subtitle: d.subtitle,
        day_order: d.day_order,
      }))
    );
  } else {
    await supabase.from('program_days').insert([
      { program_id: newProgram.id, name: 'Gun 1', day_order: 1 },
      { program_id: newProgram.id, name: 'Gun 2', day_order: 2 },
      { program_id: newProgram.id, name: 'Gun 3', day_order: 3 },
    ]);
  }

  return {
    id: newProgram.id,
    name: newProgram.name,
    description: newProgram.description,
    is_active: newProgram.is_active,
    last_performed_at: newProgram.last_performed_at,
    is_template: false,
    day_count: templateDays?.length ?? 3,
  };
}

// --- weekly_workout_exercises (003): sabit 7 gün, hangi günde ne antrenman ---

export type WeeklyWorkoutExercise = {
  id: string;
  day_of_week: number;
  exercise_name: string;
  exercise_sets: number;
  exercise_reps: number;
  exercise_target_kg: number | null;
  exercise_rest_seconds: number | null;
  exercise_notes: string | null;
  completed: boolean;
};

/** Belirli bir güne (1=Pazartesi … 7=Pazar) ait egzersizleri getirir. */
export async function getWeeklyExercises(dayOfWeek: number): Promise<WeeklyWorkoutExercise[]> {
  if (!supabase) return [];

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return [];

  const { data, error } = await supabase
    .from('weekly_workout_exercises')
    .select(
      'id, day_of_week, exercise_name, exercise_sets, exercise_reps, exercise_target_kg, exercise_rest_seconds, exercise_notes, completed'
    )
    .eq('user_id', session.user.id)
    .eq('day_of_week', dayOfWeek)
    .order('created_at', { ascending: true });

  if (error) return [];
  return (data ?? []) as WeeklyWorkoutExercise[];
}

/** Haftalık plana egzersiz ekler (day_of_week 1–7). */
export async function addWeeklyExercise(
  dayOfWeek: number,
  payload: {
    exercise_name: string;
    exercise_sets: number;
    exercise_reps: number;
    exercise_target_kg: number | null;
    exercise_rest_seconds: number | null;
    exercise_notes: string | null;
  }
): Promise<void> {
  if (!supabase) throw new Error('Supabase baglantisi yok.');

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error('Giris yapmaniz gerekiyor.');

  const name = payload.exercise_name.trim();
  if (!name || payload.exercise_sets < 1 || payload.exercise_reps < 1) {
    throw new Error('Egzersiz adi, set ve tekrar zorunludur.');
  }
  if (dayOfWeek < 1 || dayOfWeek > 7) throw new Error('Gun 1–7 arasi olmali.');

  const { error } = await supabase.from('weekly_workout_exercises').insert({
    user_id: session.user.id,
    day_of_week: dayOfWeek,
    exercise_name: name,
    exercise_sets: payload.exercise_sets,
    exercise_reps: payload.exercise_reps,
    exercise_target_kg: payload.exercise_target_kg != null && payload.exercise_target_kg > 0 ? payload.exercise_target_kg : null,
    exercise_rest_seconds: payload.exercise_rest_seconds != null && payload.exercise_rest_seconds >= 0 ? payload.exercise_rest_seconds : null,
    exercise_notes: payload.exercise_notes != null && payload.exercise_notes.trim() !== '' ? payload.exercise_notes.trim() : null,
    completed: false,
  });

  if (error) throw new Error(error.message);
}

/** Haftalık plandan egzersizi siler. */
export async function deleteWeeklyExercise(exerciseId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase baglantisi yok.');

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error('Giris yapmaniz gerekiyor.');

  const { error } = await supabase
    .from('weekly_workout_exercises')
    .delete()
    .eq('id', exerciseId)
    .eq('user_id', session.user.id);

  if (error) throw new Error(error.message);
}

/** Haftalık planda egzersizi (set, tekrar, hedef, dinlenme, not) gunceller. */
export async function updateWeeklyExercise(
  exerciseId: string,
  payload: {
    exercise_name: string;
    exercise_sets: number;
    exercise_reps: number;
    exercise_target_kg: number | null;
    exercise_rest_seconds: number | null;
    exercise_notes: string | null;
  }
): Promise<void> {
  if (!supabase) throw new Error('Supabase baglantisi yok.');

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error('Giris yapmaniz gerekiyor.');

  const name = payload.exercise_name.trim();
  if (!name || payload.exercise_sets < 1 || payload.exercise_reps < 1) {
    throw new Error('Egzersiz adi, set ve tekrar zorunludur.');
  }

  const { error } = await supabase
    .from('weekly_workout_exercises')
    .update({
      exercise_name: name,
      exercise_sets: payload.exercise_sets,
      exercise_reps: payload.exercise_reps,
      exercise_target_kg:
        payload.exercise_target_kg != null && payload.exercise_target_kg > 0
          ? payload.exercise_target_kg
          : null,
      exercise_rest_seconds:
        payload.exercise_rest_seconds != null && payload.exercise_rest_seconds >= 0
          ? payload.exercise_rest_seconds
          : null,
      exercise_notes:
        payload.exercise_notes != null && payload.exercise_notes.trim() !== ''
          ? payload.exercise_notes.trim()
          : null,
    })
    .eq('id', exerciseId)
    .eq('user_id', session.user.id);

  if (error) throw new Error(error.message);
}

/** Haftalık planda completed bilgisini günceller. */
export async function toggleWeeklyExerciseCompleted(
  exerciseId: string,
  completed: boolean
): Promise<void> {
  if (!supabase) throw new Error('Supabase baglantisi yok.');

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error('Giris yapmaniz gerekiyor.');

  const { error } = await supabase
    .from('weekly_workout_exercises')
    .update({ completed })
    .eq('id', exerciseId)
    .eq('user_id', session.user.id);

  if (error) throw new Error(error.message);
}
