import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { theme, type OrderStatus } from '@/constants/theme';
import { peso } from '@/data/menu';
import { usePos } from '@/store/pos';
import { SideRail } from '@/components/pos/SideRail';

const NEXT: Record<string, OrderStatus[]> = {
  'In Progress': ['Ready to Serve', 'Cancelled'],
  'Ready to Serve': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

export default function OrdersScreen() {
  const { orders, updateStatus } = usePos();
  const active = orders.filter((o) => o.status === 'In Progress' || o.status === 'Ready to Serve');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.root}>
        <SideRail />
        <View style={styles.main}>
          <Text style={styles.title}>Active Orders</Text>
          <Text style={styles.sub}>{active.length} orders in the kitchen queue</Text>
          <FlatList
            data={orders}
            keyExtractor={(o) => o.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: o }) => (
              <View style={styles.card}>
                <View style={styles.top}>
                  <View>
                    <Link href={`/order/${o.id}` as never}>
                      <Text style={styles.id}>Order #{o.id}</Text>
                    </Link>
                    <Text style={styles.meta}>
                      {o.type} • {o.lines.reduce((s, l) => s + l.qty, 0)} items • {peso(o.total)}
                    </Text>
                  </View>
                  <StatusPill status={o.status} />
                </View>
                <View style={styles.actions}>
                  {NEXT[o.status].map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => updateStatus(o.id, s)}
                      style={[
                        styles.btn,
                        s === 'Completed' && styles.btnDone,
                        s === 'Cancelled' && styles.btnCancel,
                      ]}>
                      <Text
                        style={[
                          styles.btnText,
                          s === 'Completed' && styles.btnTextLight,
                          s === 'Cancelled' && styles.btnTextCancel,
                        ]}>
                        Mark {s}
                      </Text>
                    </Pressable>
                  ))}
                  {NEXT[o.status].length === 0 && (
                    <Text style={styles.final}>No further actions</Text>
                  )}
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No orders yet.</Text>}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

export function StatusPill({ status }: { status: OrderStatus }) {
  const style =
    status === 'Ready to Serve'
      ? styles.ready
      : status === 'In Progress'
        ? styles.progress
        : status === 'Completed'
          ? styles.done
          : styles.cancelled;
  const txt =
    status === 'Ready to Serve'
      ? styles.readyText
      : status === 'In Progress'
        ? styles.progressText
        : status === 'Completed'
          ? styles.doneText
          : styles.cancelledText;
  return (
    <View style={[styles.pill, style]}>
      <Text style={[styles.pillText, txt]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  root: { flex: 1, flexDirection: 'row' },
  main: { flex: 1, padding: 14 },
  title: { fontSize: 20, fontWeight: '800', color: theme.text },
  sub: { fontSize: 12, color: theme.muted, marginTop: 2, marginBottom: 10 },
  list: { gap: 10, paddingBottom: 24 },
  card: {
    backgroundColor: theme.card, borderRadius: 12,
    borderWidth: 1, borderColor: theme.line, padding: 12,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { fontSize: 15, fontWeight: '800', color: theme.text },
  meta: { fontSize: 11, color: theme.muted, marginTop: 2 },
  pill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 11, fontWeight: '700' },
  ready: { backgroundColor: theme.greenSoft },
  readyText: { color: theme.green },
  progress: { backgroundColor: theme.amberSoft },
  progressText: { color: theme.amber },
  done: { backgroundColor: '#E4E9F5' },
  doneText: { color: theme.blue },
  cancelled: { backgroundColor: theme.redSoft },
  cancelledText: { color: theme.red },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
    backgroundColor: theme.accentSoft,
  },
  btnDone: { backgroundColor: theme.green },
  btnCancel: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.red },
  btnText: { fontSize: 12, fontWeight: '700', color: theme.accentDark },
  btnTextLight: { color: '#fff' },
  btnTextCancel: { color: theme.red },
  final: { fontSize: 12, color: theme.muted },
  empty: { textAlign: 'center', color: theme.muted, marginTop: 32 },
});
