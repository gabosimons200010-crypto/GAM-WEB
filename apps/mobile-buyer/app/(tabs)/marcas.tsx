import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveImage } from '@/components/product-card';
import { BRANDS } from '@/lib/brands';
import { colors, microcaps, spacing } from '@/lib/theme';

export default function BrandsScreen() {
  return (
    <FlatList
      data={BRANDS}
      keyExtractor={(b) => b.slug}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.kicker}>Directorio</Text>
          <Text style={styles.title}>Marcas de Gamarra</Text>
        </View>
      }
      renderItem={({ item }) => {
        const img = resolveImage(item.editorialUrl ?? null);
        return (
          <Link href={{ pathname: '/tienda/[slug]', params: { slug: item.slug } }} asChild>
            <Pressable style={styles.card}>
              {img ? (
                <Image source={{ uri: img }} style={styles.image} contentFit="cover" transition={150} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Text style={styles.imageName}>{item.name}</Text>
                </View>
              )}
              <View style={styles.overlay}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.bio} numberOfLines={2}>
                  {item.bio}
                </Text>
              </View>
            </Pressable>
          </Link>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.lg },
  header: { marginBottom: spacing.sm },
  kicker: { ...microcaps, fontSize: 10, color: colors.muted },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink, marginTop: spacing.xs },
  card: { position: 'relative', height: 200, backgroundColor: colors.surface },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  imageName: { ...microcaps, fontSize: 18, color: colors.ink },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: spacing.md,
  },
  name: { fontSize: 18, fontWeight: '700', color: colors.paper },
  bio: { fontSize: 12, color: colors.paper, opacity: 0.9, marginTop: 2, lineHeight: 16 },
});
