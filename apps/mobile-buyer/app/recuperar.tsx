import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ApiError, requestPasswordReset } from '@/lib/api';
import { colors, microcaps, spacing } from '@/lib/theme';

export default function ForgotScreen() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!email.trim()) {
      setError('Escribe tu correo.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await requestPasswordReset(email.trim());
      setSent(true);
      setDemoToken(res.demoToken ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos procesar la solicitud.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Recuperar contraseña</Text>
      <Text style={styles.sub}>Te enviaremos un enlace para restablecerla.</Text>

      <Text style={styles.label}>Correo</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="tucorreo@ejemplo.com"
        placeholderTextColor={colors.muted}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      {!sent ? (
        <Pressable style={styles.cta} disabled={busy} onPress={submit}>
          {busy ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.ctaText}>Enviar enlace</Text>}
        </Pressable>
      ) : (
        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Modo demo</Text>
          <Text style={styles.demoMsg}>
            Sin correo real: usa este código para restablecer tu contraseña.
          </Text>
          <Pressable
            style={styles.cta}
            onPress={() =>
              router.replace({ pathname: '/restablecer', params: { email: email.trim(), token: demoToken ?? '' } })
            }>
            <Text style={styles.ctaText}>Continuar</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 13, color: colors.muted, marginBottom: spacing.md },
  label: { ...microcaps, fontSize: 11, color: colors.ink },
  input: { borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, height: 46, fontSize: 15, color: colors.ink },
  error: { fontSize: 13, color: colors.sale },
  cta: { marginTop: spacing.md, backgroundColor: colors.ink, height: 48, alignItems: 'center', justifyContent: 'center' },
  ctaText: { ...microcaps, color: colors.paper, fontSize: 12, fontWeight: '600' },
  demoBox: { borderWidth: 1, borderColor: colors.line, padding: spacing.lg, gap: spacing.sm, marginTop: spacing.md },
  demoTitle: { ...microcaps, fontSize: 11, color: colors.ink },
  demoMsg: { fontSize: 13, color: colors.muted, lineHeight: 18 },
});
