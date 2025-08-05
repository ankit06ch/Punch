import React, { useRef, useState, useEffect } from 'react';
import { View, FlatList, Dimensions, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring, runOnJS } from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { BlurView } from 'expo-blur';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import PunchCard from '../components/PunchCard';
import CustomText from '../../components/CustomText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import AnimatedBubblesBackground from '../components/AnimatedBubblesBackground';
import { useRouter } from 'expo-router';
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

// Orange and Navy theme colors
const COLORS = {
  primary: '#FB7A20',      // Orange
  secondary: '#1E3A8A',    // Navy
  accent: '#F97316',       // Darker orange
  background: '#FFFFFF',   // White background (changed from peach)
  text: {
    primary: '#000000',    // Black text
    secondary: '#374151',  // Dark gray text
    light: '#6B7280',      // Medium gray
  },
  card: {
    primary: '#FB7A20',    // Orange cards
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

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      setLoadingUser(true);
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setName(userData.name || '');
          setPunches(userData.punches || 0);
          setFavorites(userData.favorites || []);
        }
      }
      setLoadingUser(false);
    };
    fetchUserData();
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

  // Filter punch cards to only show user's favorites
  const favoriteCards = restaurants
    .filter(r => favorites.includes(r.name || r.businessName))
    .map(card => ({
      ...card,
      punches: Math.floor(Math.random() * ((card.total || 10) - 1 + 1)) + 1,
      total: card.total || 10,
    }));

  const rewards = [
    { 
      id: 'r1', 
      label: 'Free Coffee', 
      icon: 'coffee', 
      color: COLORS.card.primary,
      description: 'Any size, any flavor',
      progress: 8,
      required: 10
    },
    { 
      id: 'r2', 
      label: '10% Off Next Visit', 
      icon: 'gift', 
      color: COLORS.card.secondary,
      description: 'Valid for 30 days',
      progress: 5,
      required: 8
    },
    { 
      id: 'r3', 
      label: 'Free Side Dish', 
      icon: 'star', 
      color: COLORS.card.accent,
      description: 'Fries, salad, or soup',
      progress: 12,
      required: 15
    },
    { 
      id: 'r4', 
      label: 'Buy 1 Get 1 Free', 
      icon: 'heart', 
      color: COLORS.card.primary,
      description: 'On any menu item',
      progress: 3,
      required: 12
    },
    { 
      id: 'r5', 
      label: 'Free Dessert', 
      icon: 'star', 
      color: COLORS.card.secondary,
      description: 'Cheesecake or ice cream',
      progress: 6,
      required: 10
    },
  ];

  const handleViewAllRewards = () => {
    // Navigate to wallet screen for rewards
    router.push('/authenticated_tabs/wallet');
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
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  punchCountText: {
    color: COLORS.text.secondary,
    marginBottom: 32,
  },
  punchHighlight: {
    color: COLORS.primary,
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
    color: COLORS.primary,
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
    color: COLORS.primary,
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
});