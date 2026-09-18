import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TactileCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  variant?: 'inset' | 'outset';
  color?: string;
  padding?: number;
}

export function TactileCard({ children, onPress, style, variant = 'outset', color = '#FFFFFF', padding = 20 }: TactileCardProps) {
  const CardContent = (
    <View style={[styles.inner, { backgroundColor: color, padding }]}>
      {variant === 'inset' && (
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'transparent']}
          style={styles.insetShadow}
          pointerEvents="none"
        />
      )}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable 
        onPress={onPress} 
        style={({ pressed }) => [
          styles.container,
          variant === 'outset' ? styles.outset : styles.inset,
          pressed && variant === 'outset' && styles.pressed,
          style
        ]}
      >
        {CardContent}
      </Pressable>
    );
  }

  return (
    <View style={[
      styles.container, 
      variant === 'outset' ? styles.outset : styles.inset,
      style
    ]}>
      {CardContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  outset: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  inset: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderTopWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  inner: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    transform: [{ translateY: 2 }],
    borderBottomWidth: 2,
    shadowOffset: { width: 0, height: 2 },
  },
  insetShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    zIndex: 1,
  }
});
