import { StyleSheet, Text, View } from 'react-native';

type StatGridItem = {
  label: string;
  value: string;
  hint: string;
  hintColor?: string;
};

type StatGridProps = {
  items: StatGridItem[];
};

export function StatGrid({ items }: StatGridProps) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item.label} style={styles.gridItem}>
          <Text style={styles.metricLabel}>{item.label}</Text>
          <Text style={styles.metricValue}>{item.value}</Text>
          <Text style={[styles.metricHint, { color: item.hintColor ?? '#34D399' }]}>{item.hint}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 4,
  },
  metricLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  metricValue: {
    color: '#F9FAFB',
    fontSize: 24,
    fontWeight: '700',
  },
  metricHint: {
    fontSize: 12,
    fontWeight: '600',
  },
});
