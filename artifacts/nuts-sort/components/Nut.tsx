import React, { useEffect, useId } from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, G } from 'react-native-svg';
import Animated, { useAnimatedStyle, withSpring, withTiming, Easing, useSharedValue } from 'react-native-reanimated';

interface NutProps {
  color: string;
  isSelected?: boolean;
  isHint?: boolean;
  size?: number;
}

export function Nut({ color, isSelected, isHint, size = 60 }: NutProps) {
  const gradientId = `nut-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (isSelected) {
      translateY.value = withSpring(-15, { damping: 12, stiffness: 200 });
      scale.value = withSpring(1.05, { damping: 12, stiffness: 200 });
    } else {
      translateY.value = withSpring(0, { damping: 15, stiffness: 250 });
      scale.value = withSpring(1, { damping: 15, stiffness: 250 });
    }
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value }
      ],
      opacity: isHint ? withTiming(0.6, { duration: 500, easing: Easing.inOut(Easing.ease) }) : 1,
    };
  });

  const width = size;
  const height = size * 0.55; 

  // Darker shade for sides
  const darkenColor = (hex: string, amount: number) => {
    let color = hex.replace('#', '');
    if (color.length === 3) color = color.split('').map(c => c + c).join('');
    const num = parseInt(color, 16);
    let r = (num >> 16) - amount;
    let g = ((num >> 8) & 0x00FF) - amount;
    let b = (num & 0x0000FF) - amount;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  const sideColor = darkenColor(color, 40);
  const darkSideColor = darkenColor(color, 70);

  return (
    <Animated.View style={[{ width, height, marginVertical: 1, zIndex: isSelected ? 10 : 1 }, animatedStyle]}>
      <Svg width={width} height={height} viewBox="0 0 100 55">
        <Defs>
          <LinearGradient id={`${gradientId}-top`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor={sideColor} stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id={`${gradientId}-front`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sideColor} stopOpacity="1" />
            <Stop offset="1" stopColor={darkSideColor} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Side faces - giving it thickness */}
        {/* Left side */}
        <Path d="M 5 25 L 25 15 L 25 35 L 5 45 Z" fill={darkSideColor} />
        {/* Front face */}
        <Path d="M 25 35 L 75 35 L 95 45 L 5 45 Z" fill={`url(#${gradientId}-front)`} />
        {/* Right side */}
        <Path d="M 75 15 L 95 25 L 95 45 L 75 35 Z" fill={sideColor} />

        {/* Top Hexagon Face */}
        <Path 
          d="M 25 5 L 75 5 L 95 25 L 75 45 L 25 45 L 5 25 Z" 
          fill={`url(#${gradientId}-top)`}
          stroke={darkSideColor}
          strokeWidth="1"
        />

        {/* Hole (Inner Hexagon) */}
        <Path 
          d="M 35 15 L 65 15 L 80 25 L 65 35 L 35 35 L 20 25 Z" 
          fill="#334155" // Hole looks like the bolt going through
        />
        {/* Inner shadow for the hole */}
        <Path 
          d="M 35 15 L 65 15 L 80 25 L 65 18 L 35 18 L 20 25 Z" 
          fill="#1E293B" 
        />
      </Svg>
    </Animated.View>
  );
}
