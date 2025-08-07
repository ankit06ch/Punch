import React, { useEffect, useRef } from 'react';
import { View, Image, Dimensions, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingImagesProps {
  currentIndex: number;
  isVisible: boolean;
}

const OnboardingImages: React.FC<OnboardingImagesProps> = ({ currentIndex, isVisible }) => {
  const imageAnimations = useRef([
    new Animated.Value(height), // Start from bottom of screen
    new Animated.Value(height),
    new Animated.Value(height),
    new Animated.Value(height),
  ]).current;

  const opacityAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const scaleAnimations = useRef([
    new Animated.Value(0.8),
    new Animated.Value(0.8),
    new Animated.Value(0.8),
    new Animated.Value(0.8),
  ]).current;

  useEffect(() => {
    if (isVisible) {
      // Animate the current image flying up
      const currentAnim = imageAnimations[currentIndex];
      const currentOpacity = opacityAnimations[currentIndex];
      const currentScale = scaleAnimations[currentIndex];

      // Reset all animations
      imageAnimations.forEach((anim, index) => {
        if (index !== currentIndex) {
          anim.setValue(height);
          opacityAnimations[index].setValue(0);
          scaleAnimations[index].setValue(0.8);
        }
      });

      // Animate current image
      Animated.parallel([
        Animated.spring(currentAnim, {
          toValue: 0, // Fly up to the very top of the screen
          useNativeDriver: true,
          tension: 50,
          friction: 8,
          delay: 300, // Delay to let modal animate first
        }),
        Animated.timing(currentOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          delay: 300,
        }),
        Animated.spring(currentScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
          delay: 300,
        }),
      ]).start();
    } else {
      // Hide all images when modal is not visible
      imageAnimations.forEach((anim, index) => {
        anim.setValue(height);
        opacityAnimations[index].setValue(0);
        scaleAnimations[index].setValue(0.8);
      });
    }
  }, [currentIndex, isVisible]);

  const images = [
    require('../../assets/images/onboarding/1.png'),
    require('../../assets/images/onboarding/2.png'),
    require('../../assets/images/onboarding/3.png'),
    require('../../assets/images/onboarding/4.png'),
  ];

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
      {images.map((image, index) => (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            top: 0,
            left: width * 0.025, // Move half way back to the left
            right: -(width * 0.025),
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [
              { translateY: imageAnimations[index] },
              { scale: scaleAnimations[index] },
            ],
            opacity: opacityAnimations[index],
          }}
        >
          <Image
            source={image}
            style={{
              width: width * 0.95, // 95% of screen width
              height: height * 0.85, // 85% of screen height
              resizeMode: 'cover',
            }}
          />
        </Animated.View>
      ))}
    </View>
  );
};

export default OnboardingImages; 