import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useGame } from '@/game/GameProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function LifeRefillModal({ visible, onClose }: Props) {
  const game = useGame();
  const theme = useThemeColors();
  
  if (!visible) return null;

  const handleWatchAd = async () => {
    await game.gainLifeByAd();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={theme.textMuted} />
          </Pressable>
          
          <Ionicons name="heart" size={64} color={theme.danger} style={{ alignSelf: 'center', marginBottom: 16 }} />
          <Text style={[styles.title, { color: theme.text }]}>Out of Lives?</Text>
          
          <View style={[styles.livesBox, { backgroundColor: theme.danger + '1A' }]}>
            <Text style={{ color: theme.danger, fontWeight: '800', fontSize: 18 }}>
              {game.state?.lives ?? 0} / 5 Lives
            </Text>
          </View>
          
          <Text style={{ textAlign: 'center', color: theme.textMuted, marginBottom: 32, paddingHorizontal: 16, fontSize: 16, lineHeight: 24 }}>
            Watch a short video ad to refill 1 life and keep playing your puzzle.
          </Text>
          
          <Pressable 
            style={[styles.btn, { backgroundColor: game.adsAvailable ? theme.primary : theme.border }]}
            onPress={handleWatchAd}
            disabled={!game.adsAvailable || game.adBusy || (game.state?.lives ?? 0) >= 5}
          >
            <Ionicons name="play" size={24} color="#FFF" />
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 18, letterSpacing: 1 }}>
              {!game.adsAvailable ? 'UNAVAILABLE IN PREVIEW' : game.adBusy ? 'LOADING...' : (game.state?.lives ?? 0) >= 5 ? 'MAX LIVES' : '+1 LIFE (AD)'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 48,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  livesBox: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 24,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    borderRadius: 20,
    width: '100%',
  }
});
