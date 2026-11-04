import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { theme } from '@/constants/theme';

const ITEMS = [
  { route: '/(tabs)/', icon: '🧾', label: 'POS' },
  { route: '/(tabs)/orders', icon: '🍳', label: 'Orders' },
  { route: '/(tabs)/history', icon: '📊', label: 'Sales' },
  { route: '/(tabs)/menu', icon: '🍽️', label: 'Menu' },
  { route: '/(tabs)/admin', icon: '🔐', label: 'Admin' },
] as const;

export function SideRail() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.rail}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>🍲</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.items}
        showsVerticalScrollIndicator={false}>
        {ITEMS.map((it) => {
          const active =
            it.route === '/(tabs)/'
              ? pathname === '/' || pathname === '/(tabs)/' || pathname === '/(tabs)'
              : pathname.includes(it.route.replace('/(tabs)', ''));
          return (
            <Pressable
              key={it.route}
              accessibilityLabel={it.label}
              onPress={() => router.replace(it.route as never)}
              style={[styles.btn, active && styles.btnActive]}>
              <Text style={styles.icon}>{it.icon}</Text>
              <Text style={[styles.lbl, active && styles.lblActive]}>{it.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>E</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 72,
    backgroundColor: theme.card,
    borderRightWidth: 1,
    borderRightColor: theme.line,
    alignItems: 'center',
    paddingVertical: 12,
  },
  items: { alignItems: 'center', gap: 4, flexGrow: 1 },
  logo: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: theme.accentSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: { fontSize: 24 },
  btn: {
    width: 60, paddingVertical: 8, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  btnActive: { backgroundColor: theme.accentSoft },
  icon: { fontSize: 20 },
  lbl: { fontSize: 10, color: theme.muted, marginTop: 2, fontWeight: '600' },
  lblActive: { color: theme.accentDark },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#3B2F2F',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  avatarText: { color: '#fff', fontWeight: '700' },
});
