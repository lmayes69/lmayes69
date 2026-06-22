import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';

interface Props {
  level: number; // 0-100
  size?: 'sm' | 'md';
}

function getLevelLabel(level: number): string {
  if (level >= 90) return 'Full';
  if (level >= 70) return '75%';
  if (level >= 45) return 'Half';
  if (level >= 20) return 'Low';
  return 'Nearly Empty';
}

export default function QuantityIndicator({ level, size = 'md' }: Props) {
  const fillColor = level > 60 ? Colors.accent : level > 25 ? Colors.gold : Colors.error;
  const height = size === 'sm' ? 40 : 64;
  const width = size === 'sm' ? 14 : 20;

  return (
    <View style={styles.container}>
      <View style={[styles.bottle, { height, width }]}>
        <View
          style={[
            styles.fill,
            {
              height: `${level}%`,
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>
      <Text style={[styles.label, { color: fillColor }]}>{getLevelLabel(level)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  bottle: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: Colors.surfaceElevated,
  },
  fill: {
    borderRadius: 2,
  },
  label: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
