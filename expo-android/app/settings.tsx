import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch, ScrollView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '@/game/GameProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { THEMES } from '@/constants/theme';
import { AdPrivacySettings } from '@/components/AdPrivacySettings';
import { AdBanner } from '@/components/AdBanner';
import { Backdrop } from '@/components/premium/Backdrop';
import { ScreenHeader, Panel, GOLD, shade, IconName } from '@/components/premium/UI';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const theme = useThemeColors();
  const { state, updateSettings, equipItem } = game;
  const settings = state.settings;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Backdrop image="w2" strength={0.8} />
      <ScreenHeader title="SETTINGS" top={insets.top + (Platform.OS === 'web' ? 24 : 8)} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.section}>PREFERENCES</Text>
        <Panel padding={6}>
          <SettingToggle icon="volume-high" color="#3E8EF0" label="Sound Effects" value={settings.sound} onValueChange={v => updateSettings({ sound: v })} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingToggle icon="phone-portrait" color="#B350D8" label="Haptics" value={settings.haptics} onValueChange={v => updateSettings({ haptics: v })} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingToggle icon="text" color="#2FA36B" label="Color Labels" hint="Letters on nuts for accessibility" value={settings.colorLabels} onValueChange={v => updateSettings({ colorLabels: v })} />
        </Panel>

        <Text style={styles.section}>APP THEME</Text>
        <Panel padding={14}>
          <View style={styles.themeGrid}>
            {game.catalog.filter(i => i.category === 'themes' && state.owned.includes(i.id)).map(item => {
              const on = state.equipped.themes === item.id;
              const t = THEMES[item.appearance] || THEMES.default;
              return (
                <Pressable key={item.id} onPress={() => equipItem(item.id)} style={({ pressed }) => [styles.themeCell, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
                  <View style={[styles.themePreview, { backgroundColor: t.background, borderColor: on ? GOLD : t.border }]}>
                    <LinearGradient colors={[shade(t.primary, 0.2), t.primary]} style={styles.themeBar} />
                    <View style={[styles.themeSurface, { backgroundColor: t.surface }]}>
                      <View style={[styles.themeDot, { backgroundColor: t.danger }]} />
                      <View style={[styles.themeDot, { backgroundColor: t.warning }]} />
                      <View style={[styles.themeDot, { backgroundColor: t.success }]} />
                    </View>
                    {on && <View style={styles.check}><Ionicons name="checkmark" size={14} color="#3D2400" /></View>}
                  </View>
                  <Text style={[styles.themeName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={() => router.push('/shop')} style={styles.more}>
            <Text style={[styles.moreText, { color: theme.primary }]}>More themes in the Shop</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.primary} />
          </Pressable>
        </Panel>

        <Text style={styles.section}>PRIVACY</Text>
        <Panel padding={12}>
          <AdPrivacySettings />
        </Panel>
      </ScrollView>
      <AdBanner />
    </View>
  );
}

function SettingToggle({ icon, color, label, hint, value, onValueChange }: { icon: IconName; color: string; label: string; hint?: string; value: boolean; onValueChange: (v: boolean) => void }) {
  const theme = useThemeColors();
  return (
    <View style={styles.row}>
      <LinearGradient colors={[shade(color, 0.3), color, shade(color, -0.3)]} style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color="#FFF" />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowText, { color: theme.text }]}>{label}</Text>
        {hint && <Text style={[styles.rowHint, { color: theme.textMuted }]}>{hint}</Text>}
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: theme.border, true: '#3FB24F' }} thumbColor="#F7F8FA" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#11141E' },
  content: { paddingHorizontal: 16, paddingBottom: 48 },
  section: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginTop: 18, marginBottom: 8, marginLeft: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowText: { fontSize: 16, fontWeight: '800' },
  rowHint: { fontSize: 12, marginTop: 1 },
  divider: { height: 1, marginLeft: 58, opacity: 0.7 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  themeCell: { width: 88, alignItems: 'center' },
  themePreview: { width: 88, height: 112, borderRadius: 18, borderWidth: 2.5, padding: 8, gap: 8 },
  themeBar: { height: 16, borderRadius: 6 },
  themeSurface: { flex: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4, paddingBottom: 8 },
  themeDot: { width: 12, height: 12, borderRadius: 6 },
  check: { position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  themeName: { fontSize: 12, fontWeight: '800', marginTop: 6 },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 14, padding: 4 },
  moreText: { fontWeight: '800', fontSize: 13 },
});
