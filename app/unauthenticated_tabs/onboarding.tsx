import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import VectorBackground from '../../components/VectorBackground';
import CustomText from '../../components/CustomText';
import onboardingStyles from '../styles/onboardingStyles';
import { AntDesign } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import AnimatedBubblesBackground from '../components/AnimatedBubblesBackground';
import OnboardingImages from '../components/OnboardingImages';
import {
  useFonts,
  Figtree_300Light,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  Figtree_900Black,
} from '@expo-google-fonts/figtree';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    headline: 'Support local. Earn rewards.',
    subheadline: 'Shop at your favorite small businesses and get rewarded every time.',
    description: '',
  },
  {
    id: 2,
    headline: 'Points with every purchase.',
    subheadline: 'Collect loyalty points automatically—no punch cards, no hassle.',
    description: '',
  },
  {
    id: 3,
    headline: 'Discover new spots near you.',
    subheadline: 'Find cafes, shops, and services that reward you for showing up.',
    description: '',
  },
  {
    id: 4,
    headline: 'Track, redeem, repeat.',
    subheadline: 'Redeem points for exclusive deals and keep supporting local.',
    description: '',
  },
];

interface OnboardingItem {
  id: number;
  headline: string;
  subheadline: string;
  description: string;
}

interface OnboardingModalProps {
  currentIndex: number;
  onboardingData: OnboardingItem[];
  handleSkip: () => void;
  handleNext: () => void;
  scrollViewRef: React.RefObject<ScrollView | null>;
  handleScroll: (event: any) => void;
  modalAnim: Animated.Value;
}

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

function OnboardingModal({ currentIndex, onboardingData, handleSkip, handleNext, scrollViewRef, handleScroll, modalAnim }: OnboardingModalProps) {
  const insets = useSafeAreaInsets();
  const MODAL_WIDTH = width - 48; // 24px margin on each side
  const MODAL_HEIGHT = 280;
  // Animated progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentIndex + 1) / onboardingData.length,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentIndex, onboardingData.length]);
  return (
    <Animated.View style={{
      position: 'absolute',
      left: 24,
      right: 24,
      bottom: 0,
      width: MODAL_WIDTH,
      zIndex: 10,
      height: MODAL_HEIGHT + insets.bottom,
      backgroundColor: 'transparent',
      justifyContent: 'flex-end',
      alignSelf: 'center',
      transform: [{ translateY: modalAnim }],
    }}>
     {/* Animated progress bar */}
     <View style={{ width: '100%', height: 6, backgroundColor: '#f3e1d2', borderTopLeftRadius: 8, borderTopRightRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
       <Animated.View
         style={{
           height: 6,
           backgroundColor: '#FB7A20',
           width: progressAnim.interpolate({
             inputRange: [0, 1],
             outputRange: ['0%', '100%'],
           }),
           borderTopLeftRadius: 8,
           borderTopRightRadius: 8,
         }}
       />
     </View>
      <View
        style={{
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          paddingHorizontal: 32,
          paddingTop: 32,
          paddingBottom: insets.bottom,
          flex: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -12 },
          shadowOpacity: 0.3,
          shadowRadius: 32,
          elevation: 24,
          alignItems: 'center',
          justifyContent: 'space-between',
          width: MODAL_WIDTH,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Swipeable Text Content */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={{ width: MODAL_WIDTH, flexGrow: 0 }}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {onboardingData.map((item: OnboardingItem, index: number) => (
            <View key={item.id} style={{ width: MODAL_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ maxWidth: 340, alignSelf: 'center' }}>
                <CustomText variant="title" weight="bold" fontFamily="figtree" style={{ color: '#222', marginBottom: 12, textAlign: 'center' }}>{item.headline}</CustomText>
                {item.subheadline ? (
                  <CustomText variant="subtitle" weight="normal" fontFamily="figtree" style={{ color: '#666', marginBottom: 8, textAlign: 'center', fontWeight: '400' }}>{item.subheadline}</CustomText>
                ) : null}
                {item.description ? (
                  <CustomText variant="body" weight="normal" fontFamily="figtree" style={{ color: '#888', textAlign: 'center', fontWeight: '400', marginBottom: 12 }}>{item.description}</CustomText>
                ) : null}
              </View>
            </View>
          ))}
        </ScrollView>
        {/* Navigation Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 8 }}>
          <TouchableOpacity onPress={handleSkip}>
            <CustomText variant="body" weight="semibold" fontFamily="figtree" style={{ color: '#FB7A20', opacity: 0.8 }}>Skip</CustomText>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={{ backgroundColor: '#FB7A20', borderRadius: 30, padding: 16 }}>
            <AntDesign name="arrowright" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const MODAL_HEIGHT = 280;
  const MODAL_WIDTH = width - 48; // 24px margin on each side, must match modal
  const scrollViewRef = useRef<ScrollView>(null);
  const modalAnim = useRef(new Animated.Value(MODAL_HEIGHT + 80)).current; // Start fully off-screen
  const [modalVisible, setModalVisible] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  useEffect(() => {
    // If coming from signup, remount modal and set to last slide
    if (params.fromSignup) {
      setCurrentIndex(onboardingData.length - 1);
      setShowModal(true);
      setTimeout(() => {
        Animated.spring(modalAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 7,
          tension: 60,
        }).start();
      }, 200);
    } else {
      // Show modal after mount (simulate after splash navigation)
      const timer = setTimeout(() => setModalVisible(true), 100);
      return () => clearTimeout(timer);
    }
    // Cleanup: always hide modal on unmount or params change
    return () => setShowModal(false);
  }, [params.fromSignup]);

  useEffect(() => {
    if (modalVisible) {
      setTimeout(() => {
        Animated.spring(modalAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 7,
          tension: 60,
        }).start();
      }, 200);
    }
  }, [modalVisible]);

  const statusBarColor = '#FB7A20';

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * MODAL_WIDTH,
        animated: true,
      });
    } else {
      // Animate modal down before navigating
      Animated.timing(modalAnim, {
        toValue: MODAL_HEIGHT + 80,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.cubic),
      }).start(() => {
        setShowModal(false);
        setTimeout(() => {
          router.replace('/unauthenticated_tabs/signup');
        }, 10);
      });
    }
  };

  const handleSkip = () => {
    // Animate modal down before navigating
    Animated.timing(modalAnim, {
      toValue: MODAL_HEIGHT + 80,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.cubic),
    }).start(() => {
      setShowModal(false);
      setTimeout(() => {
        router.replace('/unauthenticated_tabs/signup');
      }, 10);
    });
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / MODAL_WIDTH);
    setCurrentIndex(index);
  };

  const renderScreen = (item: any, index: number) => {
    return (
      <View key={item.id} style={{ width, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ maxWidth: 340, alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
          <CustomText variant="title" weight="bold" fontFamily="figtree" style={[onboardingStyles.title, { color: 'white', marginBottom: 12, textAlign: 'center' }]}> {item.headline} </CustomText>
          {item.subheadline ? (
            <CustomText variant="subtitle" weight="medium" fontFamily="figtree" style={[onboardingStyles.subtitle, { color: 'white', marginBottom: 12, textAlign: 'center' }]}> {item.subheadline} </CustomText>
          ) : null}
          {item.description ? (
            <CustomText variant="body" weight="semibold" fontFamily="figtree" style={[onboardingStyles.description, { color: 'white', textAlign: 'center' }]}> {item.description} </CustomText>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={[onboardingStyles.container, { flex: 1, backgroundColor: '#FFF7F2' }]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <AnimatedBubblesBackground />
      <OnboardingImages 
        currentIndex={currentIndex}
        isVisible={showModal}
      />
      {showModal && (
        <OnboardingModal
          currentIndex={currentIndex}
          onboardingData={onboardingData}
          handleSkip={handleSkip}
          handleNext={handleNext}
          scrollViewRef={scrollViewRef}
          handleScroll={handleScroll}
          modalAnim={modalAnim}
        />
      )}
    </View>
  );
}