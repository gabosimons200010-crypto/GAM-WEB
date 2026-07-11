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

import { ApiError, trackOrder } from '@/lib/api';
import { money, statusLabel } from '@/lib/format';
import { colors, microcaps, spacing } from '@/lib/theme';
import type { OrderView } from '@/lib/types';

export default function TrackScreen() {
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!number.trim() || !email.trim()) {
      setError('Escribe el número de pedido y tu correo.');
      return;
    }
    setBusy(true);
    setError(null);
    setOrder(null);
    try {
      const o = await trackOrder(number.trim(), email.trim());
      setOrder(o);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No encontramos ese pedido.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Rastrear pedido</Text>
        <Text style={styles.sub}>Ingresa el número de pedido y el correo con el que compraste.</Text>

        <Text style={styles.label}>Número de pedido</Text>
        <TextInput
          style={styles.input}
          value={number}
          onChangeText={setNumber}
          placeholder="GG-XXXXXX"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
        />
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

        <Pressable style={styles.cta} disabled={busy} onPress={submit}>
          {busy ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.ctaText}>Rastrear</Text>}
        </Pressable>

        {order && (
          <View style={styles.result}>
            <View style={styles.resultTop}>
              <Text style={styles.orderNum}>#{order.number}</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{statusLabel(order.status)}</Text>
              </View>
            </View>
            <Text style={styles.orderMeta}>
              {new Date(order.createdAt).toLocaleDateString('es-PE')} · {money(order.grandTotal)}
            </Text>
            {order.subOrders.map((s) => (
              <View key={s.id} style={styles.sub2}>
                <Text style={styles.subStore}>{s.storeName ?? 'Tienda'}</Text>
                <Text style={styles.subStatus}>{statusLabel(s.status)}{s.trackingCode ? ` · ${s.trackingCode}` : ''}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.xl, gap: spacing.sm },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 13, color: colors.muted, marginBottom: spacing.md },
  label: { ...microcaps, fontSize: 11, color: colors.ink, marginTop: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, height: 46, fontSize: 15, color: colors.ink },
  error: { fontSize: 13, color: colors.sale, marginTop: spacing.xs },
  cta: { marginTop: spacing.md, backgroundColor: colors.ink, height: 48, alignItems: 'center', justifyContent: 'center' },
  ctaText: { ...microcaps, color: colors.paper, fontSize: 12, fontWeight: '600' },
  result: { marginTop: spacing.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, gap: spacing.sm },
  resultTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNum: { fontSize: 16, fontWeight: '700', color: colors.ink },
  pill: { backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  pillText: { ...microcaps, fontSize: 10, color: colors.ink },
  orderMeta: { fontSize: 12, color: colors.muted },
  sub2: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.sm },
  subStore: { fontSize: 13, color: colors.ink },
  subStatus: { ...microcaps, fontSize: 10, color: colors.muted, marginTop: 2 },
});
