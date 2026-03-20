import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

type FabButtonProps = {
  label: string;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
};

export function FabButton({ label, onPress, style, disabled }: FabButtonProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.fab,
        style,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <MaterialIcons name="add" size={20} color="#052E16" />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignSelf: 'flex-end',
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 16,
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: '#052E16',
    fontWeight: '800',
    fontSize: 13,
  },
});
