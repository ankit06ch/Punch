import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface VectorBackgroundProps {
  screenIndex: number;
}

export default function VectorBackground({ screenIndex }: VectorBackgroundProps) {
  const animatedValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Create floating animation for each shape
    const animations = animatedValues.map((value, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 3000 + index * 500,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 3000 + index * 500,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach(animation => animation.start());

    return () => {
      animations.forEach(animation => animation.stop());
    };
  }, [screenIndex]);

  const getShapesForScreen = (index: number) => {
    const shapes = [
      // Screen 1: Welcome - Coffee cup shapes
      [
        { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)', top: '20%', right: -20 },
        { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.06)', top: '60%', left: -15 },
        { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.07)', bottom: '25%', right: 15 },
      ],
      // Screen 2: Discover - Map/location shapes
      [
        { width: 120, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.08)', top: '15%', right: -30 },
        { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.06)', top: '50%', left: -25 },
        { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.07)', bottom: '20%', right: 10 },
        { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)', bottom: '60%', left: 20 },
      ],
      // Screen 3: Earn - Reward/gift shapes
      [
        { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.08)', top: '10%', right: -25 },
        { width: 75, height: 75, borderRadius: 37.5, backgroundColor: 'rgba(255,255,255,0.06)', top: '45%', left: -20 },
        { width: 85, height: 85, borderRadius: 42.5, backgroundColor: 'rgba(255,255,255,0.07)', bottom: '30%', right: 5 },
        { width: 65, height: 65, borderRadius: 32.5, backgroundColor: 'rgba(255,255,255,0.05)', bottom: '15%', left: 15 },
      ],
      // Screen 4: Community - Connection shapes
      [
        { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)', top: '20%', right: -20 },
        { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)', top: '55%', left: -25 },
        { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.07)', bottom: '25%', right: 10 },
        { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.05)', bottom: '10%', left: 10 },
        { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.06)', top: '35%', right: 20 },
      ],
    ];

    return shapes[index] || shapes[0];
  };

  const shapes = getShapesForScreen(screenIndex);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
      {shapes.map((shape, index) => (
        <Animated.View
          key={index}
          style={[
            shape as any,
            {
              transform: [
                {
                  translateY: animatedValues[index]?.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  }) || 0,
                },
                {
                  scale: animatedValues[index]?.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.1, 1],
                  }) || 1,
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
} 