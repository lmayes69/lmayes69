import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotesPyramid from '../../components/NotesPyramid';
import QuantityIndicator from '../../components/QuantityIndicator';
import SeasonBadge from '../../components/SeasonBadge';
import StarRating from '../../components/StarRating';
import TagChip from '../../components/TagChip';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useFragrances } from '../../hooks/useFragrances';
import { Fragrance } from '../../types';

export default function FragranceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { fragrances, updateFragrance, deleteFragrance, toggleFavorite } = useFragrances(user?.id);
  const [fragrance, setFragrance] = useState<Fragrance | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const found = fragrances.find(f => f.id === id);
    if (found) { setFragrance(found); setNotesText(found.personal_notes); }
  }, [fragrances, id]);

  if (!fragrance) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const handleRating = async (rating: number) => {
    await updateFragrance(fragrance.id, { rating });
  };

  const handleQuantity = async (level: number) => {
    await updateFragrance(fragrance.id, { quantity_level: level });
  };

  const handleSaveNotes = async () => {
    await updateFragrance(fragrance.id, { personal_notes: notesText });
    setEditingNotes(false);
  };

  const handleAddCustomTag = async () => {
    const trimmed = customTag.trim();
    if (!trimmed || fragrance.custom_tags.includes(trimmed)) { setCustomTag(''); return; }
    const newTags = [...fragrance.custom_tags, trimmed];
    await updateFragrance(fragrance.id, { custom_tags: newTags });
    setCustomTag('');
  };

  const handleRemoveTag = async (tag: string) => {
    const newTags = fragrance.custom_tags.filter(t => t !== tag);
    await updateFragrance(fragrance.id, { custom_tags: newTags });
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    await deleteFragrance(fragrance.id);
    router.back();
  };

  const openReviewSource = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open link'));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {fragrance.image_url ? (
            <Image source={{ uri: fragrance.image_url }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroPlaceholderIcon}>🧴</Text>
            </View>
          )}
          <LinearGradient
            colors={['rgba(18,16,30,0)', 'rgba(18,16,30,0.7)', Colors.background]}
            style={styles.heroGradient}
          />
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.favoriteBtn} onPress={() => toggleFavorite(fragrance.id)}>
            <Ionicons
              name={fragrance.is_favorite ? 'heart' : 'heart-outline'}
              size={24}
              color={fragrance.is_favorite ? '#E07070' : Colors.textPrimary}
            />
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerSection}>
            <View>
              <Text style={styles.brandText}>{fragrance.brand}</Text>
              <Text style={styles.nameText}>{fragrance.name}</Text>
              <View style={styles.metaRow}>
                <View style={styles.concentrationBadge}>
                  <Text style={styles.concentrationText}>{fragrance.concentration}</Text>
                </View>
                {fragrance.is_inspired_by && (
                  <View style={styles.inspiredBadge}>
                    <Ionicons name="copy-outline" size={11} color={Colors.gold} />
                    <Text style={styles.inspiredText}>
                      Inspired by {fragrance.inspired_by_original ?? 'original'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <QuantityIndicator level={fragrance.quantity_level} size="md" />
          </View>

          {/* Rating */}
          <View style={[styles.card, styles.ratingCard]}>
            <Text style={styles.cardLabel}>Your Rating</Text>
            <StarRating rating={fragrance.rating} onRate={handleRating} size={28} />
          </View>

          {/* Description */}
          {fragrance.description ? (
            <View style={styles.descriptionCard}>
              <View style={styles.cardLabelRow}>
                <Ionicons name="document-text-outline" size={14} color={Colors.accentLight} />
                <Text style={styles.cardLabel}>About This Fragrance</Text>
              </View>
              <Text style={styles.descriptionText}>{fragrance.description}</Text>
            </View>
          ) : null}

          {/* Seasons */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Best Seasons</Text>
            <View style={styles.seasonRow}>
              {fragrance.seasons.length > 0
                ? fragrance.seasons.map(s => <SeasonBadge key={s} season={s} />)
                : <Text style={styles.emptyLabel}>No seasons specified</Text>
              }
            </View>
          </View>

          {/* Occasions */}
          {fragrance.occasions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Best For</Text>
              <View style={styles.tagRow}>
                {fragrance.occasions.map(o => <TagChip key={o} label={o} variant="occasion" />)}
              </View>
            </View>
          )}

          {/* Notes Pyramid */}
          {(fragrance.notes.top.length > 0 || fragrance.notes.middle.length > 0 || fragrance.notes.base.length > 0) && (
            <NotesPyramid notes={fragrance.notes} />
          )}

          {/* Quantity Level Editor */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Bottle Level</Text>
            <View style={styles.quantityRow}>
              {[10, 25, 50, 75, 90, 100].map(lvl => (
                <Pressable
                  key={lvl}
                  style={[styles.quantityBtn, fragrance.quantity_level === lvl && styles.quantityBtnActive]}
                  onPress={() => handleQuantity(lvl)}
                >
                  <Text style={[styles.quantityBtnText, fragrance.quantity_level === lvl && styles.quantityBtnTextActive]}>
                    {lvl}%
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tags</Text>
            <View style={styles.tagRow}>
              {fragrance.preset_tags.map(tag => <TagChip key={tag} label={tag} variant="preset" />)}
              {fragrance.custom_tags.map(tag => (
                <TagChip key={tag} label={tag} variant="custom" onRemove={() => handleRemoveTag(tag)} />
              ))}
            </View>
            <View style={styles.tagInputRow}>
              <TextInput
                style={styles.tagInput}
                placeholder="Add tag..."
                placeholderTextColor={Colors.textTertiary}
                value={customTag}
                onChangeText={setCustomTag}
                onSubmitEditing={handleAddCustomTag}
                returnKeyType="done"
              />
              <Pressable style={styles.addTagBtn} onPress={handleAddCustomTag}>
                <Ionicons name="add" size={18} color={Colors.background} />
              </Pressable>
            </View>
          </View>

          {/* Personal Notes */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Personal Notes</Text>
              {!editingNotes ? (
                <Pressable onPress={() => setEditingNotes(true)}>
                  <Ionicons name="pencil-outline" size={16} color={Colors.accent} />
                </Pressable>
              ) : (
                <Pressable onPress={handleSaveNotes}>
                  <Text style={styles.saveNotesBtn}>Save</Text>
                </Pressable>
              )}
            </View>
            {editingNotes ? (
              <TextInput
                style={styles.notesInput}
                value={notesText}
                onChangeText={setNotesText}
                multiline
                autoFocus
                placeholder="Your thoughts about this fragrance..."
                placeholderTextColor={Colors.textTertiary}
                textAlignVertical="top"
              />
            ) : (
              <Pressable onPress={() => setEditingNotes(true)}>
                <Text style={styles.notesText}>
                  {fragrance.personal_notes || 'Tap to add personal notes...'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Review Sources */}
          {fragrance.review_sources.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Reviews & References</Text>
              {fragrance.review_sources.map(source => (
                <Pressable
                  key={source.name}
                  style={[styles.reviewCard, Shadows.card]}
                  onPress={() => openReviewSource(source.url)}
                >
                  <View style={styles.reviewHeader}>
                    <Ionicons name="globe-outline" size={16} color={Colors.accent} />
                    <Text style={styles.reviewName}>{source.name}</Text>
                    <Ionicons name="open-outline" size={14} color={Colors.textTertiary} style={styles.reviewExternal} />
                  </View>
                  {source.summary && <Text style={styles.reviewSummary}>{source.summary}</Text>}
                </Pressable>
              ))}
            </View>
          )}

          {/* Delete */}
          <Pressable style={styles.deleteBtn} onPress={() => setShowDeleteModal(true)}>
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
            <Text style={styles.deleteBtnText}>Remove from Collection</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.card]}>
            <Text style={styles.modalTitle}>Remove Fragrance?</Text>
            <Text style={styles.modalSubtitle}>
              "{fragrance.brand} {fragrance.name}" will be permanently removed from your collection.
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalDelete} onPress={handleDelete}>
                <Text style={styles.modalDeleteText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  loadingText: { ...Typography.bodyLarge, color: Colors.textSecondary },

  heroContainer: { height: 300, backgroundColor: Colors.surfaceElevated, position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceElevated },
  heroPlaceholderIcon: { fontSize: 80 },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 },
  backBtn: {
    position: 'absolute', top: 48, left: Spacing.lg,
    backgroundColor: 'rgba(18,16,30,0.7)', borderRadius: Radius.round, padding: Spacing.sm,
  },
  favoriteBtn: {
    position: 'absolute', top: 48, right: Spacing.lg,
    backgroundColor: 'rgba(18,16,30,0.7)', borderRadius: Radius.round, padding: Spacing.sm,
  },

  content: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 60 },

  headerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandText: { ...Typography.label, color: Colors.accentLight, marginBottom: Spacing.xs },
  nameText: { ...Typography.displayMedium, color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap' },
  concentrationBadge: {
    paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.round,
    backgroundColor: Colors.accentGlow, borderWidth: 1, borderColor: `${Colors.accent}40`,
  },
  concentrationText: { ...Typography.label, color: Colors.accentLight, fontSize: 10 },
  inspiredBadge: {
    flexDirection: 'row', gap: 4, alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.round,
    backgroundColor: Colors.goldDim, borderWidth: 1, borderColor: `${Colors.gold}40`,
  },
  inspiredText: { ...Typography.label, color: Colors.gold, fontSize: 10 },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg,
  },
  ratingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { ...Typography.label, color: Colors.textSecondary },
  cardLabelRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginBottom: Spacing.sm },

  descriptionCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.sm,
  },
  descriptionText: { ...Typography.bodyMedium, color: Colors.textSecondary, lineHeight: 23 },

  section: { gap: Spacing.md },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyLabel: { ...Typography.bodySmall, color: Colors.textTertiary, fontStyle: 'italic' },

  seasonRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },

  quantityRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  quantityBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  quantityBtnActive: { backgroundColor: Colors.accentGlow, borderColor: Colors.accent },
  quantityBtnText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '500' },
  quantityBtnTextActive: { color: Colors.accentLight, fontWeight: '600' },

  tagInputRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  tagInput: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    color: Colors.textPrimary, ...Typography.bodyMedium,
    borderWidth: 1, borderColor: Colors.border,
  },
  addTagBtn: { backgroundColor: Colors.accent, borderRadius: Radius.md, padding: Spacing.md },

  notesInput: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.lg,
    color: Colors.textPrimary, ...Typography.bodyMedium, borderWidth: 1,
    borderColor: Colors.accentDim, minHeight: 100, lineHeight: 22,
  },
  notesText: { ...Typography.bodyMedium, color: Colors.textSecondary, lineHeight: 22, fontStyle: 'italic' },
  saveNotesBtn: { ...Typography.label, color: Colors.accent },

  reviewCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.sm,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reviewName: { ...Typography.headingSmall, color: Colors.textPrimary, flex: 1 },
  reviewExternal: { marginLeft: 'auto' },
  reviewSummary: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 18 },

  deleteBtn: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.lg, marginTop: Spacing.md,
    borderWidth: 1, borderColor: `${Colors.error}40`, borderRadius: Radius.lg,
  },
  deleteBtnText: { ...Typography.headingSmall, color: Colors.error },

  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  modalCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xxl,
    gap: Spacing.lg, width: '100%', maxWidth: 340, borderWidth: 1, borderColor: Colors.border,
  },
  modalTitle: { ...Typography.headingLarge, color: Colors.textPrimary, textAlign: 'center' },
  modalSubtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  modalActions: { flexDirection: 'row', gap: Spacing.md },
  modalCancel: { flex: 1, paddingVertical: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  modalCancelText: { ...Typography.headingSmall, color: Colors.textPrimary },
  modalDelete: { flex: 1, paddingVertical: Spacing.lg, borderRadius: Radius.md, backgroundColor: 'rgba(224,112,112,0.2)', borderWidth: 1, borderColor: `${Colors.error}60`, alignItems: 'center' },
  modalDeleteText: { ...Typography.headingSmall, color: Colors.error },
});
