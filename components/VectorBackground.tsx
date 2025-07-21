import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface VectorBackgroundProps {
  screenIndex: number;
}

// Edge/corner positions for bubbles
const bubblePositions = [
  // Top left
  { top: 30, left: 20 },
  { top: 80, left: 40 },
  // Top right
  { top: 40, right: 30 },
  { top: 120, right: 10 },
  // Bottom left
  { bottom: 40, left: 10 },
  { bottom: 120, left: 40 },
  // Bottom right
  { bottom: 30, right: 30 },
  { bottom: 100, right: 60 },
  // Sides
  { top: height / 2 - 100, left: 10 },
  { top: height / 2 + 60, right: 10 },
];

export default function VectorBackground({ screenIndex }: VectorBackgroundProps) {
  // Animate each bubble
  const animatedValues = useRef(bubblePositions.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = animatedValues.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 3500 + index * 200,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 3500 + index * 200,
            useNativeDriver: true,
          }),
        ])
      )
    );
    animations.forEach(anim => anim.start());
    return () => { animations.forEach(anim => anim.stop()); };
  }, [screenIndex]);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }} pointerEvents="none">
      {bubblePositions.map((pos, i) => (
        <Animated.View
          key={i}
          style={[
            {
              position: 'absolute',
              width: 48 + (i % 3) * 16, // 48, 64, 80
              height: 48 + (i % 3) * 16,
              borderRadius: 100,
              backgroundColor: 'rgba(255,255,255,0.07)',
              opacity: 0.7 - (i % 4) * 0.15, // Vary opacity
              ...pos,
              transform: [
                {
                  translateY: animatedValues[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -12 - (i % 3) * 6],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
} 