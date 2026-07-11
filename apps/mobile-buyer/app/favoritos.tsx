import { Image } from 'expo-image';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { FavoriteHeart, resolveImage } from '@/components/product-card';
import { ApiError, listFavorites } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useFavorites } from '@/lib/favorites';
import { money } from '@/lib/format';
import { colors, microcaps, spacing } from '@/lib/theme';
import type { FavoriteProduct } from '@/lib/types';

export default function FavoritesScreen() {
  const { user } = useAuth();
  const { ids } = useFavorites();
  const [items, setItems] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setLoading(false);
        return;
      }
      let active = true;
      setLoading(true);
      listFavorites()
        .then((list) => active && setItems(list))
        .catch((e) => active && setError(e instanceof ApiError ? e.message : 'No pudimos cargar favoritos.'))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [user]),
  );

  // Refleja quitar favoritos en la propia lista.
  const visible = items.filter((p) => ids.has(p.id));

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Inicia sesión para ver tus favoritos.</Text>
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

  if (error) return <View style={styles.center}><Text style={styles.msg}>{error}</Text></View>;

  if (visible.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Aún no tienes favoritos.</Text>
        <Link href="/" asChild>
          <Pressable style={styles.cta}>
            <Text style={styles.ctaText}>Explorar catálogo</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <FlatList
      data={visible}
      keyExtractor={(p) => p.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const img = resolveImage(item.thumbnailUrl);
        const shown = item.salePrice ?? item.price;
        return (
          <View style={styles.cell}>
            <Link href={{ pathname: '/producto/[slug]', params: { slug: item.slug } }} asChild>
              <Pressable>
                <View style={styles.imageWrap}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.image} contentFit="cover" />
                  ) : (
                    <View style={[styles.image, styles.imagePlaceholder]} />
                  )}
                </View>
                <Text style={styles.store} numberOfLines={1}>{item.storeName}</Text>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.price}>{money(shown)}</Text>
              </Pressable>
            </Link>
            <View style={styles.heartWrap}>
              <FavoriteHeart productId={item.id} />
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.paper },
  msg: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  cta: { backgroundColor: colors.ink, paddingHorizontal: spacing.xxl, height: 46, minWidth: 220, alignItems: 'center', justifyContent: 'center' },
  ctaText: { ...microcaps, color: colors.paper, fontSize: 12, fontWeight: '600' },
  list: { padding: spacing.lg },
  row: { gap: spacing.md },
  cell: { flex: 1, marginBottom: spacing.xl, position: 'relative' },
  imageWrap: { aspectRatio: 3 / 4, backgroundColor: colors.surface },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { backgroundColor: colors.surface },
  store: { ...microcaps, fontSize: 10, color: colors.muted, marginTop: 8 },
  name: { fontSize: 13, color: colors.ink, marginTop: 2, lineHeight: 17 },
  price: { fontSize: 13, fontWeight: '600', color: colors.ink, marginTop: 4 },
  heartWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
