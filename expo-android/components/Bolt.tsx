import React, { useId } from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Ellipse } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';
import { useBaseAppearance, useBoltAppearance } from '@/hooks/useThemeColors';

interface BoltProps {
  height: number;
  width?: number;
}

export function Bolt({ height, width = 60 }: BoltProps) {
  const gradientId = `bolt-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const baseAppearance = useBaseAppearance();
  const boltAppearance = useBoltAppearance();
  
  const boltColor = boltAppearance === 'brass' ? '#D49A36' : boltAppearance === 'silver' ? '#EAE6DF' : '#A39D98';
  const boltShadow = boltAppearance === 'brass' ? '#8C5A18' : boltAppearance === 'silver' ? '#A39D98' : '#403D3A';
  
  const baseColor = baseAppearance === 'walnut' ? '#4A3320' : baseAppearance === 'marble' ? '#F5F2EC' : '#403D3A';
  const baseShadow = baseAppearance === 'walnut' ? '#2A1A0F' : baseAppearance === 'marble' ? '#D4CDC4' : '#2C2A28';

  return (
    <View style={{ width, height, position: 'relative', alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* Base platform */}
      <View style={[StyleSheet.absoluteFill, { bottom: -20, alignItems: 'center', justifyContent: 'flex-end', zIndex: 0 }]}>
        <Svg width={width + 30} height={35} viewBox={`0 0 ${width + 30} 35`}>
          <Defs>
            <LinearGradient id={`${gradientId}-base`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={baseColor} stopOpacity="1" />
              <Stop offset="1" stopColor={baseShadow} stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id={`${gradientId}-base-top`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.2" />
              <Stop offset="1" stopColor={baseColor} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          
          {/* Base bottom curve */}
          <Path d={`M 0 15 A ${(width + 30)/2} 10 0 0 0 ${width + 30} 15 L ${width + 30} 25 A ${(width + 30)/2} 10 0 0 1 0 25 Z`} fill={baseShadow} />
          {/* Base Body */}
          <Rect x="0" y="15" width={width + 30} height={10} fill={`url(#${gradientId}-base)`} />
          {/* Base Top Surface */}
          <Ellipse cx={(width + 30)/2} cy="15" rx={(width + 30)/2} ry="10" fill={`url(#${gradientId}-base-top)`} />
        </Svg>
      </View>

      {/* Threaded rod */}
      <Svg width={24} height={height} viewBox={`0 0 24 ${height}`} style={{ zIndex: 0, marginBottom: 5 }}>
        <Defs>
          <LinearGradient id={`${gradientId}-rod`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={boltShadow} stopOpacity="1" />
            <Stop offset="0.2" stopColor={boltColor} stopOpacity="1" />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.6" />
            <Stop offset="0.8" stopColor={boltColor} stopOpacity="1" />
            <Stop offset="1" stopColor={boltShadow} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="2" y="10" width="20" height={height - 10} fill={`url(#${gradientId}-rod)`} />
        
        {/* Draw threads */}
        {Array.from({ length: Math.floor((height - 15) / 8) }).map((_, i) => (
          <Path
            key={i}
            d={`M 2 ${i * 8 + 15} Q 12 ${i * 8 + 20} 22 ${i * 8 + 13}`}
            stroke={boltShadow}
            strokeWidth="1.5"
            fill="none"
            opacity={0.6}
          />
        ))}
        {/* Top of bolt rounded */}
        <Path d="M 2 10 Q 12 -5 22 10 Z" fill={`url(#${gradientId}-rod)`} />
      </Svg>
    </View>
  );
}
