import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import CustomText from '../../components/CustomText';
import { Colors } from '../../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_HEIGHT = 180;

// Function to create darker shade of a color
const getDarkerShade = (color: string): string => {
  // Create darker shades for the wallet page colors
  const colorMap: { [key: string]: string } = {
    '#2C3E50': '#1B2631', // Dark blue-gray -> Even darker
    '#34495E': '#2C3E50', // Medium blue-gray -> Dark blue-gray
    '#E74C3C': '#C0392B', // Red -> Darker red
    '#27AE60': '#1E8449', // Green -> Darker green
    '#F39C12': '#D68910', // Orange -> Darker orange
    '#3498DB': '#2980B9', // Blue -> Darker blue
  };
  
  return colorMap[color] || color; // Return original color if no mapping found
};

interface EnhancedRewardCardProps {
  reward: any;
  onClaim: (reward: any) => void;
  isAvailable: boolean;
  progress: number;
  required: number;
}

export default function EnhancedRewardCard({ 
  reward, 
  onClaim, 
  isAvailable, 
  progress, 
  required 
}: EnhancedRewardCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  const progressPercentage = Math.min((progress / required) * 100, 100);
  const punchesNeeded = Math.max(required - progress, 0);

  const handlePress = () => {
    if (!isAvailable) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onClaim(reward);
  };

  const handlePressIn = () => {
    if (!isAvailable) return;
    setIsPressed(true);
    Animated.timing(scaleAnimation, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (!isAvailable) return;
    setIsPressed(false);
    Animated.timing(scaleAnimation, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnimation }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={isAvailable ? 0.8 : 1}
        disabled={!isAvailable}
      >
        <View style={[
          styles.blurContainer,
          {
            backgroundColor: isAvailable 
              ? getDarkerShade(reward.color) 
              : reward.color
          }
        ]}>
          {/* Main content */}
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <View style={[styles.iconBackground, { backgroundColor: reward.color }]}>
                  <AntDesign name={reward.icon} size={24} color="white" />
                </View>
                {isAvailable && (
                  <View style={[styles.availableIndicator, { backgroundColor: reward.color }]}>
                    <AntDesign name="check" size={12} color="white" />
                  </View>
                )}
              </View>
              
              <View style={styles.titleContainer}>
                <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.title}>
                  {reward.label}
                </CustomText>
                <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.restaurant}>
                  {reward.restaurantName}
                </CustomText>
              </View>
            </View>

            {/* Description */}
            <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.description}>
              {reward.description}
            </CustomText>

            {/* Progress section */}
            <View style={styles.progressSection}>
              {isAvailable ? (
                <View style={styles.availableSection}>
                  <AntDesign name="gift" size={16} color="white" />
                  <CustomText variant="caption" weight="bold" fontFamily="figtree" style={styles.availableText}>
                    Tap to Claim!
                  </CustomText>
                </View>
              ) : (
                <>
                  <View style={styles.progressInfo}>
                    <CustomText variant="caption" weight="bold" fontFamily="figtree" style={styles.progressText}>
                      {progressPercentage.toFixed(0)}% Complete
                    </CustomText>
                    <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.punchesNeeded}>
                      {punchesNeeded} more punches
                    </CustomText>
                  </View>
                  
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${progressPercentage}%`,
                            backgroundColor: getDarkerShade(reward.color)
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Decorative elements */}
          <View style={styles.decorativeElements}>
            <View style={[styles.decorativeDot, { backgroundColor: reward.color }]} />
            <View style={[styles.decorativeDot, { backgroundColor: reward.color }]} />
            <View style={[styles.decorativeDot, { backgroundColor: reward.color }]} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: 16,
  },
  touchable: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 40,
    zIndex: -1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  availableIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: 'white',
    marginBottom: 2,
  },
  restaurant: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  description: {
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 8,
  },
  availableSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  availableText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '600',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    color: 'white',
    fontWeight: '600',
  },
  punchesNeeded: {
    color: 'rgba(255,255,255,0.8)',
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  decorativeElements: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
  },
  decorativeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
}); 