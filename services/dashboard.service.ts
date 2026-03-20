import { supabase } from '@/lib/supabase/client';

export type DashboardSummary = {
  todayProgramName: string | null;
  todayProgramExerciseCount: number | null;
  latestWeightKg: number | null;
  latestLift: string | null;
};

export async function getDashboardSummary(): Promise<DashboardSummary | null> {
  if (!supabase) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return null;
  }

  const { data: weightRow } = await supabase
    .from('weight_tracking')
    .select('weight_kg')
    .eq('user_id', session.user.id)
    .order('logged_on', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    todayProgramName: null,
    todayProgramExerciseCount: null,
    latestWeightKg: weightRow?.weight_kg ?? null,
    latestLift: null,
  };
}
