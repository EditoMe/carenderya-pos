import { useState } from 'react';
import { Alert, FlatList, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '@/constants/theme';
import { CATEGORIES, peso, type Category } from '@/data/menu';
import { usePos, type NewProduct } from '@/store/pos';
import { usePhotos } from '@/store/photos';
import { useAdmin } from '@/store/admin';
import { SideRail } from '@/components/pos/SideRail';
import { DishImage } from '@/components/pos/DishImage';

type Section = 'photos' | 'products' | 'pin';

export default function AdminScreen() {
  const { isAdmin } = useAdmin();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.root}>
        <SideRail />
        <View style={styles.main}>{isAdmin ? <AdminPanel /> : <PinGate />}</View>
      </View>
    </SafeAreaView>
  );
}

/* ---------------- PIN gate ---------------- */

function PinGate() {
  const { unlock } = useAdmin();
  const { height } = useWindowDimensions();
  // Landscape phones are short: shrink the pad so Unlock stays reachable.
  const short = height < 500;
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const press = (d: string) => {
    setError('');
    setPin((p) => (p.length < 8 ? p + d : p));
  };

  const submit = async () => {
    if (pin.length < 4 || busy) return;
    setBusy(true);
    const ok = await unlock(pin);
    setBusy(false);
    if (ok) {
      setPin('');
    } else {
      setError('Wrong PIN — try again');
      setPin('');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.center, short && styles.centerShort]}
      showsVerticalScrollIndicator={false}>
      <Text style={[styles.lockEmoji, short && styles.lockEmojiShort]}>🔐</Text>
      <Text style={[styles.title, short && styles.titleShort]}>Owner / Admin Only</Text>
      {!short && (
        <Text style={styles.sub}>Enter your admin PIN to manage dish photos and settings.</Text>
      )}

      <View style={styles.pinRow}>
        {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
          <View key={i} style={[styles.pinDot, i < pin.length && styles.pinDotOn]} />
        ))}
      </View>
      {error !== '' && <Text style={styles.error}>{error}</Text>}

      <View style={[styles.pad, short && styles.padShort]}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
          k === '' ? (
            <View key={i} style={[styles.key, short && styles.keyShort]} />
          ) : (
            <Pressable
              key={i}
              style={[styles.key, short && styles.keyShort]}
              onPress={() => (k === '⌫' ? (setError(''), setPin((p) => p.slice(0, -1))) : press(k))}>
              <Text style={[styles.keyText, short && styles.keyTextShort]}>{k}</Text>
            </Pressable>
          ),
        )}
      </View>

      <Pressable
        onPress={submit}
        disabled={pin.length < 4 || busy}
        style={[styles.cta, short && styles.ctaShort, (pin.length < 4 || busy) && styles.ctaDisabled]}>
        <Text style={styles.ctaText}>{busy ? 'Checking…' : 'Unlock Admin'}</Text>
      </Pressable>
      <Text style={styles.hint}>Default PIN: 1234 (change it after first login)</Text>
    </ScrollView>
  );
}

/* ---------------- Admin panel ---------------- */

function AdminPanel() {
  const { lock, isDefaultPin } = useAdmin();
  const [section, setSection] = useState<Section>('photos');

  return (
    <View style={styles.panel}>
      <View style={styles.head}>
        <View style={styles.seg}>
          {(['photos', 'products', 'pin'] as Section[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => setSection(s)}
              style={[styles.segBtn, section === s && styles.segBtnActive]}>
              <Text style={[styles.segText, section === s && styles.segTextActive]}>
                {s === 'photos' ? '📷 Photos' : s === 'products' ? '🍽️ Products' : '🔑 PIN'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={lock} style={styles.lockBtn}>
          <Text style={styles.lockBtnText}>Lock 🔒</Text>
        </Pressable>
      </View>

      {isDefaultPin && (
        <View style={styles.warn}>
          <Text style={styles.warnText}>
            ⚠️ You are still using the default PIN (1234). Change it under the PIN tab.
          </Text>
        </View>
      )}

      {section === 'photos' && <PhotosPanel />}
      {section === 'products' && <ProductsPanel />}
      {section === 'pin' && <PinPanel />}
    </View>
  );
}

/* ---------------- Photos section ---------------- */

function PhotosPanel() {
  const { menu } = usePos();
  const { photoFor, setPhoto, removePhoto } = usePhotos();
  const [busyId, setBusyId] = useState<string | null>(null);

  const pickPhoto = async (id: string, fromCamera: boolean) => {
    try {
      setBusyId(id);
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission needed', 'Camera access is required to take a dish photo.');
          return;
        }
        const res = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        if (!res.canceled) await setPhoto(id, res.assets[0].uri);
      } else {
        if (Platform.OS !== 'web') {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('Permission needed', 'Photo library access is required to choose a dish photo.');
            return;
          }
        }
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        if (!res.canceled) await setPhoto(id, res.assets[0].uri);
      }
    } catch {
      Alert.alert('Photo not saved', 'Something went wrong while saving the photo. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionSub}>Photos are saved on this device and shown across POS, orders and menu.</Text>
      <FlatList
        data={menu}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: m }) => {
          const uri = photoFor(m.id);
          const busy = busyId === m.id;
          return (
            <View style={styles.row}>
              <View style={[styles.thumb, { backgroundColor: m.tint }]}>
                <DishImage uri={uri} asset={m.photo} emoji={m.emoji} size={28} fill />
              </View>
              <View style={styles.mid}>
                <Text style={styles.name}>{m.name}</Text>
                <Text style={styles.meta}>
                  {m.category} • {peso(m.price)} • {uri ? '📷 Owner photo' : m.photo ? '🖼️ Prototype photo' : 'Emoji art'}
                </Text>
              </View>
              <View style={styles.btns}>
                <Pressable
                  disabled={busy}
                  onPress={() => pickPhoto(m.id, false)}
                  style={[styles.btn, styles.btnPhoto]}>
                  <Text style={styles.btnPhotoText}>{busy ? '…' : '🖼️ Gallery'}</Text>
                </Pressable>
                <Pressable
                  disabled={busy}
                  onPress={() => pickPhoto(m.id, true)}
                  style={[styles.btn, styles.btnPhoto]}>
                  <Text style={styles.btnPhotoText}>{busy ? '…' : '📷 Camera'}</Text>
                </Pressable>
                {uri && (
                  <Pressable
                    disabled={busy}
                    onPress={() => removePhoto(m.id)}
                    style={[styles.btn, styles.btnRemove]}>
                    <Text style={styles.btnRemoveText}>Remove</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

/* ---------------- Products section ---------------- */

const EMOJI_PRESETS = ['🍽️', '🍗', '🍲', '🥘', '🍜', '🍚', '🍨', '🥤', '🍳', '🥟', '🍌', '🥓', '🍖'];
const PRODUCT_CATS = CATEGORIES.filter((c) => c !== 'All Menu');

function ProductsPanel() {
  const { menu, updatePrice, addItem, removeItem } = usePos();
  const { removePhoto } = usePhotos();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState('');
  const [priceErr, setPriceErr] = useState('');

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cat, setCat] = useState<Category>('Ulam');
  const [emoji, setEmoji] = useState('🍽️');
  const [formMsg, setFormMsg] = useState('');
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null);

  const savePrice = (id: string) => {
    const v = parseFloat(priceDraft);
    if (!Number.isFinite(v) || v <= 0) {
      setPriceErr('Enter a price greater than zero.');
      return;
    }
    updatePrice(id, v);
    setEditingId(null);
    setPriceErr('');
  };

  const submitNew = () => {
    const trimmed = name.trim();
    const v = parseFloat(price);
    if (trimmed.length === 0) {
      setFormMsg('⚠️ Give the new product a name.');
      return;
    }
    if (!Number.isFinite(v) || v <= 0) {
      setFormMsg('⚠️ Enter a price greater than zero.');
      return;
    }
    const product: NewProduct = { name: trimmed, price: Math.round(v * 100) / 100, category: cat, emoji };
    addItem(product);
    setName('');
    setPrice('');
    setFormMsg(`✓ "${trimmed}" added — set its photo under the Photos tab.`);
  };

  return (
    <View style={styles.sectionWrap}>
      {/* Add form */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>＋ Add new product</Text>
        <View style={styles.formRow}>
          <View style={[styles.field, { flex: 2 }]}>
            <Text style={styles.pinLabel}>Name</Text>
            <TextInput
              value={name}
              onChangeText={(v) => {
                setName(v);
                setFormMsg('');
              }}
              placeholder="e.g. Chicken Curry"
              placeholderTextColor={theme.muted}
              style={styles.pinInput}
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.pinLabel}>Price (₱)</Text>
            <TextInput
              value={price}
              onChangeText={(v) => {
                setPrice(v.replace(/[^0-9.]/g, ''));
                setFormMsg('');
              }}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={theme.muted}
              style={styles.pinInput}
            />
          </View>
        </View>
        <Text style={[styles.pinLabel, { marginTop: 8 }]}>Category</Text>
        <View style={styles.catPills}>
          {PRODUCT_CATS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCat(c as Category)}
              style={[styles.pill, cat === c && styles.pillActive]}>
              <Text style={[styles.pillText, cat === c && styles.pillTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.pinLabel, { marginTop: 8 }]}>Icon</Text>
        <View style={styles.emojiRow}>
          {EMOJI_PRESETS.map((e) => (
            <Pressable
              key={e}
              onPress={() => setEmoji(e)}
              style={[styles.emojiPick, emoji === e && styles.emojiPickActive]}>
              <Text style={{ fontSize: 20 }}>{e}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={submitNew} style={[styles.btn, styles.btnPhoto, styles.addGo]}>
          <Text style={styles.btnPhotoText}>Add to menu</Text>
        </Pressable>
        {formMsg !== '' && <Text style={styles.formMsg}>{formMsg}</Text>}
      </View>

      {/* List */}
      <FlatList
        data={menu}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: m }) => (
          <View style={styles.row}>
            <View style={[styles.thumb, { backgroundColor: m.tint }]}>
              <DishImage uri={undefined} asset={m.photo} emoji={m.emoji} size={28} fill />
            </View>
            <View style={styles.mid}>
              <Text style={styles.name}>{m.name}</Text>
              <Text style={styles.meta}>{m.category}{m.available ? '' : ' • Sold out'}</Text>
              {editingId === m.id ? (
                <View>
                  <View style={styles.editRow}>
                    <TextInput
                      value={priceDraft}
                      onChangeText={(v) => setPriceDraft(v.replace(/[^0-9.]/g, ''))}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={theme.muted}
                      style={[styles.pinInput, styles.priceInput]}
                    />
                    <Pressable onPress={() => savePrice(m.id)} style={[styles.btn, styles.btnPhoto]}>
                      <Text style={styles.btnPhotoText}>Save</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setEditingId(null);
                        setPriceErr('');
                      }}
                      style={[styles.btn, styles.btnGhost]}>
                      <Text style={styles.btnGhostText}>Cancel</Text>
                    </Pressable>
                  </View>
                  {priceErr !== '' && <Text style={styles.inlineErr}>{priceErr}</Text>}
                </View>
              ) : (
                <Text style={styles.priceLine}>{peso(m.price)}</Text>
              )}
            </View>
            {editingId !== m.id && (
              <View style={styles.btns}>
                <Pressable
                  onPress={() => {
                    setPriceDraft(String(m.price));
                    setEditingId(m.id);
                    setPriceErr('');
                  }}
                  style={[styles.btn, styles.btnPhoto]}>
                  <Text style={styles.btnPhotoText}>✏️ Price</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPendingRemove({ id: m.id, name: m.name })}
                  style={[styles.btn, styles.btnRemove]}>
                  <Text style={styles.btnRemoveText}>Remove</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      />

      <Modal
        transparent
        animationType="fade"
        visible={pendingRemove !== null}
        onRequestClose={() => setPendingRemove(null)}>
        <View style={styles.modalDim}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Remove product?</Text>
            <Text style={styles.modalSub}>
              “{pendingRemove?.name}” will no longer appear on the POS. Past orders keep their records.
            </Text>
            <View style={styles.modalBtns}>
              <Pressable
                onPress={() => setPendingRemove(null)}
                style={[styles.btn, styles.btnGhost, styles.modalBtn]}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (pendingRemove) {
                    removeItem(pendingRemove.id);
                    removePhoto(pendingRemove.id);
                    setFormMsg('');
                  }
                  setPendingRemove(null);
                }}
                style={[styles.btn, styles.btnRemove, styles.modalBtn]}>
                <Text style={styles.btnRemoveText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------------- PIN section ---------------- */

function PinPanel() {
  const { changePin } = useAdmin();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [pinMsg, setPinMsg] = useState('');

  const doChangePin = async () => {
    const ok = await changePin(current, next);
    setPinMsg(ok ? 'PIN updated.' : 'Failed — check current PIN (new PIN must be 4–8 digits).');
    if (ok) {
      setCurrent('');
      setNext('');
    }
  };

  return (
    <View style={styles.pinBox}>
      <Text style={styles.pinTitle}>Change admin PIN</Text>
      <Text style={styles.sub}>Anyone with the PIN can edit photos, prices and products — keep it secret.</Text>
      <View style={styles.pinInputs}>
        <PinInput label="Current" value={current} onChange={setCurrent} />
        <PinInput label="New (4–8 digits)" value={next} onChange={setNext} />
        <Pressable onPress={doChangePin} style={[styles.btn, styles.btnPhoto, styles.pinGo]}>
          <Text style={styles.btnPhotoText}>Save</Text>
        </Pressable>
      </View>
      {pinMsg !== '' && <Text style={styles.pinMsg}>{pinMsg}</Text>}
    </View>
  );
}

function PinInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.pinLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(v: string) => onChange(v.replace(/[^0-9]/g, '').slice(0, 8))}
        keyboardType="numeric"
        secureTextEntry
        placeholder="••••"
        placeholderTextColor={theme.muted}
        style={styles.pinInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  root: { flex: 1, flexDirection: 'row' },
  main: { flex: 1, padding: 14 },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  centerShort: { padding: 10 },
  lockEmojiShort: { fontSize: 32 },
  titleShort: { fontSize: 17, marginTop: 4 },
  lockEmoji: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: '800', color: theme.text, marginTop: 8 },
  sub: { fontSize: 12, color: theme.muted, marginTop: 4, textAlign: 'center' },
  pinRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  pinDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line,
  },
  pinDotOn: { backgroundColor: theme.accent, borderColor: theme.accent },
  error: { color: theme.red, fontSize: 12, fontWeight: '700', marginTop: 8 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', maxWidth: 260, marginTop: 12, justifyContent: 'center' },
  padShort: { maxWidth: 230, marginTop: 8 },
  key: {
    width: 76, height: 56, margin: 4, borderRadius: 12,
    backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line,
    alignItems: 'center', justifyContent: 'center',
  },
  keyText: { fontSize: 20, fontWeight: '700', color: theme.text },
  keyShort: { width: 62, height: 44, margin: 3 },
  keyTextShort: { fontSize: 17 },
  cta: {
    marginTop: 14, backgroundColor: theme.accent,
    borderRadius: 12, paddingHorizontal: 32, paddingVertical: 13,
  },
  ctaShort: { marginTop: 10, paddingVertical: 10 },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  hint: { marginTop: 10, fontSize: 11, color: theme.muted },
  panel: { flex: 1 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 },
  seg: { flexDirection: 'row', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line, borderRadius: 12, padding: 3, gap: 2 },
  segBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9 },
  segBtnActive: { backgroundColor: theme.text },
  segText: { fontSize: 12, fontWeight: '700', color: theme.muted },
  segTextActive: { color: '#fff' },
  lockBtn: {
    backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9,
  },
  lockBtnText: { fontSize: 12, fontWeight: '700', color: theme.text },
  warn: {
    backgroundColor: theme.amberSoft, borderRadius: 10,
    padding: 10, marginBottom: 10,
  },
  warnText: { fontSize: 12, color: theme.amber, fontWeight: '700' },
  sectionWrap: { flex: 1 },
  sectionSub: { fontSize: 11, color: theme.muted, marginBottom: 8 },
  list: { gap: 8, paddingBottom: 12 },
  row: {
    backgroundColor: theme.card, borderRadius: 12,
    borderWidth: 1, borderColor: theme.line, padding: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  thumb: { width: 56, height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  mid: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: theme.text },
  meta: { fontSize: 11, color: theme.muted, marginTop: 2 },
  priceLine: { fontSize: 14, fontWeight: '800', color: theme.text, marginTop: 2 },
  inlineErr: { fontSize: 11, color: theme.red, fontWeight: '700', marginTop: 4 },
  formMsg: { fontSize: 12, color: theme.muted, fontWeight: '600', marginTop: 8 },
  editRow: { flexDirection: 'row', gap: 6, marginTop: 6, alignItems: 'center' },
  priceInput: { width: 100 },
  btns: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' },
  btn: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  btnPhoto: { backgroundColor: theme.accentSoft },
  btnPhotoText: { fontSize: 11, fontWeight: '700', color: theme.accentDark },
  btnRemove: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.red },
  btnRemoveText: { fontSize: 11, fontWeight: '700', color: theme.red },
  btnGhost: { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.line },
  btnGhostText: { fontSize: 11, fontWeight: '700', color: theme.muted },
  form: {
    backgroundColor: theme.card, borderRadius: 12,
    borderWidth: 1, borderColor: theme.line, padding: 12, marginBottom: 10,
  },
  formTitle: { fontSize: 14, fontWeight: '800', color: theme.text },
  formRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  field: { flex: 1 },
  catPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.line,
  },
  pillActive: { backgroundColor: theme.accent, borderColor: theme.accent },
  pillText: { fontSize: 12, fontWeight: '700', color: theme.muted },
  pillTextActive: { color: '#fff' },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  emojiPick: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.line,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiPickActive: { borderColor: theme.accent, backgroundColor: theme.accentSoft },
  addGo: { marginTop: 10, alignItems: 'center', paddingVertical: 11 },
  pinBox: {
    backgroundColor: theme.card, borderRadius: 12,
    borderWidth: 1, borderColor: theme.line, padding: 12, marginTop: 4,
  },
  pinTitle: { fontSize: 13, fontWeight: '800', color: theme.text },
  pinInputs: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'flex-end' },
  pinLabel: { fontSize: 11, color: theme.muted, marginBottom: 4 },
  pinInput: {
    backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.line,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 14, color: theme.text,
  },
  pinGo: { paddingHorizontal: 18, paddingVertical: 10 },
  pinMsg: { fontSize: 11, color: theme.muted, marginTop: 6 },
  modalDim: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', maxWidth: 380,
    backgroundColor: theme.card, borderRadius: 14, padding: 18,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: theme.text },
  modalSub: { fontSize: 12, color: theme.muted, marginTop: 6, lineHeight: 18 },
  modalBtns: { flexDirection: 'row', gap: 8, marginTop: 14, justifyContent: 'flex-end' },
  modalBtn: { paddingHorizontal: 18, paddingVertical: 10 },
});
