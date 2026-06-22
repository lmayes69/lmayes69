import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '../constants/theme';
import { Fragrance } from '../types';
import SeasonBadge from './SeasonBadge';

interface Props {
  fragrance: Fragrance;
  onToggleFavorite?: (id: string) => void;
  variant?: 'grid' | 'list';
}

export default function FragranceCard({ fragrance, onToggleFavorite, variant = 'grid' }: Props) {
  const allNotes = [
    ...fragrance.notes.top.slice(0, 2),
    ...fragrance.notes.middle.slice(0, 1),
  ].join(' · ');

  const handlePress = () => router.push(`/fragrance/${fragrance.id}`);

  if (variant === 'list') {
    return (
      <Pressable style={[styles.listCard, Shadows.card]} onPress={handlePress}>
        <View style={styles.listImageContainer}>
          {fragrance.image_url ? (
            <Image source={{ uri: fragrance.image_url }} style={styles.listImage} />
          ) : (
            <View style={styles.listImagePlaceholder}>
              <Ionicons name="flask-outline" size={28} color={Colors.accentDim} />
            </View>
          )}
        </View>
        <View style={styles.listContent}>
          <Text style={styles.brandText}>{fragrance.brand}</Text>
          <Text style={styles.nameText} numberOfLines={1}>{fragrance.name}</Text>
          <Text style={styles.notesText} numberOfLines={1}>{allNotes}</Text>
          <View style={styles.listMeta}>
            {fragrance.seasons.slice(0, 2).map(s => (
              <SeasonBadge key={s} season={s} compact />
            ))}
            {fragrance.is_inspired_by && (
              <View style={styles.inspiredBadge}>
                <Text style={styles.inspiredText}>Inspired</Text>
              </View>
            )}
          </View>
        </View>
        <Pressable onPress={() => onToggleFavorite?.(fragrance.id)} style={styles.favoriteBtn}>
          <Ionicons
            name={fragrance.is_favorite ? 'heart' : 'heart-outline'}
            size={20}
            color={fragrance.is_favorite ? '#E07070' : Colors.textTertiary}
          />
        </Pressable>
      </Pressable>
    );
  }

  return (
    <Pressable style={[styles.gridCard, Shadows.card]} onPress={handlePress}>
      <View style={styles.imageContainer}>
        {fragrance.image_url ? (
          <Image source={{ uri: fragrance.image_url }} style={styles.gridImage} />
        ) : (
          <View style={styles.gridImagePlaceholder}>
            <Ionicons name="flask-outline" size={40} color={Colors.accentDim} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(18,16,30,0.95)']}
          style={styles.imageGradient}
        />
        <Pressable onPress={() => onToggleFavorite?.(fragrance.id)} style={styles.gridFavoriteBtn}>
          <Ionicons
            name={fragrance.is_favorite ? 'heart' : 'heart-outline'}
            size={18}
            color={fragrance.is_favorite ? '#E07070' : 'rgba(255,255,255,0.7)'}
          />
        </Pressable>
        {fragrance.is_inspired_by && (
          <View style={styles.gridInspiredBadge}>
            <Text style={styles.gridInspiredText}>Inspired</Text>
          </View>
        )}
      </View>
      <View style={styles.gridContent}>
        <Text style={styles.brandText} numberOfLines={1}>{fragrance.brand}</Text>
        <Text style={styles.nameText} numberOfLines={1}>{fragrance.name}</Text>
        <View style={styles.gridMeta}>
          {fragrance.seasons.slice(0, 2).map(s => (
            <SeasonBadge key={s} season={s} compact />
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageContainer: {
    height: 160,
    backgroundColor: Colors.surfaceElevated,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  gridFavoriteBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(18,16,30,0.6)',
    borderRadius: Radius.round,
    padding: 6,
  },
  gridInspiredBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  gridInspiredText: {
    ...Typography.caption,
    color: Colors.textPrimary,
  },
  gridContent: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  gridMeta: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
  },

  listCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingRight: Spacing.md,
  },
  listImageContainer: {
    width: 72,
    height: 72,
    backgroundColor: Colors.surfaceElevated,
  },
  listImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  listImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flex: 1,
    padding: Spacing.md,
    gap: 2,
  },
  listMeta: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  inspiredBadge: {
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  inspiredText: {
    ...Typography.caption,
    color: Colors.textPrimary,
  },
  favoriteBtn: {
    padding: Spacing.sm,
  },

  brandText: {
    ...Typography.label,
    color: Colors.accentLight,
  },
  nameText: {
    ...Typography.headingSmall,
    color: Colors.textPrimary,
  },
  notesText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
