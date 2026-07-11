import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductCard, resolveImage } from '@/components/product-card';
import { ApiError, searchProducts } from '@/lib/api';
import { BRANDS } from '@/lib/brands';
import { colors, microcaps, spacing } from '@/lib/theme';
import type { ProductCard as ProductCardType } from '@/lib/types';

export default function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ProductCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await searchProducts({ sort: 'best_selling', pageSize: 40 });
      setItems(res.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos cargar el catálogo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

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
        <Text style={styles.errorTitle}>Sin conexión</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        <Text style={styles.hint}>
          Verifica que el teléfono y la PC estén en la misma red Wi-Fi y que la API esté encendida.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(p) => p.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xl }]}
      renderItem={({ item }) => (
        <View style={styles.cell}>
          <ProductCard product={item} />
        </View>
      )}
      ListHeaderComponent={
        <View>
          <View style={styles.hero}>
            <Text style={styles.heroKicker}>El emporio de Gamarra, online</Text>
            <Text style={styles.heroTitle}>Las marcas de{'\n'}Gamarra, en tu bolsillo</Text>
            <Link href="/marcas" asChild>
              <Pressable style={styles.heroCta}>
                <Text style={styles.heroCtaText}>Ver marcas</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.stripHeader}>
            <Text style={styles.stripTitle}>Marcas</Text>
            <Link href="/marcas" style={styles.stripLink}>
              Ver todas →
            </Link>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
            {BRANDS.map((b) => {
              const img = resolveImage(b.editorialUrl ?? null);
              return (
                <Link key={b.slug} href={{ pathname: '/tienda/[slug]', params: { slug: b.slug } }} asChild>
                  <Pressable style={styles.brand}>
                    {img ? (
                      <Image source={{ uri: img }} style={styles.brandImg} contentFit="cover" />
                    ) : (
                      <View style={[styles.brandImg, styles.brandPlaceholder]} />
                    )}
                    <Text style={styles.brandName} numberOfLines={1}>
                      {b.name}
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionTitle}>Lo más vendido</Text>
        </View>
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  list: { paddingHorizontal: spacing.lg },
  hero: { paddingVertical: spacing.xl, gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  heroKicker: { ...microcaps, fontSize: 10, color: colors.muted },
  heroTitle: { fontSize: 32, fontWeight: '800', color: colors.ink, lineHeight: 36, letterSpacing: -0.5 },
  heroCta: { alignSelf: 'flex-start', backgroundColor: colors.ink, paddingHorizontal: spacing.xl, height: 44, justifyContent: 'center', marginTop: spacing.sm },
  heroCtaText: { ...microcaps, color: colors.paper, fontSize: 12, fontWeight: '600' },
  stripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.xl },
  stripTitle: { ...microcaps, fontSize: 12, color: colors.ink },
  stripLink: { ...microcaps, fontSize: 11, color: colors.muted },
  strip: { gap: spacing.md, paddingVertical: spacing.md, paddingRight: spacing.lg },
  brand: { width: 120, marginRight: spacing.md },
  brandImg: { width: 120, height: 150, backgroundColor: colors.surface },
  brandPlaceholder: { backgroundColor: colors.surface },
  brandName: { ...microcaps, fontSize: 10, color: colors.ink, marginTop: spacing.sm },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.md },
  row: { gap: spacing.md },
  cell: { flex: 1, marginBottom: spacing.xl },
  errorTitle: { ...microcaps, fontSize: 13, color: colors.ink, marginBottom: spacing.sm },
  errorMsg: { fontSize: 14, color: colors.ink, textAlign: 'center' },
  hint: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: spacing.md, lineHeight: 18 },
});
