import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ApiError, canReview, createReview, listReviews } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, microcaps, spacing } from '@/lib/theme';
import type { Review } from '@/lib/types';

export function Stars({ value, size = 14, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = n <= Math.round(value) ? 'star' : 'star-outline';
        const star = <Ionicons name={icon} size={size} color={colors.ink} />;
        return onChange ? (
          <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
            {star}
          </Pressable>
        ) : (
          <View key={n}>{star}</View>
        );
      })}
    </View>
  );
}

export function Reviews({
  productId,
  ratingAvg,
  ratingCount,
}: {
  productId: string;
  ratingAvg: number;
  ratingCount: number;
}) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try {
      const list = await listReviews(productId);
      setReviews(list);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    if (user) {
      canReview(productId)
        .then((r) => setAllowed(r.canReview))
        .catch(() => setAllowed(false));
    } else {
      setAllowed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user]);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      await createReview(productId, rating, comment.trim() || undefined);
      setComment('');
      setAllowed(false);
      setMsg('¡Gracias por tu reseña!');
      await load();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'No pudimos publicar tu reseña.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reseñas</Text>
        {ratingCount > 0 && (
          <View style={styles.headerRating}>
            <Stars value={ratingAvg} />
            <Text style={styles.count}>
              {ratingAvg.toFixed(1)} · {ratingCount}
            </Text>
          </View>
        )}
      </View>

      {allowed && (
        <View style={styles.form}>
          <Text style={styles.formLabel}>Tu compra está verificada ✓ — deja tu reseña</Text>
          <Stars value={rating} size={26} onChange={setRating} />
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Cuéntanos qué te pareció (opcional)"
            placeholderTextColor={colors.muted}
            multiline
          />
          <Pressable style={styles.submit} disabled={busy} onPress={submit}>
            {busy ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.submitText}>Publicar reseña</Text>}
          </Pressable>
        </View>
      )}

      {msg && <Text style={styles.msg}>{msg}</Text>}

      {loading ? (
        <ActivityIndicator color={colors.ink} style={{ marginTop: spacing.md }} />
      ) : reviews.length === 0 ? (
        <Text style={styles.empty}>Aún no hay reseñas. {user ? '' : 'Inicia sesión y compra para poder reseñar.'}</Text>
      ) : (
        reviews.map((r) => (
          <View key={r.id} style={styles.review}>
            <View style={styles.reviewTop}>
              <Text style={styles.author}>{r.authorName}</Text>
              <Stars value={r.rating} size={12} />
            </View>
            {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.xxl, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...microcaps, fontSize: 13, color: colors.ink },
  headerRating: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  count: { fontSize: 12, color: colors.muted },
  stars: { flexDirection: 'row', gap: 2 },
  form: { gap: spacing.sm, borderWidth: 1, borderColor: colors.line, padding: spacing.md },
  formLabel: { fontSize: 12, color: colors.ink },
  input: { borderWidth: 1, borderColor: colors.line, padding: spacing.md, minHeight: 64, fontSize: 14, color: colors.ink, textAlignVertical: 'top' },
  submit: { backgroundColor: colors.ink, height: 44, alignItems: 'center', justifyContent: 'center' },
  submitText: { ...microcaps, color: colors.paper, fontSize: 11, fontWeight: '600' },
  msg: { fontSize: 12, color: colors.muted },
  empty: { fontSize: 13, color: colors.muted, marginTop: spacing.sm },
  review: { gap: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: spacing.md },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontSize: 13, fontWeight: '600', color: colors.ink },
  comment: { fontSize: 13, color: colors.ink, lineHeight: 19 },
});
