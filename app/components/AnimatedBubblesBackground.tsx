import React from 'react';
import { View, Animated, Easing } from 'react-native';

function AnimatedBubblesBackground() {
  // Define animated values for each bubble
  const bubbles = [
    { size: 180, color: '#FB7A20', opacity: 0.10, left: 40, top: 80, animRange: 40, duration: 4000 },
    { size: 120, color: '#FB7A20', opacity: 0.08, left: 220, top: 200, animRange: 30, duration: 5000 },
    { size: 90, color: '#FB7A20', opacity: 0.07, left: 100, top: 400, animRange: 25, duration: 3500 },
    { size: 140, color: '#FB7A20', opacity: 0.09, left: 260, top: 500, animRange: 35, duration: 6000 },
  ];
  const animatedValues = React.useRef(bubbles.map(() => new Animated.Value(0))).current;

  React.useEffect(() => {
    animatedValues.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: bubbles[i].duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: bubbles[i].duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 0 }} pointerEvents="none">
      {bubbles.map((bubble, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: bubble.left,
            top: bubble.top,
            width: bubble.size,
            height: bubble.size,
            borderRadius: bubble.size / 2,
            backgroundColor: bubble.color,
            opacity: bubble.opacity,
            transform: [
              {
                translateY: animatedValues[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -bubble.animRange],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}

export default AnimatedBubblesBackground; 