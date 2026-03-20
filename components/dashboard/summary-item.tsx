import { StyleSheet, Text, View } from 'react-native';

type SummaryItemProps = {
  label: string;
  value: string;
  valueColor?: string;
};

export function SummaryItem({ label, value, valueColor = '#F9FAFB' }: SummaryItemProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
  },
});
