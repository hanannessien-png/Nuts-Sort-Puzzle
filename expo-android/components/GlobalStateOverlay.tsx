import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useGame } from '@/game/GameProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';

export function GlobalStateOverlay() {
  const game = useGame();
  const theme = useThemeColors();

  if (!game.loaded || game.error) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: 24 }]}>
        <Text style={{ color: theme.text, fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
          {!game.loaded && !game.error ? 'Loading...' : 'Error'}
        </Text>
        {game.error && (
          <View style={{ alignItems: 'center', width: '100%' }}>
            <Text style={{ color: theme.danger, marginBottom: 24, textAlign: 'center', fontSize: 16 }}>{game.error}</Text>
            <Pressable onPress={game.retryLoad} style={{ backgroundColor: theme.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, width: '100%', alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 18 }}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  if (game.notice) {
    return (
      <View style={[styles.toast, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]} pointerEvents="box-none">
        <Text style={{ color: theme.text, flex: 1, fontWeight: '600' }}>{game.notice}</Text>
        <Pressable onPress={game.clearNotice} style={{ padding: 4 }}>
          <Ionicons name="close" size={20} color={theme.textMuted} />
        </Pressable>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 99998,
  }
});
