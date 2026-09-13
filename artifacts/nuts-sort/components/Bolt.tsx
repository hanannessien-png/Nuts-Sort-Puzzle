import React, { useId } from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { View } from 'react-native';
import { useBaseAppearance, useBoltAppearance } from '@/hooks/useThemeColors';

interface BoltProps {
  height: number;
  width?: number;
}

export function Bolt({ height, width = 60 }: BoltProps) {
  const gradientId = `bolt-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const baseAppearance = useBaseAppearance();
  const boltAppearance = useBoltAppearance();
  
  const boltColor = boltAppearance === 'brass' ? '#FBBF24' : boltAppearance === 'silver' ? '#F8FAFC' : '#94A3B8';
  const boltShadow = boltAppearance === 'brass' ? '#B45309' : boltAppearance === 'silver' ? '#94A3B8' : '#475569';
  
  const baseColor = baseAppearance === 'walnut' ? '#8B5A2B' : baseAppearance === 'marble' ? '#F1F5F9' : '#64748B';

  return (
    <View style={{ width, height, position: 'relative', alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* Base platform */}
      <Svg width={width + 20} height={30} viewBox={`0 0 ${width + 20} 30`} style={{ position: 'absolute', bottom: -15, zIndex: 0 }}>
        <Defs>
          <LinearGradient id={`${gradientId}-base`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={baseColor} stopOpacity="1" />
            <Stop offset="1" stopColor="#334155" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="10" width={width + 20} height={20} rx="10" fill={`url(#${gradientId}-base)`} />
        <Rect x="5" y="5" width={width + 10} height={10} rx="5" fill={baseColor} opacity={0.8} />
      </Svg>

      {/* Threaded rod */}
      <Svg width={30} height={height} viewBox={`0 0 30 ${height}`} style={{ zIndex: 0 }}>
        <Defs>
          <LinearGradient id={`${gradientId}-rod`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={boltShadow} stopOpacity="1" />
            <Stop offset="0.3" stopColor={boltColor} stopOpacity="1" />
            <Stop offset="0.7" stopColor={boltColor} stopOpacity="1" />
            <Stop offset="1" stopColor={boltShadow} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="5" y="0" width="20" height={height} fill={`url(#${gradientId}-rod)`} />
        
        {/* Draw threads */}
        {Array.from({ length: Math.floor(height / 10) }).map((_, i) => (
          <Path
            key={i}
            d={`M 5 ${i * 10} L 25 ${i * 10 + 5}`}
            stroke={boltShadow}
            strokeWidth="2"
            opacity={0.5}
          />
        ))}
        {/* Top of bolt rounded */}
        <Path d="M 5 0 Q 15 -10 25 0 Z" fill={boltShadow} />
      </Svg>
    </View>
  );
}
