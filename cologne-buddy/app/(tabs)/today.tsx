import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TagChip from '../../components/TagChip';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useFragrances } from '../../hooks/useFragrances';
import { getRecommendation } from '../../lib/claude-ai';
import { Fragrance, Occasion, Season } from '../../types';

const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter'];
const OCCASIONS: Occasion[] = ['Casual', 'Work', 'Date Night', 'Formal', 'Outdoor', 'Sport', 'Evening'];
const MOODS = ['Energetic', 'Relaxed', 'Romantic', 'Confident', 'Adventurous', 'Sophisticated'];

function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

export default function TodayScreen() {
  const { user } = useAuth();
  const { fragrances } = useFragrances(user?.id);
  const [season, setSeason] = useState<Season>(getCurrentSeason());
  const [occasion, setOccasion] = useState<Occasion>('Casual');
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<{ fragrance: Fragrance; reason: string } | null>(null);

  const getRecommendationNow = async () => {
    if (fragrances.length === 0) return;
    setLoading(true);
    setRecommendation(null);

    const result = await getRecommendation(
      fragrances.map(f => ({
        id: f.id,
        name: f.name,
        brand: f.brand,
        seasons: f.seasons,
        occasions: f.occasions,
        notes: f.notes,
      })),
      mood || 'any',
      occasion,
      season
    );

    if (result) {
      const found = fragrances.find(f => f.id === result.fragrance_id);
      if (found) setRecommendation({ fragrance: found, reason: result.reason });
    } else if (fragrances.length > 0) {
      const matching = fragrances.filter(f =>
        f.seasons.includes(season) && f.occasions.includes(occasion)
      );
      const pick = matching[0] ?? fragrances[0];
      setRecommendation({ fragrance: pick, reason: `${pick.brand} ${pick.name} is a great choice for a ${season.toLowerCase()} ${occasion.toLowerCase()}.` });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (fragrances.length > 0) getRecommendationNow();
  }, [fragrances.length]);

  const seasonEmoji: Record<Season, string> = { Spring: '🌸', Summer: '☀️', Fall: '🍂', Winter: '❄️' };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Season Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Season</Text>
          <View style={styles.pillRow}>
            {SEASONS.map(s => (
              <Pressable
                key={s}
                style={[styles.pill, season === s && styles.pillActive]}
                onPress={() => setSeason(s)}
              >
                <Text style={[styles.pillText, season === s && styles.pillTextActive]}>
                  {seasonEmoji[s]} {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Occasion Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Occasion</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRowH}>
            {OCCASIONS.map(o => (
              <Pressable
                key={o}
                style={[styles.pill, occasion === o && styles.pillActive]}
                onPress={() => setOccasion(o)}
              >
                <Text style={[styles.pillText, occasion === o && styles.pillTextActive]}>{o}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Mood Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Mood (optional)</Text>
          <View style={styles.moodGrid}>
            {MOODS.map(m => (
              <Pressable
                key={m}
                style={[styles.moodChip, mood === m && styles.moodChipActive]}
                onPress={() => setMood(mood === m ? '' : m)}
              >
                <Text style={[styles.moodText, mood === m && styles.moodTextActive]}>{m}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Get Recommendation Button */}
        <Pressable style={styles.recommendBtn} onPress={getRecommendationNow} disabled={loading || fragrances.length === 0}>
          {loading
            ? <ActivityIndicator color={Colors.background} size="small" />
            : <><Ionicons name="sparkles" size={18} color={Colors.background} /><Text style={styles.recommendBtnText}>Get My Recommendation</Text></>
          }
        </Pressable>

        {fragrances.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🧴</Text>
            <Text style={styles.emptyText}>Add some fragrances to your collection first!</Text>
          </View>
        )}

        {/* Recommendation Card */}
        {recommendation && (
          <Pressable
            style={[styles.recCard, Shadows.glow]}
            onPress={() => router.push(`/fragrance/${recommendation.fragrance.id}`)}
          >
            <LinearGradient
              colors={[Colors.surfaceElevated, Colors.surface]}
              style={styles.recGradient}
            >
              <View style={styles.recGlowAccent} />
              <View style={styles.recHeader}>
                <Text style={styles.recHeaderText}>✨ Your Pick</Text>
              </View>

              <View style={styles.recContent}>
                {recommendation.fragrance.image_url ? (
                  <Image source={{ uri: recommendation.fragrance.image_url }} style={styles.recImage} />
                ) : (
                  <View style={styles.recImagePlaceholder}>
                    <Text style={styles.recImageIcon}>🧴</Text>
                  </View>
                )}
                <View style={styles.recInfo}>
                  <Text style={styles.recBrand}>{recommendation.fragrance.brand}</Text>
                  <Text style={styles.recName}>{recommendation.fragrance.name}</Text>
                  <View style={styles.recTags}>
                    {recommendation.fragrance.occasions.slice(0, 2).map(o => (
                      <TagChip key={o} label={o} variant="occasion" />
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.reasonBox}>
                <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.accentLight} />
                <Text style={styles.reasonText}>{recommendation.reason}</Text>
              </View>

              <View style={styles.recNotes}>
                {[...recommendation.fragrance.notes.top.slice(0, 2), ...recommendation.fragrance.notes.base.slice(0, 1)].map(n => (
                  <View key={n} style={styles.noteTag}>
                    <Text style={styles.noteTagText}>{n}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.tapHint}>Tap to view full details →</Text>
            </LinearGradient>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100, gap: Spacing.xl },

  section: { gap: Spacing.md },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pillRowH: { gap: Spacing.sm, paddingRight: Spacing.lg },
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillActive: { backgroundColor: Colors.accentGlow, borderColor: Colors.accent },
  pillText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '500' },
  pillTextActive: { color: Colors.accentLight, fontWeight: '600' },

  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  moodChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  moodChipActive: { backgroundColor: Colors.goldDim, borderColor: `${Colors.gold}60` },
  moodText: { ...Typography.bodySmall, color: Colors.textSecondary },
  moodTextActive: { color: Colors.gold, fontWeight: '600' },

  recommendBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  recommendBtnText: { ...Typography.headingSmall, color: Colors.background },

  emptyState: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxl },
  emptyIcon: { fontSize: 48 },
  emptyText: { ...Typography.bodyMedium, color: Colors.textSecondary, textAlign: 'center' },

  recCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.accentDim,
  },
  recGradient: { borderRadius: Radius.xl, overflow: 'hidden' },
  recGlowAccent: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accentGlow,
  },
  recHeader: {
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  recHeaderText: { ...Typography.label, color: Colors.accentLight },
  recContent: {
    flexDirection: 'row',
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  recImage: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
  },
  recImagePlaceholder: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recImageIcon: { fontSize: 36 },
  recInfo: { flex: 1, gap: Spacing.xs },
  recBrand: { ...Typography.label, color: Colors.accentLight },
  recName: { ...Typography.headingLarge, color: Colors.textPrimary },
  recTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.accentGlow,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: `${Colors.accent}30`,
  },
  reasonText: { ...Typography.bodySmall, color: Colors.textAccent, flex: 1, lineHeight: 18 },
  recNotes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  noteTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteTagText: { ...Typography.bodySmall, color: Colors.textSecondary },
  tapHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'right',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
});
