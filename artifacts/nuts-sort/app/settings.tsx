import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/game/GameProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { THEMES } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

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
      
      <LinearGradient 
        colors={[`${theme.surface}00`, `${theme.surface}60`, theme.background]} 
        style={StyleSheet.absoluteFill} 
        pointerEvents="none"
      />
      
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={32} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>SETTINGS</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Preferences</Text>
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
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
        <View style={[styles.section, { backgroundColor: theme.surface, padding: 20, borderColor: theme.border, borderWidth: 1 }]}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
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
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
                    <View style={[styles.themeDot, { backgroundColor: t.primary }]} />
                    <View style={[styles.themeDot, { backgroundColor: t.danger }]} />
                  </View>
                  {isActive && (
                    <View style={[styles.activeCheck, { backgroundColor: t.primary }]}>
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    </View>
                  )}
                  <Text style={[styles.themeName, { color: t.text }]}>{item.name}</Text>
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
    paddingBottom: 24,
    zIndex: 10,
  },
  backBtn: { padding: 8 },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  content: { padding: 24, paddingBottom: 60 },
  section: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '800',
  },
  divider: { height: 1, marginLeft: 60 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  themePreview: {
    width: 90,
    height: 125,
    borderRadius: 20,
    borderWidth: 2,
    padding: 12,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  themeSurface: {
    width: '100%',
    height: 44,
    borderRadius: 10,
  },
  themeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  activeCheck: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  themeName: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  }
});
