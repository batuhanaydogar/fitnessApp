import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { InputField } from '@/components/common/input-field';
import { PrimaryButton } from '@/components/common/primary-button';
import { useAuth } from '@/contexts/auth-context';

export default function LoginScreen() {
  const { signIn, error, clearError, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async () => {
    clearError();
    setLocalError(null);
    if (!email.trim()) {
      setLocalError('E-posta girin.');
      return;
    }
    if (!password) {
      setLocalError('Şifre girin.');
      return;
    }
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch {
      // error state set in context
    }
  };

  const err = localError ?? error;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={20}>
        <View style={styles.header}>
          <Text style={styles.title}>Giriş Yap</Text>
          <Text style={styles.subtitle}>Hesabınla devam et</Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            placeholder="ornek@email.com"
            keyboardType="email-address"
            editable={!isLoading}
          />
          <InputField
            label="Şifre"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            editable={!isLoading}
          />
          {err ? <Text style={styles.error}>{err}</Text> : null}
          <PrimaryButton label="Giriş Yap" onPress={handleLogin} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Hesabın yok mu?</Text>
          <Pressable
            onPress={() => router.push('/(auth)/sign-up')}
            disabled={isLoading}
            style={({ pressed }) => [pressed && styles.pressed]}>
            <Text style={styles.link}>Kayıt ol</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color="#22C55E" />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#030712',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    gap: 4,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  form: {
    gap: 16,
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  link: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(3,7,18,0.5)',
  },
});
