import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  Easing
} from 'react-native-reanimated';

interface CustomLoadingScreenProps {
  visible?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function CustomLoadingScreen({ 
  visible = true, 
  size = 'medium' 
}: CustomLoadingScreenProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      // Start rotation animation
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 2000,
          easing: Easing.linear,
        }),
        -1
      );

      // Start scale animation for the logo
      scale.value = withRepeat(
        withTiming(1.1, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      rotation.value = 0;
      scale.value = 0.8;
    }
  }, [visible]);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { logoSize: 40, circleSize: 80, strokeWidth: 3 };
      case 'large':
        return { logoSize: 80, circleSize: 160, strokeWidth: 6 };
      default:
        return { logoSize: 60, circleSize: 120, strokeWidth: 4 };
    }
  };

  const { logoSize, circleSize, strokeWidth } = getSizeConfig();

  const rotatingCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` }
      ],
    };
  });

  const logoStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value }
      ],
    };
  });

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.loadingContainer}>
        {/* Rotating Circle */}
        <Animated.View style={[styles.circleContainer, { width: circleSize, height: circleSize }, rotatingCircleStyle]}>
          <View style={[styles.circle, { width: circleSize, height: circleSize, borderWidth: strokeWidth }]} />
        </Animated.View>

        {/* Punch Logo */}
        <Animated.View style={[styles.logoContainer, { width: logoSize, height: logoSize }, logoStyle]}>
          <Image
            source={require('../../assets/Punch_Logos/PunchP_logo/punchPlogo.png')}
            style={[styles.logo, { width: logoSize, height: logoSize }]}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circleContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    borderRadius: 1000,
    borderColor: '#FB7A20',
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    tintColor: '#FB7A20',
  },
}); 