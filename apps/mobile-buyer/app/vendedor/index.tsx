import { Ionicons } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError, getMyStores } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, microcaps, spacing } from '@/lib/theme';
import type { SellerStore } from '@/lib/types';

export default function SellerHome() {
  const { user, ready } = useAuth();
  const [stores, setStores] = useState<SellerStore[]>([]);
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
      getMyStores()
        .then((s) => active && setStores(s))
        .catch((e) => active && setError(e instanceof ApiError ? e.message : 'No pudimos cargar tus tiendas.'))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [user]),
  );

  if (ready && !user) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Inicia sesión con tu cuenta de vendedor.</Text>
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

  if (stores.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="storefront-outline" size={44} color={colors.muted} />
        <Text style={styles.msg}>Tu cuenta no tiene tiendas. Este panel es para vendedores.</Text>
      </View>
    );
  }

  const store = stores[0];

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Panel de vendedor</Text>
      <Text style={styles.store}>{store.commercialName}</Text>
      <Text style={styles.status}>
        {store.status} {store.verified ? '· Verificada ✓' : ''}
      </Text>

      <Link href={{ pathname: '/vendedor/productos', params: { storeId: store.id } }} asChild>
        <Pressable style={styles.tile}>
          <Ionicons name="shirt-outline" size={22} color={colors.ink} />
          <View style={styles.flex}>
            <Text style={styles.tileTitle}>Mis productos</Text>
            <Text style={styles.tileSub}>Ajusta stock, pausa o reactiva</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      </Link>

      <Link href="/vendedor/pedidos" asChild>
        <Pressable style={styles.tile}>
          <Ionicons name="cube-outline" size={22} color={colors.ink} />
          <View style={styles.flex}>
            <Text style={styles.tileTitle}>Pedidos</Text>
            <Text style={styles.tileSub}>Avanza el estado de tus ventas</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.paper },
  flex: { flex: 1 },
  msg: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  cta: { backgroundColor: colors.ink, paddingHorizontal: spacing.xxl, height: 46, alignItems: 'center', justifyContent: 'center' },
  ctaText: { ...microcaps, color: colors.paper, fontSize: 12, fontWeight: '600' },
  kicker: { ...microcaps, fontSize: 10, color: colors.muted },
  store: { fontSize: 24, fontWeight: '700', color: colors.ink },
  status: { ...microcaps, fontSize: 10, color: colors.muted, marginBottom: spacing.md },
  tile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.line, padding: spacing.lg },
  tileTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  tileSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
