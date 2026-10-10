import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '@/game/GameProvider';
import { useThemeColors, useNutPalette } from '@/hooks/useThemeColors';
import { PuzzleBoard } from '@/components/PuzzleBoard';
import { GameOverlay } from '@/components/GameOverlay';
import { AdBanner } from '@/components/AdBanner';
import { CoinIcon } from '@/components/Icons';
import { POWER_PRICES } from '@/game/catalogue';
import { Backdrop } from '@/components/premium/Backdrop';
import { MetalIconButton, GlossButton, Panel, GOLD, shade, IconName } from '@/components/premium/UI';
import type { PowerUp } from '@/game/types';

const POWER: Record<PowerUp, { icon: IconName; color: string; label: string; title: string; desc: string }> = {
  hint: { icon: 'bulb', color: '#F2A93B', label: 'HINT', title: 'Get a Hint', desc: 'Reveal one verified next move.' },
  undo: { icon: 'arrow-undo', color: '#3E8EF0', label: 'UNDO', title: 'Undo Move', desc: 'Take back your last move.' },
  extraBolt: { icon: 'add-circle', color: '#2FA36B', label: 'BOLT', title: 'Extra Bolt', desc: 'Add one empty bolt to the board.' },
};

export default function PlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const theme = useThemeColors();
  const palette = useNutPalette();
  const { state, tapColumn, usePowerUp, setPlaying } = game;
  const active = state.active;

  const [isPaused, setIsPaused] = useState(false);
  const [powerUpSheet, setPowerUpSheet] = useState<PowerUp | null>(null);
  const lastPowerUp = useRef<PowerUp>('hint');
  const displayedPowerUp = powerUpSheet ?? lastPowerUp.current;
  const [focused, setFocused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [settledMove, setSettledMove] = useState('');
  const [boardHeight, setBoardHeight] = useState(360);
  const [feedback, setFeedback] = useState<string | null>(null);
  const onBoardBusy = useCallback((value: boolean) => setAnimating(value), []);
  const onBoardSettled = useCallback((levelId: number, moves: number) => setSettledMove(`${levelId}:${moves}`), []);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      setPlaying(!isPaused);
      return () => { setPlaying(false); setFocused(false); };
    }, [isPaused, setPlaying])
  );

  if (!active) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Backdrop image="home" strength={0.7} />
        <Panel padding={24} style={{ width: '85%', maxWidth: 340 }}>
          <Text style={[styles.sheetTitle, { color: theme.text }]}>No active level</Text>
          <Text style={[styles.sheetDesc, { color: theme.textMuted }]}>Pick a level to start sorting.</Text>
          <GlossButton title="GO HOME" icon="home" size="md" color={theme.primary} onPress={() => router.replace('/')} style={{ marginTop: 18 }} />
        </Panel>
        <View style={styles.bannerAbs}><AdBanner /></View>
      </View>
    );
  }

  const formatTime = (seconds: number) => {
    const total = Math.ceil(Math.max(0, seconds));
    return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`;
  };

  const locked = animating || game.busy || active.status !== 'playing';

  const handlePowerUp = async (kind: PowerUp) => {
    if (animating || game.busy || active.status !== 'playing') return;
    setFeedback(null);
    if ((state.powerups[kind] ?? 0) > 0) {
      const res = await usePowerUp(kind, 'stock');
      if (!res.ok && res.message) setFeedback(res.message);
      return;
    }
    lastPowerUp.current = kind;
    setPlaying(false);
    setIsPaused(true);
    setPowerUpSheet(kind);
  };

  const executePowerUp = async (payment: 'coins' | 'ad') => {
    if (!powerUpSheet) return;
    const kind = powerUpSheet;
    setPowerUpSheet(null);
    try {
      const res = await usePowerUp(kind, payment);
      if (!res.ok && res.message) setFeedback(res.message);
    } finally { setIsPaused(false); }
  };

  const handleRestart = () => { game.resetLevel(); setIsPaused(false); };

  const showGameOverlay = active.status !== 'playing' && !animating
    && (active.status !== 'won' || settledMove === `${active.levelId}:${active.moves}`);
  const level = state.levels[active.levelId];
  const sorted = active.board.filter((column, index) => column.length > 0
    && column.every(color => color === column[0])
    && !active.board.some((other, otherIndex) => otherIndex !== index && other.includes(column[0]))).length;
  const lowTime = active.remaining < 15;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Backdrop image="home" strength={0.85} />

      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'web' ? 40 : 8) }]}>
        <MetalIconButton icon="chevron-back" size={42} testID="btn-back" label="Back to home"
          onPress={() => { setPlaying(false); setFocused(false); router.canGoBack() ? router.back() : router.replace('/'); }} />
        <View style={styles.statsPill}>
          <View style={styles.stat}>
            <Ionicons name="time" size={17} color={lowTime ? '#FF5A66' : GOLD} />
            <Text testID="remaining-time" style={[styles.statText, lowTime && { color: '#FF7A84' }]}>{formatTime(active.remaining)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Ionicons name="swap-vertical" size={17} color="#9CC7FF" />
            <Text testID="move-count" style={styles.statText}>{active.moves}</Text>
          </View>
        </View>
        <MetalIconButton icon="pause" size={42} testID="btn-pause" label="Pause game" disabled={locked}
          onPress={() => { setPlaying(false); setIsPaused(true); }} />
      </View>

      {/* The complete table scales into this fixed viewport; gameplay never scrolls. */}
      <View testID="play-table-viewport" style={styles.tableViewport}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelTitle}>LEVEL {active.levelId}</Text>
          <LinearGradient colors={[shade(GOLD, 0.25), shade(GOLD, -0.15)]} style={styles.diffChip}>
            <Text style={styles.diffText}>{(level?.difficulty ?? 'Puzzle').toUpperCase()}</Text>
          </LinearGradient>
        </View>
        <LinearGradient colors={['#E9EDF3', '#9AA2B1', '#5D6575', '#A8B0BE']} locations={[0, 0.3, 0.7, 1]} style={styles.frame}>
          <View style={[styles.boardCard, { backgroundColor: theme.surface }]}
            onLayout={event => setBoardHeight(Math.max(1, event.nativeEvent.layout.height - 38))}>
            <LinearGradient colors={['rgba(0,0,0,0.12)', 'transparent']} style={styles.innerShadow} pointerEvents="none" />
            <PuzzleBoard active={active} availableHeight={boardHeight} enabled={focused && !isPaused} blocked={game.busy || game.adBusy}
              colorLabels={state.settings.colorLabels} onTap={tapColumn} onBusy={onBoardBusy} onSettled={onBoardSettled} />
            <View style={styles.boardProgress}>
              {Array.from({ length: level?.colors ?? 3 }, (_, i) => (
                <View key={i} style={[styles.progDot, { backgroundColor: palette[i % palette.length], opacity: i < sorted ? 1 : 0.3 }]} />
              ))}
              <Text style={[styles.progText, { color: theme.textMuted }]}>{sorted}/{level?.colors ?? 3} sorted</Text>
            </View>
          </View>
        </LinearGradient>
        <Text style={styles.helper} numberOfLines={1}>
          {feedback ?? (active.selected !== null ? 'Choose a new bolt, or tap the nut again to cancel' : 'Tap a top nut, then choose its new bolt')}
        </Text>
      </View>

      <View style={[styles.powerups, { paddingBottom: 6 }]}>
        {(['hint', 'undo', 'extraBolt'] as PowerUp[]).map(kind => (
          <PowerUpButton key={kind} kind={kind} count={state.powerups[kind] ?? 0} disabled={locked}
            onPress={() => void handlePowerUp(kind)} testID={`btn-${kind}`} />
        ))}
      </View>

      {showGameOverlay && <GameOverlay />}

      <Modal visible={!!powerUpSheet} transparent animationType="fade" onRequestClose={() => { setPowerUpSheet(null); setIsPaused(false); }}>
        <View style={styles.overlay}>
          <Panel padding={22} style={styles.card}>
            <LinearGradient colors={[shade(POWER[displayedPowerUp].color, 0.3), POWER[displayedPowerUp].color, shade(POWER[displayedPowerUp].color, -0.3)]} style={styles.sheetIcon}>
              <Ionicons name={POWER[displayedPowerUp].icon} size={36} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>{POWER[displayedPowerUp].title}</Text>
            <Text style={[styles.sheetDesc, { color: theme.textMuted }]}>{POWER[displayedPowerUp].desc} You have none in stock.</Text>
            <GlossButton title={`USE FOR ${POWER_PRICES[displayedPowerUp]}`} size="md" color="#2FA36B" right={<CoinIcon size={20} />}
              onPress={() => void executePowerUp('coins')} style={{ marginTop: 18 }} />
            <GlossButton title={game.adBusy ? 'LOADING' : game.adsAvailable ? 'WATCH AD' : 'AD UNAVAILABLE'} icon="play" size="md" color="#3E8EF0"
              disabled={game.adBusy || !game.adsAvailable} onPress={() => void executePowerUp('ad')} style={{ marginTop: 10 }} />
            {!game.adsAvailable && <Text style={[styles.small, { color: theme.textMuted }]}>{game.adStatus}</Text>}
            <Pressable style={styles.cancel} onPress={() => { setPowerUpSheet(null); setIsPaused(false); }}>
              <Text style={[styles.cancelText, { color: theme.textMuted }]}>Cancel</Text>
            </Pressable>
          </Panel>
        </View>
      </Modal>

      <Modal visible={isPaused && !powerUpSheet && !game.busy} transparent animationType="fade" onRequestClose={() => setIsPaused(false)}>
        <View style={styles.overlay}>
          <Panel padding={22} style={styles.card}>
            <Text style={[styles.pauseTitle, { color: theme.text }]}>PAUSED</Text>
            <Text style={[styles.sheetDesc, { color: theme.textMuted }]}>Take your time. The clock is stopped.</Text>
            <GlossButton title="RESUME" icon="play" size="lg" color="#3FB24F" onPress={() => setIsPaused(false)} style={{ marginTop: 18 }} />
            <GlossButton title="RESTART" icon="refresh" size="md" color={theme.primary} onPress={handleRestart} testID="btn-restart" style={{ marginTop: 10 }} />
            <Text style={[styles.small, { color: theme.textMuted }]}>Free reset. Your remaining time stays the same.</Text>
            <GlossButton title="QUIT TO HOME" icon="home" size="sm" color="#C8343F" style={{ marginTop: 12 }}
              onPress={() => { setPlaying(false); setFocused(false); router.replace('/'); }} />
          </Panel>
        </View>
      </Modal>

      <View style={{ paddingBottom: insets.bottom }}><AdBanner /></View>
    </View>
  );
}

function PowerUpButton({ kind, count, onPress, disabled, testID }: { kind: PowerUp; count: number; onPress: () => void; disabled: boolean; testID: string }) {
  const p = POWER[kind];
  return (
    <Pressable onPress={onPress} testID={testID} accessibilityLabel={`${p.label}, ${count} owned`}
      style={({ pressed }) => [styles.pu, { opacity: disabled ? 0.6 : 1, transform: [{ translateY: pressed ? 3 : 0 }] }]}>
      <View style={[styles.puLip, { backgroundColor: shade(p.color, -0.5) }]} />
      <LinearGradient colors={[shade(p.color, 0.3), p.color, shade(p.color, -0.25)]} style={styles.puFace}>
        <LinearGradient colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']} style={styles.puSheen} />
        <Ionicons name={p.icon} size={22} color="#FFF" />
        <Text style={styles.puLabel}>{p.label}</Text>
      </LinearGradient>
      <View style={[styles.puBadge, count > 0 ? styles.puBadgeOwned : styles.puBadgePrice]}>
        {count > 0 ? <Text style={styles.puBadgeText}>{count}</Text> : (
          <>
            <CoinIcon size={11} />
            <Text style={styles.puBadgeText}>{POWER_PRICES[kind]}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#11141E' },
  center: { justifyContent: 'center', alignItems: 'center' },
  bannerAbs: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 6 },
  statsPill: { flexDirection: 'row', alignItems: 'center', height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(14,17,28,0.8)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 12 },
  statText: { color: '#FFF', fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  tableViewport: { flex: 1, minHeight: 0, paddingTop: 2, paddingBottom: 4 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 },
  levelTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 2, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0 },
  diffChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  diffText: { color: '#3D2400', fontWeight: '900', fontSize: 11, letterSpacing: 1.2 },
  frame: { flex: 1, minHeight: 0, marginHorizontal: 10, borderRadius: 28, padding: 4, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  boardCard: { flex: 1, minHeight: 0, borderRadius: 24, paddingTop: 4, paddingBottom: 6, justifyContent: 'center', overflow: 'hidden' },
  innerShadow: { position: 'absolute', top: 0, left: 0, right: 0, height: 18 },
  boardProgress: { height: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  progDot: { width: 9, height: 9, borderRadius: 5 },
  progText: { fontSize: 12, fontWeight: '800', marginLeft: 4 },
  helper: { color: 'rgba(255,255,255,0.75)', textAlign: 'center', fontSize: 11, fontWeight: '600', paddingHorizontal: 16, marginTop: 6 },
  powerups: { flexDirection: 'row', justifyContent: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 8 },
  pu: { flex: 1, maxWidth: 104, height: 58 },
  puLip: { position: 'absolute', left: 0, right: 0, top: 5, bottom: 0, borderRadius: 18 },
  puFace: { height: 53, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  puSheen: { position: 'absolute', top: 2, left: 5, right: 5, height: 22, borderRadius: 14 },
  puLabel: { color: '#FFF', fontWeight: '900', fontSize: 11, letterSpacing: 1.2, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 },
  puBadge: { position: 'absolute', top: -7, right: -6, minWidth: 24, height: 22, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 6, borderWidth: 2, borderColor: '#FFF' },
  puBadgeOwned: { backgroundColor: '#E8384A' },
  puBadgePrice: { backgroundColor: '#1A1F2C' },
  puBadgeText: { color: '#FFF', fontWeight: '900', fontSize: 11 },
  overlay: { flex: 1, backgroundColor: 'rgba(6,8,14,0.78)', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 360, alignSelf: 'center' },
  sheetIcon: { width: 70, height: 70, borderRadius: 22, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  sheetTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  sheetDesc: { fontSize: 14, textAlign: 'center', marginTop: 4, lineHeight: 20 },
  pauseTitle: { fontSize: 30, fontWeight: '900', textAlign: 'center', letterSpacing: 3 },
  small: { fontSize: 11, textAlign: 'center', marginTop: 8, lineHeight: 16 },
  cancel: { padding: 14, alignItems: 'center', marginTop: 2 },
  cancelText: { fontWeight: '800', fontSize: 15 },
});
