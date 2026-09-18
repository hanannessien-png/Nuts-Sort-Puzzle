import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, useReducedMotion } from 'react-native-reanimated';
import { Nut } from './Nut';
import { Bolt } from './Bolt';
import { useNutPalette, useThemeColors } from '@/hooks/useThemeColors';
import type { BoardGeometry } from './boardGeometry';

interface ColumnProps {
  index: number;
  nuts: number[];
  geometry: BoardGeometry;
  selected: boolean;
  disabled: boolean;
  hintSource: boolean;
  hintTarget: boolean;
  colorLabels: boolean;
  hiddenRow?: number;
  onTap: (index: number) => void;
}

export function Column({ index, nuts, geometry: g, selected, disabled, hintSource, hintTarget, colorLabels, hiddenRow, onTap }: ColumnProps) {
  const palette = useNutPalette();
  const theme = useThemeColors();
  return (
    <Pressable
      testID={`column-${index}`}
      accessibilityRole="button"
      accessibilityLabel={`Column ${index + 1}; bottom to top: ${nuts.join(',') || 'empty'}; top: ${nuts.at(-1) ?? 'empty'}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => onTap(index)}
      style={{ position: 'absolute', left: g.x(index) - 7, top: g.rowTop(index), width: g.cell, height: g.rowHeight, zIndex: selected ? 20 : 1 }}
    >
      <View testID={`bolt-${index}`} pointerEvents="none" style={{ position: 'absolute', top: g.tipY, left: 7 }}>
        <Bolt height={g.rodHeight} width={g.nutSize} />
      </View>
      {nuts.map((color, row) => (
        <StackNut
          key={`${row}-${color}`}
          testID={`nut-${index}-${row}`}
          color={palette[color % palette.length]}
          label={colorLabels ? String.fromCharCode(65 + color) : undefined}
          y={g.y(row)}
          liftY={g.liftY}
          size={g.nutSize}
          selected={selected && row === nuts.length - 1}
          hidden={hiddenRow === row}
          zIndex={row + 1}
        />
      ))}
      <View pointerEvents="none" style={[styles.marker, {
        top: g.baseY + 10,
        backgroundColor: selected ? theme.primary : hintSource || hintTarget ? theme.success : 'transparent',
      }]}>
        <Text style={{ color: selected || hintSource || hintTarget ? theme.surface : theme.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
          {hintSource ? 'FROM' : hintTarget ? 'TO' : String(index + 1).padStart(2, '0')}
        </Text>
      </View>
    </Pressable>
  );
}

function StackNut({ color, label, testID, y, liftY, size, selected, hidden, zIndex }: {
  color: string; label?: string; testID: string; y: number; liftY: number; size: number;
  selected: boolean; hidden: boolean; zIndex: number;
}) {
  const reduced = useReducedMotion();
  const offset = useSharedValue(selected ? liftY - y : 0);
  useEffect(() => {
    offset.value = withTiming(selected ? liftY - y : 0, { duration: reduced ? 0 : 180 });
  }, [selected, liftY, y, reduced, offset]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  return (
    <Animated.View testID={testID} pointerEvents="none" style={[{
      position: 'absolute', top: y, left: 7, opacity: hidden ? 0 : 1,
      zIndex: selected ? 100 : zIndex,
    }, animated]}>
      <Nut color={color} size={size} label={label} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  marker: { position: 'absolute', alignSelf: 'center', minWidth: 32, paddingHorizontal: 6, height: 21, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});