import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import { peso, type MenuItem } from '@/data/menu';
import { usePos } from '@/store/pos';
import { usePhotos } from '@/store/photos';
import { DishImage } from './DishImage';

export function MenuCard({ item, compact, short }: { item: MenuItem; compact?: boolean; short?: boolean }) {
  const { cart, add, remove } = usePos();
  const { photoFor } = usePhotos();
  const qty = cart.find((l) => l.id === item.id)?.qty ?? 0;

  return (
    <View style={[styles.card, compact && styles.cardCompact, !item.available && styles.dim]}>
      <View style={[styles.img, { backgroundColor: item.tint }, short && styles.imgShort]}>
        <DishImage uri={photoFor(item.id)} asset={item.photo} emoji={item.emoji} size={short ? 38 : 52} fill />
        {item.bestseller && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>★ Best</Text>
          </View>
        )}
        {!item.available && (
          <View style={styles.off}>
            <Text style={styles.offText}>Unavailable</Text>
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.price}>{peso(item.price)}</Text>
      {qty === 0 ? (
        <Pressable
          disabled={!item.available}
          onPress={() => add(item.id)}
          style={[styles.add, !item.available && styles.addDisabled]}>
          <Text style={styles.addText}>Add Item +</Text>
        </Pressable>
      ) : (
        <View style={styles.stepper}>
          <Pressable onPress={() => remove(item.id)} style={styles.stepBtn}>
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.qty}>{qty}</Text>
          <Pressable onPress={() => add(item.id)} style={[styles.stepBtn, styles.stepPlus]}>
            <Text style={[styles.stepText, styles.stepPlusText]}>+</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: theme.radius,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.line,
    minWidth: 150,
  },
  cardCompact: { minWidth: 130, padding: 8 },
  dim: { opacity: 0.75 },
  img: {
    height: 104,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  imgShort: { height: 72, marginBottom: 6 },
  badge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: theme.accent,
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  off: {
    position: 'absolute', bottom: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  },
  offText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  name: { fontSize: 13, fontWeight: '700', color: theme.text },
  price: { fontSize: 12, color: theme.muted, marginTop: 2, fontWeight: '600' },
  add: {
    marginTop: 8,
    borderWidth: 1, borderColor: theme.accent,
    borderRadius: 10, paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: '#FFF6EF',
  },
  addDisabled: { opacity: 0.4 },
  addText: { color: theme.accentDark, fontWeight: '700', fontSize: 12 },
  stepper: {
    marginTop: 8,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.accentSoft,
    borderRadius: 10, padding: 2,
  },
  stepBtn: {
    flex: 1, paddingVertical: 5,
    alignItems: 'center', borderRadius: 8,
    backgroundColor: theme.card,
  },
  stepPlus: { backgroundColor: theme.accent },
  stepText: { fontSize: 16, fontWeight: '800', color: theme.text },
  stepPlusText: { color: '#fff' },
  qty: { flex: 1, textAlign: 'center', fontWeight: '800', color: theme.text },
});
