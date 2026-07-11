import { Image } from 'expo-image';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FavoriteHeart, resolveImage } from '@/components/product-card';
import { Recommendations } from '@/components/recommendations';
import { Reviews } from '@/components/reviews';
import { addToCart, ApiError, getProduct } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { discountPct, genderLabel, money } from '@/lib/format';
import { productExtras, sizeChartFor } from '@/lib/product-extras';
import { colors, microcaps, spacing } from '@/lib/theme';
import type { ProductDetail } from '@/lib/types';

const { width } = Dimensions.get('window');

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [imgIndex, setImgIndex] = useState(0);

  const { user } = useAuth();
  const { refresh: refreshBadge } = useCart();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const p = await getProduct(String(slug));
        if (active) setProduct(p);
      } catch (e) {
        if (active) setError(e instanceof ApiError ? e.message : 'No pudimos cargar el producto.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const sizes = useMemo(
    () => [...new Set((product?.variants ?? []).map((v) => v.size).filter(Boolean))] as string[],
    [product],
  );
  const colorsList = useMemo(
    () => [...new Set((product?.variants ?? []).map((v) => v.color).filter(Boolean))] as string[],
    [product],
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }
  if (error || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errMsg}>{error ?? 'Producto no encontrado.'}</Text>
      </View>
    );
  }

  const off = discountPct(product.price, product.salePrice);
  const shown = product.salePrice ?? product.price;
  const images =
    product.media.length > 0
      ? product.media.map((m) => ({ uri: resolveImage(m.url), label: m.label }))
      : [{ uri: undefined, label: null }];
  const extras = productExtras(product);
  const sizeChart = sizeChartFor(product);

  const needsSize = sizes.length > 0;
  const needsColor = colorsList.length > 0;
  const selected = product.variants.find(
    (v) => (size === null || v.size === size) && (color === null || v.color === color),
  );
  const chosen = (!needsSize || size !== null) && (!needsColor || color !== null) ? selected : undefined;
  const available = chosen?.available ?? 0;

  async function onAdd() {
    setMsg(null);
    if (!user) {
      router.push('/ingresar');
      return;
    }
    if (!chosen) {
      setMsg('Elige talla y color antes de continuar.');
      return;
    }
    if (available <= 0) {
      setMsg('Esta variante está agotada.');
      return;
    }
    setAdding(true);
    try {
      await addToCart(chosen.id, 1);
      await refreshBadge();
      setAdded(true);
      setMsg('Añadido a la cesta.');
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'No pudimos añadir a la cesta.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: product.storeName }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setImgIndex(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {images.map((im, i) =>
              im.uri ? (
                <Image key={i} source={{ uri: im.uri }} style={styles.hero} contentFit="cover" transition={150} />
              ) : (
                <View key={i} style={[styles.hero, styles.heroPlaceholder]} />
              ),
            )}
          </ScrollView>
          {images[imgIndex]?.label ? (
            <View style={styles.imgLabel}>
              <Text style={styles.imgLabelText}>{images[imgIndex].label}</Text>
            </View>
          ) : null}
          {images.length > 1 && (
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {imgIndex + 1}/{images.length}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.storeRow}>
            <Link href={{ pathname: '/tienda/[slug]', params: { slug: product.storeSlug } }} style={styles.store}>
              {product.storeName} →
            </Link>
            <FavoriteHeart productId={product.id} size={22} />
          </View>
          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{money(shown)}</Text>
            {product.salePrice != null && <Text style={styles.strike}>{money(product.price)}</Text>}
            {off != null && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>-{off}%</Text>
              </View>
            )}
          </View>

          {product.gender && <Text style={styles.meta}>{genderLabel(product.gender)}</Text>}

          {sizes.length > 0 && (
            <Selector label="Talla" options={sizes} value={size} onChange={setSize} />
          )}
          {colorsList.length > 0 && (
            <Selector label="Color" options={colorsList} value={color} onChange={setColor} />
          )}

          {chosen && available > 0 && available <= 5 && (
            <Text style={styles.stock}>Quedan {available} unidades</Text>
          )}

          {product.description ? <Text style={styles.desc}>{product.description}</Text> : null}

          <Pressable style={styles.cta} disabled={adding} onPress={onAdd}>
            {adding ? (
              <ActivityIndicator color={colors.paper} />
            ) : (
              <Text style={styles.ctaText}>Añadir a la cesta</Text>
            )}
          </Pressable>

          {msg && (
            <View style={styles.msgRow}>
              <Text style={styles.msgText}>{msg}</Text>
              {added && (
                <Link href="/carrito" style={styles.msgLink}>
                  Ver cesta →
                </Link>
              )}
            </View>
          )}

          <Accordion title="Composición y cuidados">
            <Text style={styles.infoLine}>{extras.composition}</Text>
            {extras.care.map((c) => (
              <Text key={c} style={styles.infoBullet}>· {c}</Text>
            ))}
          </Accordion>

          <Accordion title={`Guía de tallas · ${product.storeName}`}>
            <View style={styles.sizeHeader}>
              <Text style={[styles.sizeCell, styles.sizeHeadText]}>Talla</Text>
              <Text style={[styles.sizeCell, styles.sizeHeadText]}>Pecho (cm)</Text>
              <Text style={[styles.sizeCell, styles.sizeHeadText]}>Largo (cm)</Text>
            </View>
            {sizeChart.map((r) => (
              <View key={r.size} style={styles.sizeRow}>
                <Text style={styles.sizeCell}>{r.size}</Text>
                <Text style={styles.sizeCell}>{r.chest}</Text>
                <Text style={styles.sizeCell}>{r.length}</Text>
              </View>
            ))}
            <Text style={styles.sizeNote}>Medidas de referencia de la prenda. Cada marca define su propio tallaje.</Text>
          </Accordion>

          <Reviews productId={product.id} ratingAvg={product.ratingAvg} ratingCount={product.ratingCount} />

          <Recommendations productId={product.id} storeSlug={product.storeSlug} storeName={product.storeName} />
        </View>
      </ScrollView>
    </>
  );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.accordion}>
      <Pressable style={styles.accordionHead} onPress={() => setOpen((v) => !v)}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <Text style={styles.accordionSign}>{open ? '−' : '+'}</Text>
      </Pressable>
      {open && <View style={styles.accordionBody}>{children}</View>}
    </View>
  );
}

function Selector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.selector}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <View style={styles.chips}>
        {options.map((o) => {
          const active = value === o;
          return (
            <Pressable
              key={o}
              onPress={() => onChange(o)}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.paper },
  errMsg: { fontSize: 14, color: colors.ink, textAlign: 'center' },
  hero: { width, aspectRatio: 3 / 4, backgroundColor: colors.surface },
  heroPlaceholder: { backgroundColor: colors.surface },
  counter: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  counterText: { color: colors.paper, fontSize: 11, fontWeight: '600' },
  imgLabel: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  imgLabelText: { color: colors.paper, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  body: { padding: spacing.lg },
  storeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  store: { ...microcaps, fontSize: 11, color: colors.muted },
  name: { fontSize: 20, fontWeight: '600', color: colors.ink, marginTop: spacing.xs },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  price: { fontSize: 20, fontWeight: '700', color: colors.ink },
  strike: { fontSize: 14, color: colors.muted, textDecorationLine: 'line-through' },
  badge: { backgroundColor: colors.sale, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: colors.paper, fontSize: 11, fontWeight: '700' },
  meta: { ...microcaps, fontSize: 10, color: colors.muted, marginTop: spacing.sm },
  selector: { marginTop: spacing.xl },
  selectorLabel: { ...microcaps, fontSize: 11, color: colors.ink, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minWidth: 44, alignItems: 'center', borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipActive: { borderColor: colors.ink, backgroundColor: colors.ink },
  chipText: { fontSize: 13, color: colors.ink },
  chipTextActive: { color: colors.paper },
  stock: { ...microcaps, fontSize: 10, color: colors.muted, marginTop: spacing.md },
  desc: { fontSize: 14, color: colors.ink, lineHeight: 21, marginTop: spacing.xl },
  cta: { marginTop: spacing.xl, backgroundColor: colors.ink, paddingVertical: spacing.lg, alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  ctaText: { ...microcaps, color: colors.paper, fontSize: 12, fontWeight: '600' },
  msgRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginTop: spacing.md },
  msgText: { fontSize: 12, color: colors.ink },
  msgLink: { fontSize: 12, color: colors.ink, fontWeight: '600', textDecorationLine: 'underline' },
  accordion: { borderBottomWidth: 1, borderBottomColor: colors.line },
  accordionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.lg },
  accordionTitle: { ...microcaps, fontSize: 12, color: colors.ink },
  accordionSign: { fontSize: 18, color: colors.ink },
  accordionBody: { paddingBottom: spacing.lg, gap: spacing.xs },
  infoLine: { fontSize: 14, color: colors.ink, marginBottom: spacing.xs },
  infoBullet: { fontSize: 13, color: colors.muted, lineHeight: 20 },
  sizeHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: spacing.sm },
  sizeRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: spacing.sm },
  sizeCell: { flex: 1, fontSize: 13, color: colors.ink },
  sizeHeadText: { ...microcaps, fontSize: 10, color: colors.muted },
  sizeNote: { fontSize: 11, color: colors.muted, marginTop: spacing.sm, lineHeight: 16 },
});
