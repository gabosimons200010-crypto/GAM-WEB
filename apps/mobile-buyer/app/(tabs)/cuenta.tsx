import { Ionicons } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ApiError, cancelOrder, listOrders } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { money, statusLabel } from '@/lib/format';
import { colors, microcaps, spacing } from '@/lib/theme';
import type { OrderView } from '@/lib/types';

export default function AccountScreen() {
  const { user, ready, logout } = useAuth();

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (!user) return <LoggedOut />;
  const isSeller = user.roles.some((r) => ['VENDEDOR', 'ADMIN_TIENDA'].includes(r));
  return <LoggedIn email={user.email} isSeller={isSeller} onLogout={logout} />;
}

function LoggedOut() {
  return (
    <View style={styles.center}>
      <Ionicons name="person-circle-outline" size={52} color={colors.muted} />
      <Text style={styles.title}>Tu cuenta</Text>
      <Text style={styles.hint}>Ingresa para ver tus pedidos, guardar favoritos y comprar más rápido.</Text>
      <Link href="/ingresar" asChild>
        <Pressable style={styles.cta}>
          <Text style={styles.ctaText}>Ingresar</Text>
        </Pressable>
      </Link>
      <Link href="/registrarse" asChild>
        <Pressable style={styles.ctaOutline}>
          <Text style={styles.ctaOutlineText}>Crear cuenta</Text>
        </Pressable>
      </Link>
      <Link href="/rastrear" style={styles.trackLink}>
        Rastrear un pedido
      </Link>
    </View>
  );
}

function LoggedIn({ email, isSeller, onLogout }: { email: string | null; isSeller: boolean; onLogout: () => void }) {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recarga los pedidos cada vez que la pestaña recibe foco.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(null);
      listOrders()
        .then((res) => {
          if (active) setOrders(res.items);
        })
        .catch((e) => {
          if (active) setError(e instanceof ApiError ? e.message : 'No pudimos cargar tus pedidos.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={22} color={colors.ink} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.hola}>Hola</Text>
          <Text style={styles.email} numberOfLines={1}>
            {email ?? 'Mi cuenta'}
          </Text>
        </View>
        <Pressable onPress={onLogout} hitSlop={10}>
          <Text style={styles.logout}>Salir</Text>
        </Pressable>
      </View>

      <Link href="/favoritos" asChild>
        <Pressable style={styles.linkRow}>
          <Ionicons name="heart-outline" size={18} color={colors.ink} />
          <Text style={styles.linkText}>Mis favoritos</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </Pressable>
      </Link>

      <Link href="/direcciones" asChild>
        <Pressable style={styles.linkRow}>
          <Ionicons name="location-outline" size={18} color={colors.ink} />
          <Text style={styles.linkText}>Mis direcciones</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </Pressable>
      </Link>

      <Link href="/rastrear" asChild>
        <Pressable style={styles.linkRow}>
          <Ionicons name="cube-outline" size={18} color={colors.ink} />
          <Text style={styles.linkText}>Rastrear un pedido</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </Pressable>
      </Link>

      {isSeller && (
        <Link href="/vendedor" asChild>
          <Pressable style={styles.linkRow}>
            <Ionicons name="storefront-outline" size={18} color={colors.ink} />
            <Text style={styles.linkText}>Panel de vendedor</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>
        </Link>
      )}

      <Text style={styles.section}>Mis pedidos</Text>

      {loading ? (
        <ActivityIndicator color={colors.ink} style={{ marginTop: spacing.xl }} />
      ) : error ? (
        <Text style={styles.msg}>{error}</Text>
      ) : orders.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.msg}>Aún no tienes pedidos.</Text>
          <Link href="/" asChild>
            <Pressable style={styles.ctaOutline}>
              <Text style={styles.ctaOutlineText}>Explorar catálogo</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        orders.map((o) => <OrderRow key={o.id} order={o} onChange={setOrders} />)
      )}
    </ScrollView>
  );
}

const CANCELABLE = ['PENDING_PAYMENT', 'PAID', 'PREPARING'];

function OrderRow({ order, onChange }: { order: OrderView; onChange: React.Dispatch<React.SetStateAction<OrderView[]>> }) {
  const [busy, setBusy] = useState(false);
  const cancelable = CANCELABLE.includes(order.status);

  async function cancel() {
    setBusy(true);
    try {
      const updated = await cancelOrder(order.id);
      onChange((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch {
      // silencioso
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderTop}>
        <Text style={styles.orderNum}>#{order.number}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{statusLabel(order.status)}</Text>
        </View>
      </View>
      <Text style={styles.orderMeta}>
        {new Date(order.createdAt).toLocaleDateString('es-PE')} · {money(order.grandTotal)}
      </Text>
      {cancelable && (
        <Pressable onPress={cancel} disabled={busy} hitSlop={6} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>{busy ? 'Cancelando…' : 'Cancelar pedido'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  container: { padding: spacing.lg, gap: spacing.md },
  flex: { flex: 1 },
  title: { ...microcaps, fontSize: 14, color: colors.ink },
  hint: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19, maxWidth: 280, marginBottom: spacing.sm },
  cta: { backgroundColor: colors.ink, paddingHorizontal: spacing.xxl, height: 46, minWidth: 220, alignItems: 'center', justifyContent: 'center' },
  ctaText: { ...microcaps, color: colors.paper, fontSize: 12, fontWeight: '600' },
  ctaOutline: { borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.xxl, height: 46, minWidth: 220, alignItems: 'center', justifyContent: 'center' },
  ctaOutlineText: { ...microcaps, color: colors.ink, fontSize: 11 },
  trackLink: { fontSize: 13, color: colors.muted, textDecorationLine: 'underline', marginTop: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: spacing.lg },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  hola: { ...microcaps, fontSize: 10, color: colors.muted },
  email: { fontSize: 15, color: colors.ink, fontWeight: '600' },
  logout: { ...microcaps, fontSize: 11, color: colors.muted },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  linkText: { flex: 1, fontSize: 14, color: colors.ink },
  section: { ...microcaps, fontSize: 12, color: colors.ink, marginTop: spacing.md },
  msg: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: spacing.md },
  emptyBox: { alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  orderCard: { borderWidth: 1, borderColor: colors.line, padding: spacing.md, gap: spacing.xs },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNum: { fontSize: 14, fontWeight: '600', color: colors.ink },
  statusPill: { backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  statusText: { ...microcaps, fontSize: 10, color: colors.ink },
  orderMeta: { fontSize: 12, color: colors.muted },
  cancelBtn: { marginTop: spacing.xs, alignSelf: 'flex-start' },
  cancelText: { ...microcaps, fontSize: 10, color: colors.sale },
});
