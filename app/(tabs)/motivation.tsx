import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';

import { AppCard } from '@/components/common/app-card';
import { PrimaryButton } from '@/components/common/primary-button';
import { ProgressBar } from '@/components/common/progress-bar';
import { ScreenContainer } from '@/components/common/screen-container';
import { SectionHeader } from '@/components/common/section-header';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  getActiveQuotes,
  getFavoriteQuoteIds,
  toggleFavoriteQuote,
  type QuoteItem,
} from '@/services/motivation.service';
import {
  getAchievementBadges,
  getWorkoutActivityStats,
  type BadgeUnlockResult,
  type WorkoutActivityStats,
} from '@/services/tracking.service';

const badgeUnlockFallback: BadgeUnlockResult = {
  unlockedCount: 0,
  badges: [
    { id: 'disiplin', unlocked: false },
    { id: 'pr_hunter', unlocked: false },
    { id: 'erken_kus', unlocked: false },
    { id: 'hafta_sonu_savascisi', unlocked: false },
  ],
};
const fallbackActivityStats: WorkoutActivityStats = {
  weeklyActiveDays: 0,
  weeklyGoalDays: 5,
  currentStreakDays: 0,
};
const fallbackQuotes = [
  { id: 'local-1', quote: 'Bugun yaptigin sey yarinki formunu olusturur.' },
  { id: 'local-2', quote: 'Kucuk ilerleme her gun tekrarlandiginda buyuk sonuclar getirir.' },
  { id: 'local-3', quote: 'Mazeret degil, tekrar sayisi biriktir.' },
  { id: 'local-4', quote: 'Bugunun zorlugu yarinin gucudur.' },
  { id: 'local-5', quote: 'Disiplin, motivasyonun bitti yerde devreye girer.' },
];

export default function MotivationScreen() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quotes, setQuotes] = useState<QuoteItem[]>(fallbackQuotes);
  const [favoriteQuoteIds, setFavoriteQuoteIds] = useState<string[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<'ilham' | 'favoriler'>('ilham');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activityStats, setActivityStats] = useState<WorkoutActivityStats>(fallbackActivityStats);
  const [badgeUnlocks, setBadgeUnlocks] = useState<BadgeUnlockResult>(badgeUnlockFallback);

  const currentQuote = quotes[quoteIndex] ?? quotes[0];
  const isCurrentFavorite = currentQuote ? favoriteQuoteIds.includes(currentQuote.id) : false;
  const favoriteQuotes = quotes.filter((item) => favoriteQuoteIds.includes(item.id));

  const loadSupabaseData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [remoteQuotes, remoteFavoriteIds, remoteActivityStats, remoteBadgeUnlocks] = await Promise.all([
        getActiveQuotes(),
        getFavoriteQuoteIds(),
        getWorkoutActivityStats(),
        getAchievementBadges(),
      ]);

      if (remoteQuotes.length > 0) {
        setQuotes(remoteQuotes);
      } else {
        setQuotes(fallbackQuotes);
      }
      setFavoriteQuoteIds(remoteFavoriteIds);
      setActivityStats({
        weeklyActiveDays: remoteActivityStats.weeklyActiveDays,
        weeklyGoalDays: remoteActivityStats.weeklyGoalDays > 0 ? remoteActivityStats.weeklyGoalDays : 5,
        currentStreakDays: remoteActivityStats.currentStreakDays,
      });

      setBadgeUnlocks(remoteBadgeUnlocks);
    } catch {
      setQuotes(fallbackQuotes);
      setActivityStats(fallbackActivityStats);
      setBadgeUnlocks(badgeUnlockFallback);
      setLoadError('Veriler yenilenemedi. Baglantiyi kontrol edip tekrar deneyebilirsin.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

  useFocusEffect(
    useCallback(() => {
      loadSupabaseData();
    }, [loadSupabaseData]),
  );

  useEffect(() => {
    if (quoteIndex < quotes.length) {
      return;
    }
    setQuoteIndex(0);
  }, [quoteIndex, quotes.length]);

  const favoriteCountText = useMemo(() => {
    if (favoriteQuotes.length === 0) {
      return 'Henuz favori sozun yok.';
    }
    return `${favoriteQuotes.length} favori soz kaydedildi.`;
  }, [favoriteQuotes.length]);

  const weeklyCompletedDays = useMemo(
    () => Math.min(activityStats.weeklyActiveDays, activityStats.weeklyGoalDays),
    [activityStats.weeklyActiveDays, activityStats.weeklyGoalDays],
  );
  const weeklyProgressValue = useMemo(() => {
    if (activityStats.weeklyGoalDays <= 0) {
      return 0;
    }
    return Math.round((weeklyCompletedDays / activityStats.weeklyGoalDays) * 100);
  }, [activityStats.weeklyGoalDays, weeklyCompletedDays]);
  const weeklyRemainingDays = useMemo(
    () => Math.max(activityStats.weeklyGoalDays - weeklyCompletedDays, 0),
    [activityStats.weeklyGoalDays, weeklyCompletedDays],
  );
  const weeklyTargetText = useMemo(() => {
    if (isLoading) {
      return 'Haftalik hedef verisi yukleniyor...';
    }
    if (weeklyRemainingDays === 0) {
      return 'Harika! Bu haftaki hedefini tamamladin.';
    }
    if (weeklyRemainingDays === 1) {
      return 'Bir antrenman daha ile haftayi tamamliyorsun.';
    }
    return `${weeklyRemainingDays} antrenman daha ile haftayi tamamlayabilirsin.`;
  }, [isLoading, weeklyRemainingDays]);

  const handleNextQuote = () => {
    if (isLoading) {
      return;
    }
    if (quotes.length === 0) {
      return;
    }
    setQuoteIndex((prev) => (prev + 1) % quotes.length);
  };

  const handleToggleFavorite = async () => {
    if (isLoading) {
      return;
    }
    if (!currentQuote) {
      return;
    }

    const previous = favoriteQuoteIds;
    const willBeFavorite = !isCurrentFavorite;
    const next = isCurrentFavorite
      ? previous.filter((id) => id !== currentQuote.id)
      : [...previous, currentQuote.id];

    setFavoriteQuoteIds(next);

    try {
      await toggleFavoriteQuote(currentQuote.id, isCurrentFavorite);
      if (willBeFavorite) {
        Alert.alert('✅ Favoriye eklendi', 'Favori soz kaydedildi.', [{ text: 'Tamam' }]);
      } else {
        Alert.alert('✅ Favoriden cikarildi', 'Favori soz kaldirildi.', [{ text: 'Tamam' }]);
      }
    } catch {
      setFavoriteQuoteIds(previous);
    }
  };

  return (
    <ScreenContainer
      title="Motivasyon"
      subtitle="Hedeflerini takip et, serini koru ve odagini kaybetme.">
      <AppCard title="Motivasyon Alanı" subtitle="Ilham ve favori sozlerin tek yerde">
        <View style={styles.segmentedControl}>
          <Pressable
            onPress={() => setActiveMainTab('ilham')}
            style={[styles.segmentButton, activeMainTab === 'ilham' && styles.segmentButtonActive]}>
            <View style={styles.segmentContent}>
              <MaterialIcons
                name="auto-awesome"
                size={15}
                style={[styles.segmentIcon, activeMainTab === 'ilham' && styles.segmentIconActive]}
              />
              <Text style={[styles.segmentText, activeMainTab === 'ilham' && styles.segmentTextActive]}>
                Ilham
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setActiveMainTab('favoriler')}
            style={[
              styles.segmentButton,
              activeMainTab === 'favoriler' && styles.segmentButtonActive,
            ]}>
            <View style={styles.segmentContent}>
              <MaterialIcons
                name="favorite"
                size={15}
                style={[styles.segmentIcon, activeMainTab === 'favoriler' && styles.segmentIconActive]}
              />
              <Text style={[styles.segmentText, activeMainTab === 'favoriler' && styles.segmentTextActive]}>
                Favoriler
              </Text>
            </View>
          </Pressable>
        </View>
      </AppCard>

      {activeMainTab === 'ilham' ? (
        <>
          <AppCard title="Gunun Sozu" subtitle="Bugun odagini koru">
            <View style={styles.quoteHero}>
              <Text style={styles.quoteMark}>"</Text>
              <Text style={styles.quoteHeroText}>
                {isLoading
                  ? 'Motivasyon sozleri yukleniyor...'
                  : currentQuote?.quote ?? 'Su an gosterilecek motivasyon sozu bulunamadi.'}
              </Text>
            </View>
            <View style={styles.actionRow}>
              <View style={styles.actionButton}>
                <PrimaryButton
                  label={isLoading ? 'Yukleniyor...' : 'Yeni Soz Getir'}
                  onPress={handleNextQuote}
                />
              </View>
              <Pressable
                disabled={isLoading}
                onPress={handleToggleFavorite}
                style={({ pressed }) => [
                  styles.favoriteButton,
                  isLoading && styles.disabledButton,
                  isCurrentFavorite && styles.favoriteButtonActive,
                  pressed && styles.pressed,
                ]}>
                <Text
                  style={[
                    styles.favoriteButtonText,
                    isCurrentFavorite && styles.favoriteButtonTextActive,
                  ]}>
                  {isCurrentFavorite ? 'Favoriden Cikar' : 'Favoriye Ekle'}
                </Text>
              </Pressable>
              <Pressable
                onPress={loadSupabaseData}
                style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}>
                <MaterialIcons name="refresh" size={14} color="#93C5FD" />
                <Text style={styles.refreshButtonText}>Verileri Yenile</Text>
              </Pressable>
            </View>
            {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
          </AppCard>

          <AppCard
            title="Haftalik Hedef"
            subtitle={`${activityStats.weeklyGoalDays} antrenman hedefinde ilerleme`}>
            <SectionHeader
              title="Hedef Durumu"
              subtitle={`${weeklyCompletedDays}/${activityStats.weeklyGoalDays} tamamlandi`}
            />
            <ProgressBar value={weeklyProgressValue} />
            <Text style={styles.targetText}>{weeklyTargetText}</Text>
            <View style={styles.quickStatsRow}>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatLabel}>Streak</Text>
                <Text style={styles.quickStatValue}>{activityStats.currentStreakDays} gun</Text>
              </View>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatLabel}>Aktif Gun</Text>
                <Text style={styles.quickStatValue}>{activityStats.weeklyActiveDays}</Text>
              </View>
            </View>
          </AppCard>
        </>
      ) : (
        <>
          <AppCard title="Favori Sozlerim" subtitle={favoriteCountText}>
            {isLoading ? (
              <Text style={styles.emptyStateText}>Favoriler yukleniyor...</Text>
            ) : favoriteQuotes.length > 0 ? (
              favoriteQuotes.map((quote) => (
                <View key={quote.id} style={styles.favoriteQuoteItem}>
                  <Text style={styles.favoriteQuoteText}>{quote.quote}</Text>
                  <Pressable
                    onPress={async () => {
                      const previous = favoriteQuoteIds;
                      const next = previous.filter((id) => id !== quote.id);
                      setFavoriteQuoteIds(next);
                      try {
                        await toggleFavoriteQuote(quote.id, true);
                        Alert.alert('✅ Favoriden cikarildi', 'Favori soz kaldirildi.', [{ text: 'Tamam' }]);
                      } catch {
                        setFavoriteQuoteIds(previous);
                      }
                    }}
                    style={({ pressed }) => [styles.quoteRowFavoriteButtonActive, pressed && styles.pressed]}>
                    <Text style={styles.quoteRowFavoriteTextActive}>Favoriden Cikar</Text>
                  </Pressable>
                </View>
              ))
            ) : (
              <Text style={styles.emptyStateText}>Henuz favori sozun yok.</Text>
            )}
            {!isSupabaseConfigured ? (
              <Text style={styles.infoText}>
                Supabase ayarlanmadi. Favoriler su an sadece uygulama oturumu boyunca tutuluyor.
              </Text>
            ) : null}
            {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
          </AppCard>
        </>
      )}

      <AppCard
        title="Rozetler ve Basarilar"
        subtitle={`${badgeUnlocks.unlockedCount}/4 rozet kazandın`}
      >
        <View style={styles.badgeWrap}>
          {(
            [
              { id: 'disiplin' as const, label: 'Disiplin' },
              { id: 'pr_hunter' as const, label: 'PR Hunter' },
              { id: 'erken_kus' as const, label: 'Erken Kus' },
              { id: 'hafta_sonu_savascisi' as const, label: 'Hafta Sonu Savascisi' },
            ] as const
          ).map((b) => {
            const unlocked = badgeUnlocks.badges.find((x) => x.id === b.id)?.unlocked ?? false;
            return (
              <View
                key={b.id}
                style={[styles.badge, unlocked ? styles.badgeUnlocked : styles.badgeLocked]}>
                <Text
                  style={[
                    styles.badgeText,
                    unlocked ? styles.badgeTextUnlocked : styles.badgeTextLocked,
                  ]}>
                  {b.label}
                </Text>
              </View>
            );
          })}
        </View>
      </AppCard>
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
  segmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentIcon: {
    color: '#9CA3AF',
  },
  segmentIconActive: {
    color: '#052E16',
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
  targetText: {
    color: '#A7F3D0',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  quoteHero: {
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  quoteMark: {
    color: '#34D399',
    fontSize: 22,
    fontWeight: '700',
  },
  quoteHeroText: {
    color: '#E5E7EB',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  actionRow: {
    gap: 8,
  },
  actionButton: {
    width: '100%',
  },
  favoriteButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
  },
  favoriteButtonActive: {
    backgroundColor: '#14532D',
    borderColor: '#16A34A',
  },
  disabledButton: {
    opacity: 0.7,
  },
  favoriteButtonText: {
    color: '#86EFAC',
    fontSize: 14,
    fontWeight: '700',
  },
  favoriteButtonTextActive: {
    color: '#DCFCE7',
  },
  pressed: {
    opacity: 0.85,
  },
  favoriteQuoteItem: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  favoriteQuoteText: {
    color: '#E5E7EB',
    fontSize: 13,
    lineHeight: 18,
  },
  quoteRowFavoriteButton: {
    alignSelf: 'flex-start',
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#22C55E',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  quoteRowFavoriteButtonActive: {
    alignSelf: 'flex-start',
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#14532D',
    borderColor: '#16A34A',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  quoteRowFavoriteText: {
    color: '#86EFAC',
    fontSize: 12,
    fontWeight: '700',
  },
  quoteRowFavoriteTextActive: {
    color: '#DCFCE7',
  },
  emptyStateText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  infoText: {
    color: '#60A5FA',
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    marginTop: 2,
  },
  refreshButton: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    backgroundColor: '#0B1A3A',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  refreshButtonText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 999,
    minHeight: 34,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  badgeUnlocked: {
    backgroundColor: '#052E16',
    borderColor: '#16A34A',
  },
  badgeLocked: {
    backgroundColor: '#0B1220',
    borderColor: '#334155',
    opacity: 0.6,
  },
  badgeText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextUnlocked: {
    color: '#DCFCE7',
  },
  badgeTextLocked: {
    color: '#94A3B8',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickStatItem: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  quickStatLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  quickStatValue: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '700',
  },
});
