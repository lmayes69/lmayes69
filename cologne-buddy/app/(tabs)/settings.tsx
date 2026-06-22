import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useFragrances } from '../../hooks/useFragrances';

function SettingsRow({ icon, label, value, onPress, destructive }: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable style={styles.settingsRow} onPress={onPress} disabled={!onPress}>
      <View style={[styles.iconContainer, destructive && styles.iconContainerDestructive]}>
        <Ionicons name={icon as any} size={18} color={destructive ? Colors.error : Colors.accent} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, destructive && styles.destructiveLabel]}>{label}</Text>
        {value && <Text style={styles.rowValue}>{value}</Text>}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { fragrances } = useFragrances(user?.id);

  const stats = {
    total: fragrances.length,
    favorites: fragrances.filter(f => f.is_favorite).length,
    inspired: fragrances.filter(f => f.is_inspired_by).length,
    designer: fragrances.filter(f => !f.is_inspired_by).length,
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <LinearGradient colors={[Colors.surfaceElevated, Colors.surface]} style={[styles.profileCard, Shadows.card]}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>🧴</Text>
            </View>
          </View>
          <Text style={styles.emailText}>{user?.email}</Text>
          <Text style={styles.memberText}>Cologne Buddy Member</Text>
        </LinearGradient>

        {/* Collection Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#E07070' }]}>{stats.favorites}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.accent }]}>{stats.designer}</Text>
            <Text style={styles.statLabel}>Designer</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.gold }]}>{stats.inspired}</Text>
            <Text style={styles.statLabel}>Inspired</Text>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <SettingsRow icon="flask-outline" label="App Version" value="1.0.0" />
            <View style={styles.divider} />
            <SettingsRow icon="sparkles-outline" label="AI-Powered" value="Claude AI" />
            <View style={styles.divider} />
            <SettingsRow icon="cloud-outline" label="Sync" value="Supabase Cloud" />
          </View>
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <View style={styles.card}>
            <SettingsRow icon="globe-outline" label="Fragrantica" value="fragrantica.com" />
            <View style={styles.divider} />
            <SettingsRow icon="globe-outline" label="Basenotes" value="basenotes.com" />
            <View style={styles.divider} />
            <SettingsRow icon="globe-outline" label="Parfumo" value="parfumo.com" />
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <SettingsRow icon="log-out-outline" label="Sign Out" onPress={handleSignOut} destructive />
          </View>
        </View>

        <Text style={styles.footerText}>Made with ❤️ for fragrance lovers</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 100, gap: Spacing.xl },

  profileCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarContainer: { marginBottom: Spacing.sm },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentGlow,
    borderWidth: 2,
    borderColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 36 },
  emailText: { ...Typography.headingSmall, color: Colors.textPrimary },
  memberText: { ...Typography.bodySmall, color: Colors.textSecondary },

  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: { ...Typography.displayMedium, color: Colors.accent, fontSize: 24 },
  statLabel: { ...Typography.label, color: Colors.textTertiary, fontSize: 9 },

  section: { gap: Spacing.md },
  sectionTitle: { ...Typography.label, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 52 },

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerDestructive: { backgroundColor: 'rgba(224,112,112,0.15)' },
  rowContent: { flex: 1 },
  rowLabel: { ...Typography.bodyMedium, color: Colors.textPrimary, fontWeight: '500' },
  destructiveLabel: { color: Colors.error },
  rowValue: { ...Typography.bodySmall, color: Colors.textTertiary, marginTop: 2 },

  footerText: { ...Typography.bodySmall, color: Colors.textTertiary, textAlign: 'center', paddingVertical: Spacing.lg },
});
