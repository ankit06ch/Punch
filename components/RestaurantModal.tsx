import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Animated, Image, PanResponder, ScrollView, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import { AntDesign } from '@expo/vector-icons';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import CustomText from './CustomText';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface Restaurant {
  id: string;
  name: string;
  businessName?: string;
  latitude?: number;
  longitude?: number;
  color: string;
  distance?: string;
  hours?: string;
  price?: string;
  cuisine?: string;
  rating?: string;
  logoUrl?: string;
  activeRewards?: any[];
  location?: string;
}

interface RestaurantModalProps {
  restaurant: Restaurant | null;
  visible: boolean;
  onClose: () => void;
  likedRestaurants: string[];
  onLikeUpdate: (restaurantId: string) => void;
}

const COLORS = {
  primary: '#2C3E50',
  secondary: '#34495E',
  background: '#FFFFFF',
  text: {
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    light: '#BDC3C7',
  },
};

export default function RestaurantModal({ restaurant, visible, onClose, likedRestaurants, onLikeUpdate }: RestaurantModalProps) {
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const panAnimation = useRef(new Animated.Value(0)).current;
  const backdropAnimation = useRef(new Animated.Value(0)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Double tap like functionality
  const heartAnimation = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);
  const tapCount = useRef(0);
  
  // Check if restaurant is liked
  const isLiked = restaurant ? likedRestaurants.includes(restaurant.id) : false;

  // Pan gesture handler for modal
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true, // Allow dragging from anywhere
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        panAnimation.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // If expanded, only allow downward movement
        if (isExpanded && gestureState.dy < 0) {
          // Lock upward movement when expanded
          return;
        }
        // Allow both up and down movement with gradual reveal
        panAnimation.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // Close modal if dragged down significantly
          closeModal();
        } else if (gestureState.dy < -50 || gestureState.vy < -0.5) {
          // Expand modal if dragged up significantly (only if not already expanded)
          if (!isExpanded) {
            setIsExpanded(true);
            // Snap back to expanded position
            Animated.spring(panAnimation, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }).start();
          } else {
            // Already expanded, just snap back to position
            Animated.spring(panAnimation, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }).start();
          }
        } else {
          // Snap back to current position
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
    if (visible && restaurant) {
      openModal();
    } else {
      closeModal();
    }
  }, [visible, restaurant]);

  const openModal = () => {
    // Animate backdrop fade in
    Animated.timing(backdropAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animate modal slide up
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const closeModal = () => {
    // Animate backdrop fade out
    Animated.timing(backdropAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Animate modal slide down
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      panAnimation.setValue(0);
      setIsExpanded(false); // Reset expansion state
    });
  };

  const openDirections = () => {
    if (restaurant?.latitude && restaurant?.longitude) {
      const url = `https://maps.apple.com/?daddr=${restaurant.latitude},${restaurant.longitude}`;
      Linking.openURL(url).catch(err => {
        console.error('Error opening directions:', err);
        // Fallback to Google Maps
        const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`;
        Linking.openURL(googleUrl);
      });
    }
  };

  const handleDoubleTap = async () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTap.current && (now - lastTap.current) < DOUBLE_TAP_DELAY) {
      // Double tap detected
      tapCount.current = 0;
      lastTap.current = 0;
      
      if (restaurant) {
        // Update like state in Firestore
        await onLikeUpdate(restaurant.id);
        
        // Add haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Animate heart
        heartScale.setValue(0);
        Animated.sequence([
          Animated.timing(heartScale, {
            toValue: 1.2,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(heartScale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Show heart animation
        heartAnimation.setValue(0);
        Animated.timing(heartAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          heartAnimation.setValue(0);
        });
      }
      
    } else {
      // Single tap
      tapCount.current = 1;
      lastTap.current = now;
      
      // Reset tap count after delay
      setTimeout(() => {
        if (tapCount.current === 1) {
          tapCount.current = 0;
          lastTap.current = 0;
        }
      }, DOUBLE_TAP_DELAY);
    }
  };

  if (!restaurant) return null;

  return (
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
            height: isExpanded ? height * 0.9 : height * 0.3, // Preview: 30%, Expanded: 90%
            transform: [{
              translateY: Animated.add(
                modalAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height, 0],
                }),
                panAnimation
              )
            }]
          }
        ]}
      >
        <BlurView intensity={30} tint="light" style={styles.modalContent} {...panResponder.panHandlers}>
          {/* Heart Animation Overlay */}
          <Animated.View 
            style={[
              styles.heartOverlay,
              {
                opacity: heartAnimation,
                transform: [{
                  scale: heartAnimation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 1.2, 1],
                  })
                }]
              }
            ]}
            pointerEvents="none"
          >
            <Animated.View
              style={[
                styles.heartIcon,
                {
                  transform: [{ scale: heartScale }]
                }
              ]}
            >
              <AntDesign name="heart" size={80} color="#FF6B6B" />
            </Animated.View>
          </Animated.View>

          {/* Double Tap Area */}
          <TouchableOpacity 
            style={styles.doubleTapArea} 
            onPress={handleDoubleTap}
            activeOpacity={1}
          >
            <View style={styles.doubleTapContent}>
              {/* Drag Handle */}
              <View style={styles.dragHandle} />
              
              {/* Header with Logo, Name, Cuisine, and Close Button */}
              <View style={styles.modalHeader}>
            <View style={styles.logoContainer}>
              {restaurant.logoUrl ? (
                <Image source={{ uri: restaurant.logoUrl }} style={styles.logo} />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: restaurant.color }]}>
                  <AntDesign name="home" size={24} color="white" />
                </View>
              )}
            </View>
            
            <View style={styles.titleContainer}>
              <CustomText variant="title" weight="bold" fontFamily="figtree" style={styles.restaurantName}>
                {restaurant.name}
              </CustomText>
              <View style={styles.titleRow}>
                {restaurant.cuisine && (
                  <CustomText variant="body" weight="normal" fontFamily="figtree" style={styles.cuisine}>
                    {restaurant.cuisine}
                  </CustomText>
                )}
                {isLiked && (
                  <AntDesign name="heart" size={16} color="#FF6B6B" style={styles.likeIndicator} />
                )}
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closeModal}
            >
              <AntDesign name="close" size={20} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Preview Mode - Quick Info */}
          {!isExpanded && (
            <View style={styles.previewContent}>
              <View style={styles.quickInfoRow}>
                {restaurant.distance && (
                  <View style={styles.quickInfoItem}>
                    <AntDesign name="enviroment" size={14} color={COLORS.text.light} />
                    <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.quickInfoText}>
                      {restaurant.distance}
                    </CustomText>
                  </View>
                )}
                
                {restaurant.rating && (
                  <View style={styles.quickInfoItem}>
                    <AntDesign name="star" size={14} color="#FFD700" />
                    <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.quickInfoText}>
                      {restaurant.rating}
                    </CustomText>
                  </View>
                )}
                
                {restaurant.price && (
                  <View style={styles.quickInfoItem}>
                    <AntDesign name="star" size={14} color={COLORS.text.light} />
                    <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.quickInfoText}>
                      {restaurant.price}
                    </CustomText>
                  </View>
                )}
              </View>
              
              <View style={styles.previewHint}>
                <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.previewHintText}>
                  Drag up to see address & details
                </CustomText>
                <AntDesign name="up" size={16} color={COLORS.text.light} />
              </View>
            </View>
          )}

          {/* Expanded Mode - Full Content */}
          {isExpanded && (
            <>
              <ScrollView style={styles.expandableContent} showsVerticalScrollIndicator={false}>
                {/* Quick Info Row */}
                <View style={styles.quickInfoRow}>
                  {restaurant.distance && (
                    <View style={styles.quickInfoItem}>
                      <AntDesign name="enviroment" size={14} color={COLORS.text.light} />
                      <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.quickInfoText}>
                        {restaurant.distance}
                      </CustomText>
                    </View>
                  )}
                  
                  {restaurant.rating && (
                    <View style={styles.quickInfoItem}>
                      <AntDesign name="star" size={14} color="#FFD700" />
                      <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.quickInfoText}>
                        {restaurant.rating}
                      </CustomText>
                    </View>
                  )}
                  
                  {restaurant.price && (
                    <View style={styles.quickInfoItem}>
                      <AntDesign name="star" size={14} color={COLORS.text.light} />
                      <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.quickInfoText}>
                        {restaurant.price}
                      </CustomText>
                    </View>
                  )}
                </View>

                {/* Address Section */}
                <View style={styles.section}>
                  <CustomText variant="subtitle" weight="bold" fontFamily="figtree" style={styles.sectionTitle}>
                    Address
                  </CustomText>
                  <View style={styles.addressContainer}>
                    <CustomText variant="body" weight="normal" fontFamily="figtree" style={styles.addressText}>
                      {restaurant.location || "123 Main Street, Cumming, GA 30040"}
                    </CustomText>
                    <TouchableOpacity style={styles.directionsButton} onPress={openDirections}>
                      <AntDesign name="right" size={16} color={COLORS.primary} />
                      <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.directionsButtonText}>
                        Get Directions
                      </CustomText>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Hours Section */}
                {restaurant.hours && typeof restaurant.hours === 'object' && (
                  <View style={styles.section}>
                    <CustomText variant="subtitle" weight="bold" fontFamily="figtree" style={styles.sectionTitle}>
                      Hours
                    </CustomText>
                    {Object.entries(restaurant.hours).map(([day, hours]) => (
                      <View key={day} style={styles.hoursRow}>
                        <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.hoursDay}>
                          {day}
                        </CustomText>
                        <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.hoursTime}>
                          {hours as string}
                        </CustomText>
                      </View>
                    ))}
                  </View>
                )}

                {/* Active Rewards Section */}
                {restaurant.activeRewards && restaurant.activeRewards.length > 0 && (
                  <View style={styles.section}>
                    <CustomText variant="subtitle" weight="bold" fontFamily="figtree" style={styles.sectionTitle}>
                      Active Rewards
                    </CustomText>
                    {restaurant.activeRewards.map((reward: any, index: number) => (
                      <View key={index} style={styles.rewardItem}>
                        <CustomText variant="body" weight="medium" fontFamily="figtree" style={styles.rewardTitle}>
                          {reward.title}
                        </CustomText>
                        <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.rewardDescription}>
                          {reward.description}
                        </CustomText>
                        <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.rewardPunches}>
                          {reward.punchesRequired} punches required
                        </CustomText>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton}>
                  <AntDesign name="star" size={18} color={COLORS.primary} />
                  <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.actionButtonText}>
                    Add to Favorites
                  </CustomText>
                </TouchableOpacity>
              </View>
            </>
          )}
            </View>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10000,
    // Extend to bottom edge to eliminate gap
    paddingBottom: 0,
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    // Ensure content fills to bottom edge
    justifyContent: 'flex-start',
  },
  dragHandle: {
    width: 60,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeIndicator: {
    marginLeft: 8,
  },
  restaurantName: {
    color: COLORS.text.primary,
    fontSize: 20,
    marginBottom: 2,
  },
  cuisine: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandableContent: {
    flex: 1,
  },
  quickInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickInfoText: {
    color: COLORS.text.secondary,
    marginLeft: 4,
    fontSize: 12,
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    marginBottom: 8,
    fontSize: 16,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  hoursDay: {
    color: COLORS.text.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  hoursTime: {
    color: COLORS.text.secondary,
    fontSize: 12,
  },
  rewardItem: {
    backgroundColor: 'rgba(251, 122, 32, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  rewardTitle: {
    color: COLORS.text.primary,
    marginBottom: 2,
    fontSize: 14,
  },
  rewardDescription: {
    color: COLORS.text.secondary,
    marginBottom: 2,
    fontSize: 12,
  },
  rewardPunches: {
    color: '#FB7A20',
    fontWeight: '600',
    fontSize: 11,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionButtonText: {
    color: COLORS.text.primary,
    marginLeft: 6,
    fontSize: 12,
  },
  primaryActionButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  primaryActionButtonText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 12,
  },
  previewContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  previewHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  previewHintText: {
    color: COLORS.text.light,
    marginRight: 8,
    fontSize: 12,
  },
  addressContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  addressText: {
    color: COLORS.text.primary,
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(44, 62, 80, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(44, 62, 80, 0.2)',
  },
  directionsButtonText: {
    color: COLORS.primary,
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  heartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  heartIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  doubleTapArea: {
    flex: 1,
  },
  doubleTapContent: {
    flex: 1,
  },
}); 