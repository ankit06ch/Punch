import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import VectorBackground from '../../components/VectorBackground';
import CustomText from '../../components/CustomText';
import onboardingStyles from '../styles/onboardingStyles';
import { AntDesign } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    headline: 'Earn Punches. Get Rewards.',
    subheadline: '',
    description: '',
  },
  {
    id: 2,
    headline: 'Discover Local Gems',
    subheadline: 'Find aesthetic cafes, boba joints, and food spots around you — all offering exclusive Punch rewards.',
    description: 'Personalized for where you go.',
  },
  {
    id: 3,
    headline: 'Earn Punches. Get Rewards.',
    subheadline: 'Every visit earns a punch. Hit the goal, unlock your reward — it\'s that easy.',
    description: 'From free drinks to surprise drops.',
  },
  {
    id: 4,
    headline: 'Join the Community',
    subheadline: 'See where your friends are punching. Share spots. Earn together.',
    description: 'Loyalty is better when it\'s social.',
  },
];

function ProgressCircleWithLogo({ screenIndex = 0 }: { screenIndex?: number }) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  // Calculate target progress based on screen index (0-3 for 4 screens)
  const targetProgress = (screenIndex + 1) / 4; // 0.25, 0.5, 0.75, 1.0
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [screenIndex, targetProgress]);
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
      <View style={{ position: 'relative', width: 120, height: 120 }}>
        {/* Progress ring */}
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <View style={{
            width: 120, height: 120, borderRadius: 60, borderWidth: 6, borderColor: 'rgba(255,255,255,0.25)',
            position: 'absolute',
          }} />
          <Animated.View style={{
            width: 120, height: 120, borderRadius: 60, borderWidth: 6, borderColor: '#fff',
            borderRightColor: 'transparent', borderBottomColor: 'transparent',
            transform: [{
              rotate: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              })
            }],
            position: 'absolute',
          }} />
        </View>
        {/* Logo in center */}
        <View style={{
          width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 20,
        }}>
          <Image source={require('../../assets/Punch_Logos/Punch_T/black_logo.png')} style={{ width: 48, height: 48, resizeMode: 'contain' }} />
        </View>
      </View>
    </View>
  );
}

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const statusBarColor = '#FB7A20';

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      router.replace('/unauthenticated_tabs/signup');
    }
  };

  const handleSkip = () => {
    router.replace('/unauthenticated_tabs/signup');
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    setCurrentIndex(index);
  };

  const renderScreen = (item: any, index: number) => {
    return (
      <View key={item.id} style={{ width, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ maxWidth: 340, alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
          <CustomText variant="title" weight="bold" style={[onboardingStyles.title, { color: 'white', marginBottom: 12, textAlign: 'center' }]}> {item.headline} </CustomText>
          {item.subheadline ? (
            <CustomText variant="subtitle" weight="medium" style={[onboardingStyles.subtitle, { color: 'white', marginBottom: 12, textAlign: 'center' }]}> {item.subheadline} </CustomText>
          ) : null}
          {item.description ? (
            <CustomText variant="body" weight="semibold" style={[onboardingStyles.description, { color: 'white', textAlign: 'center' }]}> {item.description} </CustomText>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={[onboardingStyles.container, { flex: 1, backgroundColor: '#fff' }]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <SafeAreaView style={[onboardingStyles.safeArea, { flex: 1 }]}>
        {/* Remove VectorBackground for a cleaner look, or keep if desired */}
        <View style={{ alignItems: 'center', marginBottom: 0 }}>
          <ProgressCircleWithLogo screenIndex={currentIndex} />
        </View>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={[onboardingStyles.scrollView, { flex: 1 }]}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
          {onboardingData.map((item, index) => (
            <View key={item.id} style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
              <CustomText variant="title" weight="bold" style={[onboardingStyles.title, { color: '#222', marginBottom: 12, textAlign: 'center' }]}>{item.headline}</CustomText>
              {item.subheadline ? (
                <CustomText variant="subtitle" weight="normal" style={[onboardingStyles.subtitle, { color: '#666', marginBottom: 0, textAlign: 'center', fontWeight: '400' }]}>{item.subheadline}</CustomText>
              ) : null}
              {item.description && !item.subheadline ? (
                <CustomText variant="body" weight="normal" style={[onboardingStyles.description, { color: '#888', textAlign: 'center', fontWeight: '400' }]}>{item.description}</CustomText>
              ) : null}
            </View>
          ))}
        </ScrollView>
        {/* Navigation Buttons (always visible at the bottom) */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 24, marginBottom: 32, position: 'absolute', bottom: 40 }}>
          <TouchableOpacity onPress={handleSkip}>
            <CustomText variant="body" weight="semibold" style={{ color: '#FB7A20', opacity: 0.8 }}>Skip</CustomText>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={{ backgroundColor: '#FB7A20', borderRadius: 30, padding: 16 }}>
            <AntDesign name="arrowright" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Progress Dots */}
        <View style={onboardingStyles.dotsContainer}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                onboardingStyles.dot,
                index === currentIndex ? onboardingStyles.activeDot : onboardingStyles.inactiveDot,
              ]}
            />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}