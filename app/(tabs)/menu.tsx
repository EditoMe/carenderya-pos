import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { CATEGORIES, peso } from '@/data/menu';
import { usePos } from '@/store/pos';
import { usePhotos } from '@/store/photos';
import { SideRail } from '@/components/pos/SideRail';
import { DishImage } from '@/components/pos/DishImage';

export default function MenuScreen() {
  const { menu, toggleAvailable, priceOf } = usePos();
  const { photoFor } = usePhotos();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('All Menu');

  const items = menu.filter(
    (m) =>
      (cat === 'All Menu' || m.category === cat) &&
      m.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.root}>
        <SideRail />
        <View style={styles.main}>
          <Text style={styles.title}>Menu Management</Text>
          <Text style={styles.sub}>Toggle availability — sold-out dishes can&apos;t be added to orders</Text>

          <View style={styles.bar}>
            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={(c) => c}
              showsHorizontalScrollIndicator={false}
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
              placeholder="Search dishes…"
              placeholderTextColor={theme.muted}
              style={styles.search}
            />
          </View>

          <FlatList
            data={items}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: m }) => (
              <View style={styles.row}>
                <View style={[styles.thumb, { backgroundColor: m.tint }]}>
                  <DishImage uri={photoFor(m.id)} asset={m.photo} emoji={m.emoji} size={26} fill />
                </View>
                <View style={styles.mid}>
                  <Text style={styles.name}>{m.name}</Text>
                  <Text style={styles.meta}>
                    {m.category} • {peso(priceOf(m.id))}
                    {m.bestseller ? ' • ★ Bestseller' : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => toggleAvailable(m.id)}
                  style={[styles.toggle, m.available ? styles.on : styles.off]}>
                  <Text style={[styles.toggleText, m.available ? styles.onText : styles.offText]}>
                    {m.available ? 'Available' : 'Sold out'}
                  </Text>
                </Pressable>
              </View>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  root: { flex: 1, flexDirection: 'row' },
  main: { flex: 1, padding: 14 },
  title: { fontSize: 20, fontWeight: '800', color: theme.text },
  sub: { fontSize: 12, color: theme.muted, marginTop: 2, marginBottom: 10 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line, marginRight: 6,
  },
  pillActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  pillText: { fontSize: 12, fontWeight: '700', color: theme.muted },
  pillTextActive: { color: '#fff' },
  search: {
    width: 140, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, fontSize: 12, color: theme.text,
  },
  list: { gap: 8, paddingBottom: 24 },
  row: {
    backgroundColor: theme.card, borderRadius: 12,
    borderWidth: 1, borderColor: theme.line, padding: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  thumb: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  mid: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: theme.text },
  meta: { fontSize: 11, color: theme.muted, marginTop: 2 },
  toggle: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  on: { backgroundColor: theme.greenSoft },
  off: { backgroundColor: theme.redSoft },
  toggleText: { fontSize: 12, fontWeight: '700' },
  onText: { color: theme.green },
  offText: { color: theme.red },
});
