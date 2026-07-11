import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, microcaps, spacing } from '@/lib/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!email.trim() || !password) {
      setError('Escribe tu correo y una contraseña.');
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('La contraseña necesita mínimo 8 caracteres, una mayúscula y un número.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register(email.trim(), password, fullName.trim() || undefined);
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos crear la cuenta.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Crea tu cuenta</Text>
        <Text style={styles.sub}>Guarda tus pedidos, favoritos y compra más rápido.</Text>

        <Field label="Nombre" value={fullName} onChange={setFullName} placeholder="Tu nombre" />
        <Field label="Correo" value={email} onChange={setEmail} placeholder="tucorreo@ejemplo.com" keyboardType="email-address" />
        <Field label="Contraseña" value={password} onChange={setPassword} placeholder="Mín. 8, una mayúscula y un número" secure />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.cta} disabled={busy} onPress={submit}>
          {busy ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.ctaText}>Crear cuenta</Text>}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
          <Link href="/ingresar" replace style={styles.footerLink}>
            Ingresar
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  placeholder: string;
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
  flex: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, gap: spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 13, color: colors.muted, marginBottom: spacing.md },
  field: { gap: spacing.xs },
  label: { ...microcaps, fontSize: 11, color: colors.ink },
  input: { borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, height: 46, fontSize: 15, color: colors.ink },
  error: { fontSize: 13, color: colors.sale, marginTop: spacing.xs },
  cta: { marginTop: spacing.md, backgroundColor: colors.ink, height: 48, alignItems: 'center', justifyContent: 'center' },
  ctaText: { ...microcaps, color: colors.paper, fontSize: 12, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { fontSize: 13, color: colors.muted },
  footerLink: { fontSize: 13, color: colors.ink, fontWeight: '600', textDecorationLine: 'underline' },
});
