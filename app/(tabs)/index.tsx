import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, type OrderStatus, type OrderType } from '@/constants/theme';
import { CATEGORIES, peso } from '@/data/menu';
import { usePos } from '@/store/pos';
import { SideRail } from '@/components/pos/SideRail';
import { MenuCard } from '@/components/pos/MenuCard';
import { OrderPanel } from '@/components/pos/OrderPanel';

const ORDER_TYPES: OrderType[] = ['Dine In', 'Take Away', 'Deliver'];

export default function PosScreen() {
  const { menu, orders, orderType, setOrderType, totals } = usePos();
  const { width, height } = useWindowDimensions();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('All Menu');
  const [query, setQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  const wide = width >= 1024;
  // Landscape phones are short (~360-400pt tall): compact the top section
  // so the menu grid keeps maximum vertical space.
  const short = height < 500;
  const numCols = width >= 1150 ? 4 : width >= 760 ? 3 : 2;

  const items = useMemo(
    () =>
      menu.filter(
        (m) =>
          (cat === 'All Menu' || m.category === cat) &&
          m.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [menu, cat, query],
  );

  const activeOrders = orders.filter((o) => o.status === 'In Progress' || o.status === 'Ready to Serve');

  // Pad the last row with invisible spacers so a lone card can't stretch full-width.
  const gridData = useMemo(() => {
    const rem = items.length % numCols;
    if (rem === 0) return items;
    return [...items, ...Array.from({ length: numCols - rem }, (_, i) => ({ id: `spacer-${i}`, spacer: true as const }))];
  }, [items, numCols]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.root}>
        <SideRail />

        <View style={[styles.main, short && styles.mainShort]}>
          {/* Header */}
          <View style={[styles.header, short && styles.headerShort]}>
            <View>
              <Text style={styles.brand}>🍲 Carenderya POS</Text>
              <Text style={styles.brandSub}>carenderya-pos-dashboard</Text>
            </View>
            <View style={styles.typeRow}>
              {ORDER_TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setOrderType(t)}
                  style={[styles.typeBtn, orderType === t && styles.typeBtnActive]}>
                  <Text style={[styles.typeText, orderType === t && styles.typeTextActive]}>{t}</Text>
                </Pressable>
              ))}
              <Pressable style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>

          {/* Sales analytics strip (from Figma) */}
          <View style={[styles.analytics, short && styles.analyticsShort]}>
            <View style={[styles.salesCard, short && styles.salesCardShort]}>
              <View style={styles.salesTop}>
                <Text style={styles.salesTitle}>Sales Analytics</Text>
                {short && <Text style={styles.salesCount}> • {activeOrders.length} active</Text>}
              </View>
              <Text style={[styles.salesValue, short && styles.salesValueShort]}>
                {peso(activeOrders.reduce((s, o) => s + o.total, 0) + totals.total)}
              </Text>
              {!short && (
                <Text style={styles.salesSub}>{activeOrders.length} active orders today</Text>
              )}
            </View>
            {activeOrders.slice(0, 3).map((o) => (
              <View key={o.id} style={[styles.orderChip, short && styles.orderChipShort]}>
                <Text style={[styles.orderId, short && styles.orderIdShort]} numberOfLines={1}>
                  Order #{o.id}
                </Text>
                <StatusPill status={o.status} />
              </View>
            ))}
          </View>

          {/* Category pills + search */}
          <View style={[styles.catRow, short && styles.catRowShort]}>
            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={(c) => c}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catList}
              renderItem={({ item: c }) => (
                <Pressable
                  onPress={() => setCat(c)}
                  style={[styles.pill, cat === c && styles.pillActive]}>
                  <Text style={[styles.pillText, cat === c && styles.pillTextActive]}>{c}</Text>
                </Pressable>
              )}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search…"
              placeholderTextColor={theme.muted}
              style={styles.search}
            />
          </View>

          <Text style={[styles.sectionTitle, short && styles.sectionTitleShort]}>Menu Items</Text>

          {/* Menu grid */}
          <FlatList
            data={gridData}
            key={`${numCols}`}
            numColumns={numCols}
            keyExtractor={(m) => m.id}
            contentContainerStyle={[styles.grid, !wide && styles.gridFab]}
            columnWrapperStyle={numCols > 1 ? styles.row : undefined}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) =>
              'spacer' in item ? (
                <View style={styles.spacer} />
              ) : (
                <MenuCard item={item} compact={!wide} short={short} />
              )
            }
            ListEmptyComponent={
              <Text style={styles.emptyGrid}>No dishes match your search.</Text>
            }
          />
        </View>

        {/* Right summary — fixed on wide landscape, modal sheet on narrow */}
        {wide ? (
          <OrderPanel />
        ) : (
          <>
            <Pressable style={styles.cartFab} onPress={() => setCartOpen(true)}>
              <Text style={styles.cartFabText}>🧾 {totals.count} • {peso(totals.total)}</Text>
            </Pressable>
            <Modal visible={cartOpen} animationType="slide" transparent>
              <View style={styles.sheetWrap}>
                <Pressable style={styles.sheetDim} onPress={() => setCartOpen(false)} />
                <View style={styles.sheet}>
                  <OrderPanel onPlaced={() => setCartOpen(false)} />
                </View>
              </View>
            </Modal>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const ready = status === 'Ready to Serve';
  return (
    <View style={[styles.pillStatus, ready ? styles.ready : styles.progress]}>
      <Text style={[styles.pillStatusText, ready ? styles.readyText : styles.progressText]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  root: { flex: 1, flexDirection: 'row' },
  main: { flex: 1, padding: 14 },
  mainShort: { padding: 10 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8,
  },
  headerShort: { marginBottom: 6 },
  brand: { fontSize: 17, fontWeight: '800', color: theme.text },
  brandSub: { fontSize: 11, color: theme.muted },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  typeBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, backgroundColor: theme.card,
    borderWidth: 1, borderColor: theme.line,
  },
  typeBtnActive: { backgroundColor: theme.text, borderColor: theme.text },
  typeText: { fontSize: 12, fontWeight: '700', color: theme.muted },
  typeTextActive: { color: '#fff' },
  cancelBtn: { paddingHorizontal: 10, paddingVertical: 7 },
  cancelText: { fontSize: 12, fontWeight: '700', color: theme.red },
  analytics: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  analyticsShort: { gap: 6, marginBottom: 6 },
  salesCard: {
    flex: 1.2, backgroundColor: theme.card, borderRadius: 12,
    padding: 10, borderWidth: 1, borderColor: theme.line,
  },
  salesCardShort: { padding: 8 },
  salesTop: { flexDirection: 'row', alignItems: 'baseline' },
  salesCount: { fontSize: 10, color: theme.muted, fontWeight: '600' },
  salesTitle: { fontSize: 11, color: theme.muted, fontWeight: '600' },
  salesValue: { fontSize: 18, fontWeight: '800', color: theme.text, marginTop: 2 },
  salesValueShort: { fontSize: 16, marginTop: 0 },
  salesSub: { fontSize: 10, color: theme.muted, marginTop: 2 },
  orderChip: {
    flex: 1, backgroundColor: theme.card, borderRadius: 12,
    padding: 10, borderWidth: 1, borderColor: theme.line,
    justifyContent: 'center', gap: 6,
  },
  orderChipShort: { padding: 8, gap: 4, borderRadius: 10 },
  orderId: { fontSize: 12, fontWeight: '700', color: theme.text },
  orderIdShort: { fontSize: 11 },
  pillStatus: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  ready: { backgroundColor: theme.greenSoft },
  progress: { backgroundColor: theme.amberSoft },
  pillStatusText: { fontSize: 10, fontWeight: '700' },
  readyText: { color: theme.green },
  progressText: { color: theme.amber },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  catRowShort: { marginBottom: 4 },
  catList: { gap: 6, paddingVertical: 2 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, backgroundColor: theme.card,
    borderWidth: 1, borderColor: theme.line, marginRight: 6,
  },
  pillActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  pillText: { fontSize: 12, fontWeight: '700', color: theme.muted },
  pillTextActive: { color: '#fff' },
  search: {
    width: 130, backgroundColor: theme.card,
    borderWidth: 1, borderColor: theme.line,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7,
    fontSize: 12, color: theme.text,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: theme.text, marginVertical: 6 },
  sectionTitleShort: { fontSize: 12, marginVertical: 4 },
  grid: { gap: 10, paddingBottom: 24 },
  gridFab: { paddingBottom: 76 },
  spacer: { flex: 1 },
  row: { gap: 10 },
  emptyGrid: { textAlign: 'center', color: theme.muted, marginTop: 24 },
  cartFab: {
    position: 'absolute', right: 16, bottom: 16,
    backgroundColor: theme.text, borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 12,
    elevation: 4,
  },
  cartFabText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  sheetWrap: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  sheetDim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { width: 330, backgroundColor: theme.card },
});
