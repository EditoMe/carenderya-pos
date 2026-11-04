import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { peso } from '@/data/menu';
import { usePos } from '@/store/pos';
import { usePhotos } from '@/store/photos';
import { DishImage } from './DishImage';

export function OrderPanel({ onPlaced }: { onPlaced?: () => void }) {
  const { cart, setQty, totals, priceOf, nameOf, orderType, promo, setPromo, clearCart, menu } = usePos();
  const { photoFor } = usePhotos();
  const router = useRouter();
  const dishOf = (id: string) => menu.find((m) => m.id === id);

  return (
    <View style={styles.panel}>
      <View style={styles.head}>
        <View>
          <Text style={styles.title}>Order&apos;s Summary</Text>
          <Text style={styles.sub}>{orderType} • Total items ({totals.count})</Text>
        </View>
        {cart.length > 0 && (
          <Pressable onPress={clearCart}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.lines} showsVerticalScrollIndicator={false}>
        {cart.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🧾</Text>
            <Text style={styles.emptyText}>No items yet.{'\n'}Tap Add Item to start an order.</Text>
          </View>
        )}
        {cart.map((l) => (
          <View key={l.id} style={styles.line}>
            <View style={styles.thumb}>
              <DishImage uri={photoFor(l.id)} asset={dishOf(l.id)?.photo} emoji={dishOf(l.id)?.emoji ?? '🍽️'} size={22} fill />
            </View>
            <View style={styles.lineMid}>
              <Text style={styles.lineName} numberOfLines={1}>{nameOf(l.id)}</Text>
              <Text style={styles.linePrice}>{peso(priceOf(l.id))}</Text>
            </View>
            <View style={styles.qtyRow}>
              <Pressable onPress={() => setQty(l.id, l.qty - 1)} style={styles.qbtn}>
                <Text style={styles.qbtnText}>−</Text>
              </Pressable>
              <Text style={styles.q}>{l.qty}</Text>
              <Pressable onPress={() => setQty(l.id, l.qty + 1)} style={styles.qbtn}>
                <Text style={styles.qbtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable
        onPress={() => setPromo(!promo)}
        style={[styles.promo, promo && styles.promoOn]}>
        <Text style={[styles.promoText, promo && styles.promoTextOn]}>
          {promo ? '✓ ' : ''}Promo 10% OFF applied
        </Text>
      </Pressable>

      <View style={styles.sums}>
        <Row label="Price" value={peso(totals.subtotal)} />
        <Row label="Discount" value={totals.discount > 0 ? `-${peso(totals.discount)}` : peso(0)} />
        <Row label="Tax (12%)" value={peso(totals.tax)} />
        <View style={styles.div} />
        <Row label="Total" value={peso(totals.total)} big />
      </View>

      <Pressable
        disabled={cart.length === 0}
        onPress={() => {
          onPlaced?.();
          router.push('/checkout' as never);
        }}
        style={[styles.cta, cart.length === 0 && styles.ctaDisabled]}>
        <Text style={styles.ctaText}>Place Order • {peso(totals.total)}</Text>
      </Pressable>
    </View>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, big && styles.rowBig]}>{label}</Text>
      <Text style={[styles.rowValue, big && styles.rowBig]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: 300,
    backgroundColor: theme.card,
    borderLeftWidth: 1,
    borderLeftColor: theme.line,
    padding: 14,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '800', color: theme.text },
  sub: { fontSize: 11, color: theme.muted, marginTop: 2 },
  cancel: { fontSize: 12, color: theme.red, fontWeight: '700' },
  lines: { flex: 1, marginVertical: 4 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { textAlign: 'center', color: theme.muted, marginTop: 8, fontSize: 12, lineHeight: 18 },
  line: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 8 },
  thumb: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: '#F6EEE3',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  lineMid: { flex: 1 },
  lineName: { fontSize: 12, fontWeight: '700', color: theme.text },
  linePrice: { fontSize: 11, color: theme.muted, marginTop: 1 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qbtn: {
    width: 22, height: 22, borderRadius: 7,
    backgroundColor: theme.bg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.line,
  },
  qbtnText: { fontSize: 14, fontWeight: '800', color: theme.text, lineHeight: 16 },
  q: { fontSize: 13, fontWeight: '800', color: theme.text, minWidth: 16, textAlign: 'center' },
  promo: {
    borderWidth: 1, borderStyle: 'dashed', borderColor: theme.line,
    borderRadius: 10, paddingVertical: 8, alignItems: 'center', marginTop: 6,
  },
  promoOn: { borderColor: theme.green, backgroundColor: theme.greenSoft },
  promoText: { fontSize: 11, color: theme.muted, fontWeight: '700' },
  promoTextOn: { color: theme.green },
  sums: { marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowLabel: { fontSize: 12, color: theme.muted },
  rowValue: { fontSize: 12, color: theme.text, fontWeight: '600' },
  rowBig: { fontSize: 15, fontWeight: '800', color: theme.text },
  div: { height: 1, backgroundColor: theme.line, marginVertical: 6 },
  cta: {
    marginTop: 10,
    backgroundColor: theme.accent,
    borderRadius: 12, paddingVertical: 13,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
