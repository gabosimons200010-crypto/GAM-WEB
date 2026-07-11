import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { type Address, ApiError, createAddress, deleteAddress, listAddresses, setDefaultAddress } from '@/lib/api';
import { colors, microcaps, spacing } from '@/lib/theme';

export default function AddressesScreen() {
  const [items, setItems] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [department, setDepartment] = useState('Lima');
  const [province, setProvince] = useState('Lima');
  const [district, setDistrict] = useState('');
  const [line, setLine] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    try {
      setItems(await listAddresses());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No pudimos cargar tus direcciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void reload();
    }, [reload]),
  );

  async function save() {
    if (!district.trim() || !line.trim()) return;
    setSaving(true);
    try {
      await createAddress({
        department,
        province,
        district: district.trim(),
        line: line.trim(),
        phone: phone.trim() || undefined,
        isDefault: items.length === 0,
      });
      setDistrict('');
      setLine('');
      setPhone('');
      setAdding(false);
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault(id: string) {
    await setDefaultAddress(id).catch(() => {});
    await reload();
  }
  async function remove(id: string) {
    await deleteAddress(id).catch(() => {});
    await reload();
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.ink} /></View>;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {error && <Text style={styles.error}>{error}</Text>}

      {items.map((a) => (
        <View key={a.id} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.line}>{a.line}</Text>
            {a.isDefault && <Text style={styles.default}>Predeterminada</Text>}
          </View>
          <Text style={styles.meta}>
            {a.district}, {a.province}, {a.department}
            {a.phone ? ` · ${a.phone}` : ''}
          </Text>
          <View style={styles.actions}>
            {!a.isDefault && (
              <Pressable onPress={() => makeDefault(a.id)} hitSlop={6}>
                <Text style={styles.action}>Hacer predeterminada</Text>
              </Pressable>
            )}
            <Pressable onPress={() => remove(a.id)} hitSlop={6}>
              <Text style={[styles.action, styles.remove]}>Eliminar</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {items.length === 0 && <Text style={styles.empty}>Aún no tienes direcciones guardadas.</Text>}

      {adding ? (
        <View style={styles.form}>
          <Field label="Distrito" value={district} onChange={setDistrict} placeholder="Ej. Miraflores" />
          <Field label="Dirección" value={line} onChange={setLine} placeholder="Calle, número, referencia" />
          <Field label="Celular" value={phone} onChange={setPhone} placeholder="9XX XXX XXX" />
          <Pressable style={styles.cta} disabled={saving} onPress={save}>
            {saving ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.ctaText}>Guardar dirección</Text>}
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.ctaOutline} onPress={() => setAdding(true)}>
          <Text style={styles.ctaOutlineText}>+ Agregar dirección</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  content: { padding: spacing.lg, gap: spacing.md },
  error: { fontSize: 13, color: colors.sale },
  card: { borderWidth: 1, borderColor: colors.line, padding: spacing.md, gap: spacing.xs },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  line: { fontSize: 14, fontWeight: '600', color: colors.ink, flex: 1 },
  default: { ...microcaps, fontSize: 9, color: colors.muted },
  meta: { fontSize: 12, color: colors.muted },
  actions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
  action: { ...microcaps, fontSize: 10, color: colors.ink },
  remove: { color: colors.sale },
  empty: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  form: { gap: spacing.sm, borderWidth: 1, borderColor: colors.line, padding: spacing.md },
  field: { gap: spacing.xs },
  fieldLabel: { ...microcaps, fontSize: 10, color: colors.muted },
  input: { borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, height: 44, fontSize: 14, color: colors.ink },
  cta: { backgroundColor: colors.ink, height: 46, alignItems: 'center', justifyContent: 'center' },
  ctaText: { ...microcaps, color: colors.paper, fontSize: 11, fontWeight: '600' },
  ctaOutline: { borderWidth: 1, borderColor: colors.ink, height: 46, alignItems: 'center', justifyContent: 'center' },
  ctaOutlineText: { ...microcaps, color: colors.ink, fontSize: 11 },
});
