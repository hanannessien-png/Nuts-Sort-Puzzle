import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CoinIcon } from '@/components/Icons';

export type IconName = keyof typeof Ionicons.glyphMap;

/** Lighten (amt>0) or darken (amt<0) a #RRGGBB color. */
export function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '');
  if (h.length < 6) return hex;
  const n = parseInt(h.slice(0, 6), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt))));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function isDark(hex: string): boolean {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  const l = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return l < 140;
}

export const GOLD = '#F2B53A';

/** Glossy 3D game button with metallic lip and top sheen. */
export function GlossButton({
  title, subtitle, onPress, color, icon, size = 'lg', disabled, testID, style, right,
}: {
  title: string; subtitle?: string; onPress?: () => void; color: string; icon?: IconName;
  size?: 'xl' | 'lg' | 'md' | 'sm'; disabled?: boolean; testID?: string; style?: StyleProp<ViewStyle>;
  right?: React.ReactNode;
}) {
  const h = size === 'xl' ? 76 : size === 'lg' ? 60 : size === 'md' ? 50 : 40;
  const fs = size === 'xl' ? 28 : size === 'lg' ? 20 : size === 'md' ? 16 : 13;
  const r = h / 2.6;
  const base = disabled ? '#8A8F99' : color;
  const textColor = isDark(base) || !disabled ? '#FFFFFF' : '#1E2230';
  return (
    <Pressable onPress={onPress} disabled={disabled} testID={testID} style={[{ height: h + 6 }, style]}>
      {({ pressed }) => (
        <View style={{ flex: 1 }}>
          <View style={[StyleSheet.absoluteFill, { top: 6, borderRadius: r, backgroundColor: shade(base, -0.45) }]} />
          <View style={{ height: h, borderRadius: r, overflow: 'hidden', transform: [{ translateY: pressed ? 5 : 0 }] }}>
            <LinearGradient colors={[shade(base, 0.28), base, shade(base, -0.18)]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.05)']}
              style={{ position: 'absolute', top: 3, left: 10, right: 10, height: h * 0.42, borderRadius: r }} />
            <View style={[StyleSheet.absoluteFill, { borderRadius: r, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' }]} />
            <View style={styles.btnRow}>
              {icon && <Ionicons name={icon} size={fs + 4} color={textColor} style={styles.textShadowIcon} />}
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.btnText, { fontSize: fs, color: textColor }]} numberOfLines={1}>{title}</Text>
                {subtitle ? <Text style={[styles.btnSub, { color: textColor }]} numberOfLines={1}>{subtitle}</Text> : null}
              </View>
              {right}
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

/** Raised beveled panel tinted from the active theme surface. */
export function Panel({ children, style, padding = 16, glow }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; padding?: number; glow?: string }) {
  const t = useThemeColors();
  const dark = isDark(t.surface);
  return (
    <View style={[styles.panelOuter, { borderColor: glow ?? (dark ? shade(t.surface, 0.12) : '#FFFFFF') }, style]}>
      <LinearGradient colors={[dark ? shade(t.surface, 0.08) : t.surface, dark ? shade(t.surface, -0.15) : shade(t.surface, -0.05)]} style={StyleSheet.absoluteFill} />
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

/** Round metallic icon button. */
export function MetalIconButton({ icon, onPress, testID, label, disabled, size = 46 }: { icon: IconName; onPress: () => void; testID?: string; label?: string; disabled?: boolean; size?: number }) {
  return (
    <Pressable onPress={onPress} testID={testID} accessibilityLabel={label} disabled={disabled} hitSlop={6}
      style={({ pressed }) => ({ width: size, height: size, opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] })}>
      <LinearGradient colors={['#F4F6FA', '#B9C0CC', '#7D8696']} style={[styles.metalRing, { borderRadius: size / 2 }]}>
        <LinearGradient colors={['#2D3446', '#1A1F2C']} style={{ flex: 1, margin: 3, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={size * 0.46} color="#F3F5FA" />
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
}

/** Dark glass HUD pill with a metallic icon socket. */
export function HudPill({ icon, value, onPress, plus, testID }: { icon: React.ReactNode; value: string | number; onPress?: () => void; plus?: boolean; testID?: string }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} testID={testID} style={({ pressed }) => [styles.hud, pressed && { opacity: 0.8 }]}>
      <View style={styles.hudIcon}>{icon}</View>
      <Text style={styles.hudText}>{value}</Text>
      {plus && (
        <LinearGradient colors={['#7CE07A', '#2F9E44']} style={styles.hudPlus}>
          <Ionicons name="add" size={14} color="#FFF" />
        </LinearGradient>
      )}
    </Pressable>
  );
}

export function CoinPill({ coins }: { coins: number }) {
  return <HudPill icon={<CoinIcon size={24} />} value={coins} />;
}

export function Stars({ count, size = 12, gap = 1, empty = 'rgba(0,0,0,0.25)' }: { count: number; size?: number; gap?: number; empty?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Ionicons key={s} name="star" size={size} color={s <= count ? GOLD : empty} />
      ))}
    </View>
  );
}

/** Screen title row for secondary screens. */
export function ScreenHeader({ title, onBack, right, top }: { title: string; onBack: () => void; right?: React.ReactNode; top: number }) {
  return (
    <View style={[styles.header, { paddingTop: top }]}>
      <MetalIconButton icon="chevron-back" onPress={onBack} label="Back" />
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ minWidth: 46, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export const styles = StyleSheet.create({
  btnRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 16 },
  btnText: { fontWeight: '900', letterSpacing: 1.2, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 },
  btnSub: { fontSize: 11, fontWeight: '700', opacity: 0.9, marginTop: -1 },
  textShadowIcon: { textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 },
  panelOuter: {
    borderRadius: 22, borderWidth: 1.5, overflow: 'hidden',
    shadowColor: '#0A0C14', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  metalRing: { flex: 1, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  hud: {
    flexDirection: 'row', alignItems: 'center', height: 38, paddingLeft: 3, paddingRight: 12, borderRadius: 19,
    backgroundColor: 'rgba(14,17,28,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', gap: 8,
  },
  hudIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  hudText: { color: '#FFF', fontSize: 17, fontWeight: '900', fontVariant: ['tabular-nums'], minWidth: 18 },
  hudPlus: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: -6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: {
    color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 2.5,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 4,
  },
});
