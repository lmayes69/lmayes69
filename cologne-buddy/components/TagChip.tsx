import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';

interface Props {
  label: string;
  onRemove?: () => void;
  variant?: 'preset' | 'custom' | 'occasion';
  selected?: boolean;
  onPress?: () => void;
}

const VARIANT_COLORS = {
  preset: { bg: Colors.accentGlow, border: `${Colors.accent}40`, text: Colors.accentLight },
  custom: { bg: Colors.goldDim, border: `${Colors.gold}40`, text: Colors.gold },
  occasion: { bg: 'rgba(112,192,112,0.1)', border: 'rgba(112,192,112,0.3)', text: Colors.success },
};

export default function TagChip({ label, onRemove, variant = 'custom', selected, onPress }: Props) {
  const colors = VARIANT_COLORS[variant];

  const content = (
    <View style={[
      styles.chip,
      { backgroundColor: colors.bg, borderColor: colors.border },
      selected && styles.selected,
      !!onPress && styles.pressable,
    ]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={8}>
          <Ionicons name="close" size={12} color={colors.text} />
        </Pressable>
      )}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.round,
    borderWidth: 1,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  selected: {
    borderColor: Colors.accent,
  },
  pressable: {
    opacity: 0.9,
  },
});
