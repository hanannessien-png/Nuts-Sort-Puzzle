import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '@/game/GameProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Panel, GlossButton, shade } from '@/components/premium/UI';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function LifeRefillModal({ visible, onClose }: Props) {
  const game = useGame();
  const theme = useThemeColors();
  if (!visible) return null;
  const lives = game.state?.lives ?? 0;
  const handleWatchAd = async () => { await game.gainLifeByAd(); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Panel padding={22} style={styles.card}>
          <Pressable onPress={onClose} style={styles.close} accessibilityLabel="Close" hitSlop={8}>
            <Ionicons name="close" size={24} color={theme.textMuted} />
          </Pressable>
          <LinearGradient colors={['#FF8A96', '#E8384A', '#A81F30']} style={styles.heart}>
            <Ionicons name="heart" size={46} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.title, { color: theme.text }]}>{lives > 0 ? 'Lives' : 'Out of Lives'}</Text>
          <View style={styles.hearts}>
            {[1, 2, 3, 4, 5].map(i => (
              <Ionicons key={i} name="heart" size={28} color={i <= lives ? '#E8384A' : shade(theme.surface, -0.18)} />
            ))}
          </View>
          <Text style={[styles.count, { color: theme.text }]}>{lives} / 5</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>Watch a short video ad to refill 1 life and keep playing.</Text>
          <GlossButton
            title={!game.adsAvailable ? 'UNAVAILABLE IN PREVIEW' : game.adBusy ? 'LOADING' : lives >= 5 ? 'MAX LIVES' : '+1 LIFE'}
            icon={game.adsAvailable && lives < 5 ? 'play' : undefined} size="lg" color="#3FB24F"
            onPress={handleWatchAd} disabled={!game.adsAvailable || game.adBusy || lives >= 5} />
          {!game.adsAvailable && <Text style={[styles.small, { color: theme.textMuted }]}>{game.adStatus}</Text>}
        </Panel>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(6,8,14,0.78)', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 360, alignSelf: 'center' },
  close: { position: 'absolute', top: 0, right: 0, padding: 4, zIndex: 2 },
  heart: { width: 84, height: 84, borderRadius: 42, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center' },
  hearts: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 12 },
  count: { textAlign: 'center', fontWeight: '900', fontSize: 15, marginTop: 4, fontVariant: ['tabular-nums'] },
  body: { textAlign: 'center', fontSize: 14, lineHeight: 20, marginVertical: 16 },
  small: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 8 },
});
