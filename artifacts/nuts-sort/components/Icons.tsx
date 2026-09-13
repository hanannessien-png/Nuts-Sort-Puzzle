import React from 'react';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';

export function CoinIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <RadialGradient id="coinGrad" cx="12" cy="12" r="12" fx="8" fy="8">
          <Stop offset="0" stopColor="#FDE047" stopOpacity="1" />
          <Stop offset="0.7" stopColor="#D97706" stopOpacity="1" />
          <Stop offset="1" stopColor="#92400E" stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id="innerGrad" cx="12" cy="12" r="8" fx="12" fy="8">
          <Stop offset="0" stopColor="#F59E0B" stopOpacity="1" />
          <Stop offset="1" stopColor="#B45309" stopOpacity="1" />
        </RadialGradient>
      </Defs>
      
      {/* Outer rim */}
      <Circle cx="12" cy="12" r="11" fill="url(#coinGrad)" stroke="#78350F" strokeWidth="1" />
      {/* Inner sunken face */}
      <Circle cx="12" cy="12" r="8" fill="url(#innerGrad)" />
      
      {/* Decorative center (a subtle hexagon for "nuts") */}
      <Path 
        d="M 12 7 L 16 9.5 L 16 14.5 L 12 17 L 8 14.5 L 8 9.5 Z" 
        fill="#FDE047" 
        opacity="0.9" 
        stroke="#92400E"
        strokeWidth="0.5"
      />
      {/* Center hole */}
      <Circle cx="12" cy="12" r="2.5" fill="#78350F" />
    </Svg>
  );
}
