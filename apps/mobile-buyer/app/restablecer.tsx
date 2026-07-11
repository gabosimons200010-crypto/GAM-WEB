import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ApiError, resetPassword } from '@/lib/api';
import { colors, microcaps, spacing } from '@/lib/theme';

export default function ResetScreen() {
  const params = useLocalSearchParams<{ email?: string; token?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [token, setToken] = useState(params.token ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!email.trim() || !token.trim() || !password) {
      setError('Completa todos los campos.');
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('La contraseña necesita mínimo 8 caracteres, una mayúscula y un número.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetPassword(email.trim(), token.trim(), password);
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos restablecer la contraseña.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>¡Contraseña actualizada!</Text>
        <Text style={styles.sub}>Ya puedes ingresar con tu nueva contraseña.</Text>
        <Pressable style={styles.cta} onPress={() => router.replace('/ingresar')}>
          <Text style={styles.ctaText}>Ir a ingresar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Nueva contraseña</Text>
      <Field label="Correo" value={email} onChange={setEmail} keyboardType="email-address" />
      <Field label="Código" value={token} onChange={setToken} />
      <Field label="Nueva contraseña" value={password} onChange={setPassword} placeholder="Mín. 8, mayúscula y número" secure />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.cta} disabled={busy} onPress={submit}>
        {busy ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.ctaText}>Guardar contraseña</Text>}
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  secure,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: 'email-address' | 'default';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.paper },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  field: { gap: spacing.xs },
  label: { ...microcaps, fontSize: 11, color: colors.ink },
  input: { borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, height: 46, fontSize: 15, color: colors.ink },
  error: { fontSize: 13, color: colors.sale },
  cta: { marginTop: spacing.md, backgroundColor: colors.ink, height: 48, minWidth: 200, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  ctaText: { ...microcaps, color: colors.paper, fontSize: 12, fontWeight: '600' },
});
