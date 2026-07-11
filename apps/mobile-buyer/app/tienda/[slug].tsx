import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProductCard, resolveImage } from '@/components/product-card';
import { ApiError, getStorePage } from '@/lib/api';
import { brandSocials, getBrandBySlug } from '@/lib/brands';
import { colors, microcaps, spacing } from '@/lib/theme';
import type { StorePage } from '@/lib/types';

export default function StoreScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [data, setData] = useState<StorePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const brand = getBrandBySlug(String(slug));

  useEffect(() => {
    let active = true;
    getStorePage(String(slug))
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e instanceof ApiError ? e.message : 'No pudimos cargar la tienda.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }
  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>{error ?? 'Tienda no encontrada.'}</Text>
      </View>
    );
  }

  const { store, products } = data;
  const banner = resolveImage(store.bannerUrl) ?? resolveImage(brand?.editorialUrl ?? null);
  const bio = store.description ?? brand?.bio;
  const socials = brand ? brandSocials(brand) : [];

  return (
    <>
      <Stack.Screen options={{ title: store.name }} />
      <FlatList
        data={products.items}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            {banner ? (
              <Image source={{ uri: banner }} style={styles.banner} contentFit="cover" transition={150} />
            ) : (
              <View style={[styles.banner, styles.bannerPlaceholder]}>
                <Text style={styles.bannerMono}>{store.name}</Text>
              </View>
            )}
            <View style={styles.headerBody}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{store.name}</Text>
                {store.verified && <Text style={styles.verified}>✓ Verificada</Text>}
              </View>
              {bio ? <Text style={styles.bio}>{bio}</Text> : null}
              {(store.floor || store.stand) && (
                <Text style={styles.meta}>
                  Gamarra{store.floor ? ` · Piso ${store.floor}` : ''}{store.stand ? ` · Stand ${store.stand}` : ''}
                </Text>
              )}
              {socials.length > 0 && (
                <View style={styles.socials}>
                  {socials.map((s) => (
                    <Pressable key={s.href} onPress={() => Linking.openURL(s.href)} style={styles.social}>
                      <Text style={styles.socialText}>{s.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              <Text style={styles.count}>{products.total} productos</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <ProductCard product={item} />
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.paper },
  msg: { fontSize: 14, color: colors.ink, textAlign: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginHorizontal: -spacing.lg, marginBottom: spacing.lg },
  banner: { width: '100%', height: 200, backgroundColor: colors.surface },
  bannerPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  bannerMono: { ...microcaps, fontSize: 18, color: colors.ink },
  headerBody: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontSize: 24, fontWeight: '700', color: colors.ink },
  verified: { ...microcaps, fontSize: 10, color: colors.muted },
  bio: { fontSize: 14, color: colors.ink, lineHeight: 20 },
  meta: { ...microcaps, fontSize: 10, color: colors.muted },
  socials: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  social: { borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  socialText: { ...microcaps, fontSize: 10, color: colors.ink },
  count: { ...microcaps, fontSize: 11, color: colors.muted, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md },
  row: { gap: spacing.md },
  cell: { flex: 1, marginBottom: spacing.xl },
});
