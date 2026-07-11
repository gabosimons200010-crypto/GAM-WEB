import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { resolveImage } from '@/components/product-card';
import { ApiError, getCart, removeCartItem, updateCartItem } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { money } from '@/lib/format';
import { colors, microcaps, spacing } from '@/lib/theme';
import type { CartView } from '@/lib/types';

export default function CartScreen() {
  const { user, ready } = useAuth();
  const { refresh: refreshBadge } = useCart();
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const c = await getCart();
      setCart(c);
      await refreshBadge();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos cargar la cesta.');
    } finally {
      setLoading(false);
    }
  }, [user, refreshBadge]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setError(null);
      void reload();
    }, [reload]),
  );

  async function changeQty(variantId: string, qty: number) {
    setBusy(variantId);
    try {
      const c = qty <= 0 ? await removeCartItem(variantId) : await updateCartItem(variantId, qty);
      setCart(c);
      await refreshBadge();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo actualizar.');
    } finally {
      setBusy(null);
    }
  }

  if (ready && !user) {
    return (
      <View style={styles.center}>
        <Ionicons name="bag-outline" size={44} color={colors.muted} />
        <Text style={styles.title}>Inicia sesión para ver tu cesta</Text>
        <Link href="/ingresar" asChild>
          <Pressable style={styles.cta}>
            <Text style={styles.ctaText}>Ingresar</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>{error}</Text>
      </View>
    );
  }

  if (!cart || cart.groups.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="bag-outline" size={44} color={colors.muted} />
        <Text style={styles.title}>Tu cesta está vacía</Text>
        <Link href="/" asChild>
          <Pressable style={styles.cta}>
            <Text style={styles.ctaText}>Explorar catálogo</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.list}>
        {cart.groups.map((g) => (
          <View key={g.storeId} style={styles.group}>
            <Text style={styles.store}>{g.storeName}</Text>
            {g.lines.map((l) => {
              const img = resolveImage(l.thumbnailUrl);
              return (
                <View key={l.variantId} style={styles.line}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.thumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPlaceholder]} />
                  )}
                  <View style={styles.flex}>
                    <Text style={styles.name} numberOfLines={2}>
                      {l.productName}
                    </Text>
                    <Text style={styles.variant}>
                      {[l.size, l.color].filter(Boolean).join(' · ')} · {money(l.unitPrice)}
                    </Text>
                    {l.unavailable && <Text style={styles.warn}>Sin stock — no se cobrará</Text>}
                    <View style={styles.qtyRow}>
                      <QtyBtn disabled={busy === l.variantId} onPress={() => changeQty(l.variantId, l.quantity - 1)}>
                        −
                      </QtyBtn>
                      <Text style={styles.qty}>{l.quantity}</Text>
                      <QtyBtn
                        disabled={busy === l.variantId || l.quantity >= l.available}
                        onPress={() => changeQty(l.variantId, l.quantity + 1)}>
                        +
                      </QtyBtn>
                      <Pressable onPress={() => changeQty(l.variantId, 0)} hitSlop={8} style={styles.remove}>
                        <Text style={styles.removeText}>Quitar</Text>
                      </Pressable>
                    </View>
                  </View>
                  <Text style={styles.lineTotal}>{money(l.lineTotal)}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total ({cart.itemCount})</Text>
          <Text style={styles.total}>{money(cart.total)}</Text>
        </View>
        <Pressable
          style={[styles.pay, cart.total <= 0 && styles.payDisabled]}
          disabled={cart.total <= 0}
          onPress={() => router.push('/checkout')}>
          <Text style={styles.payText}>Ir a pagar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function QtyBtn({ children, onPress, disabled }: { children: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.qtyBtn, disabled && styles.qtyBtnDisabled]}>
      <Text style={styles.qtyBtnText}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.paper },
  title: { ...microcaps, fontSize: 14, color: colors.ink, textAlign: 'center' },
  msg: { fontSize: 14, color: colors.ink, textAlign: 'center' },
  cta: { backgroundColor: colors.ink, paddingHorizontal: spacing.xxl, height: 46, minWidth: 220, alignItems: 'center', justifyContent: 'center' },
  ctaText: { ...microcaps, color: colors.paper, fontSize: 12, fontWeight: '600' },
  list: { padding: spacing.lg, gap: spacing.xl },
  group: { gap: spacing.md },
  store: { ...microcaps, fontSize: 11, color: colors.ink, borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: spacing.sm },
  line: { flexDirection: 'row', gap: spacing.md },
  thumb: { width: 68, height: 88, backgroundColor: colors.surface },
  thumbPlaceholder: { backgroundColor: colors.surface },
  name: { fontSize: 13, color: colors.ink },
  variant: { fontSize: 11, color: colors.muted, marginTop: 2 },
  warn: { fontSize: 11, color: colors.sale, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  qtyBtn: { width: 28, height: 28, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  qtyBtnDisabled: { opacity: 0.35 },
  qtyBtnText: { fontSize: 15, color: colors.ink },
  qty: { width: 28, textAlign: 'center', fontSize: 14, color: colors.ink },
  remove: { marginLeft: spacing.md },
  removeText: { ...microcaps, fontSize: 10, color: colors.muted },
  lineTotal: { fontSize: 13, fontWeight: '600', color: colors.ink },
  footer: { borderTopWidth: 1, borderTopColor: colors.line, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.paper },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { ...microcaps, fontSize: 12, color: colors.muted },
  total: { fontSize: 18, fontWeight: '700', color: colors.ink },
  pay: { backgroundColor: colors.ink, height: 50, alignItems: 'center', justifyContent: 'center' },
  payDisabled: { opacity: 0.4 },
  payText: { ...microcaps, color: colors.paper, fontSize: 12, fontWeight: '600' },
});
