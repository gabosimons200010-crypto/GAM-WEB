import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { advanceOrderStatus, ApiError, listSellerOrders } from '@/lib/api';
import { money, statusLabel } from '@/lib/format';
import { colors, microcaps, spacing } from '@/lib/theme';
import type { SellerSubOrder } from '@/lib/types';

// Siguiente estado en el flujo de preparación/entrega.
const NEXT: Record<string, { to: string; label: string }> = {
  PAID: { to: 'PREPARING', label: 'Marcar en preparación' },
  PREPARING: { to: 'SHIPPED', label: 'Marcar enviado' },
  SHIPPED: { to: 'DELIVERED', label: 'Marcar entregado' },
};

export default function SellerOrders() {
  const [orders, setOrders] = useState<SellerSubOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    listSellerOrders()
      .then((res) => setOrders(res.items))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'No pudimos cargar los pedidos.'))
      .finally(() => setLoading(false));
  }, []);

  async function advance(sub: SellerSubOrder) {
    const step = NEXT[sub.status];
    if (!step) return;
    setBusy(sub.id);
    try {
      const updated = await advanceOrderStatus(sub.id, step.to);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch {
      // silencioso
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.ink} /></View>;
  if (error) return <View style={styles.center}><Text style={styles.msg}>{error}</Text></View>;
  if (orders.length === 0) return <View style={styles.center}><Text style={styles.msg}>Aún no tienes pedidos.</Text></View>;

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const step = NEXT[item.status];
        return (
          <View style={styles.card}>
            <View style={styles.top}>
              <Text style={styles.num}>#{item.orderNumber}</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{statusLabel(item.status)}</Text>
              </View>
            </View>
            {item.buyerName ? <Text style={styles.buyer}>{item.buyerName}</Text> : null}
            {item.items.map((it, i) => (
              <Text key={i} style={styles.item}>
                {it.quantity}× {it.productName} {[it.size, it.color].filter(Boolean).join(' · ')}
              </Text>
            ))}
            <Text style={styles.total}>{money(item.subtotal + item.shippingCost)}</Text>
            {item.trackingCode ? <Text style={styles.tracking}>Seguimiento: {item.trackingCode}</Text> : null}
            {step && (
              <Pressable style={styles.advance} disabled={busy === item.id} onPress={() => advance(item)}>
                <Text style={styles.advanceText}>{busy === item.id ? 'Actualizando…' : step.label}</Text>
              </Pressable>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.paper },
  msg: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  list: { padding: spacing.lg, gap: spacing.md },
  card: { borderWidth: 1, borderColor: colors.line, padding: spacing.md, gap: spacing.xs },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  num: { fontSize: 14, fontWeight: '600', color: colors.ink },
  pill: { backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  pillText: { ...microcaps, fontSize: 9, color: colors.ink },
  buyer: { fontSize: 13, color: colors.ink },
  item: { fontSize: 12, color: colors.muted },
  total: { fontSize: 14, fontWeight: '600', color: colors.ink, marginTop: spacing.xs },
  tracking: { ...microcaps, fontSize: 10, color: colors.muted },
  advance: { alignSelf: 'flex-start', backgroundColor: colors.ink, paddingHorizontal: spacing.lg, height: 40, justifyContent: 'center', marginTop: spacing.sm },
  advanceText: { ...microcaps, fontSize: 10, color: colors.paper, fontWeight: '600' },
});
