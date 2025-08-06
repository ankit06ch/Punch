import React, { useRef, useState, useEffect } from 'react';
import { View, FlatList, Dimensions, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring, runOnJS } from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { BlurView } from 'expo-blur';
import { collection, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import PunchCard from '../components/PunchCard';
import CustomText from '../../components/CustomText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import AnimatedBubblesBackground from '../components/AnimatedBubblesBackground';
import GoogleMapsView, { GoogleMapsViewRef } from '../components/GoogleMapsView';
import { useRouter, useFocusEffect } from 'expo-router';
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
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = 180;

// Sophisticated color palette matching wallet page
const COLORS = {
  primary: '#2C3E50',      // Dark blue-gray (matching wallet)
  secondary: '#34495E',    // Medium blue-gray
  accent: '#E74C3C',       // Red accent
  background: '#FFFFFF',   // White background
  text: {
    primary: '#2C3E50',    // Dark blue-gray (matching wallet)
    secondary: '#7F8C8D',  // Medium gray (matching wallet)
    light: '#BDC3C7',      // Light gray (matching wallet)
  },
  card: {
    primary: '#FB7A20',    // Keep orange for cards
    secondary: '#1E3A8A',  // Navy cards
    accent: '#F97316',     // Darker orange
  }
};

const CARD_COLORS = [
  COLORS.card.primary,     // Orange
  COLORS.card.secondary,   // Navy
  COLORS.card.accent,      // Darker orange
  '#2EC4B6',              // Teal
  '#FFB703',              // Yellow
  '#A259FF',              // Purple
  '#FF6F61',              // Coral
  '#43B0FF',              // Blue
  '#FFD166',              // Gold
  '#06D6A0',              // Mint
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function AnimatedCard({ card, onPress }: { card: any; onPress: () => void }) {
  const scale = useSharedValue(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.12, { damping: 4 }),
      withSpring(0.95, { damping: 4 }),
      withSpring(1.08, { damping: 4 }),
      withSpring(1, { damping: 4 }, (finished) => {
        if (finished) runOnJS(setShowConfetti)(true);
      })
    );
    onPress();
  };

  return (
    <AnimatedTouchable
      activeOpacity={0.85}
      onPress={handlePress}
      style={[{ marginHorizontal: 8 }, animatedStyle]}
    >
      <PunchCard
        businessName={card.name || card.businessName || 'Business'}
        punches={card.punches || 0}
        total={card.total || 10}
        color={card.color}
        logo={card.logoUrl ? { uri: card.logoUrl } : undefined}
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      />
      {/* @ts-ignore */}
      {showConfetti && (
        <ConfettiCannon
          count={30}
          origin={{ x: CARD_WIDTH / 2, y: CARD_HEIGHT / 2 }}
          fadeOut
          explosionSpeed={350}
          fallSpeed={2500}
          onAnimationEnd={() => setShowConfetti(false)}
        />
      )}
    </AnimatedTouchable>
  );
}

function AnimatedGreeting({ name }: { name: string }) {
  const scale = useSharedValue(0.8);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 6 });
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={style}>
      <CustomText variant="title" weight="bold" fontFamily="figtree" style={styles.greetingText}>
        Hello, {name || 'Friend'}
      </CustomText>
    </Animated.View>
  );
}

function AnimatedPunchCount({ punches }: { punches: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame = 0;
    const totalFrames = 30;
    const increment = punches / totalFrames;
    const animate = () => {
      frame++;
      setDisplay(Math.round(increment * frame));
      if (frame < totalFrames) requestAnimationFrame(animate);
      else setDisplay(punches);
    };
    animate();
  }, [punches]);
  return (
    <CustomText variant="subtitle" weight="medium" fontFamily="figtree" style={styles.punchCountText}>
      You have <CustomText variant="subtitle" weight="bold" fontFamily="figtree" style={styles.punchHighlight}>{display}</CustomText> punches
    </CustomText>
  );
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

function RewardCard({ reward }: { reward: any }) {
  return (
    <View style={styles.rewardCard}>
      <View style={styles.rewardHeader}>
        <View style={[styles.rewardIcon, { backgroundColor: reward.color }]}>
          <AntDesign name={reward.icon} size={20} color="white" />
        </View>
        <View style={styles.rewardInfo}>
          <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.rewardTitle}>
            {reward.label}
          </CustomText>
          <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.rewardRestaurant}>
            {reward.restaurantName}
          </CustomText>
          <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.rewardDescription}>
            {reward.description}
          </CustomText>
        </View>
      </View>
      <View style={styles.rewardFooter}>
        <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.rewardProgress}>
          {reward.progress} / {reward.required} punches
        </CustomText>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(reward.progress / reward.required) * 100}%`, backgroundColor: reward.color }]} />
        </View>
        {reward.isAvailable && (
          <View style={[styles.availableBadge, { backgroundColor: reward.color }]}>
            <CustomText variant="caption" weight="bold" fontFamily="figtree" style={styles.availableText}>
              Available!
            </CustomText>
          </View>
        )}
      </View>
    </View>
  );
}

export default function Home() {
  // Load Figtree fonts
  const [fontsLoaded] = useFonts({
    Figtree_300Light,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
    Figtree_900Black,
  });

  const [name, setName] = useState('');
  const [punches, setPunches] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [lastTapped, setLastTapped] = useState<string | null>(null);
  const router = useRouter();
  const mapRef = useRef<GoogleMapsViewRef>(null);

  // Fetch user data with real-time listener
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setLoadingUser(true);
    
    // Set up real-time listener for user data changes
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setName(userData.name || '');
        setPunches(userData.punches || 0);
        setFavorites(userData.favorites || []);
      }
      setLoadingUser(false);
    }, (error) => {
      console.error('Error listening to user data:', error);
      setLoadingUser(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch punch cards (restaurants)
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoadingCards(true);
      const querySnapshot = await getDocs(collection(db, 'restaurants'));
      const data = querySnapshot.docs.map((doc, idx) => ({
        id: doc.id,
        ...doc.data(),
        color: CARD_COLORS[idx % CARD_COLORS.length],
      }));
      setRestaurants(data);
      setLoadingCards(false);
    };
    fetchRestaurants();
  }, []);

  // Reset map to user location when home screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Small delay to ensure the map is fully loaded
      const timer = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resetToUserLocation();
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }, [])
  );

  // Filter punch cards to only show user's favorites
  const favoriteCards = restaurants
    .filter(r => favorites.includes(r.name || r.businessName))
    .map(card => ({
      ...card,
      punches: Math.floor(Math.random() * ((card.total || 10) - 1 + 1)) + 1,
      total: card.total || 10,
    }));

  // Create restaurant-specific rewards based on user's favorite restaurants
  const rewards = favoriteCards.slice(0, 5).map((restaurant, index) => {
    const rewardTypes = [
      { 
        label: 'Free Coffee', 
        icon: 'coffee', 
        description: 'Any size, any flavor',
        required: 10
      },
      { 
        label: '10% Off Next Visit', 
        icon: 'gift', 
        description: 'Valid for 30 days',
        required: 8
      },
      { 
        label: 'Free Side Dish', 
        icon: 'star', 
        description: 'Fries, salad, or soup',
        required: 15
      },
      { 
        label: 'Buy 1 Get 1 Free', 
        icon: 'heart', 
        description: 'On any menu item',
        required: 12
      },
      { 
        label: 'Free Dessert', 
        icon: 'star', 
        description: 'Cheesecake or ice cream',
        required: 10
      },
    ];
    
    const rewardType = rewardTypes[index % rewardTypes.length];
    const progress = Math.min(restaurant.punches, rewardType.required);
    
    return {
      id: `r${restaurant.id}`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name || restaurant.businessName,
      label: rewardType.label,
      icon: rewardType.icon,
      color: restaurant.color,
      description: rewardType.description,
      progress: progress,
      required: rewardType.required,
      isAvailable: progress >= rewardType.required
    };
  });

  const handleViewAllRewards = () => {
    // Navigate to wallet screen for rewards
    router.push('/authenticated_tabs/wallet');
  };



  const handleRestaurantPress = (restaurant: any) => {
    // Handle restaurant selection from map
    console.log('Restaurant selected:', restaurant.name);
    // You could navigate to restaurant details or add to favorites
  };

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedBubblesBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loadingUser ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <>
              <AnimatedGreeting name={name} />
              <AnimatedPunchCount punches={punches} />
            </>
          )}

          {/* What's Near You Section */}
          <GlassCard style={styles.sectionCard}>
            <CustomText variant="subtitle" weight="bold" fontFamily="figtree" style={styles.sectionTitle}>
              What's Near You
            </CustomText>
            
            {/* Add spacing before map */}
            <View style={{ height: 16 }} />
            
            {/* Map Component */}
            <GoogleMapsView 
              ref={mapRef}
              restaurants={restaurants} 
              onRestaurantPress={handleRestaurantPress}
            />
          </GlassCard>

          {/* Available Rewards Section */}
          <GlassCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <CustomText variant="subtitle" weight="bold" fontFamily="figtree" style={styles.sectionTitle}>
                Available Rewards
              </CustomText>
              <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAllRewards}>
                <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.viewAllText}>
                  View All
                </CustomText>
                <AntDesign name="right" size={12} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            {rewards.length === 0 ? (
              <View style={styles.emptyRewardsState}>
                <AntDesign name="gift" size={32} color={COLORS.primary} style={styles.emptyIcon} />
                <CustomText variant="body" weight="medium" fontFamily="figtree" style={styles.emptyText}>
                  No rewards available yet
                </CustomText>
                <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.emptySubtext}>
                  Like restaurants to see their rewards
                </CustomText>
              </View>
            ) : (
              <FlatList
                data={rewards}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rewardsList}
                renderItem={({ item }) => (
                  <RewardCard reward={item} />
                )}
              />
            )}
          </GlassCard>

          {/* Punch Cards Section */}
          <GlassCard style={styles.sectionCard}>
            <CustomText variant="subtitle" weight="bold" fontFamily="figtree" style={styles.sectionTitle}>
              Your Punch Cards
            </CustomText>
            <View style={styles.cardsContainer}>
              {loadingCards ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : favoriteCards.length === 0 ? (
                <View style={styles.emptyState}>
                  <AntDesign name="star" size={32} color={COLORS.primary} style={styles.emptyIcon} />
                  <CustomText variant="body" weight="medium" fontFamily="figtree" style={styles.emptyText}>
                    No favorite punch cards yet
                  </CustomText>
                  <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.emptySubtext}>
                    Like a restaurant to see it here
                  </CustomText>
                </View>
              ) : (
                <FlatList
                  data={favoriteCards}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardsList}
                  renderItem={({ item }) => (
                    <AnimatedCard card={item} onPress={() => setLastTapped(item.id)} />
                  )}
                />
              )}
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  greetingText: {
    color: COLORS.primary,  // Use wallet's primary color for title
    marginBottom: 8,
  },
  punchCountText: {
    color: COLORS.text.secondary,  // Use wallet's secondary text color
    marginBottom: 32,
  },
  punchHighlight: {
    color: COLORS.accent,  // Use wallet's accent color for highlights
  },
  glassCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.primary,  // Use wallet's primary color for section titles
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewAllText: {
    color: COLORS.primary,  // Use wallet's primary color for view all text
  },
  cardsContainer: {
    height: CARD_HEIGHT + 24,
  },
  cardsList: {
    paddingVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 12,
    opacity: 0.6,
  },
  emptyText: {
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  emptySubtext: {
    color: COLORS.text.light,
  },
  rewardsList: {
    paddingVertical: 8,
  },
  rewardCard: {
    width: 200,
    marginRight: 16,
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  rewardRestaurant: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  rewardDescription: {
    color: COLORS.text.secondary,
    lineHeight: 16,
  },
  rewardFooter: {
    marginTop: 8,
  },
  rewardProgress: {
    color: COLORS.text.secondary,
    marginBottom: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  availableBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  availableText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyRewardsState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  nearbyContainer: {
    height: CARD_HEIGHT + 24,
  },
  nearbyList: {
    paddingVertical: 8,
  },
});