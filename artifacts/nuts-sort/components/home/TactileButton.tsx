import React from 'react';
import { Pressable, Text, StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface TactileButtonProps {
  title: string;
  onPress: () => void;
  color: string;
  shadowColor: string;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'large' | 'medium' | 'small';
}

export function TactileButton({ title, onPress, color, shadowColor, icon, size = 'large' }: TactileButtonProps) {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4], // Press down distance
  });

  const height = size === 'large' ? 64 : size === 'medium' ? 48 : 40;
  const fontSize = size === 'large' ? 22 : size === 'medium' ? 16 : 14;
  const iconSize = size === 'large' ? 28 : size === 'medium' ? 20 : 16;
  const borderRadius = size === 'large' ? 32 : 16;

  return (
    <View style={[styles.container, { height: height + 4, borderRadius }]}>
      {/* 3D Base/Shadow */}
      <View style={[styles.base, { backgroundColor: shadowColor, borderRadius, top: 4 }]} />
      
      <Animated.View style={{ transform: [{ translateY }] }}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
        >
          <LinearGradient
            colors={[color, color]} // Solid for clean look
            style={[styles.button, { height, borderRadius }]}
          >
            {icon && (
              <Ionicons name={icon} size={iconSize} color="#FFF" style={styles.icon} />
            )}
            <Text style={[styles.text, { fontSize }]}>{title}</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  base: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  text: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  icon: {
    marginRight: 8,
  },
});
