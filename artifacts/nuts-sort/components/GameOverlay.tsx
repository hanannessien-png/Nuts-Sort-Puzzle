import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useGame } from '@/game/GameProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function GameOverlay() {
  const game = useGame();
  const theme = useThemeColors();
  const router = useRouter();

  const { state, abandonTimeout, continueByAd, doubleReward, resetLevel, startLevel } = game;
  const { active, victory } = state;

  if (!active && !victory) return null;

  // Victory Overlay
  if (victory) {
    return (
      <Modal transparent animationType="fade">
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.title, { color: theme.success }]}>Level Complete!</Text>
            
            <View style={styles.stars}>
              {[1, 2, 3].map(s => (
                <Ionicons 
                  key={s} 
                  name="star" 
                  size={48} 
                  color={s <= victory.stars ? theme.warning : theme.border} 
                />
              ))}
            </View>

            <View style={styles.stats}>
              <Stat icon="swap-vertical" value={victory.moves} label="Moves" theme={theme} />
              <Stat icon="time-outline" value={`${victory.seconds}s`} label="Time" theme={theme} />
              <Stat icon="logo-bitcoin" value={`+${victory.reward}`} label="Coins" theme={theme} color={theme.warning} />
            </View>

            {!victory.doubled && victory.reward > 0 && game.adsAvailable && (
              <Pressable 
                style={[styles.btn, { backgroundColor: theme.primary, marginBottom: 12 }]} 
                onPress={doubleReward}
                disabled={game.adBusy}
              >
                <Ionicons name="play" size={20} color="#FFF" />
                <Text style={styles.btnText}>{game.adBusy ? 'Loading...' : 'Double Reward (Ad)'}</Text>
              </Pressable>
            )}

            <Pressable 
              style={[styles.btn, { backgroundColor: theme.success }]} 
              onPress={async () => {
                const res = await startLevel(state.unlockedLevel);
                if (res.ok) router.replace('/play');
                else router.replace('/');
              }}
            >
              <Text style={styles.btnText}>Next Level</Text>
            </Pressable>
            
            <Pressable style={{ marginTop: 16 }} onPress={() => router.replace('/')}>
              <Text style={{ color: theme.textMuted, fontWeight: '600' }}>Back to Home</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  // Timeout Overlay
  if (active?.status === 'timeout') {
    return (
      <Modal transparent animationType="fade">
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.title, { color: theme.danger }]}>Time's Up!</Text>
            
            <Ionicons name="time" size={64} color={theme.danger} style={{ marginVertical: 20 }} />

            {game.adsAvailable && (
              <Pressable 
                style={[styles.btn, { backgroundColor: theme.primary, marginBottom: 12 }]} 
                onPress={continueByAd}
                disabled={game.adBusy}
              >
                <Ionicons name="play" size={20} color="#FFF" />
                <Text style={styles.btnText}>{game.adBusy ? 'Loading...' : '+60s (Ad)'}</Text>
              </Pressable>
            )}

            <Pressable 
              style={[styles.btn, { backgroundColor: theme.surface, borderWidth: 2, borderColor: theme.danger }]} 
              onPress={() => {
                abandonTimeout();
                router.replace('/');
              }}
            >
              <Text style={[styles.btnText, { color: theme.danger }]}>Give Up (-1 Life)</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  // Lost Overlay
  if (active?.status === 'lost') {
    return (
      <Modal transparent animationType="fade">
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.title, { color: theme.danger }]}>Out of Moves</Text>
            
            <Pressable 
              style={[styles.btn, { backgroundColor: theme.primary, marginTop: 20 }]} 
              onPress={resetLevel}
            >
              <Ionicons name="refresh" size={20} color="#FFF" />
              <Text style={styles.btnText}>Retry Level</Text>
            </Pressable>

            <Pressable style={{ marginTop: 16 }} onPress={() => router.replace('/')}>
              <Text style={{ color: theme.textMuted, fontWeight: '600' }}>Back to Home</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}

function Stat({ icon, value, label, theme, color }: any) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Ionicons name={icon} size={16} color={color || theme.text} />
        <Text style={{ fontSize: 20, fontWeight: '800', color: color || theme.text }}>{value}</Text>
      </View>
      <Text style={{ fontSize: 12, color: theme.textMuted, fontWeight: '600', marginTop: 2 }}>{label}</Text>
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
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 24,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
  },
  btnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  }
});
