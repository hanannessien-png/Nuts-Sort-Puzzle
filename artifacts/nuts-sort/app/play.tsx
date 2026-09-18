import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/game/GameProvider';
import { useThemeColors, useNutPalette } from '@/hooks/useThemeColors';
import { PuzzleBoard } from '@/components/PuzzleBoard';
import { GameOverlay } from '@/components/GameOverlay';
import { Ionicons } from '@expo/vector-icons';
import { AdBanner } from '@/components/AdBanner';
import { POWER_PRICES } from '@/game/catalogue';

import { LinearGradient } from 'expo-linear-gradient';

export default function PlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const theme = useThemeColors();
  const palette = useNutPalette();
  
  const { state, tapColumn, usePowerUp, setPlaying } = game;
  const active = state.active;

  const [isPaused, setIsPaused] = useState(false);
  const [powerUpSheet, setPowerUpSheet] = useState<'hint' | 'undo' | 'extraBolt' | null>(null);
  const lastPowerUp = useRef<'hint' | 'undo' | 'extraBolt'>('hint');
  const displayedPowerUp = powerUpSheet ?? lastPowerUp.current;
  const [focused, setFocused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [settledMove, setSettledMove] = useState('');
  const [boardHeight, setBoardHeight] = useState(360);
  const onBoardBusy = useCallback((value: boolean) => setAnimating(value), []);
  const onBoardSettled = useCallback((levelId: number, moves: number) => setSettledMove(`${levelId}:${moves}`), []);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      setPlaying(!isPaused);
      return () => {
        setPlaying(false);
        setFocused(false);
      };
    }, [isPaused, setPlaying])
  );

  if (!active) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ color: theme.text, fontSize: 24, fontWeight: 'bold' }}>No active game</Text>
        <Pressable onPress={() => router.replace('/')} style={[styles.btn, { backgroundColor: theme.primary, paddingHorizontal: 32 }]}>
          <Text style={{ color: theme.surface, fontWeight: 'bold', fontSize: 18 }}>Go Home</Text>
        </Pressable>
      </View>
    );
  }

  const formatTime = (seconds: number) => {
    const total = Math.ceil(Math.max(0, seconds));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePowerUp = (kind: 'hint' | 'undo' | 'extraBolt') => {
    if (animating || game.busy || active.status !== 'playing') return;
    lastPowerUp.current = kind;
    setPlaying(false);
    setIsPaused(true);
    setPowerUpSheet(kind);
  };

  const executePowerUp = async (payment: 'coins' | 'ad') => {
    if (!powerUpSheet) return;
    const kind = powerUpSheet;
    setPowerUpSheet(null);
    try { await usePowerUp(kind, payment); }
    finally { setIsPaused(false); }
  };

  const handleRestart = () => {
    game.resetLevel();
    setIsPaused(false);
  };

  const showGameOverlay = active.status !== 'playing' && !animating
    && (active.status !== 'won' || settledMove === `${active.levelId}:${active.moves}`);
  const level = state.levels[active.levelId];
  const sorted = active.board.filter((column, index) => column.length > 0
    && column.every(color => color === column[0])
    && !active.board.some((other, otherIndex) => otherIndex !== index && other.includes(column[0]))).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={[`${theme.surface}00`, `${theme.surface}80`]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'web' ? 40 : 12) }]}>
        <Pressable onPress={() => { setPlaying(false); setFocused(false); router.canGoBack() ? router.back() : router.replace('/'); }} style={styles.iconBtn} testID="btn-back" accessibilityLabel="Back to home">
          <Ionicons name="arrow-back" size={28} color={theme.text} />
        </Pressable>
        
        <View style={styles.stats}>
          <View style={styles.statBox}>
            <Ionicons name="time-outline" size={20} color={theme.text} />
            <Text testID="remaining-time" style={[styles.statText, { color: active.remaining < 15 ? theme.danger : theme.text, fontVariant: ['tabular-nums'] }]}>{formatTime(active.remaining)}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="swap-vertical" size={20} color={theme.text} />
            <Text testID="move-count" style={[styles.statText, { color: theme.text }]}>{active.moves}</Text>
          </View>
        </View>

        <Pressable disabled={animating || game.busy || active.status !== 'playing'} onPress={() => { setPlaying(false); setIsPaused(true); }} style={styles.iconBtn} testID="btn-pause" accessibilityLabel="Pause game">
          <Ionicons name="pause" size={28} color={theme.text} />
        </Pressable>
      </View>

      {/* The complete table scales into this fixed viewport; gameplay never scrolls. */}
      <View testID="play-table-viewport" style={styles.tableViewport}>
        <View style={styles.levelHeader}>
          <View>
            <Text style={{ color: theme.primary, fontSize: 10, letterSpacing: 2.5, fontWeight: '700', marginBottom: 5 }}>THE SORTING TABLE</Text>
            <Text style={{ color: theme.text, fontSize: 27, fontWeight: '700', letterSpacing: -1 }}>Level {String(active.levelId).padStart(2, '0')}</Text>
          </View>
          <View style={{ backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 16, paddingVertical: 9, paddingHorizontal: 13 }}>
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 12 }}>{level?.difficulty ?? 'Puzzle'}</Text>
          </View>
        </View>
        <View
          style={[styles.boardCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onLayout={event => setBoardHeight(Math.max(1, event.nativeEvent.layout.height - 38))}
        >
          <PuzzleBoard active={active} availableHeight={boardHeight} enabled={focused && !isPaused} blocked={game.busy || game.adBusy}
            colorLabels={state.settings.colorLabels} onTap={tapColumn} onBusy={onBoardBusy} onSettled={onBoardSettled} />
          <View style={styles.boardProgress}>
            {Array.from({ length: level?.colors ?? 3 }, (_, i) => <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: palette[i % palette.length] }} />)}
            <Text style={{ color: theme.textMuted, fontSize: 12, marginLeft: 4 }}>{sorted} / {level?.colors ?? 3} colors together</Text>
          </View>
        </View>
        <Text style={{ color: theme.textMuted, textAlign: 'center', fontSize: 11, paddingHorizontal: 16 }}>
          {active.selected !== null ? 'Choose a new bolt · Tap the selected nut to cancel' : 'Tap a top nut, then choose its new bolt'}
        </Text>
      </View>

      {/* Power-ups Bar */}
      <View style={[styles.powerups, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <PowerUpButton 
          icon="bulb" 
          label="Hint" 
          cost={POWER_PRICES.hint} 
          onPress={() => handlePowerUp('hint')}
          theme={theme}
          testID="btn-hint"
        />
        <PowerUpButton 
          icon="arrow-undo" 
          label="Undo" 
          cost={POWER_PRICES.undo} 
          onPress={() => handlePowerUp('undo')}
          theme={theme}
          testID="btn-undo"
        />
        <PowerUpButton 
          icon="add-circle" 
          label="Bolt" 
          cost={POWER_PRICES.extraBolt} 
          onPress={() => handlePowerUp('extraBolt')}
          theme={theme}
          testID="btn-extraBolt"
        />
      </View>
      
      {showGameOverlay && <GameOverlay />}
      
      <Modal visible={!!powerUpSheet} transparent animationType="slide" onRequestClose={() => { setPowerUpSheet(null); setIsPaused(false); }}>
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheetCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {displayedPowerUp === 'hint' ? 'Get a Hint' : displayedPowerUp === 'undo' ? 'Undo Move' : 'Extra Bolt'}
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 24 }}>
              <Pressable 
                style={[styles.sheetBtn, { backgroundColor: theme.primary, flex: 1 }]}
                onPress={() => executePowerUp('coins')}
              >
                <Ionicons name="server" size={20} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                  Pay {POWER_PRICES[displayedPowerUp]}
                </Text>
              </Pressable>
              
              {(
                <Pressable 
                  style={[styles.sheetBtn, { backgroundColor: theme.success, flex: 1 }]}
                  onPress={() => executePowerUp('ad')}
                  disabled={game.adBusy || !game.adsAvailable}
                >
                  <Ionicons name="play" size={20} color="#FFF" />
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                    {game.adBusy ? 'Loading...' : game.adsAvailable ? 'Watch Ad' : 'Unavailable'}
                  </Text>
                </Pressable>
              )}
            </View>
            {!game.adsAvailable && <Text style={{ color: theme.textMuted, textAlign: 'center', fontSize: 12, lineHeight: 18 }}>{game.adStatus}</Text>}

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
      <Modal visible={isPaused && !powerUpSheet && !game.busy} transparent animationType="fade" onRequestClose={() => setIsPaused(false)}>
        <View style={styles.pauseOverlay}>
          <View style={[styles.pauseCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.pauseTitle, { color: theme.text }]}>Paused</Text>
            <Text style={{ color: theme.textMuted, textAlign: 'center', fontSize: 13, lineHeight: 19 }}>Take your time. The clock is paused.</Text>
            
            <Pressable 
              style={[styles.pauseBtn, { backgroundColor: theme.primary }]}
              onPress={() => setIsPaused(false)}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Resume</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.pauseBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
              onPress={handleRestart}
              testID="btn-restart"
            >
              <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>Restart Level</Text>
            </Pressable>
            <Text style={{ color: theme.textMuted, textAlign: 'center', fontSize: 11 }}>Free reset · Your remaining time stays the same</Text>

            <Pressable 
              style={[styles.pauseBtn, { backgroundColor: theme.surface, borderColor: theme.danger, borderWidth: 1, marginTop: 12 }]}
              onPress={() => {
                setPlaying(false);
                setFocused(false);
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

function PowerUpButton({ icon, label, cost, onPress, theme, testID }: any) {
  return (
    <Pressable onPress={onPress} style={[styles.powerupBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} testID={testID}>
      <Ionicons name={icon} size={28} color={theme.primary} />
      <Text style={[styles.powerupLabel, { color: theme.text }]}>{label}</Text>
      <View style={[styles.costBadge, { backgroundColor: theme.primaryMuted }]}>
        <Text style={[styles.costText, { color: theme.text }]}>{cost}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tableViewport: {
    flex: 1,
    minHeight: 0,
    paddingTop: 6,
    paddingBottom: 5,
  },
  levelHeader: {
    paddingHorizontal: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  boardCard: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: 12,
    borderRadius: 26,
    borderWidth: 1,
    paddingTop: 4,
    paddingBottom: 6,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  boardProgress: {
    height: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
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
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
