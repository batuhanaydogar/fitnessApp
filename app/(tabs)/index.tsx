import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import { router } from 'expo-router';

import { AppCard } from '@/components/common/app-card';
import { PrimaryButton } from '@/components/common/primary-button';
import { ScreenContainer } from '@/components/common/screen-container';
import { StatGrid } from '@/components/common/stat-grid';
import { SummaryItem } from '@/components/dashboard/summary-item';

import {
  getWeightTrend,
  getWorkoutActivityStats,
  type WeightTrendPoint,
} from '@/services/tracking.service';
import { getActiveQuotes, type QuoteItem } from '@/services/motivation.service';
import { getWeeklyExercises, type WeeklyWorkoutExercise } from '@/services/workout.service';

function getDayOfWeek(): number {
  // 1=Pazartesi ... 7=Pazar
  return ((new Date().getDay() + 6) % 7) + 1;
}

function formatDateShort(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  return `${day}.${month}`;
}

function safeNumber(v: number | null | undefined): number {
  if (!Number.isFinite(v as number)) return 0;
  return v ?? 0;
}

export default function DashboardScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const [weeklyExercises, setWeeklyExercises] = useState<WeeklyWorkoutExercise[]>([]);
  const [weightPoints, setWeightPoints] = useState<WeightTrendPoint[]>([]);
  const [activityStats, setActivityStats] = useState({
    weeklyActiveDays: 0,
    weeklyGoalDays: 7,
    currentStreakDays: 0,
  });

  const currentQuote = quotes[quoteIndex] ?? quotes[0];

  const loadAll = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const dayOfWeek = getDayOfWeek();
      const [remoteQuotes, remoteWeight, remoteActivity, remoteWeeklyExercises] = await Promise.all([
        getActiveQuotes(),
        getWeightTrend(30),
        getWorkoutActivityStats(),
        getWeeklyExercises(dayOfWeek),
      ]);

      setQuotes(remoteQuotes);
      setQuoteIndex(0);
      setWeightPoints(remoteWeight);
      setActivityStats(remoteActivity);
      setWeeklyExercises(remoteWeeklyExercises);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Veriler yuklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const todayWorkoutMeta = useMemo(() => {
    const total = weeklyExercises.length;
    const completed = weeklyExercises.filter((e) => e.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Basit tahmin:
    // - Set basina 25 sn (egzersiz eforu)
    // - Dinlenme: rest_seconds * (sets-1)
    const estimatedMinutes = weeklyExercises.reduce((sum, ex) => {
      const sets = safeNumber(ex.exercise_sets);
      const restSeconds = safeNumber(ex.exercise_rest_seconds);
      const baseSeconds = sets * 25 + Math.max(sets - 1, 0) * restSeconds;
      return sum + baseSeconds / 60;
    }, 0);

    const estimatedDuration = estimatedMinutes > 0 ? `${Math.round(estimatedMinutes)} dk` : '—';

    return { total, completed, percent, estimatedDuration };
  }, [weeklyExercises]);

  const latestWeight = useMemo(() => {
    return weightPoints.length ? weightPoints[weightPoints.length - 1].weight_kg : null;
  }, [weightPoints]);

  const monthlyChange = useMemo(() => {
    if (weightPoints.length < 2) return null;
    const first = weightPoints[0].weight_kg;
    const last = weightPoints[weightPoints.length - 1].weight_kg;
    return last - first;
  }, [weightPoints]);

  const weightCards = useMemo(() => {
    const change = monthlyChange;
    const changeColor = change == null ? '#60A5FA' : change < 0 ? '#34D399' : '#F472B6';
    const changeText = change == null ? 'Son 30 gunde veri yok' : `${change > 0 ? '+' : ''}${change.toFixed(1)} kg`;

    return [
      {
        label: 'Guncel Kilo',
        value: latestWeight != null ? `${latestWeight.toFixed(1)} kg` : '—',
        hint: changeText,
        hintColor: changeColor,
      },
      {
        label: 'Haftalik Antrenman',
        value: `${activityStats.weeklyActiveDays}`,
        hint: `Hedef ${activityStats.weeklyGoalDays} gun`,
        hintColor: '#60A5FA',
      },
      {
        label: 'Streak',
        value: `${activityStats.currentStreakDays} gun`,
        hint: activityStats.currentStreakDays > 0 ? 'Devam et!' : 'Bugun basla',
        hintColor: '#FBBF24',
      },
    ];
  }, [activityStats.currentStreakDays, activityStats.weeklyActiveDays, activityStats.weeklyGoalDays, latestWeight, monthlyChange]);

  const lastWeights = useMemo(() => {
    // Aynı gün birden fazla kayıt olabiliyor; React key çakışmasi olmamasi icin gun bazinda tekilleştir.
    const seen = new Set<string>();
    const picked: WeightTrendPoint[] = [];

    for (let i = weightPoints.length - 1; i >= 0 && picked.length < 3; i -= 1) {
      const p = weightPoints[i];
      const key = p.logged_on;
      if (seen.has(key)) continue;
      seen.add(key);
      picked.push(p);
    }

    picked.reverse();

    return picked.map((p) => ({
      id: p.logged_on,
      date: p.logged_on,
      value: `${Number(p.weight_kg).toFixed(1)} kg`,
    }));
  }, [weightPoints]);

  const handleNextQuote = async () => {
    if (isLoading) return;

    // Yerel dongu (hizli UX)
    if (quotes.length > 0) {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
      return;
    }

    // Liste yoksa yeniden cek
    try {
      const remoteQuotes = await getActiveQuotes();
      setQuotes(remoteQuotes);
      setQuoteIndex(0);
    } catch {
      Alert.alert('Hata', 'Sozler yuklenemedi.');
    }
  };

  return (
    <ScreenContainer title="Dashboard" subtitle="Bugun antrenman, kilo ve motivasyon ozeti.">
      <AppCard
        title="Motivasyon"
        subtitle={isLoading ? 'Yukleniyor...' : 'Bugun yaptigin sey yarinki formunu olusturur.'}>
        <Pressable
          onPress={handleNextQuote}
          style={({ pressed }) => [styles.quoteRefresh, pressed && styles.quoteRefreshPressed]}>
          <Text style={styles.quoteRefreshText}>Sozu yenile</Text>
        </Pressable>
        {isLoading ? null : (
          <Text style={styles.quoteText}>
            {currentQuote?.quote ?? 'Su an gosterilecek motivasyon sozu bulunamadi.'}
          </Text>
        )}
      </AppCard>

      <AppCard title="Bugunun Antrenmani" subtitle="Gunluk plan ozeti">
        <SummaryItem label="Egzersiz Sayisi" value={`${todayWorkoutMeta.total}`} />
        <SummaryItem label="Tamamlanan" value={`${todayWorkoutMeta.completed}`} valueColor="#22C55E" />
        <SummaryItem label="Tahmini Sure" value={todayWorkoutMeta.estimatedDuration} />
      </AppCard>

      <AppCard title="Vucut Takibi" subtitle="Guncel durum">
        <StatGrid items={weightCards as any} />
      </AppCard>

      <AppCard title="Son Agirlik Kayitlari" subtitle="Son kilo girisleri">
        {isLoading ? (
          <Text style={styles.loadingText}>Kilo verileri yukleniyor...</Text>
        ) : loadError ? (
          <Text style={styles.errorText}>{loadError}</Text>
        ) : lastWeights.length > 0 ? (
          lastWeights.map((p) => (
            <SummaryItem
              key={p.id}
              label={p.date === new Date().toISOString().slice(0, 10) ? 'Bugun' : formatDateShort(p.date)}
              value={p.value}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>Henüz kilo kaydı yok.</Text>
        )}
      </AppCard>

      <PrimaryButton label="Antrenmana Basla" onPress={() => router.push('/(tabs)/workouts')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  quoteRefresh: {
    marginTop: 8,
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22C55E',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteRefreshPressed: { opacity: 0.85 },
  quoteRefreshText: {
    color: '#DCFCE7',
    fontSize: 14,
    fontWeight: '700',
  },
  quoteText: {
    marginTop: 10,
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  loadingText: { color: '#9CA3AF', fontSize: 13 },
  errorText: { color: '#FCA5A5', fontSize: 13 },
  emptyText: { color: '#9CA3AF', fontSize: 13 },
});
