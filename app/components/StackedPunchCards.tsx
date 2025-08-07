import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, Animated } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import CustomText from '../../components/CustomText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.8; // Slightly wider cards
const CARD_HEIGHT = 220;
const MINI_CARD_HEIGHT = 60;
const STACK_OFFSET = -5; // Reduced negative value for less overlap

// Sophisticated card colors matching wallet page
const CARD_COLORS = [
  '#2C3E50',    // Dark blue-gray
  '#34495E',    // Medium blue-gray
  '#E74C3C',    // Red
  '#27AE60',    // Green
  '#F39C12',    // Orange
  '#3498DB',    // Blue
];

interface PunchCardData {
  id: string;
  businessName: string;
  punches: number;
  total: number;
  color: string;
  logo?: any;
  location?: string;
  hours?: any;
}

interface StackedPunchCardsProps {
  cards: PunchCardData[];
  onCardPress?: (card: PunchCardData) => void;
}

function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <BlurView
      intensity={40}
      tint="light"
      style={[styles.glassCard, style]}
    >
      {children}
    </BlurView>
  );
}

function MiniCard({ 
  card, 
  onTap,
  shadowIntensity = 1
}: { 
  card: PunchCardData; 
  onTap: () => void;
  shadowIntensity?: number;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(scaleAnim, {
      toValue: 1.05,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onTap}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[
          styles.miniCard,
          {
            backgroundColor: card.color,
            shadowOffset: { width: 0, height: 6 * shadowIntensity },
            shadowOpacity: 0.2 * shadowIntensity,
            shadowRadius: 12 * shadowIntensity,
            elevation: 8 * shadowIntensity,
          }
        ]}
      >
        <View style={styles.miniCardContent}>
          <View style={styles.miniCardLeft}>
            <CustomText 
              variant="body" 
              weight="bold" 
              fontFamily="figtree" 
              style={styles.miniCardBusinessName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {card.businessName}
            </CustomText>
            <CustomText 
              variant="caption" 
              weight="normal" 
              fontFamily="figtree" 
              style={styles.miniCardPunches}
            >
              {card.punches} / {card.total} punches
            </CustomText>
          </View>
          <View style={styles.miniCardRight}>
            <Image 
              source={require('../../assets/Punch_Logos/PunchP_logo/punchPlogo.png')} 
              style={styles.miniCardLogo}
              resizeMode="contain"
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function BigCard({ 
  card, 
  onPress, 
  onTap 
}: { 
  card: PunchCardData; 
  onPress: () => void;
  onTap: () => void;
}) {
  const progress = (card.punches || 0) / (card.total || 10);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onTap}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[
          styles.bigCard,
          {
            backgroundColor: card.color,
          }
        ]}
      >
      {/* Punch Logo */}
      <View style={styles.bigCardLogoContainer}>
        <Image 
          source={require('../../assets/Punch_Logos/PunchP_logo/punchPlogo.png')} 
          style={styles.bigCardLogo}
          resizeMode="contain"
        />
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardLogoSection}>
            <View style={styles.cardLogo}>
              <AntDesign name="star" size={20} color="white" />
            </View>
            <CustomText 
              variant="title" 
              weight="bold" 
              fontFamily="figtree" 
              style={styles.cardBusinessName}
              numberOfLines={1}
              ellipsizeMode="tail"
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              {card.businessName}
            </CustomText>
          </View>
        </View>

        {/* Card Info */}
        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color="rgba(255,255,255,0.8)" />
            <CustomText 
              variant="caption" 
              weight="normal" 
              fontFamily="figtree" 
              style={styles.cardLocation}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {card.location || '123 Main St, City'}
            </CustomText>
          </View>
          
          {/* Reward Progress */}
          <View style={styles.rewardProgressInline}>
            <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.rewardText}>
              {card.punches || 0} / {card.total || 10} punches
            </CustomText>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
}

export default function StackedPunchCards({ cards, onCardPress }: StackedPunchCardsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleCardTap = (cardIndex: number) => {
    if (cardIndex >= 0 && cardIndex < cards.length && !isAnimating) {
      setIsAnimating(true);
      
      // Simple animation delay to simulate shuffle
      setTimeout(() => {
        setActiveIndex(cardIndex);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleCardPress = (card: PunchCardData) => {
    if (onCardPress) {
      onCardPress(card);
    }
  };

  if (cards.length === 0) {
    return (
      <GlassCard style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <View style={styles.emptyIconContainer}>
            <CustomText 
              variant="title" 
              weight="bold" 
              fontFamily="figtree" 
              style={styles.emptyIcon}
            >
              P
            </CustomText>
          </View>
          <CustomText variant="body" weight="medium" fontFamily="figtree" style={styles.emptyText}>
            No favorite punch cards yet
          </CustomText>
          <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.emptySubtext}>
            Like a restaurant to see it here
          </CustomText>
        </View>
      </GlassCard>
    );
  }

  // Get the active card (big card)
  const activeCard = cards[activeIndex];
  
  // Get the mini cards (all except active)
  const miniCards = cards.filter((_, index) => index !== activeIndex).slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Mini Cards Stacked on Top */}
      <View style={styles.miniCardsContainer}>
        {miniCards.map((card, index) => (
          <View 
            key={card.id} 
            style={[
              styles.miniCardWrapper,
              { 
                zIndex: index + 1, // Reverse z-index: lowest card on top
                marginBottom: index < miniCards.length - 1 ? STACK_OFFSET : STACK_OFFSET
              }
            ]}
          >
            <MiniCard
              card={card}
              onTap={() => handleCardTap(cards.indexOf(card))}
              shadowIntensity={index + 1} // Progressive shadow intensity
            />
          </View>
        ))}
      </View>

      {/* Big Card at Bottom */}
      <View style={[styles.bigCardContainer, { zIndex: 100 }]}>
        <BigCard
          card={activeCard}
          onPress={() => handleCardPress(activeCard)}
          onTap={() => handleCardTap(activeIndex)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    minHeight: CARD_HEIGHT + (MINI_CARD_HEIGHT * 3) + (STACK_OFFSET * 2),
  },
  bigCardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginTop: STACK_OFFSET,
  },
  miniCardsContainer: {
    width: CARD_WIDTH,
  },
  miniCardWrapper: {
    width: '100%',
  },
  bigCard: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  bigCardLogoContainer: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    zIndex: 1,
  },
  bigCardLogo: {
    width: 30,
    height: 30,
    tintColor: 'white',
    opacity: 0.8,
  },
  miniCard: {
    width: '100%',
    height: MINI_CARD_HEIGHT,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  miniCardContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniCardLeft: {
    flex: 1,
  },
  miniCardRight: {
    marginLeft: 12,
  },
  miniCardLogo: {
    width: 20,
    height: 20,
    tintColor: 'white',
  },
  miniCardBusinessName: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  miniCardPunches: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  glassCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardLogoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardBusinessName: {
    color: 'white',
    fontSize: 18,
    marginBottom: 4,
  },
  cardInfo: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLocation: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  rewardProgressInline: {
    marginBottom: 12,
  },
  rewardText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  emptyContainer: {
    minHeight: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(44, 62, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    color: '#2C3E50',
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
}); 