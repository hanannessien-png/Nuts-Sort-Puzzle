import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface DimensionalNutProps {
  color: string;
  size?: number;
  style?: any;
}

export function DimensionalNut({ color, size = 40, style }: DimensionalNutProps) {
  return (
    <View style={[styles.container, { width: size, height: size * 0.4 }, style]}>
      {/* Outer Hexagon/Circle approximation */}
      <View style={[styles.outer, { backgroundColor: color }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.4)', 'rgba(0,0,0,0.3)']}
          style={StyleSheet.absoluteFill}
        />
        {/* Inner Hole */}
        <View style={styles.innerHole}>
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.1)']}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>
      
      {/* Side thickness (fake 3D) */}
      <View style={[styles.side, { backgroundColor: color, height: size * 0.15 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outer: {
    width: '100%',
    height: '100%',
    borderRadius: 8, // slight rounding for smooth nut
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  innerHole: {
    width: '40%',
    height: '40%',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  side: {
    position: 'absolute',
    bottom: -6,
    width: '98%',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 1,
    opacity: 0.8,
  }
});
