import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Colors, Spacing } from '../constants/theme';

interface Props {
  rating: number;
  onRate?: (rating: number) => void;
  size?: number;
}

export default function StarRating({ rating, onRate, size = 22 }: Props) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onRate?.(star)} disabled={!onRate} hitSlop={4}>
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? Colors.gold : Colors.textTertiary}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
});
