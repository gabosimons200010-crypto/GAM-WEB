import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { resolveImage } from '@/components/product-card';
import { getStorePage, searchProducts } from '@/lib/api';
import { discountPct, money } from '@/lib/format';
import { colors, microcaps, spacing } from '@/lib/theme';
import type { ProductCard } from '@/lib/types';

function Strip({ title, items }: { title: string; items: ProductCard[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.block}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {items.map((p) => {
          const img = resolveImage(p.thumbnailUrl);
          const off = discountPct(p.price, p.salePrice);
          return (
            <Link key={p.id} href={{ pathname: '/producto/[slug]', params: { slug: p.slug } }} asChild>
              <Pressable style={styles.card}>
                <View style={styles.imageWrap}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.image} contentFit="cover" />
                  ) : (
                    <View style={[styles.image, styles.placeholder]} />
                  )}
                  {off != null && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>-{off}%</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.store} numberOfLines={1}>{p.storeName}</Text>
                <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.price}>{money(p.salePrice ?? p.price)}</Text>
              </Pressable>
            </Link>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function Recommendations({
  productId,
  storeSlug,
  storeName,
}: {
  productId: string;
  storeSlug: string;
  storeName: string;
}) {
  const [sameStore, setSameStore] = useState<ProductCard[]>([]);
  const [others, setOthers] = useState<ProductCard[]>([]);

  useEffect(() => {
    let active = true;
    getStorePage(storeSlug)
      .then((d) => active && setSameStore(d.products.items.filter((p) => p.id !== productId).slice(0, 10)))
      .catch(() => {});
    searchProducts({ sort: 'best_selling', pageSize: 20 })
      .then((res) => active && setOthers(res.items.filter((p) => p.storeSlug !== storeSlug).slice(0, 10)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [productId, storeSlug]);

  return (
    <View>
      <Strip title={`Más de ${storeName}`} items={sameStore} />
      <Strip title="Completa el look" items={others} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: spacing.xl },
  title: { ...microcaps, fontSize: 12, color: colors.ink, marginBottom: spacing.md },
  strip: { gap: spacing.md, paddingRight: spacing.lg },
  card: { width: 130, marginRight: spacing.md },
  imageWrap: { position: 'relative', width: 130, aspectRatio: 3 / 4, backgroundColor: colors.surface },
  image: { width: '100%', height: '100%' },
  placeholder: { backgroundColor: colors.surface },
  badge: { position: 'absolute', top: 6, left: 6, backgroundColor: colors.sale, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { color: colors.paper, fontSize: 9, fontWeight: '700' },
  store: { ...microcaps, fontSize: 9, color: colors.muted, marginTop: 6 },
  name: { fontSize: 12, color: colors.ink, marginTop: 1 },
  price: { fontSize: 12, fontWeight: '600', color: colors.ink, marginTop: 2 },
});
