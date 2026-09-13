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
            <Ionicons name="close" size={24} color={theme.textMuted} />
          </Pressable>
          
          <Ionicons name="heart" size={48} color={theme.danger} style={{ alignSelf: 'center', marginBottom: 12 }} />
          <Text style={[styles.title, { color: theme.text }]}>Out of Lives?</Text>
          
          <View style={[styles.livesBox, { backgroundColor: theme.danger + '20' }]}>
            <Text style={{ color: theme.danger, fontWeight: 'bold', fontSize: 16 }}>
              {game.state?.lives ?? 0} / 5 Lives
            </Text>
          </View>
          
          <Text style={{ textAlign: 'center', color: theme.textMuted, marginBottom: 24, paddingHorizontal: 16 }}>
            Watch a short video ad to refill 1 life and keep playing.
          </Text>
          
          <Pressable 
            style={[styles.btn, { backgroundColor: game.adsAvailable ? theme.primary : theme.border }]}
            onPress={handleWatchAd}
            disabled={!game.adsAvailable || game.adBusy || (game.state?.lives ?? 0) >= 5}
          >
            <Ionicons name="play" size={20} color="#FFF" />
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
              {!game.adsAvailable ? 'Ad unavailable in preview' : game.adBusy ? 'Loading...' : (game.state?.lives ?? 0) >= 5 ? 'Max Lives Reached' : '+1 Life (Ad)'}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  livesBox: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 16,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
  }
});