import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Typography } from '../constants/theme';
import { Season } from '../types';

const SEASON_CONFIG: Record<Season, { color: string; icon: string; bg: string }> = {
  Spring: { color: Colors.springGreen, icon: '🌸', bg: 'rgba(126,200,160,0.15)' },
  Summer: { color: Colors.summerCoral, icon: '☀️', bg: 'rgba(232,146,106,0.15)' },
  Fall:   { color: Colors.fallAmber,   icon: '🍂', bg: 'rgba(201,168,76,0.15)' },
  Winter: { color: Colors.winterIce,   icon: '❄️', bg: 'rgba(123,184,212,0.15)' },
};

interface Props {
  season: Season;
  compact?: boolean;
}

export default function SeasonBadge({ season, compact = false }: Props) {
  const config = SEASON_CONFIG[season];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: `${config.color}40` }, compact && styles.compact]}>
      {!compact && <Text style={styles.icon}>{config.icon}</Text>}
      <Text style={[styles.label, { color: config.color }, compact && styles.compactLabel]}>
        {compact ? config.icon : season}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.round,
    borderWidth: 1,
  },
  compact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  icon: {
    fontSize: 12,
  },
  label: {
    ...Typography.label,
    fontSize: 11,
  },
  compactLabel: {
    fontSize: 12,
  },
});
