import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { peso } from '@/data/menu';
import { usePos } from '@/store/pos';
import { StatusPill } from '../(tabs)/orders';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, updateStatus } = usePos();
  const router = useRouter();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>Order not found</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.head}>
          <View>
            <Text style={styles.title}>Order #{order.id}</Text>
            <Text style={styles.sub}>
              {order.type} • {order.payment ? `Paid via ${order.payment}` : 'Unpaid'} •{' '}
              {new Date(order.createdAt).toLocaleString()}
            </Text>
          </View>
          <StatusPill status={order.status} />
        </View>

        <View style={styles.card}>
          {order.lines.map((l) => (
            <View key={l.id} style={styles.line}>
              <Text style={styles.lineName}>
                {l.qty}× {l.name}
              </Text>
              <Text style={styles.lineValue}>{peso(l.price * l.qty)}</Text>
            </View>
          ))}
          <View style={styles.div} />
          <Line label="Subtotal" value={peso(order.subtotal)} />
          <Line label="Discount" value={order.discount > 0 ? `-${peso(order.discount)}` : peso(0)} />
          <Line label="Tax (12%)" value={peso(order.tax)} />
          <Line label="Total" value={peso(order.total)} big />
        </View>

        <View style={styles.actions}>
          {order.status === 'In Progress' && (
            <Pressable style={[styles.btn, styles.ready]} onPress={() => updateStatus(order.id, 'Ready to Serve')}>
              <Text style={styles.btnTextLight}>Mark Ready to Serve</Text>
            </Pressable>
          )}
          {order.status === 'Ready to Serve' && (
            <Pressable style={[styles.btn, styles.done]} onPress={() => updateStatus(order.id, 'Completed')}>
              <Text style={styles.btnTextLight}>Mark Completed</Text>
            </Pressable>
          )}
          {(order.status === 'In Progress' || order.status === 'Ready to Serve') && (
            <Pressable style={[styles.btn, styles.cancel]} onPress={() => updateStatus(order.id, 'Cancelled')}>
              <Text style={styles.btnTextCancel}>Cancel Order</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Line({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={styles.sumRow}>
      <Text style={[styles.sumLabel, big && styles.big]}>{label}</Text>
      <Text style={[styles.sumValue, big && styles.big]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  wrap: { padding: 20, maxWidth: 640, width: '100%', alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: theme.text },
  sub: { fontSize: 12, color: theme.muted, marginTop: 4 },
  link: { marginTop: 12, color: theme.accentDark, fontWeight: '700' },
  card: {
    backgroundColor: theme.card, borderRadius: 12,
    borderWidth: 1, borderColor: theme.line, padding: 14,
  },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  lineName: { fontSize: 14, fontWeight: '600', color: theme.text },
  lineValue: { fontSize: 14, fontWeight: '700', color: theme.text },
  div: { height: 1, backgroundColor: theme.line, marginVertical: 8 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  sumLabel: { fontSize: 13, color: theme.muted },
  sumValue: { fontSize: 13, fontWeight: '700', color: theme.text },
  big: { fontSize: 16, fontWeight: '800', color: theme.text },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  btn: { flex: 1, minWidth: 150, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  ready: { backgroundColor: theme.accent },
  done: { backgroundColor: theme.green },
  cancel: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.red },
  btnTextLight: { color: '#fff', fontWeight: '800' },
  btnTextCancel: { color: theme.red, fontWeight: '800' },
});
