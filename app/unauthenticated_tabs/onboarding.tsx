import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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

const { width, height } = Dimensions.get('window');

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
  const MODAL_WIDTH = width * 0.92; // 92% width instead of 100%
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
      left: width * 0.04, // 4% margin on left (100% - 92% = 8%, so 4% on each side)
      right: width * 0.04, // 4% margin on right
      bottom: 0,
      width: MODAL_WIDTH,
      zIndex: 10,
      height: MODAL_HEIGHT + insets.bottom,
      backgroundColor: 'transparent',
      justifyContent: 'flex-end',
      alignSelf: 'center',
      transform: [{ translateY: modalAnim }],
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 12,
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
          shadowOffset: { width: 0, height: -15 },
          shadowOpacity: 0.5,
          shadowRadius: 25,
          elevation: 25,
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
          snapToInterval={MODAL_WIDTH}
          snapToAlignment="center"
          decelerationRate="fast"
          onMomentumScrollEnd={(event) => {
            // Ensure we snap to the exact position after momentum scrolling
            const contentOffset = event.nativeEvent.contentOffset.x;
            const index = Math.round(contentOffset / MODAL_WIDTH);
            const exactPosition = index * MODAL_WIDTH;
            if (Math.abs(contentOffset - exactPosition) > 1) {
              scrollViewRef.current?.scrollTo({
                x: exactPosition,
                animated: true,
              });
            }
          }}
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 24 }}>
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
  const [showImages, setShowImages] = useState(true); // Control image visibility
  const imageOpacity = useRef(new Animated.Value(1)).current; // Smooth fade transition
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    // If coming from signup, remount modal and set to last slide
    if (params.fromSignup) {
      setCurrentIndex(onboardingData.length - 1);
      setShowModal(true);
      setShowImages(false); // Hide images on last slide
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

  const fadeImages = (show: boolean) => {
    if (show === showImages) return; // Don't animate if already in desired state
    
    // Stop any ongoing animation first
    imageOpacity.stopAnimation();
    
    // Use a smoother animation sequence
    Animated.timing(imageOpacity, {
      toValue: show ? 1 : 0,
      duration: 250, // Even faster for smoother feel
      useNativeDriver: true,
      easing: Easing.out(Easing.quad), // Smoother easing without bounce
    }).start();
    
    // Update state immediately for immediate effect
    setShowImages(show);
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      
      // Update index immediately
      setCurrentIndex(nextIndex);
      
      // Ensure images are visible for the new screen
      if (nextIndex < onboardingData.length - 1) {
        setShowImages(true);
      } else {
        // Hide images on last slide
        setShowImages(false);
      }
      
      // Scroll to the next position with smooth animation
      const scrollPosition = nextIndex * MODAL_WIDTH;
      scrollViewRef.current?.scrollTo({
        x: scrollPosition,
        animated: true,
      });
      
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        // This ensures the scroll animation completes smoothly
      }, 100);
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
          try {
            if (router && typeof router.replace === 'function') {
              router.replace('/unauthenticated_tabs/signup');
            }
          } catch (error) {
            console.log('Router navigation error:', error);
          }
        }, 50); // Increased delay to ensure router is ready
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
        try {
          if (router && typeof router.replace === 'function') {
            router.replace('/unauthenticated_tabs/signup');
          }
        } catch (error) {
          console.log('Router navigation error:', error);
        }
      }, 50); // Increased delay to ensure router is ready
    });
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / MODAL_WIDTH);
    
    // Update current index immediately for responsive UI
    if (index !== currentIndex) {
      setCurrentIndex(index);
      
      // Ensure images are visible for the new screen
      if (index < onboardingData.length - 1) {
        setShowImages(true);
      } else {
        // Hide images on last slide
        setShowImages(false);
      }
    }
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
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      
      {/* Punch Logo at the top - visible on all pages */}
      <View style={{
        position: 'absolute',
        top: -(height * 0.02), // Position above the visible screen area
        zIndex: 2, // Ensure it's above other elements
        alignItems: 'center',
        left: 0,
        right: 0,
      }}>
        <Image
          source={require('../../assets/Punch_Logos/Punch_T/splash_morph.png')}
          style={{
            width: width * 0.2, // 20% of screen width
            height: height * 0.1, // 10% of screen height
            resizeMode: 'contain',
          }}
        />
      </View>
      
      {(currentIndex === 0 || currentIndex === 1 || currentIndex === 2 || currentIndex === 3) && (
        <OnboardingImages 
          currentIndex={currentIndex}
          isVisible={showModal}
        />
      )}
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