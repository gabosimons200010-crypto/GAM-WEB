import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/product-card';
import { ApiError, listCategories, searchProducts } from '@/lib/api';
import { colors, microcaps, spacing } from '@/lib/theme';
import type { Category, ProductCard as ProductCardType } from '@/lib/types';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<ProductCardType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const run = useCallback(async (term: string, cat: string | null) => {
    if (!term.trim() && !cat) {
      setSearched(false);
      setItems([]);
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await searchProducts({ q: term.trim() || undefined, category: cat || undefined, pageSize: 40 });
      setItems(res.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos buscar.');
    } finally {
      setLoading(false);
    }
  }, []);

  function pickCategory(slug: string) {
    const next = category === slug ? null : slug;
    setCategory(next);
    void run(q, next);
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          style={styles.input}
          placeholder="Buscar prendas, marcas…"
          placeholderTextColor={colors.muted}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => run(q, category)}
          returnKeyType="search"
          autoCapitalize="none"
        />
      </View>

      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {categories.map((c) => {
            const active = category === c.slug;
            return (
              <Pressable key={c.id} onPress={() => pickCategory(c.slug)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.msg}>{error}</Text>
        </View>
      ) : !searched ? (
        <View style={styles.center}>
          <Text style={styles.kicker}>Busca por texto o elige una categoría</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.msg}>Sin resultados.</Text>
        </View>
      ) : (
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
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.line,
  },
  input: { flex: 1, fontSize: 14, color: colors.ink },
  chips: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm },
  chipActive: { borderColor: colors.ink, backgroundColor: colors.ink },
  chipText: { fontSize: 12, color: colors.ink },
  chipTextActive: { color: colors.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  kicker: { ...microcaps, fontSize: 11, color: colors.muted, textAlign: 'center' },
  msg: { fontSize: 14, color: colors.ink, textAlign: 'center' },
  list: { paddingHorizontal: spacing.lg },
  row: { gap: spacing.md },
  cell: { flex: 1, marginBottom: spacing.xl },
});
