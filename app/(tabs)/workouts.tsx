import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { AppCard } from '@/components/common/app-card';
import { InputField } from '@/components/common/input-field';
import { PrimaryButton } from '@/components/common/primary-button';
import { ScreenContainer } from '@/components/common/screen-container';
import { FabButton } from '@/components/common/fab-button';
import { FitnessAdMobBanner } from '@/components/ads/FitnessAdMobBanner';
import {
  addWeeklyExercise,
  deleteWeeklyExercise,
  getWeeklyExercises,
  toggleWeeklyExerciseCompleted,
  updateWeeklyExercise,
} from '@/services/workout.service';

// Sabit 7 gün (Pazartesi–Pazar); ekstra gün eklenmez.
type Day = {
  id: string;
  name: string;
  order: number;
};

type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  targetKg: number | null;
  restSeconds: number | null;
  notes: string | null;
  completed: boolean;
};

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEFAULT_DAYS: Day[] = [
  { id: 'd1', name: 'Pazartesi', order: 1 },
  { id: 'd2', name: 'Salı', order: 2 },
  { id: 'd3', name: 'Çarşamba', order: 3 },
  { id: 'd4', name: 'Perşembe', order: 4 },
  { id: 'd5', name: 'Cuma', order: 5 },
  { id: 'd6', name: 'Cumartesi', order: 6 },
  { id: 'd7', name: 'Pazar', order: 7 },
];

const POPULAR_EXERCISES: Array<{
  label: string;
  labelTr?: string;
  defaultSets: string;
  defaultReps: string;
  defaultTargetKg: string;
  defaultRestSeconds: string;
}> = [
  {
    label: 'Bench Press',
    labelTr: 'Göğüs press',
    defaultSets: '4',
    defaultReps: '8',
    defaultTargetKg: '60',
    defaultRestSeconds: '120',
  },
  {
    label: 'Squat',
    labelTr: 'Çömelme / squat',
    defaultSets: '5',
    defaultReps: '5',
    defaultTargetKg: '80',
    defaultRestSeconds: '150',
  },
  {
    label: 'Deadlift',
    labelTr: 'Deadlift (kalça-bel)',
    defaultSets: '3',
    defaultReps: '5',
    defaultTargetKg: '100',
    defaultRestSeconds: '180',
  },
  {
    label: 'Overhead Press',
    labelTr: 'Omuz press',
    defaultSets: '4',
    defaultReps: '6',
    defaultTargetKg: '40',
    defaultRestSeconds: '120',
  },
];

function toExercise(e: {
  id: string;
  exercise_name: string;
  exercise_sets: number;
  exercise_reps: number;
  exercise_target_kg: number | null;
  exercise_rest_seconds: number | null;
  exercise_notes: string | null;
  completed?: boolean;
}): Exercise {
  return {
    id: e.id,
    name: e.exercise_name,
    sets: e.exercise_sets,
    reps: e.exercise_reps,
    targetKg: e.exercise_target_kg,
    restSeconds: e.exercise_rest_seconds,
    notes: e.exercise_notes,
    completed: e.completed ?? false,
  };
}

export default function WorkoutsScreen() {
  const [exercisesByDayKey, setExercisesByDayKey] = useState<Record<string, Exercise[]>>({});
  const [selectedDayId, setSelectedDayId] = useState<string | null>(DEFAULT_DAYS[0]?.id ?? null);
  const [loading, setLoading] = useState(true);

  const [formExerciseName, setFormExerciseName] = useState('');
  const [formSets, setFormSets] = useState('4');
  const [formReps, setFormReps] = useState('8');
  const [formTargetKg, setFormTargetKg] = useState('60');
  const [formRestSeconds, setFormRestSeconds] = useState('90');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const addExerciseSheetRef = useRef<BottomSheetModal>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editingDayKey, setEditingDayKey] = useState<string | null>(null);

  const days = DEFAULT_DAYS;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        const exercises: Record<string, Exercise[]> = {};
        for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
          const exs = await getWeeklyExercises(dayOfWeek);
          if (cancelled) return;
          exercises[String(dayOfWeek)] = exs.map(toExercise);
        }
        if (cancelled) return;
        setExercisesByDayKey(exercises);
        setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const selectedDay = days.find((d) => d.id === selectedDayId);
  const dayKey = selectedDay ? String(selectedDay.order) : '1';
  const currentExercises = exercisesByDayKey[dayKey] ?? [];
  const todayExerciseCount = currentExercises.length;
  const todayCompletedCount = currentExercises.filter((e) => e.completed).length;
  const todayCompletionPercent =
    todayExerciseCount > 0 ? Math.round((todayCompletedCount / todayExerciseCount) * 100) : 0;

  const closeAddExerciseForm = useCallback(() => {
    addExerciseSheetRef.current?.dismiss();
    setFormError(null);
    setFormExerciseName('');
    setFormSets('4');
    setFormReps('8');
    setFormTargetKg('60');
    setFormRestSeconds('90');
    setFormNotes('');
    setEditingExerciseId(null);
    setEditingDayKey(null);
  }, []);

  const openAddExerciseForm = useCallback(() => {
    setFormError(null);
    setEditingExerciseId(null);
    setEditingDayKey(null);
    addExerciseSheetRef.current?.present();
  }, []);

  const startEditExercise = useCallback(
    (dayKey: string, ex: Exercise) => {
      setEditingExerciseId(ex.id);
      setEditingDayKey(dayKey);
      setFormExerciseName(ex.name);
      setFormSets(String(ex.sets));
      setFormReps(String(ex.reps));
      setFormTargetKg(ex.targetKg != null ? String(ex.targetKg) : '');
      setFormRestSeconds(ex.restSeconds != null ? String(ex.restSeconds) : '');
      setFormNotes(ex.notes ?? '');
      setFormError(null);
      addExerciseSheetRef.current?.present();
    },
    []
  );

  const addExercise = useCallback(async () => {
    if (!selectedDayId) {
      setFormError('Önce bir gün seçmelisin.');
      return;
    }
    if (!selectedDay) {
      setFormError('Önce bir gün seçmelisin.');
      return;
    }
    const name = formExerciseName.trim();
    if (!name) {
      setFormError('Egzersiz adı zorunludur.');
      return;
    }
    setFormError(null);
    const sets = parseInt(formSets, 10);
    const reps = parseInt(formReps, 10);
    const targetKg = formTargetKg.trim() ? parseFloat(formTargetKg.replace(',', '.')) : null;
    const restSeconds = formRestSeconds.trim() ? parseInt(formRestSeconds, 10) : null;
    if (!formSets.trim() || !formReps.trim() || isNaN(sets) || sets < 1 || isNaN(reps) || reps < 1) {
      setFormError('Set ve tekrar zorunludur ve 1 veya daha fazla olmalı.');
      return;
    }
    if (restSeconds != null && (isNaN(restSeconds) || restSeconds < 0)) {
      setFormError('Dinlenme süresi 0 veya daha büyük bir sayı olmalı.');
      return;
    }
    const key = String(selectedDay.order);
    const base: Omit<Exercise, 'id'> = {
      name,
      sets,
      reps,
      targetKg: targetKg != null && targetKg > 0 ? targetKg : null,
      restSeconds: restSeconds != null && restSeconds > 0 ? restSeconds : null,
      notes: formNotes.trim() ? formNotes.trim() : null,
      completed: false,
    };

    // Düzenleme modu
    if (editingExerciseId && editingDayKey) {
      setExercisesByDayKey((prev) => ({
        ...prev,
        [editingDayKey]: (prev[editingDayKey] ?? []).map((e) =>
          e.id === editingExerciseId ? { ...e, ...base } : e
        ),
      }));

      try {
        if (editingExerciseId.length === 36 && editingExerciseId.includes('-')) {
          await updateWeeklyExercise(editingExerciseId, {
            exercise_name: base.name,
            exercise_sets: base.sets,
            exercise_reps: base.reps,
            exercise_target_kg: base.targetKg,
            exercise_rest_seconds: base.restSeconds,
            exercise_notes: base.notes,
          });
        }
      } catch (e) {
        console.warn('Egzersiz guncellenemedi:', e);
        setFormError(e instanceof Error ? e.message : 'Güncelleme sırasında hata oluştu.');
        return;
      }

      closeAddExerciseForm();
      Alert.alert('✅ Basarili', 'Egzersiz guncellendi.', [{ text: 'Tamam' }]);
      return;
    }

    // Yeni ekleme
    const newEx: Exercise = {
      id: generateId(),
      ...base,
    };
    setExercisesByDayKey((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), newEx],
    }));

    try {
      await addWeeklyExercise(selectedDay.order, {
        exercise_name: newEx.name,
        exercise_sets: newEx.sets,
        exercise_reps: newEx.reps,
        exercise_target_kg: newEx.targetKg,
        exercise_rest_seconds: newEx.restSeconds,
        exercise_notes: newEx.notes,
      });
    } catch (e) {
      console.warn('Egzersiz veritabanina kaydedilemedi:', e);
      setFormError(e instanceof Error ? e.message : 'Kayit sirasinda hata olustu.');
      return;
    }

    closeAddExerciseForm();
    Alert.alert('✅ Basarili', 'Egzersiz kaydedildi.', [{ text: 'Tamam' }]);
  }, [
    formExerciseName,
    formSets,
    formReps,
    formTargetKg,
    formRestSeconds,
    formNotes,
    editingExerciseId,
    editingDayKey,
    closeAddExerciseForm,
    selectedDay,
  ]);

  const removeExercise = useCallback(async (dayKey: string, exerciseId: string) => {
    const isUuid = exerciseId.length === 36 && exerciseId.includes('-');
    if (isUuid) {
      try {
        await deleteWeeklyExercise(exerciseId);
      } catch {
        // fallback: sadece local state güncelle
      }
    }
    setExercisesByDayKey((prev) => ({
      ...prev,
      [dayKey]: (prev[dayKey] ?? []).filter((e) => e.id !== exerciseId),
    }));
  }, []);

  const toggleCompleted = useCallback(
    async (dayKey: string, exerciseId: string) => {
      const current = exercisesByDayKey[dayKey] ?? [];
      const idx = current.findIndex((e) => e.id === exerciseId);
      if (idx === -1) return;
      const nextCompleted = !current[idx].completed;

      // optimistic update
      setExercisesByDayKey((prev) => ({
        ...prev,
        [dayKey]: (prev[dayKey] ?? []).map((e) =>
          e.id === exerciseId ? { ...e, completed: nextCompleted } : e
        ),
      }));

      try {
        if (exerciseId.length === 36 && exerciseId.includes('-')) {
          await toggleWeeklyExerciseCompleted(exerciseId, nextCompleted);
        }
      } catch {
        // revert on error
        setExercisesByDayKey((prev) => ({
          ...prev,
          [dayKey]: (prev[dayKey] ?? []).map((e) =>
            e.id === exerciseId ? { ...e, completed: !nextCompleted } : e
          ),
        }));
      }
    },
    [exercisesByDayKey]
  );

  return (
    <ScreenContainer
      title="Antrenman Programı"
      subtitle={
        loading
          ? 'Yükleniyor…'
          : 'Günlere göre antrenmanlarını planla. Veriler giriş yaptığın hesapla senkron.'
      }>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <AppCard
            title="Bugünkü Program"
            subtitle="Bugünün seçili gününe ait antrenman özeti."
            style={styles.sectionCard}>
            <View style={styles.todayStatsRow}>
              <View style={styles.todayStatsCol}>
                <Text style={styles.todayStatsLabel}>Toplam egzersiz</Text>
                <Text style={styles.todayStatsValue}>{todayExerciseCount}</Text>
              </View>
              <View style={styles.todayStatsCol}>
                <Text style={styles.todayStatsLabel}>Tamamlanan</Text>
                <Text style={styles.todayStatsValue}>{todayCompletedCount}</Text>
              </View>
              <View style={styles.todayStatsCol}>
                <Text style={styles.todayStatsLabel}>Tamamlama</Text>
                <Text style={styles.todayStatsValue}>{todayCompletionPercent}%</Text>
              </View>
            </View>
          </AppCard>

          <AppCard
            title="Günler"
            subtitle="Bir gün seç, o güne antrenman ekle."
            style={styles.sectionCard}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayScroll}>
              {days.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.dayChip, selectedDayId === day.id && styles.dayChipActive]}
                  onPress={() => {
                    setSelectedDayId(day.id);
                    addExerciseSheetRef.current?.dismiss();
                  }}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.dayChipText,
                      selectedDayId === day.id && styles.dayChipTextActive,
                    ]}>
                    {day.name}
                  </Text>
                  {(exercisesByDayKey[String(day.order)]?.length ?? 0) > 0 && (
                    <View style={styles.dayBadge}>
                      <Text
                        style={[
                          styles.dayBadgeText,
                          selectedDayId === day.id && styles.dayBadgeTextActive,
                        ]}>
                        {exercisesByDayKey[String(day.order)].length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </AppCard>

          {selectedDay && (
            <AppCard
              title={selectedDay.name}
              subtitle="Bu güne ait antrenmanlar."
              style={styles.sectionCard}>
              {currentExercises.length === 0 ? (
                <Text style={styles.emptyHint}>
                  Bu güne henüz egzersiz eklenmedi. Alttaki butondan ekleyebilirsin.
                </Text>
              ) : (
                <View style={styles.exerciseList}>
                  {currentExercises.map((ex) => (
                    <View key={ex.id} style={styles.exerciseCard}>
                      <View style={styles.exerciseCardContent}>
                        <Text style={[styles.exerciseName, ex.completed && styles.exerciseNameDone]}>
                          {ex.name}
                        </Text>
                        <Text style={styles.exerciseMeta}>
                          {ex.sets} set × {ex.reps} tekrar
                          {ex.targetKg != null ? ` · Hedef ${ex.targetKg} kg` : ''}
                          {ex.restSeconds != null ? ` · Dinlenme ${ex.restSeconds} sn` : ''}
                        </Text>
                        {ex.notes ? (
                          <Text style={styles.exerciseNotes} numberOfLines={2}>
                            Not: {ex.notes}
                          </Text>
                        ) : null}
                        <View style={styles.exerciseActionsRow}>
                          <TouchableOpacity
                            style={[
                              styles.completeBtn,
                              ex.completed && styles.completeBtnDone,
                            ]}
                            onPress={() => toggleCompleted(dayKey, ex.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text
                              style={[
                                styles.completeText,
                                ex.completed && styles.completeTextDone,
                              ]}>
                              {ex.completed ? 'Tamamlanmadı' : 'Tamamla'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.iconActions}>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => startEditExercise(dayKey, ex)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Text style={styles.iconButtonText}>✏︎</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => removeExercise(dayKey, ex.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Text style={styles.iconButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </AppCard>
          )}

          {!selectedDayId && (
            <Text style={styles.emptyHint}>Egzersiz eklemek için yukarıdan bir gün seç.</Text>
          )}

          <View style={styles.adMobContainer}>
            <FitnessAdMobBanner />
          </View>
        </ScrollView>

        <View style={styles.fabContainer}>
          <FabButton label="" onPress={openAddExerciseForm} disabled={!selectedDay} />
        </View>
      </KeyboardAvoidingView>

      <BottomSheetModal
        ref={addExerciseSheetRef}
        snapPoints={['55%', '90%']}
        index={1}
        enablePanDownToClose
        onDismiss={closeAddExerciseForm}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}>
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.sheetTitle}>
            {selectedDay ? `${selectedDay.name} — Yeni egzersiz ekle` : 'Yeni egzersiz ekle'}
          </Text>

          <View style={styles.sheetSection}>
            <View style={styles.popularHeaderRow}>
              <Text style={styles.popularTitle}>Popüler egzersizler</Text>
              <Text style={styles.popularSubtitle}>Tek dokunuşla formu doldur</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularChipsRow}>
              {POPULAR_EXERCISES.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.popularChip}
                  activeOpacity={0.85}
                  onPress={() => {
                    setFormExerciseName(item.label);
                    setFormSets(item.defaultSets);
                    setFormReps(item.defaultReps);
                    setFormTargetKg(item.defaultTargetKg);
                    setFormRestSeconds(item.defaultRestSeconds);
                  }}>
                  <Text style={styles.popularChipLabel}>{item.label}</Text>
                  {item.labelTr ? (
                    <Text style={styles.popularChipMeta}>{item.labelTr}</Text>
                  ) : (
                    <Text style={styles.popularChipMeta}>
                      {item.defaultSets}×{item.defaultReps} · {item.defaultTargetKg} kg
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.sheetSection}>
            <View style={styles.formRow}>
              <InputField
                label="Egzersiz adı"
                placeholder="Örn: Bench Press"
                value={formExerciseName}
                onChangeText={setFormExerciseName}
              />
            </View>
          </View>

          <View style={styles.sheetSection}>
            <View style={styles.formGrid}>
              <View style={styles.formCol}>
                <InputField
                  label="Set"
                  placeholder="4"
                  value={formSets}
                  onChangeText={setFormSets}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.formCol}>
                <InputField
                  label="Tekrar"
                  placeholder="8"
                  value={formReps}
                  onChangeText={setFormReps}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <View style={styles.formGrid}>
              <View style={styles.formCol}>
                <InputField
                  label="Hedef (kg)"
                  placeholder="60"
                  value={formTargetKg}
                  onChangeText={setFormTargetKg}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.formCol}>
                <InputField
                  label="Dinlenme (sn)"
                  placeholder="90"
                  value={formRestSeconds}
                  onChangeText={setFormRestSeconds}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.sheetSection}>
            <View style={styles.formRow}>
              <InputField
                label="Notlar"
                placeholder="Örn: Son sette failure'a kadar git"
                value={formNotes}
                onChangeText={setFormNotes}
                multiline
                style={styles.notesInput}
              />
            </View>
          </View>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.sheetCancelBtn} onPress={closeAddExerciseForm}>
              <Text style={styles.sheetCancelText}>Vazgeç</Text>
            </TouchableOpacity>
            <PrimaryButton label="Ekle" onPress={addExercise} />
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32, paddingTop: 4, gap: 16 },
  adMobContainer: { marginTop: 8, alignItems: 'center' },
  dayScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  dayChipActive: {
    borderColor: '#34D399',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  dayChipText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  dayChipTextActive: {
    color: '#34D399',
  },
  dayBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  dayBadgeTextActive: {
    color: '#34D399',
  },
  addDayChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDayText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyHint: {
    color: '#9CA3AF',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  exerciseList: {
    gap: 10,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
  },
  exerciseCardContent: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '700',
  },
  exerciseNameDone: {
    color: '#6EE7B7',
    textDecorationLine: 'line-through',
  },
  exerciseMeta: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  exerciseNotes: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  exerciseActionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#34D399',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  completeBtnDone: {
    borderColor: '#4B5563',
    backgroundColor: '#111827',
  },
  completeText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
  },
  completeTextDone: {
    color: '#9CA3AF',
  },
  iconActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 8,
    gap: 4,
  },
  iconButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  iconButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  removeExerciseBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  removeExerciseText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '600',
  },
  addExerciseButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExerciseButtonText: {
    color: '#34D399',
    fontSize: 15,
    fontWeight: '700',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 24,
  },
  todayStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  todayStatsCol: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  todayStatsLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    marginBottom: 4,
  },
  todayStatsValue: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCard: {
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  formRow: { gap: 6 },
  formGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  formCol: { flex: 1, gap: 6 },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    paddingVertical: 6,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  // Bottom sheet
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
    paddingBottom: 32,
  },
  sheetTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sheetSection: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#111827',
    gap: 10,
  },
  popularHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  popularTitle: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
  popularSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  popularChipsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 8,
    marginBottom: 12,
  },
  popularChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 2,
  },
  popularChipLabel: {
    color: '#F9FAFB',
    fontSize: 13,
    fontWeight: '600',
  },
  popularChipMeta: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  sheetCancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#1F2937',
  },
  sheetCancelText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
});
