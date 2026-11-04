import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { peso } from '@/data/menu';
import { usePos } from '@/store/pos';
import { SideRail } from '@/components/pos/SideRail';
import { StatusPill } from './orders';

export default function HistoryScreen() {
  const { orders } = usePos();
  const done = orders.filter((o) => o.status === 'Completed');
  const sales = done.reduce((s, o) => s + o.total, 0);
  const avg = done.length ? sales / done.length : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.root}>
        <SideRail />
        <View style={styles.main}>
          <Text style={styles.title}>Sales History</Text>
          <Text style={styles.sub}>Today&apos;s performance at a glance</Text>

          <View style={styles.stats}>
            <Stat label="Total Sales" value={peso(sales)} />
            <Stat label="Completed Orders" value={String(done.length)} />
            <Stat label="Avg. Order" value={peso(avg)} />
          </View>

          <FlatList
            data={orders.filter((o) => o.status === 'Completed' || o.status === 'Cancelled')}
            keyExtractor={(o) => o.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: o }) => (
              <View style={styles.row}>
                <View>
                  <Text style={styles.id}>Order #{o.id}</Text>
                  <Text style={styles.meta}>
                    {o.type} • {o.payment ?? '—'} • {new Date(o.createdAt).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={styles.right}>
                  <Text style={styles.total}>{peso(o.total)}</Text>
                  <StatusPill status={o.status} />
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>Completed orders will appear here.</Text>
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  root: { flex: 1, flexDirection: 'row' },
  main: { flex: 1, padding: 14 },
  title: { fontSize: 20, fontWeight: '800', color: theme.text },
  sub: { fontSize: 12, color: theme.muted, marginTop: 2, marginBottom: 10 },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stat: {
    flex: 1, backgroundColor: theme.card, borderRadius: 12,
    borderWidth: 1, borderColor: theme.line, padding: 12,
  },
  statLabel: { fontSize: 11, color: theme.muted, fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: '800', color: theme.text, marginTop: 4 },
  list: { gap: 8, paddingBottom: 24 },
  row: {
    backgroundColor: theme.card, borderRadius: 12,
    borderWidth: 1, borderColor: theme.line, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  id: { fontSize: 14, fontWeight: '800', color: theme.text },
  meta: { fontSize: 11, color: theme.muted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  total: { fontSize: 14, fontWeight: '800', color: theme.text },
  empty: { textAlign: 'center', color: theme.muted, marginTop: 32 },
});
