import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { theme, type PaymentMethod } from '@/constants/theme';
import { peso } from '@/data/menu';
import { usePos } from '@/store/pos';

const METHODS: PaymentMethod[] = ['Cash', 'GCash', 'Card'];

export default function CheckoutScreen() {
  const { totals, placeOrder, cart } = usePos();
  const router = useRouter();
  const { width } = useWindowDimensions();
  // Landscape phones are wide but short: two columns fit everything on screen.
  const cols = width >= 700;
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [tendered, setTendered] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const [paidTotal, setPaidTotal] = useState(0);

  const cash = parseFloat(tendered) || 0;
  const change = cash - totals.total;

  const confirm = () => {
    if (cart.length === 0) return;
    if (method === 'Cash' && change < 0) return;
    setPaidTotal(totals.total);
    const order = placeOrder(method);
    setDone(order.id);
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>✅</Text>
          <Text style={styles.title}>Order #{done} placed!</Text>
          <Text style={styles.sub}>Paid via {method} • {peso(paidTotal)}</Text>
          <Pressable style={styles.cta} onPress={() => router.replace('/(tabs)/orders' as never)}>
            <Text style={styles.ctaText}>View in Orders</Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/(tabs)/' as never)}>
            <Text style={styles.link}>Back to POS</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const payDisabled = cart.length === 0 || (method === 'Cash' && change < 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>‹ Back</Text>
            </Pressable>
            <Text style={styles.title}>Checkout</Text>
            <Text style={styles.count}>
              {cart.length === 0 ? 'Cart empty' : `${cart.length} line(s)`}
            </Text>
          </View>

          <View style={[cols && styles.cols]}>
            <View style={[cols && styles.col]}>
              <Text style={styles.label}>Payment method</Text>
              <View style={styles.methods}>
                {METHODS.map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setMethod(m)}
                    style={[styles.method, method === m && styles.methodActive]}>
                    <Text style={[styles.methodText, method === m && styles.methodTextActive]}>
                      {m === 'Cash' ? '💵' : m === 'GCash' ? '📱' : '💳'} {m}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {method === 'Cash' && (
                <>
                  <Text style={styles.label}>Cash tendered</Text>
                  <TextInput
                    value={tendered}
                    onChangeText={setTendered}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={theme.muted}
                    style={styles.input}
                  />
                  <View style={styles.quick}>
                    {[100, 200, 500, 1000].map((v) => (
                      <Pressable key={v} onPress={() => setTendered(String(v))} style={styles.chip}>
                        <Text style={styles.chipText}>₱{v}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </View>

            <View style={[cols && styles.col]}>
              <View style={styles.sums}>
                <Row label="Subtotal" value={peso(totals.subtotal)} />
                <Row label="Discount" value={totals.discount > 0 ? `-${peso(totals.discount)}` : peso(0)} />
                <Row label="Tax (12%)" value={peso(totals.tax)} />
                <Row label="Total due" value={peso(totals.total)} big />
                {method === 'Cash' && tendered !== '' && (
                  <Row label="Change" value={change >= 0 ? peso(change) : 'Insufficient'} big />
                )}
              </View>

              <Pressable
                disabled={payDisabled}
                onPress={confirm}
                style={[styles.cta, payDisabled && styles.ctaDisabled]}>
                <Text style={styles.ctaText}>Confirm Payment • {peso(totals.total)}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, big && styles.big]}>{label}</Text>
      <Text style={[styles.rowValue, big && styles.big]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroll: { flexGrow: 1 },
  inner: { flex: 1, padding: 14, maxWidth: 760, width: '100%', alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  bigEmoji: { fontSize: 56 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backBtn: { paddingVertical: 6, paddingRight: 12 },
  backText: { fontSize: 15, fontWeight: '700', color: theme.accentDark },
  title: { flex: 1, fontSize: 19, fontWeight: '800', color: theme.text },
  count: { fontSize: 11, color: theme.muted },
  sub: { fontSize: 12, color: theme.muted, marginTop: 4, marginBottom: 12 },
  cols: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  col: { flex: 1 },
  label: { fontSize: 12, fontWeight: '700', color: theme.text, marginTop: 10, marginBottom: 6 },
  methods: { flexDirection: 'row', gap: 8 },
  method: {
    flex: 1, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line,
    borderRadius: 12, paddingVertical: 11, alignItems: 'center',
  },
  methodActive: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  methodText: { fontSize: 13, fontWeight: '700', color: theme.muted },
  methodTextActive: { color: theme.accentDark },
  input: {
    backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 18, fontWeight: '800', color: theme.text,
  },
  quick: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  chip: {
    backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: theme.text },
  sums: {
    backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line,
    borderRadius: 12, padding: 12, marginTop: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rowLabel: { fontSize: 13, color: theme.muted },
  rowValue: { fontSize: 13, fontWeight: '700', color: theme.text },
  big: { fontSize: 16, fontWeight: '800', color: theme.text },
  cta: {
    marginTop: 12, backgroundColor: theme.accent,
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  link: { marginTop: 14, color: theme.accentDark, fontWeight: '700' },
});
