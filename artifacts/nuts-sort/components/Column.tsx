import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Nut } from './Nut';
import { Bolt } from './Bolt';
import { useNutPalette } from '@/hooks/useThemeColors';

interface ColumnProps {
  index: number;
  nuts: number[]; // Array of color IDs
  capacity: number;
  isSelected: boolean;
  onTap: (index: number) => void;
  isHintTarget: boolean;
  isHintSource: boolean;
}

export function Column({ index, nuts, capacity, isSelected, onTap, isHintTarget, isHintSource }: ColumnProps) {
  const palette = useNutPalette();
  
  // Nut height approx 33px effective (60 * 0.55), bolt should be tall enough for capacity + 1 (for empty space)
  const nutSize = 60;
  const effectiveNutHeight = nutSize * 0.55 + 2; // + margin
  const boltHeight = (capacity + 0.5) * effectiveNutHeight;

  return (
    <Pressable onPress={() => onTap(index)} style={styles.container}>
      <View style={{ height: boltHeight, width: nutSize, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={StyleSheet.absoluteFill}>
          <Bolt height={boltHeight} width={nutSize} />
        </View>
        
        {/* Render nuts from bottom to top */}
        <View style={styles.nutsContainer}>
          {nuts.map((colorId, i) => {
            const isTop = i === nuts.length - 1;
            const nutIsSelected = isTop && isSelected;
            const isHint = (isTop && isHintSource) || (isHintTarget && isTop);
            
            return (
              <Nut
                key={`${index}-${i}-${colorId}`}
                color={palette[colorId % palette.length]}
                isSelected={nutIsSelected}
                isHint={isHint}
                size={nutSize}
              />
            );
          })}
          
          {/* If it's a hint target but empty, we can show a ghost nut or just rely on the column highlight */}
          {nuts.length === 0 && isHintTarget && (
             <View style={{ opacity: 0.3 }}>
               <Nut color={palette[0]} size={nutSize} isHint={true} />
             </View>
          )}
        </View>
      </View>
      
      {/* Selection/Hint indicator at the base */}
      {(isSelected || isHintSource || isHintTarget) && (
        <View style={[
          styles.indicator, 
          { backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.5)' : 'rgba(16, 185, 129, 0.5)' }
        ]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginVertical: 16,
    alignItems: 'center',
    paddingBottom: 20, // For base
  },
  nutsContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 5,
  },
  indicator: {
    position: 'absolute',
    bottom: 5,
    width: 60,
    height: 10,
    borderRadius: 5,
  }
});
