import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Image,
  Dimensions,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import CustomText from '../../components/CustomText';
import { Colors } from '../../constants/Colors';
import AnimatedBubblesBackground from '../components/AnimatedBubblesBackground';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GiftBoxRewardProps {
  visible: boolean;
  reward: any;
  onClose: () => void;
  onClaim: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
}

export default function GiftBoxReward({ visible, reward, onClose, onClaim }: GiftBoxRewardProps) {
  const [tapCount, setTapCount] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const backdropAnimation = useRef(new Animated.Value(0)).current;
  const panAnimation = useRef(new Animated.Value(0)).current;
  const lidAnimation = useRef(new Animated.Value(0)).current;
  const boxScale = useRef(new Animated.Value(1)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const giftBoxOpacity = useRef(new Animated.Value(1)).current;
  const rewardOpacity = useRef(new Animated.Value(0)).current;
  const confettiAnimations = useRef<Animated.Value[]>([]);

  const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

  // Pan gesture handler for modal - only allow drag down
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5; // Only respond to downward movement
      },
      onPanResponderGrant: () => {
        // Reset pan animation to 0 to prevent accumulation
        panAnimation.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward movement and limit the range
        if (gestureState.dy > 0 && gestureState.dy < 200) {
          panAnimation.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // Close modal if dragged down significantly
          closeModal();
        } else {
          // Snap back to position
          Animated.spring(panAnimation, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      setTapCount(0);
      setIsOpening(false);
      setIsOpened(false);
      setConfetti([]);
      lidAnimation.setValue(0);
      boxScale.setValue(1);
      shakeAnimation.setValue(0);
      giftBoxOpacity.setValue(1);
      rewardOpacity.setValue(0);
      // Reset pan animation to ensure consistent size
      panAnimation.setValue(0);
      // Set modal to be visible immediately
      modalAnimation.setValue(1);
      backdropAnimation.setValue(1);
      openModal();
    } else {
      closeModal();
    }
  }, [visible]);

  const openModal = () => {
    // Modal is already set to visible in useEffect
    // Just ensure backdrop is visible
    Animated.timing(backdropAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleScreenTap = () => {
    if (isOpening || isOpened) return;

    // Reset pan animation to prevent size changes
    panAnimation.setValue(0);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTapCount(prev => prev + 1);

    // More intense shake animation with increasing intensity
    const shakeIntensity = 8 + (tapCount * 3); // Gets much more intense with each tap
    const shakeDuration = Math.max(50, 150 - (tapCount * 10)); // Gets faster with each tap
    
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: shakeIntensity,
        duration: shakeDuration,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -shakeIntensity,
        duration: shakeDuration,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: shakeIntensity * 0.7,
        duration: shakeDuration,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -shakeIntensity * 0.7,
        duration: shakeDuration,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: shakeIntensity * 0.3,
        duration: shakeDuration,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: shakeDuration,
        useNativeDriver: true,
      }),
    ]).start();

    // Open after 8 taps (or you can adjust this number)
    if (tapCount + 1 >= 8) {
      openGiftBox();
    }
  };

  const openGiftBox = () => {
    setIsOpening(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate lid opening
    Animated.timing(lidAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setIsOpened(true);
      createConfetti();
      
      // Fade out gift box and fade in reward
      Animated.parallel([
        Animated.timing(giftBoxOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(rewardOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const createConfetti = () => {
    const newConfetti: ConfettiPiece[] = [];
    const animationValues: Animated.Value[] = [];

    for (let i = 0; i < 50; i++) {
      newConfetti.push({
        id: i,
        x: Math.random() * SCREEN_WIDTH,
        y: -50 - Math.random() * 100,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      });
      animationValues.push(new Animated.Value(0));
    }

    setConfetti(newConfetti);
    confettiAnimations.current = animationValues;

    // Animate confetti falling
    const animations = animationValues.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 2000 + Math.random() * 1000,
        useNativeDriver: true,
      })
    );

    Animated.parallel(animations).start();
  };

  const handleClaim = () => {
    // Reset pan animation before closing to prevent modal from moving up
    panAnimation.setValue(0);
    onClaim();
    closeModal();
  };

  const renderConfetti = () => {
    return confetti.map((piece, index) => {
      const translateY = confettiAnimations.current[index]?.interpolate({
        inputRange: [0, 1],
        outputRange: [piece.y, SCREEN_HEIGHT + 100],
      }) || 0;

      const translateX = confettiAnimations.current[index]?.interpolate({
        inputRange: [0, 1],
        outputRange: [0, (Math.random() - 0.5) * 200],
      }) || 0;

      const rotate = confettiAnimations.current[index]?.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 360],
      }) || 0;

      return (
        <Animated.View
          key={piece.id}
          style={[
            styles.confettiPiece,
            {
              left: piece.x,
              backgroundColor: piece.color,
              transform: [
                { translateY },
                { translateX },
                { rotate: `${rotate}deg` },
                { scale: piece.scale },
              ],
            },
          ]}
        />
      );
    });
  };

  const shakeTranslateX = shakeAnimation.interpolate({
    inputRange: [-20, 20],
    outputRange: [-20, 20],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={closeModal}
      statusBarTranslucent={true}
    >
      <Animated.View 
        style={[
          styles.modalOverlay,
          {
            opacity: backdropAnimation,
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop}
          onPress={closeModal}
          activeOpacity={1}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [
                {
                  translateY: panAnimation
                }
              ]
            }
          ]}
          {...panResponder.panHandlers}
        >
          <AnimatedBubblesBackground />
          <View style={styles.modalContent}>
            {/* Sophisticated Header Design */}
            <View style={styles.headerContainer}>
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>
              
              <View style={styles.headerContent}>
                <TouchableOpacity style={styles.backButton} onPress={closeModal}>
                  <View style={styles.backButtonInner}>
                    <AntDesign name="arrowleft" size={20} color={Colors.light.text} />
                  </View>
                </TouchableOpacity>
                
                <View style={styles.titleContainer}>
                  <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.title}>
                    Claim Your Reward
                  </CustomText>
                  <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.subtitle}>
                    Tap to open your gift
                  </CustomText>
                </View>
                
                <View style={styles.placeholder} />
              </View>
            </View>

            {/* Main Content - Tap anywhere */}
            <TouchableOpacity
              style={styles.mainContent}
              onPress={handleScreenTap}
              activeOpacity={1}
              disabled={isOpening || isOpened}
            >
              {/* Gift Box */}
              <Animated.View 
                style={[
                  styles.giftBoxContainer,
                  { opacity: giftBoxOpacity }
                ]}
              >
                <Animated.View
                  style={[
                    styles.giftBox,
                    {
                      transform: [
                        { translateX: shakeTranslateX },
                      ],
                    },
                  ]}
                >
                  {/* Simple Gift Box */}
                  <View style={styles.giftBoxBase}>
                    <View style={styles.giftBoxFront} />
                    <View style={styles.giftBoxRibbonVertical} />
                    <View style={styles.logoContainer}>
                      <Image source={require('../../assets/Punch_Logos/PunchP_logo/punchPlogo.png')} style={styles.logo} />
                    </View>
                  </View>
                  <Animated.View
                    style={[
                      styles.giftBoxLid,
                      {
                        transform: [
                          {
                            translateY: lidAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -60],
                            }),
                          },
                          {
                            translateX: lidAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -20],
                            }),
                          },
                          {
                            rotate: lidAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '-15deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.lidTop} />
                    <View style={styles.lidRibbonVertical} />
                    <View style={styles.bowLeft} />
                    <View style={styles.bowRight} />
                    <View style={styles.bowTriangleLeft} />
                    <View style={styles.bowTriangleRight} />
                  </Animated.View>
                </Animated.View>
              </Animated.View>

              {/* Reward Display */}
              <Animated.View 
                style={[
                  styles.rewardDisplay,
                  { opacity: rewardOpacity }
                ]}
              >
                <View style={styles.rewardIconContainer}>
                  <View style={[styles.rewardIcon, { backgroundColor: reward?.color || Colors.light.tint }]}>
                    <AntDesign name={reward?.icon || 'gift'} size={32} color="white" />
                  </View>
                </View>
                
                <View style={styles.rewardTextContainer}>
                  <CustomText variant="title" weight="bold" fontFamily="figtree" style={styles.rewardTitle}>
                    {reward?.label || 'Free Reward!'}
                  </CustomText>
                  <CustomText variant="body" weight="medium" fontFamily="figtree" style={styles.rewardDescription}>
                    {reward?.description || 'Your reward is ready!'}
                  </CustomText>
                  <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.rewardRestaurant}>
                    {reward?.restaurantName || 'Restaurant'}
                  </CustomText>
                </View>
                
                <TouchableOpacity style={styles.claimButton} onPress={handleClaim}>
                  <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.claimButtonText}>
                    Claim Reward
                  </CustomText>
                </TouchableOpacity>
              </Animated.View>
            </TouchableOpacity>

            {/* Confetti */}
            {renderConfetti()}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.72,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  headerContainer: {
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: 'rgba(248, 249, 250, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  dragHandleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 4,
    fontSize: 16,
    lineHeight: 20,
  },
  subtitle: {
    color: Colors.light.icon,
    textAlign: 'center',
    opacity: 0.7,
  },
  placeholder: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 120, // More space for header
  },
  giftBoxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    width: '100%',
    marginTop: 50, // Push gift box lower
  },
  giftBox: {
    width: 200,
    height: 200,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftBoxBase: {
    width: 160,
    height: 160,
    position: 'relative',
  },
  giftBoxFront: {
    width: 160,
    height: 160,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#E74C3C',
  },
  giftBoxRibbonVertical: {
    position: 'absolute',
    top: 0,
    left: 70,
    bottom: 0,
    width: 20,
    backgroundColor: '#FFD700',
  },
  giftBoxLid: {
    width: 180,
    height: 40,
    position: 'absolute',
    top: -20,
    left: 10,
  },
  lidTop: {
    width: 180,
    height: 40,
    backgroundColor: '#FF8E8E',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#E74C3C',
    shadowColor: '#E74C3C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  lidRibbonVertical: {
    position: 'absolute',
    top: 0,
    left: 80,
    bottom: 0,
    width: 20,
    backgroundColor: '#FFD700',
  },
  bowLeft: {
    position: 'absolute',
    top: -15,
    left: 60,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 25,
    borderTopWidth: 0,
    borderLeftColor: '#FFD700',
    borderRightColor: '#FFD700',
    borderBottomColor: '#FFD700',
    borderTopColor: 'transparent',
    borderRadius: 5,
  },
  bowRight: {
    position: 'absolute',
    top: -15,
    right: 60,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 25,
    borderTopWidth: 0,
    borderLeftColor: '#FFD700',
    borderRightColor: '#FFD700',
    borderBottomColor: '#FFD700',
    borderTopColor: 'transparent',
    borderRadius: 5,
  },
  bowTriangleLeft: {
    position: 'absolute',
    top: -15,
    left: 90,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 0,
    borderBottomWidth: 15,
    borderTopWidth: 0,
    borderLeftColor: '#FFD700',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
  },
  bowTriangleRight: {
    position: 'absolute',
    top: -15,
    right: 90,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 0,
    borderRightWidth: 15,
    borderBottomWidth: 15,
    borderTopWidth: 0,
    borderLeftColor: 'transparent',
    borderRightColor: '#FFD700',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
  },
  logoContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 5,
  },
  logo: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
  },
  rewardDisplay: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 300,
    width: '100%',
    marginTop: -250, // Pull reward content much higher up
  },
  rewardIconContainer: {
    marginBottom: 24,
  },
  rewardIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  rewardTextContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  rewardTitle: {
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  rewardDescription: {
    color: Colors.light.icon,
    textAlign: 'center',
    marginBottom: 4,
  },
  rewardRestaurant: {
    color: Colors.light.icon,
    textAlign: 'center',
    opacity: 0.7,
  },
  claimButton: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  claimButtonText: {
    color: 'white',
    fontSize: 16,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
}); 