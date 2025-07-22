import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions, StatusBar, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';

const ORANGE = '#fba720';
const WHITE = '#fff';
const PERIOD_BOUNCE_HEIGHT = 60;
const PERIOD_BOUNCE_DURATION = 350;
const PERIOD_SETTLE_DURATION = 250;
const FINAL_DELAY = 900;

export default function SplashScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState(1); // 1: unmorph, 2: morph
  const [showPeriod, setShowPeriod] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [periodSettled, setPeriodSettled] = useState(false);

  // Responsive sizing
  const { width } = Dimensions.get('window');
  const imgSize = width * 0.7;

  // Animated values
  const periodPulse = useRef(new Animated.Value(1)).current;
  const morphScale = useRef(new Animated.Value(0.7)).current;
  const morphOpacity = useRef(new Animated.Value(0)).current;
  const unmorphOpacity = useRef(new Animated.Value(1)).current;
  const shadowScale = useRef(new Animated.Value(0.5)).current;
  const shadowOpacity = useRef(new Animated.Value(0.15)).current;
  // Period position: start above/left, bounce to visible, then move to right of image
  const periodStartX = useRef(new Animated.Value(-imgSize * 0.25)).current;
  const periodStartY = useRef(new Animated.Value(-imgSize * 0.25)).current;
  // Final position (right of image, more right and lower, adjusted for smaller size)
  const periodFinalX = imgSize * 0.48;
  const periodFinalY = imgSize * 0.11;

  // Animated value for rotation (0deg for bounce, 18deg for final)
  const periodRotation = useRef(new Animated.Value(0)).current;
  // Animated values for squash and stretch
  const periodScaleX = useRef(new Animated.Value(1)).current;
  const periodScaleY = useRef(new Animated.Value(1)).current;

  // Animate period bounce and PNG phase change
  useEffect(() => {
    setTimeout(() => setShowPeriod(true), 400);
  }, []);

  useEffect(() => {
    if (!showPeriod) return;
    // 1. Bounce period above the logo
    Animated.sequence([
      Animated.parallel([
        Animated.timing(periodStartX, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(periodStartY, {
          toValue: -imgSize * 0.18,
          duration: 420,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        // Squash and stretch pulse on bounce
        Animated.sequence([
          Animated.parallel([
            Animated.timing(periodScaleY, {
              toValue: 0.7,
              duration: 120,
              easing: Easing.out(Easing.elastic(1.2)),
              useNativeDriver: true,
            }),
            Animated.timing(periodScaleX, {
              toValue: 1.25,
              duration: 120,
              easing: Easing.out(Easing.elastic(1.2)),
              useNativeDriver: true,
            }),
            Animated.timing(periodPulse, {
              toValue: 1.18,
              duration: 120,
              easing: Easing.out(Easing.elastic(1.2)),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(periodScaleY, {
              toValue: 1,
              duration: 180,
              easing: Easing.out(Easing.elastic(1.2)),
              useNativeDriver: true,
            }),
            Animated.timing(periodScaleX, {
              toValue: 1,
              duration: 180,
              easing: Easing.out(Easing.elastic(1.2)),
              useNativeDriver: true,
            }),
            Animated.timing(periodPulse, {
              toValue: 1,
              duration: 180,
              easing: Easing.out(Easing.elastic(1.2)),
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Shadow appears and squashes during bounce
        Animated.sequence([
          Animated.timing(shadowOpacity, {
            toValue: 0.22,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(shadowScale, {
            toValue: 1.1,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(shadowScale, {
            toValue: 0.7,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(shadowOpacity, {
            toValue: 0.12,
            duration: 120,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.delay(220), // anticipation before morph
      Animated.parallel([
        Animated.sequence([
          // Morph PNG's pulse and shadow squash together
          Animated.timing(morphScale, {
            toValue: 1.25,
            duration: 120,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(morphScale, {
            toValue: 1,
            duration: 180,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(shadowScale, {
            toValue: 1.25,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(shadowScale, {
            toValue: 0.7,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(shadowOpacity, {
            toValue: 0,
            duration: 60,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(morphOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(unmorphOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(120),
      // 2. Move period to right of image with final bounce, shadow squash, and rotate into place
      Animated.parallel([
        Animated.timing(periodStartX, {
          toValue: periodFinalX,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(periodStartY, {
          toValue: periodFinalY,
          duration: 420,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(periodRotation, {
          toValue: 18,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Shadow stays hidden as period moves to final position
      ]),
    ]).start(() => {
      setPeriodSettled(true);
      setTimeout(() => {
        router.replace('../unauthenticated_tabs/onboarding');
      }, FINAL_DELAY);
    });
  }, [showPeriod]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={WHITE} barStyle="dark-content" translucent={false} />
      {Platform.OS === 'android' && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 32, backgroundColor: WHITE, zIndex: 10 }} pointerEvents="none" />
      )}
      {/* Removed radial glow for simplicity */}
      {/* Unmorph PNG */}
      <Animated.View style={{
        position: 'absolute',
        width: imgSize,
        height: imgSize,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: unmorphOpacity,
        transform: [{ scale: pulse ? periodPulse : 1 }],
      }}>
        <Image
          source={require('../../assets/Punch_Logos/Punch_T/splash_unmorph.png')}
          style={{ width: imgSize, height: imgSize, resizeMode: 'contain' }}
        />
      </Animated.View>
      {/* Morph PNG */}
      <Animated.View style={{
        position: 'absolute',
        width: imgSize,
        height: imgSize,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: morphOpacity,
        transform: [{ scale: morphScale }],
      }}>
        <Image
          source={require('../../assets/Punch_Logos/Punch_T/splash_morph.png')}
          style={{ width: imgSize, height: imgSize, resizeMode: 'contain' }}
        />
      </Animated.View>
      {/* Animated period (rounded square) */}
      {showPeriod && (
        <>
          <Animated.View
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              zIndex: 9,
              width: imgSize * 0.09,
              height: imgSize * 0.09,
              borderRadius: imgSize * 0.03,
              backgroundColor: 'transparent',
              transform: [
                { translateX: periodStartX },
                { translateY: periodStartY },
                { translateX: -imgSize * 0.065 },
                { translateY: -imgSize * 0.065 },
                { rotateZ: '18deg' },
              ],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Animated.View
              style={{
                position: 'absolute',
                bottom: -imgSize * 0.03,
                left: '50%',
                width: imgSize * 0.09,
                height: imgSize * 0.03,
                backgroundColor: '#000',
                opacity: shadowOpacity,
                borderRadius: imgSize * 0.03,
                transform: [
                  { translateX: -imgSize * 0.045 },
                  { scaleX: shadowScale },
                  { scaleY: 0.7 },
                ],
                zIndex: 1,
              }}
            />
            {/* Animated rotation for period */}
            <Animated.View
              style={{
                width: imgSize * 0.09,
                height: imgSize * 0.09,
                borderRadius: imgSize * 0.03,
                backgroundColor: '#fb7a20',
                transform: [
                  { scale: periodPulse },
                  { scaleX: periodScaleX },
                  { scaleY: periodScaleY },
                  { rotateZ: periodRotation.interpolate({ inputRange: [0, 18], outputRange: ['0deg', '18deg'] }) },
                ],
                zIndex: 2,
              }}
            />
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    backgroundColor: ORANGE,
    opacity: 0.18,
    zIndex: 0,
    transform: [{ translateX: -0.5 }, { translateY: -0.5 }],
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 60,
    elevation: 20,
  },
  period: {
    fontWeight: '900',
  },
});