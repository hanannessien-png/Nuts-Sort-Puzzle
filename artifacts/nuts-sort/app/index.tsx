import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/game/GameProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { AdBanner } from '@/components/AdBanner';
import { LifeRefillModal } from '@/components/LifeRefillModal';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { CoinIcon } from '@/components/Icons';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const theme = useThemeColors();

  const { state, startLevel } = game;
  const [showDaily, setShowDaily] = React.useState(false);
  const [showLifeRefill, setShowLifeRefill] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      // Intentionally clear active playing state when home is focused
      if (game.setPlaying) {
        game.setPlaying(false);
      }
    }, [game.setPlaying])
  );

  const handlePlay = async () => {
    if (state.active) {
      router.push('/play');
      return;
    }
    if (state.lives <= 0) {
      setShowLifeRefill(true);
      return;
    }
    const res = await startLevel(state.unlockedLevel);
    if (res.ok) {
      router.push('/play');
    } else if (res.message?.toLowerCase().includes('lives')) {
      setShowLifeRefill(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient 
        colors={[`${theme.surface}00`, `${theme.surface}80`, theme.background]} 
        style={StyleSheet.absoluteFill} 
        pointerEvents="none"
      />
      
      {/* Top HUD */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.push('/settings')} style={styles.iconBtn}>
          <Ionicons name="settings-sharp" size={26} color={theme.text} />
        </Pressable>

        <View style={styles.currencies}>
          <Pressable onPress={() => setShowLifeRefill(true)} style={[styles.currencyBadge, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
            <Ionicons name="heart" size={18} color={theme.danger} />
            <Text style={[styles.currencyText, { color: theme.text }]}>{state.lives}</Text>
          </Pressable>
          <View style={[styles.currencyBadge, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
            <CoinIcon size={18} />
            <Text style={[styles.currencyText, { color: theme.text }]}>{state.coins}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Premium Box Art Hero */}
        <View style={styles.heroWrapper}>
          <View style={styles.heroBox}>
            <Image 
              source={require('@/assets/images/premium-hero.png')} 
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            {/* Elegant overlay for text readability */}
            <LinearGradient 
              colors={['transparent', 'rgba(15,10,5,0.7)']} 
              style={styles.heroGradient} 
            />
            <View style={styles.heroContent}>
              <Text style={styles.title}>NUTS SORT</Text>
              <Text style={styles.subtitle}>
                {state.active ? 'RESUME PUZZLE' : `LEVEL ${state.unlockedLevel}`}
              </Text>
            </View>
          </View>

          {/* Floating Play Button overlapping the hero */}
          <View style={styles.playBtnContainer}>
            <Pressable 
              style={({ pressed }) => [
                styles.playBtn, 
                { backgroundColor: theme.primary },
                pressed && { transform: [{ scale: 0.95 }], opacity: 0.95 }
              ]} 
              onPress={handlePlay}
            >
              <Text style={styles.playBtnText}>{state.active ? 'CONTINUE' : 'PLAY NOW'}</Text>
              <Ionicons name="play" size={24} color="#FFF" style={{ marginLeft: 8 }} />
            </Pressable>
          </View>
        </View>

        {/* Elegant Menu Layout */}
        <View style={styles.menuContainer}>
          <Pressable 
            style={[styles.menuRow, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]} 
            onPress={() => router.push('/levels')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: `${theme.primary}20` }]}>
              <Ionicons name="map" size={24} color={theme.primary} />
            </View>
            <View style={styles.menuRowText}>
              <Text style={[styles.menuRowTitle, { color: theme.text }]}>Journey</Text>
              <Text style={[styles.menuRowSub, { color: theme.textMuted }]}>Level {state.unlockedLevel} reached</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.border} />
          </Pressable>

          <Pressable 
            style={[styles.menuRow, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]} 
            onPress={() => router.push('/shop')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: `${theme.text}10` }]}>
              <Ionicons name="color-palette" size={24} color={theme.text} />
            </View>
            <View style={styles.menuRowText}>
              <Text style={[styles.menuRowTitle, { color: theme.text }]}>Collection</Text>
              <Text style={[styles.menuRowSub, { color: theme.textMuted }]}>{state.owned.length} items unlocked</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.border} />
          </Pressable>

          <Pressable 
            style={[styles.menuRow, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]} 
            onPress={() => setShowDaily(true)}
          >
            <View style={[styles.menuIconBox, { backgroundColor: `${theme.warning}20` }]}>
              <Ionicons name="flame" size={24} color={theme.warning} />
            </View>
            <View style={styles.menuRowText}>
              <Text style={[styles.menuRowTitle, { color: theme.text }]}>Daily Rewards</Text>
              <Text style={[styles.menuRowSub, { color: theme.textMuted }]}>{state.daily.streak} {state.daily.streak === 1 ? 'day' : 'days'} streak active</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.border} />
          </Pressable>
        </View>
        
      </ScrollView>

      {/* Footer Ad */}
      <View style={{ paddingBottom: Math.max(insets.bottom, 0) }}>
        <AdBanner />
      </View>

      {/* Daily Modal */}
      <Modal visible={showDaily} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <Pressable onPress={() => setShowDaily(false)} style={{ alignSelf: 'flex-end', padding: 8 }}>
              <Ionicons name="close" size={28} color={theme.textMuted} />
            </Pressable>
            
            <Ionicons name="calendar" size={64} color={theme.warning} style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Daily Check-In</Text>
            
            <View style={[styles.streakBox, { backgroundColor: theme.warning + '20' }]}>
              <Ionicons name="flame" size={22} color={theme.warning} />
              <Text style={{ color: theme.warning, fontWeight: '800', fontSize: 20 }}>
                {state.daily.streak} Day Streak!
              </Text>
            </View>
            
            <Text style={{ textAlign: 'center', color: theme.textMuted, marginBottom: 32, paddingHorizontal: 16, fontSize: 16, lineHeight: 24 }}>
              Return daily to earn coins for power-ups and premium themes.
              {'\n\n'}Day 7: <Text style={{fontWeight: '800', color: theme.text}}>50 coins</Text>
              {'\n'}Day 30: <Text style={{fontWeight: '800', color: theme.text}}>100 coins</Text>
            </Text>
            
            <Pressable 
              style={[styles.modalBtn, { backgroundColor: theme.primary }]}
              onPress={() => setShowDaily(false)}
            >
              <Text style={styles.modalBtnText}>COLLECT REWARD</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <LifeRefillModal visible={showLifeRefill} onClose={() => setShowLifeRefill(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  iconBtn: {
    padding: 8,
  },
  currencies: {
    flexDirection: 'row',
    gap: 12,
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroWrapper: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 50,
  },
  heroBox: {
    width: '100%',
    aspectRatio: 0.9,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 54, // Leave space for overlapping button
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#EFEFEF',
    marginTop: 8,
  },
  playBtnContainer: {
    position: 'absolute',
    bottom: -32,
    width: '100%',
    alignItems: 'center',
  },
  playBtn: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 48,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  menuContainer: {
    gap: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  menuIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuRowText: {
    flex: 1,
  },
  menuRowTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  menuRowSub: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 24,
    paddingBottom: 48,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  streakBox: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginBottom: 24,
  },
  modalBtn: {
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1.5,
  }
});
