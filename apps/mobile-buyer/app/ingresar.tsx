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

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e = email, p = password) {
    if (!e.trim() || !p) {
      setError('Escribe tu correo y contraseña.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(e.trim(), p);
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  function useDemo() {
    setEmail('cliente.demo@emporio.pe');
    setPassword('Cliente123');
    void submit('cliente.demo@emporio.pe', 'Cliente123');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Bienvenido de vuelta</Text>
        <Text style={styles.sub}>Ingresa para ver tus pedidos y comprar más rápido.</Text>

        <Field label="Correo" value={email} onChange={setEmail} placeholder="tucorreo@ejemplo.com" keyboardType="email-address" />
        <Field label="Contraseña" value={password} onChange={setPassword} placeholder="••••••••" secure />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.cta} disabled={busy} onPress={() => submit()}>
          {busy ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.ctaText}>Ingresar</Text>}
        </Pressable>

        <Pressable style={styles.demo} disabled={busy} onPress={useDemo}>
          <Text style={styles.demoText}>Entrar como cliente demo</Text>
        </Pressable>

        <Link href="/recuperar" style={styles.forgot}>
          ¿Olvidaste tu contraseña?
        </Link>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta? </Text>
          <Link href="/registrarse" replace style={styles.footerLink}>
            Crear cuenta
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
  demo: { height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  demoText: { ...microcaps, color: colors.ink, fontSize: 11 },
  forgot: { textAlign: 'center', fontSize: 13, color: colors.muted, marginTop: spacing.sm, textDecorationLine: 'underline' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { fontSize: 13, color: colors.muted },
  footerLink: { fontSize: 13, color: colors.ink, fontWeight: '600', textDecorationLine: 'underline' },
});
