import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FragranceCard from '../../components/FragranceCard';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useFragrances } from '../../hooks/useFragrances';
import { CollectionFilter, Occasion, Season } from '../../types';

const FILTER_OPTIONS: { label: string; value: CollectionFilter }[] = [
  { label: 'All', value: 'all' },
  { label: '❤️ Favorites', value: 'favorites' },
  { label: '🌸 Spring', value: 'Spring' },
  { label: '☀️ Summer', value: 'Summer' },
  { label: '🍂 Fall', value: 'Fall' },
  { label: '❄️ Winter', value: 'Winter' },
  { label: 'Date Night', value: 'Date Night' },
  { label: 'Work', value: 'Work' },
  { label: 'Casual', value: 'Casual' },
];

const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter'];
const OCCASIONS: Occasion[] = ['Casual', 'Work', 'Date Night', 'Formal', 'Outdoor', 'Sport', 'Evening'];

export default function CollectionScreen() {
  const { user } = useAuth();
  const { fragrances, loading, refetch, toggleFavorite } = useFragrances(user?.id);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<CollectionFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = useMemo(() => {
    let list = fragrances;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.brand.toLowerCase().includes(q) ||
        f.notes.top.some(n => n.toLowerCase().includes(q)) ||
        f.notes.middle.some(n => n.toLowerCase().includes(q)) ||
        f.notes.base.some(n => n.toLowerCase().includes(q)) ||
        f.custom_tags.some(t => t.toLowerCase().includes(q)) ||
        f.preset_tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (activeFilter === 'favorites') {
      list = list.filter(f => f.is_favorite);
    } else if (SEASONS.includes(activeFilter as Season)) {
      list = list.filter(f => f.seasons.includes(activeFilter as Season));
    } else if (OCCASIONS.includes(activeFilter as Occasion)) {
      list = list.filter(f => f.occasions.includes(activeFilter as Occasion));
    }
    return list;
  }, [fragrances, search, activeFilter]);

  const numColumns = viewMode === 'grid' ? 2 : 1;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search name, brand, notes..."
              placeholderTextColor={Colors.textTertiary}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={Colors.textTertiary} />
              </Pressable>
            )}
          </View>
          <Pressable style={styles.viewToggle} onPress={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}>
            <Ionicons name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'} size={20} color={Colors.accent} />
          </Pressable>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTER_OPTIONS.map(opt => (
            <Pressable
              key={opt.value}
              style={[styles.filterChip, activeFilter === opt.value && styles.filterChipActive]}
              onPress={() => setActiveFilter(opt.value)}
            >
              <Text style={[styles.filterText, activeFilter === opt.value && styles.filterTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {filtered.length} of {fragrances.length} fragrance{fragrances.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyIcon}>{fragrances.length === 0 ? '🧴' : '🔍'}</Text>
            <Text style={styles.emptyTitle}>
              {fragrances.length === 0 ? 'Your collection awaits' : 'No matches found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {fragrances.length === 0
                ? 'Tap Add to start building your fragrance collection'
                : 'Try a different search or filter'}
            </Text>
          </View>
        ) : (
          <FlatList
            key={numColumns}
            data={filtered}
            numColumns={numColumns}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.accent} />}
            renderItem={({ item }) => (
              <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
                <FragranceCard
                  fragrance={item}
                  onToggleFavorite={toggleFavorite}
                  variant={viewMode}
                />
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    ...Typography.bodyMedium,
  },
  viewToggle: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.round,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.accentGlow,
    borderColor: Colors.accent,
  },
  filterText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.accentLight,
    fontWeight: '600',
  },
  statsRow: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  statsText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  gridRow: {
    gap: Spacing.md,
  },
  gridItem: {
    flex: 1,
  },
  listItem: {
    width: '100%',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xxxl,
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { ...Typography.headingMedium, color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
