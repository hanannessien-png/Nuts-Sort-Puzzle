import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/game/GameProvider';
import { useThemeColors, useNutPalette } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { AdBanner } from '@/components/AdBanner';
import { Nut } from '@/components/Nut';
import Animated, { useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { LifeRefillModal } from '@/components/LifeRefillModal';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const theme = useThemeColors();
  const palette = useNutPalette();

  const { state, startLevel } = game;

  const [showDaily, setShowDaily] = React.useState(false);
  const [showLifeRefill, setShowLifeRefill] = React.useState(false);

  const handlePlay = async () => {
    // If active attempt, just go to play screen
    if (state.active) {
      router.push('/play');
      return;
    }
    if (state.lives <= 0) {
      setShowLifeRefill(true);
      return;
    }
    // Otherwise start unlocked level
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
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.push('/settings')} style={styles.iconBtn}>
          <Ionicons name="settings-outline" size={28} color={theme.text} />
        </Pressable>

        <View style={styles.currencies}>
          <Pressable onPress={() => setShowLifeRefill(true)} style={[styles.currencyBadge, { backgroundColor: theme.surface }]}>
            <Ionicons name="heart" size={20} color={theme.danger} />
            <Text style={[styles.currencyText, { color: theme.text }]}>{state.lives}</Text>
          </Pressable>
          <View style={[styles.currencyBadge, { backgroundColor: theme.surface }]}>
            <Ionicons name="logo-bitcoin" size={20} color={theme.warning} />
            <Text style={[styles.currencyText, { color: theme.text }]}>{state.coins}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Playful Illustration */}
        <View style={styles.hero}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', height: 160 }}>
            {/* Left stack */}
            <View style={{ marginRight: -10, zIndex: 1 }}>
              <Nut color={palette[0]} size={50} />
              <Nut color={palette[1]} size={50} />
            </View>
            {/* Center stack - slightly elevated via layout, maybe animated */}
            <BouncingNut color={palette[2]} />
            {/* Right stack */}
            <View style={{ marginLeft: -10, zIndex: 1 }}>
              <Nut color={palette[3]} size={50} />
            </View>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Nuts Sort</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Level {state.unlockedLevel}</Text>
        </View>

        {/* Play Button */}
        <Pressable 
          style={({ pressed }) => [
            styles.playBtn, 
            { backgroundColor: theme.primary },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
          ]} 
          onPress={handlePlay}
        >
          <Text style={styles.playBtnText}>{state.active ? 'CONTINUE' : 'PLAY'}</Text>
        </Pressable>

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          <MenuCard 
            icon="cart" 
            label="Shop" 
            color={theme.primary} 
            bgColor={theme.surface}
            textColor={theme.text}
            onPress={() => router.push('/shop')} 
          />
          <MenuCard 
            icon="list" 
            label="Levels" 
            color={theme.success} 
            bgColor={theme.surface}
            textColor={theme.text}
            onPress={() => router.push('/levels')} 
          />
          <MenuCard 
            icon="calendar" 
            label="Daily" 
            color={theme.warning} 
            bgColor={theme.surface}
            textColor={theme.text}
            onPress={() => setShowDaily(true)} 
          />
        </View>
      </ScrollView>

      {/* Footer Ad */}
      <View style={{ paddingBottom: Math.max(insets.bottom, 0) }}>
        <AdBanner />
      </View>

      <Modal visible={showDaily} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <Pressable onPress={() => setShowDaily(false)} style={{ alignSelf: 'flex-end', padding: 8 }}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </Pressable>
            
            <Ionicons name="calendar" size={48} color={theme.warning} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Daily Check-In</Text>
            
            <View style={[styles.streakBox, { backgroundColor: theme.warning + '20', flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
              <Ionicons name="flame" size={16} color={theme.warning} />
              <Text style={{ color: theme.warning, fontWeight: 'bold', fontSize: 16 }}>
                {state.daily.streak} Day Streak!
              </Text>
            </View>
            
            <Text style={{ textAlign: 'center', color: theme.textMuted, marginBottom: 24, paddingHorizontal: 16 }}>
              Come back every day for rewards. 
              {'\n'}Day 7 grants 50 coins.
              {'\n'}Day 30 grants 100 coins!
            </Text>
            
            <Pressable 
              style={[styles.playBtn, { backgroundColor: theme.primary, width: '100%', marginBottom: 0, paddingVertical: 16 }]}
              onPress={() => setShowDaily(false)}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Awesome</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <LifeRefillModal visible={showLifeRefill} onClose={() => setShowLifeRefill(false)} />
    </View>
  );
}

function BouncingNut({ color }: { color: string }) {
  const translateY = useAnimatedStyle(() => {
    return {
      transform: [{
        translateY: withRepeat(
          withSequence(
            withTiming(-20, { duration: 1000 }),
            withTiming(0, { duration: 1000 })
          ),
          -1,
          true
        )
      }]
    }
  });

  return (
    <Animated.View style={[{ zIndex: 2, marginBottom: 20 }, translateY]}>
      <Nut color={color} size={60} />
    </Animated.View>
  );
}

function MenuCard({ icon, label, color, bgColor, textColor, onPress }: any) {
  return (
    <Pressable style={[styles.menuCard, { backgroundColor: bgColor }]} onPress={onPress}>
      <View style={[styles.iconWrapper, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <Text style={[styles.menuCardText, { color: textColor }]}>{label}</Text>
    </Pressable>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  currencyText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    marginTop: 20,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  playBtn: {
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 40,
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  menuGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  menuCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  menuCardText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  streakBox: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 16,
  }
});
