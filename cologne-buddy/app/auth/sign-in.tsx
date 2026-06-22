import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Shadows, Spacing, Typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <LinearGradient colors={[Colors.background, '#1A1535']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logoText}>🧴</Text>
            <Text style={styles.title}>Cologne Buddy</Text>
            <Text style={styles.subtitle}>Your Personal Fragrance Collection</Text>
          </View>

          <View style={[styles.card, Shadows.card]}>
            <Text style={styles.cardTitle}>Welcome Back</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignIn} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.background} /> : <Text style={styles.buttonText}>Sign In</Text>}
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/auth/sign-up" style={styles.link}>Sign Up</Link>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
  header: { alignItems: 'center', marginBottom: Spacing.xxxl },
  logoText: { fontSize: 56, marginBottom: Spacing.md },
  title: { ...Typography.displayLarge, color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.lg,
  },
  cardTitle: { ...Typography.headingLarge, color: Colors.textPrimary, textAlign: 'center' },
  errorText: { ...Typography.bodySmall, color: Colors.error, textAlign: 'center' },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    ...Typography.bodyLarge,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...Typography.headingSmall, color: Colors.background },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  link: { ...Typography.bodyMedium, color: Colors.accentLight, fontWeight: '600' },
});
