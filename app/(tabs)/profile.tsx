import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/common/app-card';
import { ScreenContainer } from '@/components/common/screen-container';
import { useAuth } from '@/contexts/auth-context';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'Kullanıcı';
  const email = user?.email ?? '';

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <ScreenContainer
      title="Profil"
      subtitle="Hesap bilgilerin ve çıkış">
      <AppCard title="Hesap" subtitle={email}>
        <View style={styles.row}>
          <Text style={styles.label}>Görünen ad</Text>
          <Text style={styles.value}>{displayName}</Text>
        </View>
      </AppCard>

      <Pressable
        onPress={handleSignOut}
        style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 4,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  value: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
