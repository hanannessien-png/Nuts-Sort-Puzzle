import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useGame } from '@/game/GameProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CoinIcon } from '@/components/Icons';
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
    <View style={{ marginVertical: 10 }}>
      <Text accessibilityRole="alert" style={{ color: theme.danger, fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
        {game.error || message}
      </Text>
      {game.error && <Pressable onPress={game.retryLoad} style={{ padding: 12, alignItems: 'center' }}>
        <Text style={{ color: theme.primary, fontWeight: '700' }}>Retry saving progress</Text>
      </Pressable>}
    </View>
  );
  const unavailable = !game.adsAvailable && (
    <Text style={{ color: theme.textMuted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginBottom: 14 }}>{game.adStatus}</Text>
  );

  if (victory) {
    return (
      <Modal transparent animationType="fade" onRequestClose={goHome}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.title, { color: theme.success }]}>Level Complete!</Text>
            
            <View style={styles.stars} accessibilityLabel={`${victory.stars} out of 5 stars`} testID="victory-stars">
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons 
                  key={s} 
                  name="star" 
                  size={34}
                  color={s <= victory.stars ? theme.warning : theme.border} 
                />
              ))}
            </View>

            <View style={styles.stats}>
              <Stat icon="swap-vertical" value={victory.moves} label="Moves" theme={theme} />
              <Stat icon="time-outline" value={`${Math.floor(Math.ceil(victory.seconds) / 60)}:${String(Math.ceil(victory.seconds) % 60).padStart(2, '0')}`} label="Time" theme={theme} />
              <Stat icon="coin" value={`+${victory.reward * (victory.doubled ? 2 : 1)}`} label="Coins" theme={theme} />
            </View>

            {!victory.doubled && victory.reward > 0 && (
              <Pressable 
                style={[styles.btn, { backgroundColor: theme.primary, marginBottom: 12 }]} 
                onPress={() => void run(doubleReward)}
                disabled={locked || !game.adsAvailable}
              >
                <Ionicons name="play" size={24} color="#FFF" />
                <Text style={styles.btnText}>{game.adBusy ? 'Loading...' : game.adsAvailable ? 'Double Reward (Ad)' : 'Ad unavailable'}</Text>
              </Pressable>
            )}
            {victory.doubled && <Text style={{ color: theme.success, fontWeight: '700', marginBottom: 12 }}>Reward doubled</Text>}
            {!victory.doubled && victory.reward > 0 && unavailable}
            {feedback}

            <Pressable 
              style={[styles.btn, { backgroundColor: theme.success }]} 
              onPress={async () => {
                if (await run(() => startLevel(Math.min(state.unlockedLevel, victory.levelId + 1)))) router.replace('/play');
              }}
              disabled={locked}
              testID="btn-next-level"
            >
              <Text style={styles.btnText}>Next Level</Text>
            </Pressable>
            
            <Pressable style={{ marginTop: 20, padding: 8 }} onPress={goHome}>
              <Text style={{ color: theme.textMuted, fontWeight: '700', fontSize: 16 }}>Back to Home</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  if (active?.status === 'timeout') {
    return (
      <Modal transparent animationType="fade" onRequestClose={goHome}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.title, { color: theme.danger }]}>Time's Up!</Text>
            
            <Ionicons name="time" size={80} color={theme.danger} style={{ marginVertical: 24 }} />

            {(
              <Pressable 
                style={[styles.btn, { backgroundColor: theme.primary, marginBottom: 12 }]} 
                onPress={() => void run(continueByAd)}
                disabled={locked || !game.adsAvailable}
              >
                <Ionicons name="play" size={24} color="#FFF" />
                <Text style={styles.btnText}>{game.adBusy ? 'Loading...' : game.adsAvailable ? '+60s (Ad)' : '+60s · Ad unavailable'}</Text>
              </Pressable>
            )}
            {unavailable}
            {feedback}

            <Pressable 
              style={[styles.btn, { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.danger }]} 
              onPress={() => {
                abandonTimeout();
                goHome();
              }}
              disabled={locked}
              testID="btn-decline-time"
            >
              <Text style={[styles.btnText, { color: theme.danger }]}>Give Up (-1 Life)</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  if (active?.status === 'lost') {
    return (
      <Modal transparent animationType="fade" onRequestClose={goHome}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.title, { color: theme.danger }]}>{state.lives > 0 ? 'Try again' : 'No lives left'}</Text>
            <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 14, fontSize: 13, lineHeight: 20 }}>
              {state.lives > 0 ? `${state.lives} lives remaining. Your level is ready for another try.` : 'Watch a completed ad for one life, or return after midnight for five lives.'}
            </Text>
            
            <Pressable 
              style={[styles.btn, { backgroundColor: theme.primary, marginTop: 32 }]} 
              onPress={async () => {
                if (state.lives < 1 && !await run(game.gainLifeByAd)) return;
                await run(() => startLevel(active.levelId));
              }}
              disabled={locked || (state.lives < 1 && !game.adsAvailable)}
              testID="btn-retry-level"
            >
              <Ionicons name="refresh" size={24} color="#FFF" />
              <Text style={styles.btnText}>{state.lives > 0 ? 'Retry Level' : game.adsAvailable ? 'Get a life (Ad)' : 'Ad unavailable'}</Text>
            </Pressable>
            {state.lives < 1 && unavailable}
            {feedback}

            <Pressable style={{ marginTop: 24, padding: 8 }} onPress={goHome}>
              <Text style={{ color: theme.textMuted, fontWeight: '700', fontSize: 16 }}>Back to Home</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}

function Stat({ icon, value, label, theme }: any) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon === 'coin' ? <CoinIcon size={22} /> : <Ionicons name={icon} size={22} color={theme.text} />}
        <Text style={{ fontSize: 24, fontWeight: '900', color: theme.text }}>{value}</Text>
      </View>
      <Text style={{ fontSize: 13, color: theme.textMuted, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  stars: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 18,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingVertical: 16,
    borderRadius: 16,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
  },
  btnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  }
});
