import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '@/game/GameProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { THEMES } from '@/constants/theme';
import { ShopCategory, ShopItem, PowerPack, PowerUp } from '@/game/types';
import { itemPrice } from '@/game/catalogue';
import { CoinIcon } from '@/components/Icons';
import { AdBanner } from '@/components/AdBanner';
import { Backdrop } from '@/components/premium/Backdrop';
import { ScreenHeader, CoinPill, Panel, GlossButton, GOLD, shade, IconName } from '@/components/premium/UI';

type Tab = ShopCategory | 'power';
const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'power', label: 'Power-ups', icon: 'flash' },
  { id: 'themes', label: 'Themes', icon: 'color-palette' },
  { id: 'nuts', label: 'Nuts', icon: 'hardware-chip' },
  { id: 'bolts', label: 'Bolts', icon: 'construct' },
  { id: 'bases', label: 'Bases', icon: 'albums' },
  { id: 'bundles', label: 'Bundles', icon: 'gift' },
];

export const POWER_META: Record<PowerUp, { icon: IconName; color: string; label: string }> = {
  hint: { icon: 'bulb', color: '#F2A93B', label: 'Hint' },
  undo: { icon: 'arrow-undo', color: '#3E8EF0', label: 'Undo' },
  extraBolt: { icon: 'add-circle', color: '#2FA36B', label: 'Extra Bolt' },
};
const RARITY: Record<ShopItem['rarity'], string> = { Classic: '#7C8799', Rare: '#3E8EF0', Epic: '#A453E0' };

export default function ShopScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const theme = useThemeColors();
  const { state, catalog, buyItem, equipItem, clearNotice } = game;
  const [tab, setTab] = useState<Tab>('power');
  const [sheetItem, setSheetItem] = useState<ShopItem | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const toast = message ?? game.error ?? game.notice;
  const isError = !!message || !!game.error;
  const dismiss = () => { setMessage(null); clearNotice(); };

  const handleAction = (item: ShopItem) => {
    if (state.owned.includes(item.id) || itemPrice(item, state.owned) === 0) {
      if (item.category !== 'bundles') equipItem(item.id);
    } else setSheetItem(item);
  };

  const executePurchase = async (payment: 'coins' | 'ad') => {
    if (!sheetItem) return;
    const item = sheetItem;
    setSheetItem(null);
    setMessage(null);
    const res = await buyItem(item.id, payment);
    if (!res.ok) setMessage(res.message ?? 'Purchase failed. Please try again.');
  };

  const buyPack = async (pack: PowerPack, payment: 'coins' | 'ad') => {
    setMessage(null);
    const res = await game.buyPowerPack(pack.id, payment);
    if (!res.ok) setMessage(res.message ?? 'Purchase failed. Please try again.');
  };

  const items = tab === 'power' ? [] : catalog.filter(i => i.category === tab);
  const sheetPrice = sheetItem ? (sheetItem.category === 'bundles' ? itemPrice(sheetItem, state.owned) : sheetItem.price) : 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Backdrop image="w4" strength={0.8} />
      <ScreenHeader title="SHOP" top={insets.top + (Platform.OS === 'web' ? 24 : 8)} onBack={() => router.back()} right={<CoinPill coins={state.coins} />} />

      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map(t => {
            const on = tab === t.id;
            return (
              <Pressable key={t.id} onPress={() => setTab(t.id)} style={[styles.tab, on && styles.tabOn]} testID={`tab-${t.id}`}>
                {on && <LinearGradient colors={[shade(GOLD, 0.3), GOLD, shade(GOLD, -0.2)]} style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />}
                <Ionicons name={t.icon} size={15} color={on ? '#3D2400' : 'rgba(255,255,255,0.8)'} />
                <Text style={[styles.tabText, { color: on ? '#3D2400' : 'rgba(255,255,255,0.85)' }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'power' ? (
          <>
            <View style={styles.banner}>
              <Image source={require('@/assets/images/shop-banner.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient colors={['rgba(8,10,18,0)', 'rgba(8,10,18,0.85)']} style={StyleSheet.absoluteFill} />
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>Power-ups</Text>
                <Text style={styles.bannerSub}>Stock up now, use them in any level with one tap.</Text>
              </View>
            </View>
            <View style={styles.stockRow}>
              {(Object.keys(POWER_META) as PowerUp[]).map(k => (
                <View key={k} style={styles.stockChip}>
                  <Ionicons name={POWER_META[k].icon} size={16} color={POWER_META[k].color} />
                  <Text style={styles.stockText}>{state.powerups[k] ?? 0}</Text>
                  <Text style={styles.stockLabel}>{POWER_META[k].label}</Text>
                </View>
              ))}
            </View>
            {!game.adsAvailable && <Text style={styles.adStatus}>{game.adStatus}</Text>}
            <View style={styles.packGrid}>
              {game.powerPacks.map(pack => {
                const meta = POWER_META[pack.kind];
                const canAd = pack.count === 1 && game.adsAvailable;
                return (
                  <View key={pack.id} style={styles.packCell}>
                    <Panel padding={12} style={{ flex: 1 }}>
                      <View style={styles.packTop}>
                        <LinearGradient colors={[shade(meta.color, 0.3), meta.color, shade(meta.color, -0.3)]} style={styles.packIcon}>
                          <Ionicons name={meta.icon} size={28} color="#FFF" />
                          <View style={styles.packCount}><Text style={styles.packCountText}>x{pack.count}</Text></View>
                        </LinearGradient>
                        <Text style={[styles.owned, { color: theme.textMuted }]}>Owned {state.powerups[pack.kind] ?? 0}</Text>
                      </View>
                      <Text style={[styles.packName, { color: theme.text }]}>{pack.name}</Text>
                      <Text style={[styles.packDesc, { color: theme.textMuted }]} numberOfLines={2}>{pack.description}</Text>
                      <GlossButton title={String(pack.price)} size="sm" color="#2FA36B" disabled={game.busy}
                        right={<CoinIcon size={16} />} onPress={() => void buyPack(pack, 'coins')} testID={`buy-${pack.id}`}
                        style={{ marginTop: 8 }} />
                      {canAd && (
                        <GlossButton title={game.adBusy ? 'LOADING' : 'FREE'} icon="play" size="sm" color="#3E8EF0" disabled={game.adBusy}
                          onPress={() => void buyPack(pack, 'ad')} style={{ marginTop: 6 }} testID={`ad-${pack.id}`} />
                      )}
                    </Panel>
                  </View>
                );
              })}
            </View>
          </>
        ) : items.length === 0 ? (
          <Panel><Text style={[styles.empty, { color: theme.textMuted }]}>Nothing here yet. New pieces arrive soon.</Text></Panel>
        ) : (
          items.map(item => {
            const owned = state.owned.includes(item.id);
            const equipped = item.category !== 'bundles' && state.equipped[item.category as keyof typeof state.equipped] === item.id;
            const price = item.category === 'bundles' ? itemPrice(item, state.owned) : item.price;
            const preview = THEMES[item.appearance] ?? THEMES.default;
            return (
              <Panel key={item.id} padding={14} style={{ marginBottom: 12 }} glow={equipped ? GOLD : undefined}>
                <View style={styles.itemRow}>
                  <LinearGradient colors={[preview.primary, preview.background]} style={styles.swatch}>
                    <View style={[styles.swatchDot, { backgroundColor: preview.surface }]} />
                    <View style={[styles.swatchBar, { backgroundColor: preview.warning }]} />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                      <View style={[styles.rarity, { backgroundColor: RARITY[item.rarity] }]}><Text style={styles.rarityText}>{item.rarity.toUpperCase()}</Text></View>
                    </View>
                    <Text style={[styles.itemDesc, { color: theme.textMuted }]}>{item.description}</Text>
                  </View>
                </View>
                <View style={{ marginTop: 10 }}>
                  {equipped ? (
                    <View style={[styles.equipped, { borderColor: GOLD }]}>
                      <Ionicons name="checkmark-circle" size={18} color={GOLD} />
                      <Text style={[styles.equippedText, { color: theme.text }]}>EQUIPPED</Text>
                    </View>
                  ) : owned || price === 0 ? (
                    item.category === 'bundles'
                      ? <View style={[styles.equipped, { borderColor: theme.border }]}><Text style={[styles.equippedText, { color: theme.textMuted }]}>OWNED</Text></View>
                      : <GlossButton title="EQUIP" size="sm" color={theme.primary} onPress={() => handleAction(item)} />
                  ) : (
                    <GlossButton title={String(price)} size="sm" color="#2FA36B" onPress={() => handleAction(item)} right={<CoinIcon size={18} />} />
                  )}
                </View>
              </Panel>
            );
          })
        )}
      </ScrollView>

      {toast && (
        <Pressable onPress={dismiss} style={[styles.toast, { backgroundColor: isError ? '#C8343F' : '#2F8F55' }]}>
          <Ionicons name={isError ? 'alert-circle' : 'checkmark-circle'} size={20} color="#FFF" />
          <Text style={styles.toastText}>{toast}</Text>
          <Ionicons name="close" size={20} color="#FFF" />
        </Pressable>
      )}

      <AdBanner />

      <Modal visible={!!sheetItem} transparent animationType="fade" onRequestClose={() => setSheetItem(null)}>
        <View style={styles.overlay}>
          <Panel padding={22} style={styles.sheet}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>{sheetItem?.name}</Text>
            <Text style={[styles.sheetDesc, { color: theme.textMuted }]}>{sheetItem?.description}</Text>
            <GlossButton title={`BUY FOR ${sheetPrice}`} size="md" color="#2FA36B" right={<CoinIcon size={20} />}
              onPress={() => void executePurchase('coins')} style={{ marginTop: 20 }} />
            {game.adsAvailable && sheetItem?.category !== 'bundles' && (
              <GlossButton title={game.adBusy ? 'LOADING' : 'WATCH AD'} icon="play" size="md" color="#3E8EF0" disabled={game.adBusy}
                onPress={() => void executePurchase('ad')} style={{ marginTop: 10 }} />
            )}
            <Pressable onPress={() => setSheetItem(null)} style={styles.cancel}>
              <Text style={[styles.cancelText, { color: theme.textMuted }]}>Not now</Text>
            </Pressable>
          </Panel>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#11141E' },
  tabsWrap: { paddingBottom: 10 },
  tabs: { paddingHorizontal: 16, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36, borderRadius: 18, backgroundColor: 'rgba(14,17,28,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  tabOn: { borderColor: '#FFE3A0' },
  tabText: { fontWeight: '900', fontSize: 13 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  banner: { height: 140, borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(242,181,58,0.6)', justifyContent: 'flex-end' },
  bannerText: { padding: 16 },
  bannerTitle: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', marginTop: 2 },
  stockRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  stockChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(14,17,28,0.75)', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  stockText: { color: '#FFF', fontWeight: '900', fontSize: 15 },
  stockLabel: { color: 'rgba(255,255,255,0.65)', fontWeight: '700', fontSize: 10, flexShrink: 1 },
  adStatus: { color: 'rgba(255,255,255,0.7)', fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 16 },
  packGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginTop: 8 },
  packCell: { width: '50%', padding: 6 },
  packTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  packIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  packCount: { position: 'absolute', bottom: -6, right: -8, backgroundColor: '#1A1F2C', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1.5, borderColor: '#FFF' },
  packCountText: { color: '#FFF', fontWeight: '900', fontSize: 11 },
  owned: { fontSize: 11, fontWeight: '800' },
  packName: { fontSize: 16, fontWeight: '900', marginTop: 10 },
  packDesc: { fontSize: 11, lineHeight: 15, marginTop: 2, minHeight: 30 },
  empty: { textAlign: 'center', fontWeight: '700' },
  itemRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  swatch: { width: 58, height: 58, borderRadius: 16, padding: 8, justifyContent: 'space-between', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  swatchDot: { width: 18, height: 18, borderRadius: 9 },
  swatchBar: { height: 5, borderRadius: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { fontSize: 17, fontWeight: '900', flexShrink: 1 },
  rarity: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  rarityText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  itemDesc: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  equipped: { height: 40, borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  equippedText: { fontWeight: '900', letterSpacing: 1.2, fontSize: 13 },
  toast: { position: 'absolute', left: 16, right: 16, bottom: 90, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  toastText: { color: '#FFF', flex: 1, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(6,8,14,0.78)', justifyContent: 'center', padding: 20 },
  sheet: { width: '100%', maxWidth: 380, alignSelf: 'center' },
  sheetTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  sheetDesc: { fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  cancel: { padding: 14, alignItems: 'center', marginTop: 4 },
  cancelText: { fontWeight: '800', fontSize: 15 },
});
