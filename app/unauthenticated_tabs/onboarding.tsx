import React, { useState, useRef } from 'react';
import {
  View,
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

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Welcome to Punch',
    subtitle: 'The modern way to earn free stuff from your favorite local spots.',
    description: 'Simple. Free. Rewarding.',
    cta: 'Get Started',
    icon: '🥤',
  },
  {
    id: 2,
    title: 'Discover Local Gems',
    subtitle: 'Find aesthetic cafes, boba joints, and food spots around you — all offering exclusive Punch rewards.',
    description: 'Personalized for where you go.',
    cta: 'Find Businesses',
    icon: '🗺',
  },
  {
    id: 3,
    title: 'Earn Punches. Get Rewards.',
    subtitle: 'Every visit earns a punch. Hit the goal, unlock your reward — it\'s that easy.',
    description: 'From free drinks to surprise drops.',
    cta: 'How It Works',
    icon: '🎁',
  },
  {
    id: 4,
    title: 'Join the Community',
    subtitle: 'See where your friends are punching. Share spots. Earn together.',
    description: 'Loyalty is better when it\'s social.',
    cta: 'Create Account',
    icon: '🤝',
  },
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      // Navigate to signup on last screen
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

  const renderScreen = (item: any, index: number) => (
    <View key={item.id} style={onboardingStyles.screen}>
      <View style={onboardingStyles.contentWrapper}>
        <View style={onboardingStyles.topSection}>
          <CustomText style={onboardingStyles.icon}>{item.icon}</CustomText>
          <CustomText variant="title" weight="bold" style={onboardingStyles.title}>
            {item.title}
          </CustomText>
          <CustomText variant="subtitle" weight="medium" style={onboardingStyles.subtitle}>
            {item.subtitle}
          </CustomText>
          <CustomText variant="body" weight="semibold" style={onboardingStyles.description}>
            {item.description}
          </CustomText>
        </View>
        
        <View style={onboardingStyles.bottomSection}>
          <TouchableOpacity style={onboardingStyles.ctaButton} onPress={handleNext}>
            <CustomText variant="button" weight="bold" style={onboardingStyles.ctaText}>
              {item.cta}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#FB7A20', '#FF8C42', '#FFA366']}
      style={onboardingStyles.container}
    >
      <SafeAreaView style={onboardingStyles.safeArea}>
        {/* Vector Background */}
        <VectorBackground screenIndex={currentIndex} />
        
        {/* Skip Button */}
        <TouchableOpacity style={onboardingStyles.skipButton} onPress={handleSkip}>
          <CustomText variant="body" weight="semibold" style={onboardingStyles.skipText}>
            Skip
          </CustomText>
        </TouchableOpacity>

        {/* Content */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={onboardingStyles.scrollView}
        >
          {onboardingData.map((item, index) => renderScreen(item, index))}
        </ScrollView>

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
    </LinearGradient>
  );
}