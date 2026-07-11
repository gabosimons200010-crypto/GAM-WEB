import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { adjustInventory, ApiError, listMyProducts, pauseProduct, publishProduct } from '@/lib/api';
import { money, statusLabel } from '@/lib/format';
import { colors, microcaps, spacing } from '@/lib/theme';
import type { ProductDetail } from '@/lib/types';

export default function SellerProducts() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMyProducts(String(storeId))
      .then((res) => setProducts(res.items))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'No pudimos cargar tus productos.'))
      .finally(() => setLoading(false));
  }, [storeId]);

  async function setStock(productId: string, variantId: string, next: number) {
    if (next < 0) return;
    // Optimista
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, variants: p.variants.map((v) => (v.id === variantId ? { ...v, available: next } : v)) }
          : p,
      ),
    );
    try {
      await adjustInventory(String(storeId), variantId, next);
    } catch {
      // revertir recargando en caso de error
    }
  }

  async function togglePause(product: ProductDetail) {
    const isPaused = product.status === 'PAUSED';
    try {
      const updated = isPaused
        ? await publishProduct(String(storeId), product.id)
        : await pauseProduct(String(storeId), product.id);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
    } catch {
      // silencioso
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.ink} /></View>;
  if (error) return <View style={styles.center}><Text style={styles.msg}>{error}</Text></View>;
  if (products.length === 0) return <View style={styles.center}><Text style={styles.msg}>Aún no tienes productos.</Text></View>;

  return (
    <FlatList
      data={products}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const isPaused = item.status === 'PAUSED';
        return (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{statusLabel(item.status)}</Text>
              </View>
            </View>
            <Text style={styles.price}>{money(item.salePrice ?? item.price)}</Text>

            {item.variants.map((v) => (
              <View key={v.id} style={styles.variantRow}>
                <Text style={styles.variant}>{[v.size, v.color].filter(Boolean).join(' · ') || 'Único'}</Text>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepBtn} onPress={() => setStock(item.id, v.id, v.available - 1)}>
                    <Text style={styles.stepText}>−</Text>
                  </Pressable>
                  <Text style={styles.stock}>{v.available}</Text>
                  <Pressable style={styles.stepBtn} onPress={() => setStock(item.id, v.id, v.available + 1)}>
                    <Text style={styles.stepText}>+</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <Pressable style={styles.pauseBtn} onPress={() => togglePause(item)}>
              <Text style={styles.pauseText}>{isPaused ? 'Reactivar' : 'Pausar'}</Text>
            </Pressable>
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
  card: { borderWidth: 1, borderColor: colors.line, padding: spacing.md, gap: spacing.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink },
  pill: { backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  pillText: { ...microcaps, fontSize: 9, color: colors.ink },
  price: { fontSize: 13, color: colors.muted },
  variantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.sm },
  variant: { fontSize: 13, color: colors.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepBtn: { width: 30, height: 30, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 16, color: colors.ink },
  stock: { minWidth: 32, textAlign: 'center', fontSize: 14, fontWeight: '600', color: colors.ink },
  pauseBtn: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.ink, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginTop: spacing.xs },
  pauseText: { ...microcaps, fontSize: 10, color: colors.ink },
});
