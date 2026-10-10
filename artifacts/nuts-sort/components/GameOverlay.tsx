import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { ZoomIn, FadeIn } from 'react-native-reanimated';
import { useGame } from '@/game/GameProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CoinIcon } from '@/components/Icons';
import { Panel, GlossButton, GOLD, shade, IconName } from '@/components/premium/UI';
import type { ActionResult } from '@/game/types';

export function GameOverlay() {
  const game = useGame();
  const theme = useThemeColors();
  const router = useRouter();
  const { state, abandonTimeout, continueByAd, doubleReward, startLevel } = game;
  const { active, victory } = state;
  const [message, setMessage] = useState<string | null>(null);
  const locked = game.busy || game.adBusy || !!game.error;
  const goHome = () => { game.setPlaying(false); router.replace('/'); };
  const run = async (action: () => Promise<ActionResult>) => {
    setMessage(null);
    game.clearNotice();
    const result = await action();
    if (!result.ok) setMessage(result.message ?? 'Please try again.');
    return result.ok;
  };
  const feedback = (game.error || message) && (
    <View style={{ marginTop: 10 }}>
      <Text accessibilityRole="alert" style={[styles.small, { color: theme.danger }]}>{game.error || message}</Text>
      {game.error && <Pressable onPress={game.retryLoad} style={{ padding: 10, alignItems: 'center' }}>
        <Text style={{ color: theme.primary, fontWeight: '800' }}>Retry saving progress</Text>
      </Pressable>}
    </View>
  );
  const unavailable = !game.adsAvailable && <Text style={[styles.small, { color: theme.textMuted }]}>{game.adStatus}</Text>;

  const Ribbon = ({ text, color }: { text: string; color: string }) => (
    <View style={styles.ribbonWrap}>
      <LinearGradient colors={[shade(color, 0.25), color, shade(color, -0.3)]} style={styles.ribbon}>
        <Text style={styles.ribbonText}>{text}</Text>
      </LinearGradient>
    </View>
  );

  if (victory) {
    const secs = Math.ceil(victory.seconds);
    return (
      <Modal transparent animationType="fade" onRequestClose={goHome}>
        <View style={styles.overlay}>
          <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.cardWrap}>
            <Panel padding={22} style={styles.card}>
              <View style={{ height: 30 }} />
              <View style={styles.stars} accessibilityLabel={`${victory.stars} out of 5 stars`} testID="victory-stars">
                {[1, 2, 3, 4, 5].map(s => (
                  <Animated.View key={s} entering={ZoomIn.delay(200 + s * 120)} style={{ marginTop: s === 3 ? -10 : s === 2 || s === 4 ? -4 : 0 }}>
                    <Ionicons name="star" size={s === 3 ? 46 : 36} color={s <= victory.stars ? GOLD : shade(theme.surface, -0.2)} />
                  </Animated.View>
                ))}
              </View>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>Level {victory.levelId} cleared</Text>
              <View style={[styles.stats, { backgroundColor: shade(theme.surface, -0.07), borderColor: theme.border }]}>
                <Stat icon="swap-vertical" value={victory.moves} label="Moves" />
                <Stat icon="time" value={`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`} label="Time" />
                <Stat icon="coin" value={`+${victory.reward * (victory.doubled ? 2 : 1)}`} label="Coins" />
              </View>
              {!victory.doubled && victory.reward > 0 && (
                <GlossButton title={game.adBusy ? 'LOADING' : game.adsAvailable ? 'DOUBLE REWARD' : 'AD UNAVAILABLE'} icon="play" size="md"
                  color="#3E8EF0" onPress={() => void run(doubleReward)} disabled={locked || !game.adsAvailable} style={{ marginTop: 14 }} />
              )}
              {victory.doubled && <Text style={[styles.doubled, { color: theme.success }]}>Reward doubled</Text>}
              {!victory.doubled && victory.reward > 0 && unavailable}
              {feedback}
              <GlossButton title="NEXT LEVEL" icon="arrow-forward" size="lg" color="#3FB24F" disabled={locked} testID="btn-next-level"
                onPress={async () => {
                  if (await run(() => startLevel(Math.min(state.unlockedLevel, victory.levelId + 1)))) router.replace('/play');
                }} style={{ marginTop: 12 }} />
              <Pressable style={styles.link} onPress={goHome}>
                <Text style={[styles.linkText, { color: theme.textMuted }]}>Back to Home</Text>
              </Pressable>
            </Panel>
            <Ribbon text="LEVEL COMPLETE" color="#3FB24F" />
          </Animated.View>
        </View>
      </Modal>
    );
  }

  if (active?.status === 'timeout') {
    return (
      <Modal transparent animationType="fade" onRequestClose={goHome}>
        <View style={styles.overlay}>
          <Animated.View entering={FadeIn} style={styles.cardWrap}>
            <Panel padding={22} style={styles.card}>
              <View style={{ height: 30 }} />
              <LinearGradient colors={['#FF8A7A', '#D9363F']} style={styles.bigIcon}>
                <Ionicons name="hourglass" size={44} color="#FFF" />
              </LinearGradient>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>So close. Add a minute and finish it.</Text>
              <GlossButton title={game.adBusy ? 'LOADING' : game.adsAvailable ? '+60 SECONDS' : 'AD UNAVAILABLE'} subtitle={game.adsAvailable && !game.adBusy ? 'Watch an ad' : undefined}
                icon="play" size="lg" color="#3E8EF0" onPress={() => void run(continueByAd)} disabled={locked || !game.adsAvailable} style={{ marginTop: 16 }} />
              {unavailable}
              {feedback}
              <GlossButton title="GIVE UP  (-1 LIFE)" size="sm" color="#C8343F" disabled={locked} testID="btn-decline-time"
                onPress={() => { abandonTimeout(); goHome(); }} style={{ marginTop: 12 }} />
            </Panel>
            <Ribbon text="TIME'S UP" color="#D9363F" />
          </Animated.View>
        </View>
      </Modal>
    );
  }

  if (active?.status === 'lost') {
    return (
      <Modal transparent animationType="fade" onRequestClose={goHome}>
        <View style={styles.overlay}>
          <Animated.View entering={FadeIn} style={styles.cardWrap}>
            <Panel padding={22} style={styles.card}>
              <View style={{ height: 30 }} />
              <LinearGradient colors={['#FF8A96', '#D9364A']} style={styles.bigIcon}>
                <Ionicons name={state.lives > 0 ? 'heart-half' : 'heart-dislike'} size={44} color="#FFF" />
              </LinearGradient>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                {state.lives > 0 ? `${state.lives} lives remaining. Your level is ready for another try.` : 'Watch a completed ad for one life, or return after midnight for five lives.'}
              </Text>
              <GlossButton title={state.lives > 0 ? 'RETRY LEVEL' : game.adsAvailable ? 'GET A LIFE' : 'AD UNAVAILABLE'}
                icon={state.lives > 0 ? 'refresh' : 'play'} size="lg" color={state.lives > 0 ? '#3FB24F' : '#3E8EF0'} testID="btn-retry-level"
                disabled={locked || (state.lives < 1 && !game.adsAvailable)} style={{ marginTop: 16 }}
                onPress={async () => {
                  if (state.lives < 1 && !await run(game.gainLifeByAd)) return;
                  await run(() => startLevel(active.levelId));
                }} />
              {state.lives < 1 && unavailable}
              {feedback}
              <Pressable style={styles.link} onPress={goHome}>
                <Text style={[styles.linkText, { color: theme.textMuted }]}>Back to Home</Text>
              </Pressable>
            </Panel>
            <Ribbon text={state.lives > 0 ? 'TRY AGAIN' : 'NO LIVES LEFT'} color="#D9364A" />
          </Animated.View>
        </View>
      </Modal>
    );
  }

  return null;
}

function Stat({ icon, value, label }: { icon: IconName | 'coin'; value: string | number; label: string }) {
  const theme = useThemeColors();
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        {icon === 'coin' ? <CoinIcon size={20} /> : <Ionicons name={icon} size={18} color={theme.textMuted} />}
        <Text style={{ fontSize: 22, fontWeight: '900', color: theme.text, fontVariant: ['tabular-nums'] }}>{value}</Text>
      </View>
      <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: '800', marginTop: 2, letterSpacing: 1.2 }}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(6,8,14,0.82)' },
  cardWrap: { width: '100%', maxWidth: 360, paddingTop: 26 },
  card: { width: '100%' },
  ribbonWrap: { position: 'absolute', top: 0, left: 18, right: 18, alignItems: 'center' },
  ribbon: { height: 52, alignSelf: 'stretch', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  ribbonText: { color: '#FFF', fontSize: 22, fontWeight: '900', letterSpacing: 2, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0 },
  stars: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 2, marginVertical: 6 },
  subtitle: { fontSize: 14, textAlign: 'center', fontWeight: '700', lineHeight: 20, marginTop: 6 },
  stats: { flexDirection: 'row', marginTop: 14, paddingVertical: 12, borderRadius: 16, borderWidth: 1 },
  doubled: { textAlign: 'center', fontWeight: '900', marginTop: 12 },
  bigIcon: { width: 84, height: 84, borderRadius: 42, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  small: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 8 },
  link: { padding: 12, alignItems: 'center', marginTop: 4 },
  linkText: { fontWeight: '800', fontSize: 15 },
});
