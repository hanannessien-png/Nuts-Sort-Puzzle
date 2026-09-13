import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Platform } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/game/GameProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Column } from '@/components/Column';
import { GameOverlay } from '@/components/GameOverlay';
import { Ionicons } from '@expo/vector-icons';
import { AdBanner } from '@/components/AdBanner';

export default function PlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const theme = useThemeColors();
  
  const { state, tapColumn, usePowerUp, setPlaying, error, notice, clearNotice } = game;
  const active = state.active;

  const [isPaused, setIsPaused] = React.useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isPaused) {
        setPlaying(true);
      }
      return () => setPlaying(false);
    }, [isPaused, setPlaying])
  );

  if (!active) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ color: theme.text }}>No active game</Text>
        <Pressable onPress={() => router.replace('/')} style={[styles.btn, { backgroundColor: theme.primary }]}>
          <Text style={{ color: theme.surface }}>Go Home</Text>
        </Pressable>
      </View>
    );
  }

  const [powerUpSheet, setPowerUpSheet] = React.useState<'hint' | 'undo' | 'extraBolt' | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePowerUp = (kind: 'hint' | 'undo' | 'extraBolt') => {
    setIsPaused(true);
    setPowerUpSheet(kind);
  };

  const executePowerUp = async (payment: 'coins' | 'ad') => {
    if (!powerUpSheet) return;
    const kind = powerUpSheet;
    setPowerUpSheet(null);
    setIsPaused(false);
    await usePowerUp(kind, payment);
  };

  const handleRetry = () => {
    game.retryLoad();
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={28} color={theme.text} />
        </Pressable>
        
        <View style={styles.stats}>
          <View style={styles.statBox}>
            <Ionicons name="time-outline" size={20} color={theme.text} />
            <Text style={[styles.statText, { color: theme.text }]}>{formatTime(active.remaining)}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="swap-vertical" size={20} color={theme.text} />
            <Text style={[styles.statText, { color: theme.text }]}>{active.moves}</Text>
          </View>
        </View>

        <Pressable onPress={() => setIsPaused(true)} style={styles.iconBtn}>
          <Ionicons name="pause" size={28} color={theme.text} />
        </Pressable>
      </View>

      {/* Board */}
      <View style={styles.boardContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.boardScroll}
        >
          {active.board.map((nuts, index) => {
            const isSelected = active.selected === index;
            const isHintSource = active.hint?.from === index;
            const isHintTarget = active.hint?.to === index;

            return (
              <Column 
                key={`col-${index}`}
                index={index}
                nuts={nuts}
                capacity={active.capacity}
                isSelected={isSelected}
                isHintSource={isHintSource}
                isHintTarget={isHintTarget}
                onTap={tapColumn}
              />
            );
          })}
        </ScrollView>
      </View>

      {/* Error / Notice Toast */}
      {(error || notice) && (
        <View style={[styles.toast, { backgroundColor: error ? theme.danger : theme.surface }]}>
          <Text style={{ color: error ? '#FFF' : theme.text }}>{error || notice}</Text>
          <Pressable onPress={clearNotice}>
            <Ionicons name="close" size={20} color={error ? '#FFF' : theme.text} />
          </Pressable>
        </View>
      )}

      {/* Power-ups Bar */}
      <View style={[styles.powerups, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <PowerUpButton 
          icon="bulb" 
          label="Hint" 
          cost={50} 
          onPress={() => handlePowerUp('hint')}
          theme={theme}
        />
        <PowerUpButton 
          icon="arrow-undo" 
          label="Undo" 
          cost={50} 
          onPress={() => handlePowerUp('undo')}
          theme={theme}
        />
        <PowerUpButton 
          icon="add-circle" 
          label="Bolt" 
          cost={100} 
          onPress={() => handlePowerUp('extraBolt')}
          theme={theme}
        />
      </View>
      
      <GameOverlay />
      
      <Modal visible={!!powerUpSheet} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheetCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {powerUpSheet === 'hint' ? 'Get a Hint' : powerUpSheet === 'undo' ? 'Undo Move' : 'Extra Bolt'}
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 24 }}>
              <Pressable 
                style={[styles.sheetBtn, { backgroundColor: theme.primary, flex: 1 }]}
                onPress={() => executePowerUp('coins')}
              >
                <Ionicons name="logo-bitcoin" size={20} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                  Pay {powerUpSheet === 'extraBolt' ? 100 : 50}
                </Text>
              </Pressable>
              
              {game.adsAvailable && (
                <Pressable 
                  style={[styles.sheetBtn, { backgroundColor: theme.success, flex: 1 }]}
                  onPress={() => executePowerUp('ad')}
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
              onPress={() => {
                setPowerUpSheet(null);
                setIsPaused(false);
              }}
            >
              <Text style={{ color: theme.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Pause Modal */}
      <Modal visible={isPaused} transparent animationType="fade">
        <View style={styles.pauseOverlay}>
          <View style={[styles.pauseCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.pauseTitle, { color: theme.text }]}>Paused</Text>
            
            <Pressable 
              style={[styles.pauseBtn, { backgroundColor: theme.primary }]}
              onPress={() => setIsPaused(false)}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Resume</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.pauseBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
              onPress={() => {
                setIsPaused(false);
                game.resetLevel();
              }}
            >
              <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Restart Level</Text>
            </Pressable>

            <Pressable 
              style={[styles.pauseBtn, { backgroundColor: theme.surface, borderColor: theme.danger, borderWidth: 1, marginTop: 12 }]}
              onPress={() => {
                setIsPaused(false);
                router.replace('/');
              }}
            >
              <Text style={{ color: theme.danger, fontWeight: 'bold', fontSize: 16 }}>Quit to Home</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* AdBanner */}
      <AdBanner />
    </View>
  );
}

function PowerUpButton({ icon, label, cost, onPress, theme }: any) {
  return (
    <Pressable onPress={onPress} style={[styles.powerupBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Ionicons name={icon} size={28} color={theme.primary} />
      <Text style={[styles.powerupLabel, { color: theme.text }]}>{label}</Text>
      <View style={[styles.costBadge, { backgroundColor: theme.primaryMuted }]}>
        <Text style={[styles.costText, { color: theme.primary }]}>{cost}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  iconBtn: {
    padding: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 20,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  boardScroll: {
    paddingHorizontal: 20,
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },
  powerups: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  powerupBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 80,
    gap: 4,
  },
  powerupLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  costBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  costText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  btn: {
    padding: 16,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
  },
  toast: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  pauseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pauseCard: {
    width: '100%',
    maxWidth: 320,
    padding: 24,
    borderRadius: 20,
    gap: 12,
  },
  pauseTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  pauseBtn: {
    paddingVertical: 14,
    borderRadius: 12,
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
