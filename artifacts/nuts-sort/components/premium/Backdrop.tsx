import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColors';

const IMAGES = {
  home: require('@/assets/images/home-bg.jpg'),
  w1: require('@/assets/images/world-1.jpg'),
  w2: require('@/assets/images/world-2.jpg'),
  w3: require('@/assets/images/world-3.jpg'),
  w4: require('@/assets/images/world-4.jpg'),
};

export type BackdropKey = keyof typeof IMAGES;
export const WORLD_IMAGES = [IMAGES.w1, IMAGES.w2, IMAGES.w3, IMAGES.w4];

/** Full-screen art backdrop with a theme-tinted grade so foreground panels stay readable. */
export function Backdrop({ image = 'home', strength = 0.55 }: { image?: BackdropKey; strength?: number }) {
  const t = useThemeColors();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#11141E' }]} />
      <Image source={IMAGES[image]} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient colors={[`${t.primary}33`, 'transparent', `${t.primary}22`]} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[`rgba(10,12,20,${strength * 0.6})`, `rgba(10,12,20,${strength * 0.35})`, `rgba(10,12,20,${Math.min(0.95, strength + 0.3)})`]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
