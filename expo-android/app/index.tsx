import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Platform } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeInDown } from 'react-native-reanimated';
import { useGame } from '@/game/GameProvider';
import { useThemeColors, useNutPalette } from '@/hooks/useThemeColors';
import { AdBanner } from '@/components/AdBanner';
import { LifeRefillModal } from '@/components/LifeRefillModal';
import { Nut } from '@/components/Nut';
import { Backdrop } from '@/components/premium/Backdrop';
import { GlossButton, HudPill, CoinPill, MetalIconButton, Panel, GOLD, shade } from '@/components/premium/UI';
import type { Attempt } from '@/game/types';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const theme = useThemeColors();
  const palette = useNutPalette();
  const { state, startLevel } = game;
  const [showDaily, setShowDaily] = React.useState(false);
  const [showLifeRefill, setShowLifeRefill] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  useFocusEffect(React.useCallback(() => { game.setPlaying?.(false); }, [game.setPlaying]));

  const pulse = useSharedValue(1);
  React.useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.035, { duration: 900 }), withTiming(1, { duration: 900 })), -1);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const activeUnfinished = state.active && (state.active.status === 'playing' || state.active.status === 'timeout') ? state.active : null;
  const pending: Attempt | undefined = Object.values(state.attempts).filter(a => a.status === 'playing' || a.status === 'timeout').slice(-1)[0];
  const continueLevel = activeUnfinished?.levelId ?? pending?.levelId;

  const handlePlay = async () => {
    setMessage(null);
    if (state.lives <= 0) { setShowLifeRefill(true); return; }
    const res = await startLevel(state.unlockedLevel);
    if (res.ok) router.push('/play');
    else if (res.message?.toLowerCase().includes('lives')) setShowLifeRefill(true);
    else if (res.message) setMessage(res.message);
  };

  const handleContinue = async () => {
    setMessage(null);
    if (activeUnfinished) { router.push('/play'); return; }
    if (!pending) return;
    const res = await startLevel(pending.levelId);
    if (res.ok) router.push('/play');
    else if (res.message?.toLowerCase().includes('lives')) setShowLifeRefill(true);
    else if (res.message) setMessage(res.message);
  };

  const streak = state.daily.streak;
  const weekDay = streak > 0 ? ((streak - 1) % 7) + 1 : 0;
  const monthDay = streak > 0 ? ((streak - 1) % 30) + 1 : 0;
  const totalStars = Object.values(state.records).reduce((s, r) => s + r.stars, 0);
  const top = insets.top + (Platform.OS === 'web' ? 24 : 8);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Backdrop image="home" strength={0.45} />

      <View style={[styles.hud, { paddingTop: top }]}>
        <HudPill icon={<Ionicons name="heart" size={22} color="#FF4D5E" />} value={`${state.lives}/5`} plus={state.lives < 5}
          onPress={() => setShowLifeRefill(true)} testID="hud-lives" />
        <CoinPill coins={state.coins} />
        <MetalIconButton icon="settings-sharp" onPress={() => router.push('/settings')} label="Settings" size={42} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.logoWrap}>
          <Text style={styles.logoKicker}>THE ORIGINAL</Text>
          <Text style={[styles.logo, styles.logoTop]}>SCREW</Text>
          <Text style={[styles.logo, styles.logoSort, { color: GOLD }]}>SORT</Text>
          <View style={styles.logoRule}>
            <View style={[styles.ruleLine, { backgroundColor: GOLD }]} />
            <Text style={styles.ruleText}>MASTER</Text>
            <View style={[styles.ruleLine, { backgroundColor: GOLD }]} />
          </View>
        </Animated.View>

        <View style={styles.stage}>
          <View style={styles.boltShaft} />
          <View style={styles.nutStack}>
            {[2, 1, 0].map(i => <Nut key={i} color={palette[i % palette.length]} size={64} />)}
          </View>
          <LinearGradient colors={['#E8ECF2', '#8B93A3', '#4C5363']} style={styles.boltBase} />
        </View>

        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.ctaBlock}>
          <View style={styles.levelTag}>
            <Text style={styles.levelTagText}>LEVEL {state.unlockedLevel}</Text>
            <View style={styles.levelDot} />
            <Ionicons name="star" size={13} color={GOLD} />
            <Text style={styles.levelTagText}>{totalStars}</Text>
          </View>
          <Animated.View style={pulseStyle}>
            <GlossButton title="PLAY" icon="play" size="xl" color={theme.success === '#4E8A63' ? '#3FB24F' : shade(theme.success, 0.15)}
              onPress={handlePlay} testID="btn-play" />
          </Animated.View>
          {continueLevel !== undefined && (
            <GlossButton title={`CONTINUE LEVEL ${continueLevel}`} icon="refresh" size="md" color={theme.primary}
              onPress={handleContinue} testID="btn-continue" style={{ marginTop: 10 }} />
          )}
          {message && <Text style={styles.message}>{message}</Text>}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(500)} style={styles.tiles}>
          <Tile icon="map" label="Levels" color="#3E8EF0" onPress={() => router.push('/levels')} testID="btn-levels" />
          <Tile icon="bag-handle" label="Shop" color="#E8763A" onPress={() => router.push('/shop')} testID="btn-shop" />
          <Tile icon="calendar" label="Daily" color="#B350D8" onPress={() => setShowDaily(true)} badge={streak > 0 ? String(streak) : undefined} testID="btn-daily" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(360).duration(500)}>
          <Pressable onPress={() => setShowDaily(true)}>
            <Panel padding={14}>
              <View style={styles.dailyRow}>
                <LinearGradient colors={['#FFD772', '#E89A1E']} style={styles.flame}>
                  <Ionicons name="flame" size={22} color="#FFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dailyTitle, { color: theme.text }]}>{streak}-day streak</Text>
                  <Text style={[styles.dailySub, { color: theme.textMuted }]}>
                    {state.daily.lastReward > 0 ? `Collected +${state.daily.lastReward} coins today` : 'Open the game daily to collect coins'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </View>
              <WeekTrack day={weekDay} />
            </Panel>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <AdBanner />

      <Modal visible={showDaily} transparent animationType="fade" onRequestClose={() => setShowDaily(false)}>
        <View style={styles.modalOverlay}>
          <Panel padding={22} style={styles.modalCard}>
            <LinearGradient colors={['#FFD772', '#E89A1E']} style={styles.modalBadge}>
              <Ionicons name="flame" size={36} color="#FFF" />
            </LinearGradient>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Daily Reward</Text>
            <Text style={[styles.modalSub, { color: theme.textMuted }]}>
              {state.daily.lastReward > 0 ? `+${state.daily.lastReward} coins collected automatically today` : 'Rewards are collected automatically each day you open the game'}
            </Text>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>WEEKLY BONUS  ·  DAY {weekDay}/7</Text>
            <WeekTrack day={weekDay} />
            <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: 18 }]}>MONTHLY BONUS  ·  DAY {monthDay}/30</Text>
            <View style={[styles.monthTrack, { backgroundColor: shade(theme.surface, -0.12) }]}>
              <LinearGradient colors={['#FFD772', '#E89A1E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ width: `${(monthDay / 30) * 100}%`, height: '100%', borderRadius: 7 }} />
            </View>
            <View style={styles.monthLegend}>
              <Text style={[styles.legend, { color: theme.textMuted }]}>10 coins every day</Text>
              <Text style={[styles.legend, { color: theme.text }]}>Day 30: 100</Text>
            </View>
            <GlossButton title="CLOSE" size="md" color={theme.primary} onPress={() => setShowDaily(false)} style={{ marginTop: 18 }} />
          </Panel>
        </View>
      </Modal>

      <LifeRefillModal visible={showLifeRefill} onClose={() => setShowLifeRefill(false)} />
    </View>
  );
}

function WeekTrack({ day }: { day: number }) {
  const theme = useThemeColors();
  return (
    <View style={styles.week}>
      {[1, 2, 3, 4, 5, 6, 7].map(d => {
        const done = d <= day;
        const big = d === 7;
        return (
          <View key={d} style={{ flex: big ? 1.4 : 1, alignItems: 'center', gap: 4 }}>
            <View style={[styles.weekCell, { backgroundColor: done ? undefined : shade(theme.surface, -0.1), borderColor: done ? '#E89A1E' : theme.border }]}>
              {done && <LinearGradient colors={['#FFD772', '#E89A1E']} style={StyleSheet.absoluteFill} />}
              {done ? <Ionicons name="checkmark" size={14} color="#FFF" /> : <Text style={[styles.weekAmt, { color: theme.textMuted }]}>{big ? 50 : 10}</Text>}
            </View>
            <Text style={[styles.weekLabel, { color: done ? theme.text : theme.textMuted }]}>{big ? 'DAY 7' : `D${d}`}</Text>
          </View>
        );
      })}
    </View>
  );
}

function Tile({ icon, label, color, onPress, badge, testID }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; color: string; onPress: () => void; badge?: string; testID?: string }) {
  return (
    <Pressable onPress={onPress} testID={testID} style={({ pressed }) => [styles.tile, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
      <View style={[styles.tileLip, { backgroundColor: shade(color, -0.5) }]} />
      <LinearGradient colors={[shade(color, 0.3), color, shade(color, -0.25)]} style={styles.tileFace}>
        <LinearGradient colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']} style={styles.tileSheen} />
        <Ionicons name={icon} size={30} color="#FFF" />
        <Text style={styles.tileText}>{label.toUpperCase()}</Text>
      </LinearGradient>
      {badge && <View style={styles.tileBadge}><Text style={styles.tileBadgeText}>{badge}</Text></View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#11141E' },
  hud: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 6, gap: 8 },
  scroll: { paddingHorizontal: 20, paddingBottom: 28, flexGrow: 1 },
  logoWrap: { alignItems: 'center', marginTop: 8 },
  logoKicker: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 5, marginBottom: 2 },
  logo: { fontSize: 62, fontWeight: '900', letterSpacing: 4, lineHeight: 64, color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.55)', textShadowOffset: { width: 0, height: 5 }, textShadowRadius: 0 },
  logoShadow: { position: 'absolute', top: 15, fontSize: 62, fontWeight: '900', letterSpacing: 4, lineHeight: 64, color: 'transparent' },
  logoTop: { color: '#F1F4FA' },
  logoSort: { marginTop: -6, textShadowColor: '#7A4A06' },
  logoRule: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  ruleLine: { width: 34, height: 2, borderRadius: 1 },
  ruleText: { color: '#FFF', fontWeight: '800', fontSize: 12, letterSpacing: 6 },
  stage: { height: 200, alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  boltShaft: { position: 'absolute', bottom: 14, width: 16, height: 176, borderRadius: 8, backgroundColor: '#C9CED8', borderLeftWidth: 4, borderColor: '#F2F4F8' },
  nutStack: { alignItems: 'center', marginBottom: 14 },
  boltBase: { width: 120, height: 18, borderRadius: 9 },
  ctaBlock: { marginTop: 14 },
  levelTag: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(14,17,28,0.7)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  levelTagText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 1.5 },
  levelDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },
  message: { color: '#FFD3D3', textAlign: 'center', marginTop: 8, fontWeight: '700' },
  tiles: { flexDirection: 'row', gap: 12, marginTop: 22, marginBottom: 16 },
  tile: { flex: 1, height: 96 },
  tileLip: { position: 'absolute', left: 0, right: 0, top: 6, bottom: 0, borderRadius: 20 },
  tileFace: { height: 90, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 4, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  tileSheen: { position: 'absolute', top: 2, left: 6, right: 6, height: 36, borderRadius: 16 },
  tileText: { color: '#FFF', fontWeight: '900', fontSize: 13, letterSpacing: 1.5, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 1 },
  tileBadge: { position: 'absolute', top: -6, right: -4, minWidth: 24, height: 24, borderRadius: 12, backgroundColor: '#FF4D5E', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF', paddingHorizontal: 4 },
  tileBadgeText: { color: '#FFF', fontWeight: '900', fontSize: 11 },
  dailyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  flame: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dailyTitle: { fontSize: 17, fontWeight: '900' },
  dailySub: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  week: { flexDirection: 'row', gap: 5 },
  weekCell: { height: 30, alignSelf: 'stretch', borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  weekAmt: { fontSize: 11, fontWeight: '900' },
  weekLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(6,8,14,0.78)', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 380, alignSelf: 'center', overflow: 'visible' },
  modalBadge: { width: 72, height: 72, borderRadius: 24, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 3, borderColor: '#FFF3D0' },
  modalTitle: { fontSize: 26, fontWeight: '900', textAlign: 'center' },
  modalSub: { fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 18, lineHeight: 19 },
  sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  monthTrack: { height: 14, borderRadius: 7, overflow: 'hidden' },
  monthLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  legend: { fontSize: 11, fontWeight: '700' },
});
