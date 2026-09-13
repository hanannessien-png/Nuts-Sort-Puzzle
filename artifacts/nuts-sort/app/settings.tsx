import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/game/GameProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { THEMES } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const theme = useThemeColors();
  
  const { state, updateSettings, equipItem } = game;
  const settings = state.settings;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <SettingToggle 
            icon="volume-high" 
            label="Sound Effects" 
            value={settings.sound} 
            onValueChange={(val: boolean) => updateSettings({ sound: val })} 
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingToggle 
            icon="hardware-chip" 
            label="Haptics" 
            value={settings.haptics} 
            onValueChange={(val: boolean) => updateSettings({ haptics: val })} 
            theme={theme}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingToggle 
            icon="color-palette" 
            label="Color Labels (Accessibility)" 
            value={settings.colorLabels} 
            onValueChange={(val: boolean) => updateSettings({ colorLabels: val })} 
            theme={theme}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>App Theme</Text>
        <View style={[styles.section, { backgroundColor: theme.surface, padding: 16 }]}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {game.catalog.filter(item => item.category === 'themes' && state.owned.includes(item.id)).map((item) => {
              const isActive = state.equipped.themes === item.id;
              const t = THEMES[item.appearance] || THEMES.default;
              return (
                <Pressable 
                  key={item.id} 
                  onPress={() => equipItem(item.id)}
                  style={[
                    styles.themePreview, 
                    { backgroundColor: t.background, borderColor: isActive ? t.primary : t.border }
                  ]}
                >
                  <View style={[styles.themeSurface, { backgroundColor: t.surface }]} />
                  <View style={{ flexDirection: 'row', gap: 4, marginTop: 8 }}>
                    <View style={[styles.themeDot, { backgroundColor: t.primary }]} />
                    <View style={[styles.themeDot, { backgroundColor: t.danger }]} />
                  </View>
                  {isActive && (
                    <View style={[styles.activeCheck, { backgroundColor: t.primary }]}>
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingToggle({ icon, label, value, onValueChange, theme }: any) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLabel}>
        <Ionicons name={icon} size={24} color={theme.text} />
        <Text style={[styles.settingText, { color: theme.text }]}>{label}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={(val: boolean) => onValueChange(val)} 
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={value ? '#FFF' : '#FFF'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: { padding: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  content: { padding: 16 },
  section: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: { height: 1, marginLeft: 52 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  themePreview: {
    width: 80,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    padding: 8,
    position: 'relative',
  },
  themeSurface: {
    width: '100%',
    height: 40,
    borderRadius: 6,
  },
  themeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  activeCheck: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  }
});
