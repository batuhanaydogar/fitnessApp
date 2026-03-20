import { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

type AppCardProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  style?: ViewStyle;
};

export function AppCard({ title, subtitle, children, style }: AppCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 16,
    gap: 10,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
  },
});
