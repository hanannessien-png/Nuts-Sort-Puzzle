import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/game/GameProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { LifeRefillModal } from '@/components/LifeRefillModal';

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
      
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Levels</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {levels.map((levelId) => {
            const isUnlocked = levelId <= unlocked;
            const record = state.records[levelId];
            const isLatest = levelId === unlocked;

            return (
              <Pressable 
                key={levelId}
                onPress={() => isUnlocked && handlePlayLevel(levelId)}
                style={[
                  styles.levelCard,
                  { 
                    backgroundColor: isUnlocked ? theme.surface : theme.border,
                    borderColor: isLatest ? theme.primary : theme.border,
                    borderWidth: isLatest ? 2 : 1,
                  }
                ]}
              >
                <Text style={[
                  styles.levelNumber, 
                  { color: isUnlocked ? theme.text : theme.textMuted }
                ]}>
                  {levelId}
                </Text>

                {record && record.stars > 0 && (
                  <View style={styles.stars}>
                    {[1, 2, 3].map(s => (
                      <Ionicons 
                        key={s} 
                        name="star" 
                        size={12} 
                        color={s <= record.stars ? theme.warning : theme.border} 
                      />
                    ))}
                  </View>
                )}
                
                {isLatest && !record && (
                  <View style={styles.stars}>
                    <Text style={{ color: theme.primary, fontSize: 10, fontWeight: '700' }}>NEW</Text>
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
    paddingBottom: 16,
  },
  backBtn: { padding: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  content: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  levelCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 8,
  }
});
