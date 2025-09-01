import React, { useRef, useState, useEffect } from 'react';
import { View, FlatList, Dimensions, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring, runOnJS } from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { BlurView } from 'expo-blur';
import { collection, getDocs, doc, getDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import PunchCard from '../components/PunchCard';
import StackedPunchCards from '../components/StackedPunchCards';
import CustomText from '../../components/CustomText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import AnimatedBubblesBackground from '../components/AnimatedBubblesBackground';
import GoogleMapsView from '../components/GoogleMapsView';
import RestaurantModal from '../../components/RestaurantModal';
import EnhancedRewardCard from '../components/EnhancedRewardCard';
import GiftBoxReward from '../components/GiftBoxReward';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
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
    primary: '#2C3E50',    // Dark blue-gray (matching wallet)
    secondary: '#34495E',  // Medium blue-gray (matching wallet)
    accent: '#E74C3C',     // Red (matching wallet)
    success: '#27AE60',    // Green (matching wallet)
    warning: '#F39C12',    // Orange (matching wallet)
    info: '#3498DB',       // Blue (matching wallet)
  }
};

const CARD_COLORS = [
  COLORS.card.primary,    // Dark blue-gray
  COLORS.card.secondary,  // Medium blue-gray
  COLORS.card.accent,     // Red
  COLORS.card.success,    // Green
  COLORS.card.warning,    // Orange
  COLORS.card.info,       // Blue
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
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [liked, setLiked] = useState<string[]>([]);
  const [giftBoxVisible, setGiftBoxVisible] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [userPunchCards, setUserPunchCards] = useState<{[key: string]: number}>({});
  const router = useRouter();

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
        setUserPunchCards(userData.punchCards || {}); // Get real punch card data
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
        color: CARD_COLORS[doc.id.charCodeAt(0) % CARD_COLORS.length], // Consistent color based on ID
      }));
      setRestaurants(data);
      setLoadingCards(false);
    };
    fetchRestaurants();
  }, []);

  // Fetch liked restaurants and set up real-time listener
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Set up real-time listener for liked restaurants
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setLiked(userData.likedRestaurants || []);
      }
    }, (error) => {
      console.error('Error listening to liked restaurants:', error);
    });

    return () => unsubscribe();
  }, []);

  // Filter punch cards to only show user's liked restaurants that have punch cards
  let favoriteCards = restaurants
    .filter(r => {
      // Check if this restaurant is in the user's liked restaurants
      const isLiked = liked.includes(r.id);
      return isLiked;
    })
    .map(card => ({
      ...card,
      businessName: (card as any).businessName || (card as any).name || 'Business',
      punches: userPunchCards[card.id] || 0, // Use real punch data from user profile
      total: (card as any).total || 10,
      logo: (card as any).logoUrl ? { uri: (card as any).logoUrl } : undefined,
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
    // For testing: ensure some rewards are available
    const testProgress = index === 0 ? rewardType.required : Math.min(restaurant.punches, rewardType.required);
    
    return {
      id: `r${restaurant.id}`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name || restaurant.businessName,
      label: rewardType.label,
      icon: rewardType.icon,
      color: restaurant.color,
      description: rewardType.description,
      progress: testProgress,
      required: rewardType.required,
      isAvailable: testProgress >= rewardType.required,
      logoUrl: (restaurant as any).logoUrl,
    };
  });

  // Sort rewards: available first, then by progress (descending)
  const sortedRewards = rewards.sort((a, b) => {
    // First, sort by availability (available rewards first)
    if (a.isAvailable && !b.isAvailable) return -1;
    if (!a.isAvailable && b.isAvailable) return 1;
    
    // If both are available or both are not available, sort by progress percentage
    const aProgress = (a.progress / a.required) * 100;
    const bProgress = (b.progress / b.required) * 100;
    return bProgress - aProgress; // Descending order
  });

  const handleViewAllRewards = () => {
    // Navigate to wallet screen for rewards
    router.push('/authenticated_tabs/wallet');
  };

  const handleRewardClaim = (reward: any) => {
    setSelectedReward(reward);
    setGiftBoxVisible(true);
  };

  const handleRewardClaimed = () => {
    // Here you would typically update the database to mark the reward as claimed
    // and reset the punch count for that restaurant
    console.log('Reward claimed:', selectedReward);
    // You could add logic here to update the user's claimed rewards in the database
  };





  const handleRestaurantPress = (restaurant: any) => {
    // Show restaurant modal
    setSelectedRestaurant(restaurant);
    setModalVisible(true);
  };

  const toggleLike = async (restaurantId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const userRef = doc(db, 'users', user.uid);
      let newLiked;
      if (liked.includes(restaurantId)) {
        await updateDoc(userRef, { likedRestaurants: arrayRemove(restaurantId) });
        newLiked = liked.filter(id => id !== restaurantId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        await updateDoc(userRef, { likedRestaurants: arrayUnion(restaurantId) });
        newLiked = [...liked, restaurantId];
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setLiked(newLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Fallback: just update local state
      let newLiked;
      if (liked.includes(restaurantId)) {
        newLiked = liked.filter(id => id !== restaurantId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        newLiked = [...liked, restaurantId];
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setLiked(newLiked);
    }
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
            <View style={styles.greetingContainer}>
              <AnimatedGreeting name={name} />
              <AnimatedPunchCount punches={punches} />
            </View>
          )}

          {/* What's Near You Section */}
          <View style={styles.mapSectionContainer}>
            <CustomText variant="subtitle" weight="bold" fontFamily="figtree" style={styles.sectionTitle}>
              What's Near You
            </CustomText>
            
            {/* Add spacing before map */}
            <View style={{ height: 16 }} />
            
            {/* Map Component */}
            <GoogleMapsView 
              restaurants={restaurants} 
              onRestaurantPress={handleRestaurantPress}
            />
          </View>

          {/* Available Rewards Section */}
          <View style={styles.rewardsSectionContainer}>
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
            {sortedRewards.length === 0 ? (
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
                data={sortedRewards.slice(0, 5)}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rewardsList}
                snapToInterval={width * 0.75 + 20} // Snap to each card width (75% + margin)
                snapToAlignment="start"
                decelerationRate="fast"
                renderItem={({ item }) => (
                  <EnhancedRewardCard
                    reward={item}
                    onClaim={handleRewardClaim}
                    isAvailable={item.isAvailable}
                    progress={item.progress}
                    required={item.required}
                  />
                )}
              />
            )}
          </View>

          {/* Punch Cards Section */}
          <View style={styles.sectionContainer}>
            <CustomText variant="subtitle" weight="bold" fontFamily="figtree" style={styles.sectionTitle}>
              Your Favorite Punch Cards
            </CustomText>
            <View style={{ height: 24 }} />
            {loadingCards ? (
              <View style={styles.cardsContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : favoriteCards.length === 0 ? (
              <View style={styles.cardsContainer}>
                <View style={styles.emptyState}>
                  <AntDesign name="star" size={32} color={COLORS.primary} style={styles.emptyIcon} />
                  <CustomText variant="body" weight="medium" fontFamily="figtree" style={styles.emptyText}>
                    No favorite punch cards yet
                  </CustomText>
                  <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.emptySubtext}>
                    Like a restaurant to see it here
                  </CustomText>
                </View>
              </View>
            ) : (
              <View style={[styles.cardsContainer, { minHeight: 360 }]}>
                <StackedPunchCards
                  cards={favoriteCards}
                  onCardPress={(card) => setLastTapped(card.id)}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      
      {/* Restaurant Modal */}
      <RestaurantModal
        restaurant={selectedRestaurant}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedRestaurant(null);
        }}
        likedRestaurants={liked}
        onLikeUpdate={toggleLike}
      />

      {/* Gift Box Reward Modal */}
      <GiftBoxReward
        visible={giftBoxVisible}
        reward={selectedReward}
        onClose={() => {
          setGiftBoxVisible(false);
          setSelectedReward(null);
        }}
        onClaim={handleRewardClaimed}
      />
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  greetingContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
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
  sectionContainer: {
    marginBottom: 24,
    marginHorizontal: 20,
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
  mapSectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 20, // Increased padding for better spacing
  },
  rewardsSectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 0, // No horizontal padding to allow full width
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  testButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
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
    minHeight: 280, // Minimum height for the cards section
    alignItems: 'center',
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
    paddingLeft: 20, // Padding for the first item
    paddingRight: 20, // Padding for the last item
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