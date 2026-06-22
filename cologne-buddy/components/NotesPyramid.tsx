import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { NotesPyramid as NotesPyramidType } from '../types';

interface Props {
  notes: NotesPyramidType;
}

function NoteRow({ label, notes, color, accent }: { label: string; notes: string[]; color: string; accent: string }) {
  return (
    <View style={styles.row}>
      <View style={[styles.labelContainer, { borderColor: accent }]}>
        <Text style={[styles.tierLabel, { color }]}>{label}</Text>
      </View>
      <View style={styles.notesContainer}>
        {notes.map((note) => (
          <View key={note} style={[styles.noteChip, { borderColor: `${color}40`, backgroundColor: `${color}10` }]}>
            <Text style={[styles.noteText, { color }]}>{note}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function NotesPyramid({ notes }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.pyramidIcon}>
          <View style={styles.pyramidTop} />
          <View style={styles.pyramidMiddle} />
          <View style={styles.pyramidBase} />
        </View>
        <Text style={styles.title}>Scent Pyramid</Text>
      </View>
      <View style={styles.rows}>
        <NoteRow label="Top" notes={notes.top} color={Colors.noteTop} accent={Colors.noteTop} />
        <NoteRow label="Heart" notes={notes.middle} color={Colors.noteMiddle} accent={Colors.noteMiddle} />
        <NoteRow label="Base" notes={notes.base} color={Colors.noteBase} accent={Colors.noteBase} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pyramidIcon: {
    alignItems: 'center',
    gap: 2,
  },
  pyramidTop: {
    width: 12,
    height: 6,
    backgroundColor: Colors.noteTop,
    borderRadius: 2,
  },
  pyramidMiddle: {
    width: 20,
    height: 6,
    backgroundColor: Colors.noteMiddle,
    borderRadius: 2,
  },
  pyramidBase: {
    width: 28,
    height: 6,
    backgroundColor: Colors.noteBase,
    borderRadius: 2,
  },
  title: {
    ...Typography.headingSmall,
    color: Colors.textPrimary,
  },
  rows: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  labelContainer: {
    width: 44,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 2,
  },
  tierLabel: {
    ...Typography.label,
    fontSize: 9,
  },
  notesContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  noteChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.round,
    borderWidth: 1,
  },
  noteText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
});
