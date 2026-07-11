import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WEB_BASE_URL } from '@/lib/api';
import { useFavorites } from '@/lib/favorites';
import { discountPct, money } from '@/lib/format';
import { colors, microcaps } from '@/lib/theme';
import type { ProductCard as ProductCardType } from '@/lib/types';

/**
 * Resuelve la URL de una imagen. Las absolutas (https, ej. Shopify) se usan tal
 * cual; las relativas (`/media/...`) las sirve la web del demo, no la API.
 */
export function resolveImage(url: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${WEB_BASE_URL}${url}`;
}

/** Botón de corazón. Se coloca como hermano del Link para no anidar toques. */
export function FavoriteHeart({ productId, size = 20 }: { productId: string; size?: number }) {
  const { isFavorite, toggle, loggedIn } = useFavorites();
  if (!loggedIn) return null;
  const fav = isFavorite(productId);
  return (
    <Pressable onPress={() => toggle(productId)} hitSlop={10} style={styles.heart}>
      <Ionicons name={fav ? 'heart' : 'heart-outline'} size={size} color={fav ? colors.sale : colors.ink} />
    </Pressable>
  );
}

export function ProductCard({ product }: { product: ProductCardType }) {
  const off = discountPct(product.price, product.salePrice);
  const shown = product.salePrice ?? product.price;
  const img = resolveImage(product.thumbnailUrl);

  return (
    <View style={styles.card}>
      <Link href={{ pathname: '/producto/[slug]', params: { slug: product.slug } }} asChild>
        <Pressable>
          <View style={styles.imageWrap}>
            {img ? (
              <Image source={{ uri: img }} style={styles.image} contentFit="cover" transition={150} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]} />
            )}
            {off != null && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>-{off}%</Text>
              </View>
            )}
          </View>
          <Text style={styles.store} numberOfLines={1}>
            {product.storeName}
          </Text>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{money(shown)}</Text>
            {product.salePrice != null && <Text style={styles.strike}>{money(product.price)}</Text>}
          </View>
        </Pressable>
      </Link>
      <View style={styles.heartWrap}>
        <FavoriteHeart productId={product.id} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, position: 'relative' },
  heart: { alignItems: 'center', justifyContent: 'center' },
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
  imageWrap: { position: 'relative', aspectRatio: 3 / 4, backgroundColor: colors.surface },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { backgroundColor: colors.surface },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.sale,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: colors.paper, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  store: { ...microcaps, fontSize: 10, color: colors.muted, marginTop: 8 },
  name: { fontSize: 13, color: colors.ink, marginTop: 2, lineHeight: 17 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  price: { fontSize: 13, fontWeight: '600', color: colors.ink },
  strike: { fontSize: 11, color: colors.muted, textDecorationLine: 'line-through' },
});
