import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/game/GameProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { LifeRefillModal } from '@/components/LifeRefillModal';
import { LinearGradient } from 'expo-linear-gradient';

export default function LevelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const theme = useThemeColors();
  
  const { state, startLevel } = game;
  const unlocked = state.unlockedLevel;

  const [showLifeRefill, setShowLifeRefill] = React.useState(false);

  // Generate array from 1 to unlocked
  const levels = Array.from({ length: unlocked }, (_, i) => i + 1);

  const handlePlayLevel = async (levelId: number) => {
    if (state.active?.levelId === levelId) {
      router.push('/play');
      return;
    }
    if (state.lives <= 0) {
      setShowLifeRefill(true);
      return;
    }
    const res = await startLevel(levelId);
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
        colors={[`${theme.surface}00`, `${theme.surface}60`, theme.background]} 
        style={StyleSheet.absoluteFill} 
        pointerEvents="none"
      />
      
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={32} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>JOURNEY</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {levels.map((levelId) => {
            const isUnlocked = levelId <= unlocked;
            const record = state.records[levelId];
            const isLatest = levelId === unlocked;

            return (
              <Pressable 
                key={levelId}
                onPress={() => isUnlocked && handlePlayLevel(levelId)}
                style={({ pressed }) => [
                  styles.levelCard,
                  { 
                    backgroundColor: isLatest ? theme.primary : theme.surface,
                    borderColor: isLatest ? theme.primary : theme.border,
                    borderWidth: 1,
                  },
                  pressed && { transform: [{ scale: 0.95 }] }
                ]}
              >
                <Text style={[
                  styles.levelNumber, 
                  { color: isLatest ? '#FFF' : theme.text }
                ]}>
                  {levelId}
                </Text>

                {record && record.stars > 0 && (
                  <View style={styles.stars} accessibilityLabel={`${record.stars} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Ionicons 
                        key={s} 
                        name="star" 
                        size={10}
                        color={s <= record.stars ? theme.warning : (isLatest ? 'rgba(255,255,255,0.3)' : theme.border)} 
                      />
                    ))}
                  </View>
                )}
                
                {isLatest && !record && (
                  <View style={styles.stars}>
                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 }}>NEW</Text>
                  </View>
                )}
                {!isLatest && !record && (
                   <View style={styles.stars}>
                     <Ionicons name="lock-open" size={14} color={theme.border} />
                   </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <LifeRefillModal visible={showLifeRefill} onClose={() => setShowLifeRefill(false)} />
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
    paddingBottom: 20,
    zIndex: 10,
  },
  backBtn: { padding: 8 },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  content: {
    padding: 24,
    paddingBottom: 80,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 24,
  },
  levelCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  levelNumber: {
    fontSize: 32,
    fontWeight: '900',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 8,
  }
});
