import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { AppCard } from '@/components/common/app-card';
import { FabButton } from '@/components/common/fab-button';
import { InputField } from '@/components/common/input-field';
import { PrimaryButton } from '@/components/common/primary-button';
import { ProgressBar } from '@/components/common/progress-bar';
import { ScreenContainer } from '@/components/common/screen-container';
import { SectionHeader } from '@/components/common/section-header';
import { SummaryItem } from '@/components/dashboard/summary-item';
import {
  addExerciseLog,
  addWeightEntry,
  getExerciseTrend,
  getWeightTrend,
  getWorkoutActivityStats,
} from '@/services/tracking.service';

const EXERCISES = ['Bench Press', 'Squat', 'Deadlift'] as const;
type ExerciseKey = (typeof EXERCISES)[number];
const CHART_WIDTH = Dimensions.get('window').width - 72;
const chartConfig = {
  backgroundGradientFrom: '#020617',
  backgroundGradientTo: '#020617',
  color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
  strokeWidth: 2,
  decimalPlaces: 1,
  propsForDots: {
    r: '3',
    strokeWidth: '0',
  },
};

export default function TrackingScreen() {
  const [activeTab, setActiveTab] = useState<'agirlik' | 'kilo'>('agirlik');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseKey>('Bench Press');

  const [weightPoints, setWeightPoints] = useState<{ date: string; value: number }[]>([]);
  const [exercisePoints, setExercisePoints] = useState<
    { date: string; targetKg: number | null }[]
  >([]);

  const [loadingWeight, setLoadingWeight] = useState(false);
  const [loadingExercise, setLoadingExercise] = useState(false);
  const [weeklyActiveDays, setWeeklyActiveDays] = useState(0);
  const [currentStreakDays, setCurrentStreakDays] = useState(0);

  const addLogSheetRef = useRef<BottomSheetModal>(null);
  const addWeightSheetRef = useRef<BottomSheetModal>(null);
  const [logTargetKg, setLogTargetKg] = useState('60');
  const [logNotes, setLogNotes] = useState('');
  const [logError, setLogError] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [weightNote, setWeightNote] = useState('');
  const [weightError, setWeightError] = useState<string | null>(null);

  const refreshActivityStats = useCallback(async () => {
    const stats = await getWorkoutActivityStats();
    setWeeklyActiveDays(stats.weeklyActiveDays);
    setCurrentStreakDays(stats.currentStreakDays);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingWeight(true);
      try {
        const data = await getWeightTrend(30);
        if (cancelled) return;
        setWeightPoints(
          data.map((p) => ({
            date: p.logged_on,
            value: Number(p.weight_kg),
          }))
        );
      } finally {
        if (!cancelled) setLoadingWeight(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    refreshActivityStats();
  }, [refreshActivityStats]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingExercise(true);
      try {
        const data = await getExerciseTrend(selectedExercise, 20);
        if (cancelled) return;
        setExercisePoints(
          data.map((p) => ({
            date: p.performed_on,
            targetKg: p.target_kg != null ? Number(p.target_kg) : null,
          }))
        );
      } finally {
        if (!cancelled) setLoadingExercise(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedExercise]);

  const latestWeight = weightPoints.length ? weightPoints[weightPoints.length - 1].value : null;
  const weightChartData = useMemo(
    () =>
      weightPoints.map((p, idx) => ({
        x: idx + 1,
        y: p.value,
      })),
    [weightPoints]
  );

  const exerciseChartData = useMemo(
    () =>
      exercisePoints
        .filter((p) => p.targetKg != null && Number.isFinite(p.targetKg))
        .map((p, idx) => ({
          x: idx + 1,
          y: Number(p.targetKg),
        })),
    [exercisePoints]
  );

  const exerciseLineData = useMemo(
    () => ({
      labels: exerciseChartData.map((_, i) => `${i + 1}`),
      datasets: [{ data: exerciseChartData.map((p) => p.y) }],
    }),
    [exerciseChartData]
  );

  const weightLineData = useMemo(
    () => ({
      labels: weightChartData.map((_, i) => `${i + 1}`),
      datasets: [{ data: weightChartData.map((p) => p.y) }],
    }),
    [weightChartData]
  );

  const monthlyChange = useMemo(() => {
    if (weightPoints.length < 2) return null;
    const first = weightPoints[0].value;
    const last = weightPoints[weightPoints.length - 1].value;
    return last - first;
  }, [weightPoints]);

  const openAddLogForm = () => {
    setLogError(null);
    setLogTargetKg('60');
    setLogNotes('');
    addLogSheetRef.current?.present();
  };

  const saveExerciseLog = async () => {
    setLogError(null);
    const target = logTargetKg.trim() ? Number(logTargetKg.replace(',', '.')) : null;
    if (target != null && (isNaN(target) || target <= 0)) {
      setLogError('Hedef agirlik pozitif bir sayi olmali.');
      return;
    }
    try {
      await addExerciseLog({
        exerciseName: selectedExercise,
        targetKg: target,
        note: logNotes,
      });
      // Kayit eklendikten sonra trendi yenile
      const data = await getExerciseTrend(selectedExercise, 20);
      setExercisePoints(
        data.map((p) => ({
          date: p.performed_on,
          targetKg: p.target_kg != null ? Number(p.target_kg) : null,
        }))
      );
      await refreshActivityStats();
      addLogSheetRef.current?.dismiss();
      Alert.alert('✅ Kaydedildi', 'Egzersiz kaydi basariyla eklendi.', [{ text: 'Tamam' }]);
    } catch (e) {
      setLogError(e instanceof Error ? e.message : 'Kayit eklenemedi.');
    }
  };

  const openAddWeightForm = () => {
    setWeightError(null);
    setWeightInput('');
    setWeightNote('');
    addWeightSheetRef.current?.present();
  };

  const saveWeightEntry = async () => {
    setWeightError(null);
    const weight = Number(weightInput.replace(',', '.'));
    if (!Number.isFinite(weight) || weight <= 0) {
      setWeightError('Kilo degeri pozitif bir sayi olmali.');
      return;
    }

    try {
      await addWeightEntry({ weightKg: weight, note: weightNote });
      const data = await getWeightTrend(30);
      setWeightPoints(
        data.map((p) => ({
          date: p.logged_on,
          value: Number(p.weight_kg),
        }))
      );
      addWeightSheetRef.current?.dismiss();
      Alert.alert('✅ Kaydedildi', 'Kilo kaydi basariyla eklendi.', [{ text: 'Tamam' }]);
    } catch (e) {
      setWeightError(e instanceof Error ? e.message : 'Kilo kaydi eklenemedi.');
    }
  };

  return (
    <ScreenContainer
      title="Takip"
      subtitle="Kilo ve agirlik ilerlemeni tek yerden izle.">
      <AppCard title="Takip Sekmeleri" subtitle="Kilo ve agirlik verileri arasinda gecis yap">
        <View style={styles.segmentedControl}>
          <Pressable
            onPress={() => setActiveTab('agirlik')}
            style={[styles.segmentButton, activeTab === 'agirlik' && styles.segmentButtonActive]}>
            <Text
              style={[
                styles.segmentText,
                activeTab === 'agirlik' && styles.segmentTextActive,
              ]}>
              Agirlik
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('kilo')}
            style={[styles.segmentButton, activeTab === 'kilo' && styles.segmentButtonActive]}>
            <Text style={[styles.segmentText, activeTab === 'kilo' && styles.segmentTextActive]}>
              Kilo
            </Text>
          </Pressable>
        </View>
      </AppCard>

      {activeTab === 'agirlik' ? (
        <>
          <AppCard title="Agirlik Takibi" subtitle="Guc gelisimini haftalik gor">
            <SectionHeader
              title="Egzersiz Secici"
              subtitle={`Secili: ${selectedExercise}`}
            />
            <View style={styles.selectorRow}>
              {EXERCISES.map((item) => {
                const active = selectedExercise === item;
                return (
                  <Pressable
                    key={item}
                    style={[styles.selectorChip, active && styles.selectorChipActive]}
                    onPress={() => setSelectedExercise(item)}>
                    <Text
                      style={[
                        styles.selectorText,
                        active && styles.selectorTextActive,
                      ]}>
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <SectionHeader
              title="Agirlik Grafigi"
              subtitle="Son antrenmanlardaki hedef agirlik"
            />
            <View style={styles.chartContainer}>
              {loadingExercise ? (
                <Text style={styles.chartText}>Yükleniyor…</Text>
              ) : exerciseChartData.length === 0 ? (
                <Text style={styles.chartText}>
                  Bu egzersiz icin henuz kayit yok.
                </Text>
              ) : (
                <View style={styles.chartHeight}>
                  <LineChart
                    data={exerciseLineData}
                    width={CHART_WIDTH}
                    height={180}
                    withInnerLines={false}
                    withOuterLines={false}
                    withVerticalLines={false}
                    withHorizontalLines
                    fromZero={false}
                    bezier
                    chartConfig={chartConfig}
                    style={styles.lineChart}
                  />
                </View>
              )}
            </View>
            <FabButton label="Kayit Ekle" onPress={openAddLogForm} />
          </AppCard>

          <AppCard title="Gecmis Kayitlar" subtitle="Tarih bazli son egzersiz verileri">
            {exercisePoints.length === 0 ? (
              <Text style={styles.emptyHistoryText}>
                Bu egzersiz icin henuz kayit yok.
              </Text>
            ) : (
              exercisePoints
                .slice()
                .reverse()
                .map((p) => (
                  <View key={`${p.date}-${p.targetKg}`} style={styles.historyRow}>
                    <Text style={styles.historyDate}>{p.date}</Text>
                    <View style={styles.historyMeta}>
                      <Text style={styles.historyExercise}>{selectedExercise}</Text>
                      <Text style={styles.historyValue}>
                        {p.targetKg != null ? `${p.targetKg} kg` : '-'}
                      </Text>
                    </View>
                  </View>
                ))
            )}
          </AppCard>
        </>
      ) : (
        <>
          <AppCard
            title="Kilo Takibi"
            subtitle={
              latestWeight != null ? `Son kayit: ${latestWeight.toFixed(1)} kg` : 'Kayit yok'
            }>
            <SectionHeader title="Kilo Grafigi" subtitle="30 gunluk trend" />
            <View style={styles.chartContainer}>
              {loadingWeight ? (
                <Text style={styles.chartText}>Yükleniyor…</Text>
              ) : weightChartData.length === 0 ? (
                <Text style={styles.chartText}>Henuz kilo kaydi yok.</Text>
              ) : (
                <View style={styles.chartHeight}>
                  <LineChart
                    data={weightLineData}
                    width={CHART_WIDTH}
                    height={180}
                    withInnerLines={false}
                    withOuterLines={false}
                    withVerticalLines={false}
                    withHorizontalLines
                    fromZero={false}
                    bezier
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                    }}
                    style={styles.lineChart}
                  />
                </View>
              )}
            </View>
            {latestWeight != null && (
              <SummaryItem
                label="Son kilo"
                value={`${latestWeight.toFixed(1)} kg`}
                valueColor="#34D399"
              />
            )}
            <SummaryItem
              label="Aylik Degisim"
              value={
                monthlyChange == null
                  ? '-'
                  : `${monthlyChange > 0 ? '+' : ''}${monthlyChange.toFixed(1)} kg`
              }
              valueColor={
                monthlyChange == null
                  ? '#9CA3AF'
                  : monthlyChange <= 0
                    ? '#34D399'
                    : '#F87171'
              }
            />
            <PrimaryButton label="Gunluk Kilo Kaydet" onPress={openAddWeightForm} />
          </AppCard>

          <AppCard title="Kilo Gecmisi" subtitle="Son kayitlarin">
            {weightPoints.length === 0 ? (
              <Text style={styles.emptyHistoryText}>Henuz kilo kaydi yok.</Text>
            ) : (
              weightPoints
                .slice()
                .reverse()
                .map((p) => (
                  <View key={`${p.date}-${p.value}`} style={styles.historyRow}>
                    <Text style={styles.historyDate}>{p.date}</Text>
                    <View style={styles.historyMeta}>
                      <Text style={styles.historyExercise}>Vucut Kilosu</Text>
                      <Text style={styles.historyValue}>{p.value.toFixed(1)} kg</Text>
                    </View>
                  </View>
                ))
            )}
          </AppCard>
        </>
      )}

      <AppCard title="Istatistik ve Streak" subtitle="Spor aliskanligini analiz et">
        <SectionHeader
          title="Haftalik Aktivite"
          subtitle={`${weeklyActiveDays}/7 gun aktif`}
        />
        <ProgressBar value={(weeklyActiveDays / 7) * 100} />
        <SummaryItem
          label="Streak"
          value={`${currentStreakDays} gun ust uste`}
          valueColor={currentStreakDays > 0 ? '#FBBF24' : '#9CA3AF'}
        />
      </AppCard>
      <BottomSheetModal
        ref={addLogSheetRef}
        snapPoints={['45%', '80%']}
        index={0}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}>
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.sheetTitle}>{selectedExercise} — Kayit ekle</Text>
          <View style={styles.sheetSection}>
            <InputField
              label="Hedef agirlik (kg)"
              placeholder="60"
              value={logTargetKg}
              onChangeText={setLogTargetKg}
              keyboardType="decimal-pad"
            />
            <InputField
              label="Notlar"
              placeholder="Orn: Son set RPE 8"
              value={logNotes}
              onChangeText={setLogNotes}
              multiline
              style={styles.notesInput}
            />
          </View>
          {logError ? <Text style={styles.errorText}>{logError}</Text> : null}
          <View style={styles.sheetActions}>
            <PrimaryButton label="Kaydet" onPress={saveExerciseLog} />
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

      <BottomSheetModal
        ref={addWeightSheetRef}
        snapPoints={['40%', '70%']}
        index={0}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}>
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.sheetTitle}>Gunluk kilo kaydet</Text>
          <View style={styles.sheetSection}>
            <InputField
              label="Kilo (kg)"
              placeholder="78.4"
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
            />
            <InputField
              label="Notlar"
              placeholder="Orn: Sabah ac karnina"
              value={weightNote}
              onChangeText={setWeightNote}
              multiline
              style={styles.notesInput}
            />
          </View>
          {weightError ? <Text style={styles.errorText}>{weightError}</Text> : null}
          <View style={styles.sheetActions}>
            <PrimaryButton label="Kaydet" onPress={saveWeightEntry} />
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#22C55E',
  },
  segmentText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#052E16',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  selectorChip: {
    borderRadius: 999,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    minHeight: 34,
    justifyContent: 'center',
  },
  selectorChipActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  selectorText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  selectorTextActive: {
    color: '#022C22',
  },
  chartContainer: {
    minHeight: 160,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#020617',
    paddingHorizontal: 8,
    paddingTop: 4,
    justifyContent: 'center',
  },
  chartHeight: {
    height: 180,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineChart: {
    borderRadius: 12,
  },
  chartText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  historyDate: {
    width: 52,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  historyMeta: {
    flex: 1,
    gap: 2,
  },
  historyExercise: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '700',
  },
  historyValue: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  emptyHistoryText: {
    color: '#6B7280',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  // bottom sheet styles
  sheetBackground: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetHandle: {
    backgroundColor: '#4B5563',
    width: 40,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  sheetTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sheetSection: {
    gap: 10,
    paddingVertical: 4,
  },
  sheetActions: {
    marginTop: 16,
  },
  notesInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    paddingVertical: 4,
  },
});
