import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  type Address,
  ApiError,
  checkout,
  createAddress,
  createPayment,
  getCart,
  listAddresses,
  simulatePaymentConfirmation,
  validateCoupon,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { money } from '@/lib/format';
import { colors, microcaps, spacing } from '@/lib/theme';
import type { OrderView, PaymentView } from '@/lib/types';

type Stage = 'form' | 'pay' | 'done';

export default function CheckoutScreen() {
  const { refresh: refreshBadge } = useCart();
  const { user } = useAuth();
  const [subtotal, setSubtotal] = useState(0);
  const [stage, setStage] = useState<Stage>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dirección
  const [department, setDepartment] = useState('Lima');
  const [province, setProvince] = useState('Lima');
  const [district, setDistrict] = useState('');
  const [line, setLine] = useState('');
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState<Address[]>([]);
  const [saveAddr, setSaveAddr] = useState(false);

  // Cupón
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  // Orden/pago
  const [order, setOrder] = useState<OrderView | null>(null);
  const [payment, setPayment] = useState<PaymentView | null>(null);

  useEffect(() => {
    getCart()
      .then((c) => setSubtotal(c.total))
      .catch(() => setSubtotal(0));
    if (user) {
      listAddresses()
        .then((list) => {
          setSaved(list);
          const def = list.find((a) => a.isDefault) ?? list[0];
          if (def) pick(def);
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function pick(a: Address) {
    setDepartment(a.department);
    setProvince(a.province);
    setDistrict(a.district);
    setLine(a.line);
    setPhone(a.phone ?? '');
  }

  async function applyCoupon() {
    if (!coupon.trim()) return;
    setCouponMsg(null);
    try {
      const res = await validateCoupon(coupon.trim(), subtotal);
      setDiscount(res.valid ? res.discount : 0);
      setCouponMsg(res.message);
    } catch (e) {
      setCouponMsg(e instanceof ApiError ? e.message : 'Cupón inválido.');
    }
  }

  async function confirm() {
    if (!district.trim() || !line.trim()) {
      setError('Completa el distrito y la dirección.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const address = { department, province, district: district.trim(), line: line.trim(), phone: phone.trim() || undefined };
      const o = await checkout({
        address,
        buyerPhone: phone.trim() || undefined,
        couponCode: coupon.trim() || undefined,
      });
      if (saveAddr && user) {
        await createAddress({ ...address, isDefault: saved.length === 0 }).catch(() => {});
      }
      setOrder(o);
      const p = await createPayment(o.id, 'YAPE');
      setPayment(p);
      setStage('pay');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos crear tu pedido.');
    } finally {
      setBusy(false);
    }
  }

  async function simulatePay() {
    if (!payment) return;
    setBusy(true);
    setError(null);
    try {
      await simulatePaymentConfirmation('YAPE', payment.providerRef ?? payment.id);
      await refreshBadge();
      setStage('done');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo confirmar el pago.');
    } finally {
      setBusy(false);
    }
  }

  if (stage === 'done') {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-circle-outline" size={64} color={colors.ink} />
        <Text style={styles.doneTitle}>¡Pago confirmado!</Text>
        <Text style={styles.doneMsg}>Pedido #{order?.number} · {money(order?.grandTotal ?? 0)}</Text>
        <Pressable style={styles.cta} onPress={() => router.replace('/cuenta')}>
          <Text style={styles.ctaText}>Ver mis pedidos</Text>
        </Pressable>
        <Pressable style={styles.ctaOutline} onPress={() => router.replace('/')}>
          <Text style={styles.ctaOutlineText}>Seguir comprando</Text>
        </Pressable>
      </View>
    );
  }

  if (stage === 'pay') {
    return (
      <View style={styles.center}>
        <View style={styles.yapeBox}>
          <Text style={styles.yapeTitle}>Yape</Text>
          <Ionicons name="qr-code-outline" size={120} color={colors.ink} />
          <Text style={styles.yapeAmount}>{money(order?.grandTotal ?? subtotal)}</Text>
          <Text style={styles.yapeHint}>Pedido #{order?.number}</Text>
        </View>
        <Text style={styles.demoNote}>
          Demo: no hay pasarela real de Yape. Toca abajo para simular la confirmación del pago.
        </Text>
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.cta} disabled={busy} onPress={simulatePay}>
          {busy ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.ctaText}>He pagado (simular)</Text>}
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Dirección de envío</Text>

        {saved.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedRow}>
            {saved.map((a) => {
              const active = a.line === line && a.district === district;
              return (
                <Pressable key={a.id} onPress={() => pick(a)} style={[styles.savedChip, active && styles.savedChipActive]}>
                  <Text style={[styles.savedChipText, active && styles.savedChipTextActive]} numberOfLines={1}>
                    {a.district} · {a.line}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <Row>
          <Field label="Departamento" value={department} onChange={setDepartment} half />
          <Field label="Provincia" value={province} onChange={setProvince} half />
        </Row>
        <Field label="Distrito" value={district} onChange={setDistrict} placeholder="Ej. Miraflores" />
        <Field label="Dirección" value={line} onChange={setLine} placeholder="Calle, número, referencia" />
        <Field label="Celular" value={phone} onChange={setPhone} placeholder="9XX XXX XXX" keyboardType="phone-pad" />

        {user && (
          <Pressable style={styles.checkRow} onPress={() => setSaveAddr((v) => !v)}>
            <View style={[styles.checkbox, saveAddr && styles.checkboxOn]}>
              {saveAddr && <Text style={styles.checkMark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>Guardar esta dirección en mi libreta</Text>
          </Pressable>
        )}

        <Text style={styles.section}>Cupón (opcional)</Text>
        <View style={styles.couponRow}>
          <TextInput
            style={[styles.input, styles.flex]}
            value={coupon}
            onChangeText={setCoupon}
            placeholder="BIENVENIDA10"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
          />
          <Pressable style={styles.couponBtn} onPress={applyCoupon}>
            <Text style={styles.couponBtnText}>Aplicar</Text>
          </Pressable>
        </View>
        {couponMsg && <Text style={styles.couponMsg}>{couponMsg}</Text>}

        <View style={styles.summary}>
          <SummaryRow label="Subtotal" value={money(subtotal)} />
          {discount > 0 && <SummaryRow label="Descuento" value={`- ${money(discount)}`} />}
          <SummaryRow label="Total" value={money(Math.max(0, subtotal - discount))} strong />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.cta} disabled={busy} onPress={confirm}>
          {busy ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.ctaText}>Confirmar y pagar con Yape</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  half,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  half?: boolean;
  keyboardType?: 'phone-pad' | 'default';
}) {
  return (
    <View style={[styles.field, half && styles.flex]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.paper },
  section: { ...microcaps, fontSize: 12, color: colors.ink, marginTop: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  field: { gap: spacing.xs },
  label: { ...microcaps, fontSize: 10, color: colors.muted },
  input: { borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, height: 44, fontSize: 14, color: colors.ink },
  savedRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  savedChip: { maxWidth: 220, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm },
  savedChipActive: { borderColor: colors.ink, backgroundColor: colors.ink },
  savedChipText: { fontSize: 12, color: colors.ink },
  savedChipTextActive: { color: colors.paper },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  checkMark: { color: colors.paper, fontSize: 13, fontWeight: '700' },
  checkLabel: { fontSize: 13, color: colors.ink },
  couponRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' },
  couponBtn: { borderWidth: 1, borderColor: colors.ink, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  couponBtnText: { ...microcaps, fontSize: 11, color: colors.ink },
  couponMsg: { fontSize: 12, color: colors.muted },
  summary: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md, marginTop: spacing.md, gap: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: colors.muted },
  summaryValue: { fontSize: 13, color: colors.ink },
  summaryStrong: { fontSize: 16, fontWeight: '700', color: colors.ink },
  error: { fontSize: 13, color: colors.sale, textAlign: 'center' },
  cta: { backgroundColor: colors.ink, height: 50, minWidth: 240, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  ctaText: { ...microcaps, color: colors.paper, fontSize: 12, fontWeight: '600' },
  ctaOutline: { borderWidth: 1, borderColor: colors.line, height: 48, minWidth: 240, alignItems: 'center', justifyContent: 'center' },
  ctaOutlineText: { ...microcaps, color: colors.ink, fontSize: 11 },
  yapeBox: { alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.line, padding: spacing.xl, width: '100%' },
  yapeTitle: { fontSize: 22, fontWeight: '800', color: '#742284', letterSpacing: 1 },
  yapeAmount: { fontSize: 24, fontWeight: '700', color: colors.ink },
  yapeHint: { ...microcaps, fontSize: 10, color: colors.muted },
  demoNote: { fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 18 },
  doneTitle: { fontSize: 22, fontWeight: '700', color: colors.ink },
  doneMsg: { fontSize: 14, color: colors.muted },
});
