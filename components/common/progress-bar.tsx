import { StyleSheet, View } from 'react-native';

type ProgressBarProps = {
  value: number;
  trackColor?: string;
  fillColor?: string;
  height?: number;
};

export function ProgressBar({
  value,
  trackColor = '#1F2937',
  fillColor = '#22C55E',
  height = 8,
}: ProgressBarProps) {
  const normalized = Math.max(0, Math.min(100, value));

  return (
    <View style={[styles.track, { backgroundColor: trackColor, height }]}>
      <View style={[styles.fill, { backgroundColor: fillColor, width: `${normalized}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
