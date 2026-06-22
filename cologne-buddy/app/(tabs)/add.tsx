import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TagChip from '../../components/TagChip';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useFragrances } from '../../hooks/useFragrances';
import { analyzeFragrance } from '../../lib/claude-ai';
import { lookupBarcode } from '../../lib/barcode-lookup';
import { supabase } from '../../lib/supabase';
import { Concentration, Occasion, Season } from '../../types';

type Mode = 'form' | 'barcode' | 'camera';

const PRESET_TAGS = ['Signature', 'Gift', 'Seasonal', 'Travel Size', 'Special Occasion', 'Everyday', 'Collection Piece', 'Limited Edition'];
const OCCASIONS: Occasion[] = ['Casual', 'Work', 'Date Night', 'Formal', 'Outdoor', 'Sport', 'Evening'];
const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter'];
const CONCENTRATIONS: Concentration[] = ['Parfum', 'EDP', 'EDT', 'EDC', 'Body Spray', 'Unknown'];

export default function AddScreen() {
  const { user } = useAuth();
  const { addFragrance } = useFragrances(user?.id);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>('form');

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [concentration, setConcentration] = useState<Concentration>('EDT');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [customTag, setCustomTag] = useState('');
  const [selectedPresetTags, setSelectedPresetTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [personalNotes, setPersonalNotes] = useState('');
  const [quantityLevel, setQuantityLevel] = useState(100);
  const [isInspiredBy, setIsInspiredBy] = useState(false);
  const [inspiredByOriginal, setInspiredByOriginal] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setMode('form');

    const result = await lookupBarcode(data);
    if (result) {
      setName(result.name);
      setBrand(result.brand);
      if (result.imageUrl) setImageUri(result.imageUrl);
      Alert.alert('Found!', `${result.brand} ${result.name}`);
    } else {
      Alert.alert('Not Found', 'Barcode not found in database. Please enter details manually.');
    }
    setScanned(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return;
    }
    setMode('camera');
  };

  const togglePresetTag = (tag: string) => {
    setSelectedPresetTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !customTags.includes(trimmed)) {
      setCustomTags(prev => [...prev, trimmed]);
    }
    setCustomTag('');
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Please enter a fragrance name.'); return; }
    if (!user) return;

    setAnalyzing(true);
    const aiData = await analyzeFragrance(name.trim(), brand.trim() || undefined);
    setAnalyzing(false);

    setSaving(true);
    let uploadedUrl: string | undefined;

    if (imageUri && user) {
      try {
        const ext = imageUri.split('.').pop() ?? 'jpg';
        const path = `${user.id}/${Date.now()}.${ext}`;
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const { error } = await supabase.storage.from('fragrance-images').upload(path, blob, { contentType: `image/${ext}` });
        if (!error) {
          const { data } = supabase.storage.from('fragrance-images').getPublicUrl(path);
          uploadedUrl = data.publicUrl;
        }
      } catch { /* continue without image */ }
    }

    const { error } = await addFragrance({
      name: aiData?.name ?? name.trim(),
      brand: aiData?.brand ?? brand.trim() ?? 'Unknown',
      concentration: aiData?.concentration ?? concentration,
      image_url: uploadedUrl ?? imageUri ?? undefined,
      description: aiData?.description ?? '',
      notes: aiData?.notes ?? { top: [], middle: [], base: [] },
      seasons: aiData?.seasons ?? [],
      occasions: aiData?.occasions ?? [],
      preset_tags: selectedPresetTags,
      custom_tags: customTags,
      review_sources: aiData?.review_sources ?? [],
      personal_notes: personalNotes,
      rating: 0,
      quantity_level: quantityLevel,
      is_inspired_by: isInspiredBy || (aiData?.is_inspired_by ?? false),
      inspired_by_original: inspiredByOriginal || aiData?.inspired_by_original,
      is_favorite: false,
    });

    setSaving(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Added!', `${name} has been added to your collection.`, [
        { text: 'Add Another', onPress: resetForm },
        { text: 'View Collection', onPress: () => router.replace('/(tabs)') },
      ]);
    }
  };

  const resetForm = () => {
    setName(''); setBrand(''); setImageUri(null);
    setSelectedPresetTags([]); setCustomTags([]); setPersonalNotes('');
    setQuantityLevel(100); setIsInspiredBy(false); setInspiredByOriginal('');
    setConcentration('EDT');
  };

  if (mode === 'barcode') {
    if (!permission?.granted) {
      return (
        <View style={styles.permContainer}>
          <Text style={styles.permText}>Camera permission needed to scan barcodes</Text>
          <Pressable style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Grant Permission</Text>
          </Pressable>
          <Pressable onPress={() => setMode('form')}>
            <Text style={[styles.permBtnText, { color: Colors.textSecondary, marginTop: Spacing.lg }]}>Go Back</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.scanContainer}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['ean8', 'ean13', 'upc_a', 'upc_e', 'code128', 'code39'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <View style={styles.scanOverlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Point camera at the barcode on the fragrance box</Text>
          <Pressable style={styles.cancelScan} onPress={() => setMode('form')}>
            <Text style={styles.cancelScanText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Entry Mode Buttons */}
        <View style={styles.modeRow}>
          <Pressable style={styles.modeBtn} onPress={() => { setMode('barcode'); setScanned(false); }}>
            <Ionicons name="barcode-outline" size={22} color={Colors.accent} />
            <Text style={styles.modeBtnText}>Scan Barcode</Text>
          </Pressable>
          <Pressable style={styles.modeBtn} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={22} color={Colors.accent} />
            <Text style={styles.modeBtnText}>Take Photo</Text>
          </Pressable>
          <Pressable style={styles.modeBtn} onPress={pickImage}>
            <Ionicons name="image-outline" size={22} color={Colors.accent} />
            <Text style={styles.modeBtnText}>Pick Photo</Text>
          </Pressable>
        </View>

        {/* Image Preview */}
        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <Pressable style={styles.removeImage} onPress={() => setImageUri(null)}>
              <Ionicons name="close-circle" size={24} color={Colors.error} />
            </Pressable>
          </View>
        )}

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Fragrance Details</Text>
          <TextInput style={styles.input} placeholder="Fragrance Name *" placeholderTextColor={Colors.textTertiary} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Brand (e.g. Dior, Creed)" placeholderTextColor={Colors.textTertiary} value={brand} onChangeText={setBrand} />

          <Text style={[styles.sectionLabel, { marginTop: Spacing.sm }]}>Concentration</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {CONCENTRATIONS.map(c => (
              <Pressable key={c} style={[styles.pill, concentration === c && styles.pillActive]} onPress={() => setConcentration(c)}>
                <Text style={[styles.pillText, concentration === c && styles.pillTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Inspired By */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.sectionLabel}>Inspired-By Fragrance</Text>
              <Text style={styles.sectionSub}>Is this a clone or inspired-by scent?</Text>
            </View>
            <Pressable
              style={[styles.toggle, isInspiredBy && styles.toggleActive]}
              onPress={() => setIsInspiredBy(v => !v)}
            >
              <View style={[styles.toggleThumb, isInspiredBy && styles.toggleThumbActive]} />
            </Pressable>
          </View>
          {isInspiredBy && (
            <TextInput
              style={styles.input}
              placeholder="Inspired by (e.g. Creed Aventus)"
              placeholderTextColor={Colors.textTertiary}
              value={inspiredByOriginal}
              onChangeText={setInspiredByOriginal}
            />
          )}
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Current Level: {quantityLevel}%</Text>
          <View style={styles.quantityBar}>
            {[10, 25, 50, 75, 90, 100].map(lvl => (
              <Pressable
                key={lvl}
                style={[styles.quantityBtn, quantityLevel === lvl && styles.quantityBtnActive]}
                onPress={() => setQuantityLevel(lvl)}
              >
                <Text style={[styles.quantityBtnText, quantityLevel === lvl && styles.quantityBtnTextActive]}>
                  {lvl}%
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Preset Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Collection Tags</Text>
          <View style={styles.tagGrid}>
            {PRESET_TAGS.map(tag => (
              <TagChip
                key={tag}
                label={tag}
                variant="preset"
                selected={selectedPresetTags.includes(tag)}
                onPress={() => togglePresetTag(tag)}
              />
            ))}
          </View>
        </View>

        {/* Custom Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Custom Tags</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.input, styles.tagInput]}
              placeholder="Add custom tag..."
              placeholderTextColor={Colors.textTertiary}
              value={customTag}
              onChangeText={setCustomTag}
              onSubmitEditing={addCustomTag}
              returnKeyType="done"
            />
            <Pressable style={styles.addTagBtn} onPress={addCustomTag}>
              <Ionicons name="add" size={20} color={Colors.background} />
            </Pressable>
          </View>
          {customTags.length > 0 && (
            <View style={styles.tagGrid}>
              {customTags.map(tag => (
                <TagChip key={tag} label={tag} variant="custom" onRemove={() => setCustomTags(prev => prev.filter(t => t !== tag))} />
              ))}
            </View>
          )}
        </View>

        {/* Personal Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Personal Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Your thoughts, where you got it, occasions worn..."
            placeholderTextColor={Colors.textTertiary}
            value={personalNotes}
            onChangeText={setPersonalNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.aiNote}>
          <Ionicons name="sparkles-outline" size={14} color={Colors.accentLight} />
          <Text style={styles.aiNoteText}>AI will analyze scent notes, seasons, occasions & reviews automatically</Text>
        </View>

        {/* Save Button */}
        <Pressable
          style={[styles.saveBtn, Shadows.glow, (saving || analyzing) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving || analyzing}
        >
          {saving || analyzing ? (
            <View style={styles.savingRow}>
              <ActivityIndicator color={Colors.background} size="small" />
              <Text style={styles.saveBtnText}>{analyzing ? 'Analyzing fragrance...' : 'Saving...'}</Text>
            </View>
          ) : (
            <Text style={styles.saveBtnText}>Add to Collection</Text>
          )}
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.xl },

  modeRow: { flexDirection: 'row', gap: Spacing.md },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeBtnText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '500' },

  imagePreviewContainer: {
    alignSelf: 'center',
    position: 'relative',
  },
  imagePreview: {
    width: 140,
    height: 140,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
  },
  removeImage: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.round,
  },

  section: { gap: Spacing.md },
  sectionLabel: { ...Typography.label, color: Colors.textSecondary },
  sectionSub: { ...Typography.bodySmall, color: Colors.textTertiary, marginTop: 2 },

  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    ...Typography.bodyLarge,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesInput: { minHeight: 80, paddingTop: Spacing.md },

  pillRow: { gap: Spacing.sm, paddingRight: Spacing.sm },
  pill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.round, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  pillActive: { backgroundColor: Colors.accentGlow, borderColor: Colors.accent },
  pillText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '500' },
  pillTextActive: { color: Colors.accentLight, fontWeight: '600' },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: Radius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleActive: { backgroundColor: Colors.accentDim, borderColor: Colors.accent },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.textTertiary },
  toggleThumbActive: { backgroundColor: Colors.textPrimary, alignSelf: 'flex-end' },

  quantityBar: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  quantityBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  quantityBtnActive: { backgroundColor: Colors.accentGlow, borderColor: Colors.accent },
  quantityBtnText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '500' },
  quantityBtnTextActive: { color: Colors.accentLight, fontWeight: '600' },

  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tagInputRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  tagInput: { flex: 1 },
  addTagBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },

  aiNote: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.accentGlow,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.accent}30`,
  },
  aiNoteText: { ...Typography.bodySmall, color: Colors.textAccent, flex: 1 },

  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { ...Typography.headingSmall, color: Colors.background },
  savingRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },

  // Barcode Scanner
  permContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: Spacing.xxl, gap: Spacing.lg },
  permText: { ...Typography.bodyLarge, color: Colors.textSecondary, textAlign: 'center' },
  permBtn: { backgroundColor: Colors.accent, borderRadius: Radius.md, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl },
  permBtnText: { ...Typography.headingSmall, color: Colors.background },

  scanContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  scanOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.xl,
  },
  scanFrame: {
    width: 260, height: 160, borderRadius: Radius.lg,
    borderWidth: 2, borderColor: Colors.accentLight,
  },
  scanHint: { ...Typography.bodyMedium, color: Colors.textPrimary, textAlign: 'center', paddingHorizontal: Spacing.xxxl },
  cancelScan: {
    backgroundColor: 'rgba(18,16,30,0.8)',
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg,
    borderRadius: Radius.md, marginTop: Spacing.xl,
  },
  cancelScanText: { ...Typography.headingSmall, color: Colors.textPrimary },
});
