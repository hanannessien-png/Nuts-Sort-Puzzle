import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/game/GameProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { ShopCategory, ShopItem } from '@/game/types';
import { itemPrice } from '@/game/catalogue';

const CATEGORIES: { id: ShopCategory; label: string; icon: any }[] = [
  { id: 'themes', label: 'Themes', icon: 'color-palette' },
  { id: 'nuts', label: 'Nuts', icon: 'medical' },
  { id: 'bolts', label: 'Bolts', icon: 'remove' },
  { id: 'bases', label: 'Bases', icon: 'albums' },
  { id: 'bundles', label: 'Bundles', icon: 'gift' },
];

export default function ShopScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const theme = useThemeColors();
  
  const { state, catalog, buyItem, equipItem, error, clearNotice } = game;
  const [activeTab, setActiveTab] = useState<ShopCategory>('themes');

  const [sheetItem, setSheetItem] = useState<ShopItem | null>(null);

  const filteredItems = catalog.filter(item => item.category === activeTab);

  const handleAction = (item: ShopItem) => {
    const isOwned = state.owned.includes(item.id);
    if (isOwned || itemPrice(item, state.owned) === 0) {
      if (item.category !== 'bundles') {
        equipItem(item.id);
      }
    } else {
      setSheetItem(item);
    }
  };

  const executePurchase = async (payment: 'coins' | 'ad') => {
    if (!sheetItem) return;
    const item = sheetItem;
    setSheetItem(null);
    await buyItem(item.id, payment);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Shop</Text>
        <View style={styles.coinBadge}>
          <Ionicons name="logo-bitcoin" size={16} color={theme.warning} />
          <Text style={[styles.coinText, { color: theme.text }]}>{state.coins}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {CATEGORIES.map(cat => {
            const isActive = activeTab === cat.id;
            return (
              <Pressable 
                key={cat.id} 
                onPress={() => setActiveTab(cat.id)}
                style={[
                  styles.tab, 
                  isActive ? { backgroundColor: theme.primary } : { backgroundColor: theme.surface }
                ]}
              >
                <Ionicons 
                  name={cat.icon} 
                  size={16} 
                  color={isActive ? '#FFF' : theme.textMuted} 
                />
                <Text style={[styles.tabText, { color: isActive ? '#FFF' : theme.textMuted }]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredItems.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>No items in this category.</Text>
        ) : (
          filteredItems.map(item => {
            const isOwned = state.owned.includes(item.id);
            const isEquipped = item.category !== 'bundles' && state.equipped[item.category as keyof typeof state.equipped] === item.id;
            
            const currentPrice = item.category === 'bundles' ? itemPrice(item, state.owned) : item.price;
            
            return (
              <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.itemDesc, { color: theme.textMuted }]}>{item.description}</Text>
                  {item.rarity !== 'Classic' && (
                    <View style={[styles.rarityBadge, { backgroundColor: item.rarity === 'Epic' ? theme.primaryMuted : theme.success + '33' }]}>
                      <Text style={[styles.rarityText, { color: item.rarity === 'Epic' ? theme.primary : theme.success }]}>{item.rarity}</Text>
                    </View>
                  )}
                </View>
                
                <Pressable 
                  style={[
                    styles.actionBtn, 
                    { backgroundColor: isEquipped ? theme.success : (isOwned ? theme.primaryMuted : theme.primary) }
                  ]}
                  onPress={() => handleAction(item)}
                >
                  {isEquipped ? (
                    <Text style={[styles.actionBtnText, { color: '#FFF' }]}>EQUIPPED</Text>
                  ) : isOwned || currentPrice === 0 ? (
                    <Text style={[styles.actionBtnText, { color: theme.primary }]}>
                      {item.category === 'bundles' ? 'OWNED' : 'EQUIP'}
                    </Text>
                  ) : (
                    <View style={styles.priceRow}>
                      <Ionicons name="logo-bitcoin" size={14} color="#FFF" />
                      <Text style={[styles.actionBtnText, { color: '#FFF' }]}>{currentPrice}</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={!!sheetItem} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheetCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              Buy {sheetItem?.name}
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 24 }}>
              <Pressable 
                style={[styles.sheetBtn, { backgroundColor: theme.primary, flex: 1 }]}
                onPress={() => executePurchase('coins')}
              >
                <Ionicons name="logo-bitcoin" size={20} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                  Pay {sheetItem ? (sheetItem.category === 'bundles' ? itemPrice(sheetItem, state.owned) : sheetItem.price) : 0}
                </Text>
              </Pressable>
              
              {game.adsAvailable && sheetItem?.category !== 'bundles' && (
                <Pressable 
                  style={[styles.sheetBtn, { backgroundColor: theme.success, flex: 1 }]}
                  onPress={() => executePurchase('ad')}
                  disabled={game.adBusy}
                >
                  <Ionicons name="play" size={20} color="#FFF" />
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                    {game.adBusy ? 'Loading...' : 'Watch Ad'}
                  </Text>
                </Pressable>
              )}
            </View>

            <Pressable 
              style={{ padding: 16, alignItems: 'center' }}
              onPress={() => setSheetItem(null)}
            >
              <Text style={{ color: theme.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {error && (
        <View style={[styles.toast, { backgroundColor: theme.danger }]}>
          <Text style={{ color: '#FFF' }}>{error}</Text>
          <Pressable onPress={clearNotice}>
            <Ionicons name="close" size={20} color="#FFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: { padding: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coinText: { fontWeight: '700', fontSize: 16 },
  tabsWrapper: {
    paddingVertical: 8,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabText: {
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 14,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
  },
  actionBtnText: {
    fontWeight: '800',
    fontSize: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  sheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  }
});
