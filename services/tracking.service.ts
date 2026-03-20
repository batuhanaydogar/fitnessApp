import { supabase } from '@/lib/supabase/client';

export type WeightTrendPoint = {
  logged_on: string;
  weight_kg: number;
};

export type ExerciseTrendPoint = {
  performed_on: string;
  exercise_name: string;
  target_kg: number | null;
};

export type WorkoutActivityStats = {
  weeklyActiveDays: number;
  weeklyGoalDays: number;
  currentStreakDays: number;
};

export type BadgeId = 'disiplin' | 'pr_hunter' | 'erken_kus' | 'hafta_sonu_savascisi';

export type BadgeUnlock = {
  id: BadgeId;
  unlocked: boolean;
};

export type BadgeUnlockResult = {
  unlockedCount: number;
  badges: BadgeUnlock[];
};

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, diff: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + diff);
  return next;
}

export async function getWeightTrend(days = 30): Promise<WeightTrendPoint[]> {
  if (!supabase) {
    return [];
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return [];

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  const fromStr = fromDate.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('weight_entries')
    .select('logged_on, weight_kg')
    .eq('user_id', session.user.id)
    .gte('logged_on', fromStr)
    .order('logged_on', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((r) => ({ logged_on: r.logged_on, weight_kg: r.weight_kg }));
}

export async function getExerciseTrend(
  exerciseName: string,
  limit = 30
): Promise<ExerciseTrendPoint[]> {
  if (!supabase) return [];

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return [];

  const { data, error } = await supabase
    .from('workouts')
    .select('performed_on, exercise_name, exercise_target_kg')
    .eq('user_id', session.user.id)
    .ilike('exercise_name', exerciseName)
    .order('performed_on', { ascending: true })
    .limit(limit);

  if (error) return [];

  return (data ?? []).map((r: any) => ({
    performed_on: r.performed_on,
    exercise_name: r.exercise_name,
    target_kg: r.exercise_target_kg ?? null,
  }));
}

export async function addExerciseLog(params: {
  exerciseName: string;
  targetKg: number | null;
  note?: string | null;
}): Promise<void> {
  if (!supabase) throw new Error('Supabase baglantisi yok.');

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error('Giris yapmaniz gerekiyor.');

  const name = params.exerciseName.trim();
  if (!name) throw new Error('Egzersiz adi zorunludur.');

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from('workouts').insert({
    user_id: session.user.id,
    performed_on: today,
    title: name,
    exercise_name: name,
    exercise_target_kg: params.targetKg,
    exercise_notes: params.note && params.note.trim() ? params.note.trim() : null,
  });

  if (error) throw new Error(error.message);
}

export async function addWeightEntry(params: {
  weightKg: number;
  note?: string | null;
  loggedOn?: string;
}): Promise<void> {
  if (!supabase) throw new Error('Supabase baglantisi yok.');

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error('Giris yapmaniz gerekiyor.');

  if (!Number.isFinite(params.weightKg) || params.weightKg <= 0) {
    throw new Error('Kilo pozitif bir sayi olmali.');
  }

  const loggedOn = params.loggedOn ?? new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from('weight_entries').insert({
    user_id: session.user.id,
    logged_on: loggedOn,
    weight_kg: params.weightKg,
    note: params.note && params.note.trim() ? params.note.trim() : null,
  });

  if (error) throw new Error(error.message);
}

export async function getWorkoutActivityStats(): Promise<WorkoutActivityStats> {
  if (!supabase) {
    return { weeklyActiveDays: 0, weeklyGoalDays: 7, currentStreakDays: 0 };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    return { weeklyActiveDays: 0, weeklyGoalDays: 7, currentStreakDays: 0 };
  }

  const fromDate = addDays(new Date(), -60);
  const fromStr = toDateOnly(fromDate);

  const { data, error } = await supabase
    .from('workouts')
    .select('performed_on')
    .eq('user_id', session.user.id)
    .gte('performed_on', fromStr)
    .order('performed_on', { ascending: false });

  if (error) {
    return { weeklyActiveDays: 0, weeklyGoalDays: 7, currentStreakDays: 0 };
  }

  const dateSet = new Set<string>((data ?? []).map((r: any) => String(r.performed_on)));
  const today = new Date();

  let weeklyActiveDays = 0;
  for (let i = 0; i < 7; i += 1) {
    const d = toDateOnly(addDays(today, -i));
    if (dateSet.has(d)) weeklyActiveDays += 1;
  }

  let currentStreakDays = 0;
  for (let i = 0; i < 60; i += 1) {
    const d = toDateOnly(addDays(today, -i));
    if (dateSet.has(d)) currentStreakDays += 1;
    else break;
  }

  return {
    weeklyActiveDays,
    weeklyGoalDays: 7,
    currentStreakDays,
  };
}

export async function getAchievementBadges(): Promise<BadgeUnlockResult> {
  const defaultResult: BadgeUnlockResult = {
    unlockedCount: 0,
    badges: [
      { id: 'disiplin', unlocked: false },
      { id: 'pr_hunter', unlocked: false },
      { id: 'erken_kus', unlocked: false },
      { id: 'hafta_sonu_savascisi', unlocked: false },
    ],
  };

  if (!supabase) {
    return defaultResult;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return defaultResult;

  const fromDate = addDays(new Date(), -60);
  const fromStr = toDateOnly(fromDate);

  const { data, error } = await supabase
    .from('workouts')
    .select('performed_on, exercise_target_kg')
    .eq('user_id', session.user.id)
    .gte('performed_on', fromStr)
    .order('performed_on', { ascending: true });

  if (error) {
    return defaultResult;
  }

  const rows = (data ?? []) as Array<{ performed_on: string; exercise_target_kg: number | null }>;
  const dateSet = new Set<string>(rows.map((r) => String(r.performed_on)));

  // Weekly (last 7 days) activity
  const today = new Date();
  const weeklyGoalDays = 5;
  let weeklyActiveDays = 0;
  for (let i = 0; i < 7; i += 1) {
    const d = toDateOnly(addDays(today, -i));
    if (dateSet.has(d)) weeklyActiveDays += 1;
  }

  // Current streak (consecutive days ending today)
  let currentStreakDays = 0;
  for (let i = 0; i < 60; i += 1) {
    const d = toDateOnly(addDays(today, -i));
    if (dateSet.has(d)) currentStreakDays += 1;
    else break;
  }

  const weekendCountLast7 = (() => {
    let count = 0;
    for (let i = 0; i < 7; i += 1) {
      const d = toDateOnly(addDays(today, -i));
      if (!dateSet.has(d)) continue;
      const jsDate = new Date(d + 'T00:00:00');
      const day = jsDate.getDay(); // 0=Sun, 6=Sat
      if (day === 0 || day === 6) count += 1;
    }
    return count;
  })();

  const prHunterUnlocked = rows.some(
    (r) => r.exercise_target_kg != null && Number.isFinite(Number(r.exercise_target_kg)) && Number(r.exercise_target_kg) > 0,
  );

  // Erken Kus: bu haftanın ilk antrenmanı Pazartesi/Sali günündeyse acilir
  const erkenKusUnlocked = (() => {
    const weekday = today.getDay(); // 0=Sun..6=Sat
    const mondayOffset = (weekday + 6) % 7; // how many days since Monday
    const monday = addDays(today, -mondayOffset);
    const weekStart = toDateOnly(monday);

    const thisWeekRows = rows.filter((r) => String(r.performed_on) >= weekStart);
    if (thisWeekRows.length === 0) return false;

    const earliest = thisWeekRows[0]; // already ordered asc by performed_on
    const earliestDate = new Date(String(earliest.performed_on) + 'T00:00:00');
    const day = earliestDate.getDay(); // 0=Sun..6=Sat

    // Monday=1, Tuesday=2
    return day === 1 || day === 2;
  })();

  // Disiplin: 3+ gun seri devam
  // Hafta Sonu Savascisi: son 7 gunde en az 1 hafta sonu antrenmani
  const results: BadgeUnlock[] = [
    { id: 'disiplin', unlocked: currentStreakDays >= 3 },
    { id: 'pr_hunter', unlocked: prHunterUnlocked },
    { id: 'erken_kus', unlocked: erkenKusUnlocked },
    { id: 'hafta_sonu_savascisi', unlocked: weekendCountLast7 >= 1 },
  ];

  // (weeklyActiveDays is currently not used for badges, but keep it as a realistic hook)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void weeklyActiveDays;

  const unlockedCount = results.reduce((acc, b) => acc + (b.unlocked ? 1 : 0), 0);

  return { unlockedCount, badges: results };
}
