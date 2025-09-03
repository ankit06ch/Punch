import React, { useRef, useState, useEffect } from 'react';
import { View, FlatList, Dimensions, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Image, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring, withRepeat, runOnJS } from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { BlurView } from 'expo-blur';
import { collection, getDocs, doc, getDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { trackRestaurantLike } from '../../utils/restaurantTracking';
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

function StatCard({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle, 
  statisticKey, 
  isSelected, 
  onPress 
}: { 
  title: string; 
  value: string | number; 
  icon: string; 
  color: string;
  subtitle?: string;
  statisticKey: string;
  isSelected: boolean;
  onPress: (key: string) => void;
}) {
  return (
    <TouchableOpacity 
      style={[
        styles.statCard, 
        { 
          backgroundColor: isSelected ? `${color}CC` : color, // Add transparency when selected
          borderWidth: isSelected ? 3 : 0,
          borderColor: 'white',
          shadowColor: isSelected ? 'white' : '#000',
          shadowOffset: { width: 0, height: isSelected ? 6 : 4 },
          shadowOpacity: isSelected ? 0.3 : 0.1,
          shadowRadius: isSelected ? 12 : 8,
          elevation: isSelected ? 8 : 4,
        }
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(statisticKey);
      }}
      activeOpacity={0.8}
    >
      <View style={styles.statHeader}>
        <AntDesign name={icon as any} size={20} color="white" />
        <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.statTitle}>
          {title}
        </CustomText>
      </View>
      <CustomText variant="title" weight="bold" fontFamily="figtree" style={styles.statValue}>
        {value}
      </CustomText>
      {subtitle && (
        <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.statSubtitle}>
          {subtitle}
        </CustomText>
      )}
    </TouchableOpacity>
  );
}

function AnalyticsGraph({ stats }: { stats: any }) {
  // Create sample data for the graph (in a real app, you'd have historical data)
  const generateGraphData = () => {
    const totalViews = stats?.totalViews || 0;
    const totalLikes = stats?.totalLikes || 0;
    
    // Create a simple bar chart representation
    const maxValue = Math.max(totalViews, totalLikes, 1);
    const viewsHeight = (totalViews / maxValue) * 100;
    const likesHeight = (totalLikes / maxValue) * 100;
    
    return { viewsHeight, likesHeight, maxValue };
  };

  const { viewsHeight, likesHeight, maxValue } = generateGraphData();

  return (
    <View style={styles.graphContainer}>
      <CustomText variant="subtitle" weight="bold" fontFamily="figtree" style={styles.graphTitle}>
        Performance Overview
      </CustomText>
      <View style={styles.graphContent}>
        <View style={styles.graphBars}>
          <View style={styles.barContainer}>
            <View style={[styles.bar, { height: `${viewsHeight}%`, backgroundColor: '#3498DB' }]} />
            <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.barLabel}>
              Views
            </CustomText>
          </View>
          <View style={styles.barContainer}>
            <View style={[styles.bar, { height: `${likesHeight}%`, backgroundColor: '#E74C3C' }]} />
            <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.barLabel}>
              Likes
            </CustomText>
          </View>
        </View>
        <View style={styles.graphLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3498DB' }]} />
            <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.legendText}>
              Total Views: {stats?.totalViews || 0}
            </CustomText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#E74C3C' }]} />
            <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.legendText}>
              Total Likes: {stats?.totalLikes || 0}
            </CustomText>
          </View>
        </View>
      </View>
    </View>
  );
}

function TotalViewsCard({ 
  selectedStatistic, 
  businessStats, 
  onStatisticSelect 
}: { 
  selectedStatistic: string; 
  businessStats: any;
  onStatisticSelect: (stat: string) => void;
}) {
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.9);
  
  // Initial entrance animation
  useEffect(() => {
    fadeAnim.value = withSpring(1, { damping: 8 });
    scaleAnim.value = withSpring(1, { damping: 8 });
  }, []);
  
  // Get the selected statistic data
  const getStatisticData = () => {
    const statConfigs = {
      totalViews: {
        title: 'Total Views',
        value: businessStats?.totalViews || 0,
        icon: 'barchart',
        color: '#3498DB',
        subtitle: 'All time'
      },
      totalLikes: {
        title: 'Total Likes',
        value: businessStats?.totalLikes || 0,
        icon: 'like1',
        color: '#E74C3C',
        subtitle: 'All time'
      },
      weeklyViews: {
        title: 'Weekly Views',
        value: businessStats?.weeklyViews || 0,
        icon: 'clockcircle',
        color: '#27AE60',
        subtitle: 'This week'
      },
      monthlyViews: {
        title: 'Monthly Views',
        value: businessStats?.monthlyViews || 0,
        icon: 'calendar',
        color: '#F39C12',
        subtitle: 'This month'
      },
      searchClicks: {
        title: 'Search Clicks',
        value: businessStats?.searchClicks || 0,
        icon: 'find',
        color: '#9B59B6',
        subtitle: 'From search'
      },
      modalViews: {
        title: 'Modal Views',
        value: businessStats?.modalViews || 0,
        icon: 'eye',
        color: '#1ABC9C',
        subtitle: 'Detailed views'
      }
    };

    return statConfigs[selectedStatistic as keyof typeof statConfigs] || statConfigs.totalViews;
  };

  const selectedStat = getStatisticData();
  
  // Create mini graph data based on selected statistic
  const generateMiniGraphData = () => {
    // Simulate some sample data points for the mini graph
    const dataPoints = [20, 35, 25, 45, 30, 40, selectedStat.value];
    const maxValue = Math.max(...dataPoints, 1);
    return dataPoints.map(point => (point / maxValue) * 100);
  };

  const graphData = generateMiniGraphData();

  // Animate when statistic changes
  useEffect(() => {
    fadeAnim.value = withSequence(
      withSpring(0.8, { damping: 8 }),
      withSpring(1, { damping: 8 })
    );
  }, [selectedStatistic]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <Animated.View style={[styles.totalViewsCard, { backgroundColor: selectedStat.color }, animatedStyle]}>
      <View style={styles.cardHeader}>
        <CustomText variant="subtitle" weight="bold" fontFamily="figtree" style={styles.cardTitle}>
          {selectedStat.title}
        </CustomText>
        <AntDesign name={selectedStat.icon as any} size={20} color="white" />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.statNumberContainer}>
          <CustomText variant="title" weight="bold" fontFamily="figtree" style={styles.statNumber}>
            {selectedStat.value}
          </CustomText>
          <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.statSubtitle}>
            {selectedStat.subtitle}
          </CustomText>
        </View>
        <View style={styles.miniGraphContainer}>
          <View style={styles.miniGraph}>
            {graphData.map((height, index) => (
              <View 
                key={index} 
                style={[
                  styles.miniGraphBar, 
                  { 
                    height: `${height}%`,
                    backgroundColor: index === graphData.length - 1 ? 'white' : 'rgba(255, 255, 255, 0.3)'
                  }
                ]} 
              />
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function NotificationsModal({ visible, onClose, stats }: { visible: boolean; onClose: () => void; stats: any }) {
  const generateNotifications = () => {
    const notifications = [];
    
    // Daily insights
    if (stats?.weeklyViews > 0) {
      notifications.push({
        id: 'daily-insight',
        type: 'insight',
        title: 'Daily Insight',
        message: `Today you got ${stats.weeklyViews} views! That's ${Math.round((stats.weeklyViews / 7) * 100)}% of your weekly total. Keep up the great work!`,
        icon: 'barchart',
        color: '#3498DB',
        time: 'Just now'
      });
    }
    
    if (stats?.weeklyLikes > 0) {
      notifications.push({
        id: 'likes-update',
        type: 'like',
        title: 'New Likes',
        message: `You received ${stats.weeklyLikes} new likes this week! Your customers are loving what you're doing.`,
        icon: 'like1',
        color: '#E74C3C',
        time: '2 hours ago'
      });
    }
    
    // Engagement insights
    if (stats?.totalViews > 10) {
      notifications.push({
        id: 'engagement',
        type: 'insight',
        title: 'Engagement Boost',
        message: `Your restaurant has been viewed ${stats.totalViews} times! That's amazing visibility in your area.`,
        icon: 'eye',
        color: '#27AE60',
        time: '1 day ago'
      });
    }
    
    // Search performance
    if (stats?.searchClicks > 0) {
      notifications.push({
        id: 'search-performance',
        type: 'insight',
        title: 'Search Performance',
        message: `People found you through search ${stats.searchClicks} times! Your SEO is working well.`,
        icon: 'find',
        color: '#9B59B6',
        time: '3 days ago'
      });
    }
    
    return notifications;
  };

  const notifications = generateNotifications();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.notificationsModal}>
          <View style={styles.modalHeader}>
            <CustomText variant="title" weight="bold" fontFamily="figtree" style={styles.modalTitle}>
              Notifications
            </CustomText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AntDesign name="close" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={styles.emptyNotifications}>
                <AntDesign name="bells" size={48} color={COLORS.text.light} />
                <CustomText variant="body" weight="medium" fontFamily="figtree" style={styles.emptyText}>
                  No notifications yet
                </CustomText>
                <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.emptySubtext}>
                  We'll notify you about new likes, views, and insights
                </CustomText>
              </View>
            ) : (
              notifications.map((notification) => (
                <View key={notification.id} style={styles.notificationItem}>
                  <View style={[styles.notificationIcon, { backgroundColor: notification.color }]}>
                    <AntDesign name={notification.icon as any} size={16} color="white" />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.notificationTitle}>
                        {notification.title}
                      </CustomText>
                      <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.notificationTime}>
                        {notification.time}
                      </CustomText>
                    </View>
                    <CustomText variant="body" weight="normal" fontFamily="figtree" style={styles.notificationMessage}>
                      {notification.message}
                    </CustomText>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  const [isBusiness, setIsBusiness] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [businessStats, setBusinessStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedStatistic, setSelectedStatistic] = useState<string>('totalViews');
  const [profilePictureError, setProfilePictureError] = useState(false);
  const previousProfilePictureUrl = useRef<string | null>(null);
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
        setIsBusiness(userData.isBusiness || false); // Get business account status
        setUserData(userData); // Store full user data for profile picture
        
        // Reset profile picture error state when user data changes
        if (userData.profilePictureUrl !== previousProfilePictureUrl.current) {
          setProfilePictureError(false);
          previousProfilePictureUrl.current = userData.profilePictureUrl;
        }
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

  // Fetch business statistics for business accounts with real-time updates
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !isBusiness) return;

    setLoadingStats(true);
    
    // Set up real-time listener for business statistics
    const unsubscribe = onSnapshot(doc(db, 'restaurants', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBusinessStats(data);
      }
      setLoadingStats(false);
    }, (error) => {
      console.error('Error listening to business stats:', error);
      setLoadingStats(false);
    });

    return () => unsubscribe();
  }, [isBusiness]);

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
        // Track the unlike action
        await trackRestaurantLike(restaurantId, user.uid, false);
      } else {
        await updateDoc(userRef, { likedRestaurants: arrayUnion(restaurantId) });
        newLiked = [...liked, restaurantId];
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Track the like action
        await trackRestaurantLike(restaurantId, user.uid, true);
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
        {/* White shadow fade at bottom */}
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.8)']}
          style={styles.bottomFade}
          pointerEvents="none"
        />
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
                    {/* Punch Logo at top left - Only for business accounts */}
          {isBusiness && (
            <View style={styles.logoContainer}>
              <View style={styles.logoSquare}>
                <Image 
                  source={require('../../assets/images/icon.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          )}

          {/* Profile Picture and Notifications at top right - Only for business accounts */}
          {isBusiness && (
            <View style={styles.topRightContainer}>
              {/* Notifications Icon */}
              <TouchableOpacity 
                style={styles.notificationContainer}
                onPress={() => setNotificationsVisible(true)}
              >
                <View style={styles.notificationCircle}>
                  <AntDesign name="bells" size={20} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
              
              {/* Profile Picture */}
              <View style={styles.profileContainer}>
                <View style={styles.profileCircle}>
                  {userData?.profilePictureUrl && !profilePictureError ? (
                    <Image 
                      source={{ uri: userData.profilePictureUrl }}
                      style={styles.profileImage}
                      resizeMode="cover"
                      onError={() => {
                        // If profile picture fails to load, we'll fall back to the icon
                        console.log('Profile picture failed to load, using fallback');
                        setProfilePictureError(true);
                      }}
                      defaultSource={require('../../assets/images/icon.png')}
                    />
                  ) : (
                    <Image 
                      source={require('../../assets/images/icon.png')}
                      style={styles.profileImage}
                      resizeMode="contain"
                    />
                  )}
                </View>
              </View>
            </View>
          )}

          {loadingUser ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <View style={[styles.greetingContainer, isBusiness && styles.businessGreetingContainer]}>
              <AnimatedGreeting name={name} />
              {!isBusiness && <AnimatedPunchCount punches={punches} />}
              {isBusiness && (
                <View style={styles.businessAccountContainer}>
                  {businessStats?.name && (
                    <View style={styles.restaurantNameBadge}>
                      <CustomText variant="body" weight="medium" fontFamily="figtree" style={styles.restaurantNameText}>
                        {businessStats.name}
                      </CustomText>
                    </View>
                  )}
                  <View style={styles.businessBadge}>
                    <CustomText variant="body" weight="medium" fontFamily="figtree" style={styles.businessAccountText}>
                      Punch for Business
                    </CustomText>
                    <View style={styles.proBadge}>
                      <CustomText variant="caption" weight="bold" fontFamily="figtree" style={styles.proBadgeText}>
                        Pro
                      </CustomText>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Business Statistics Grid - Only for business accounts */}
          {isBusiness && (
            <View style={styles.statsSectionContainer}>
              
              {loadingStats ? (
                <View style={styles.statsLoadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : businessStats ? (
                <>
                  {/* Total Views Card */}
                  <TotalViewsCard 
                    selectedStatistic={selectedStatistic}
                    businessStats={businessStats}
                    onStatisticSelect={setSelectedStatistic}
                  />
                  <View style={{ height: 24 }} />
                  
                  {/* Statistics Grid */}
                  <View style={styles.statsGrid}>
                    <StatCard
                      title="Total Views"
                      value={businessStats.totalViews || 0}
                      icon="barchart"
                      color="#3498DB"
                      subtitle="All time"
                      statisticKey="totalViews"
                      isSelected={selectedStatistic === 'totalViews'}
                      onPress={setSelectedStatistic}
                    />
                    <StatCard
                      title="Total Likes"
                      value={businessStats.totalLikes || 0}
                      icon="like1"
                      color="#E74C3C"
                      subtitle="All time"
                      statisticKey="totalLikes"
                      isSelected={selectedStatistic === 'totalLikes'}
                      onPress={setSelectedStatistic}
                    />
                    <StatCard
                      title="Weekly Views"
                      value={businessStats.weeklyViews || 0}
                      icon="clockcircle"
                      color="#27AE60"
                      subtitle="This week"
                      statisticKey="weeklyViews"
                      isSelected={selectedStatistic === 'weeklyViews'}
                      onPress={setSelectedStatistic}
                    />
                    <StatCard
                      title="Monthly Views"
                      value={businessStats.monthlyViews || 0}
                      icon="calendar"
                      color="#F39C12"
                      subtitle="This month"
                      statisticKey="monthlyViews"
                      isSelected={selectedStatistic === 'monthlyViews'}
                      onPress={setSelectedStatistic}
                    />
                    <StatCard
                      title="Search Clicks"
                      value={businessStats.searchClicks || 0}
                      icon="find"
                      color="#9B59B6"
                      subtitle="From search"
                      statisticKey="searchClicks"
                      isSelected={selectedStatistic === 'searchClicks'}
                      onPress={setSelectedStatistic}
                    />
                    <StatCard
                      title="Modal Views"
                      value={businessStats.modalViews || 0}
                      icon="eye"
                      color="#1ABC9C"
                      subtitle="Detailed views"
                      statisticKey="modalViews"
                      isSelected={selectedStatistic === 'modalViews'}
                      onPress={setSelectedStatistic}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.statsEmptyContainer}>
                  <AntDesign name="barchart" size={32} color={COLORS.primary} style={styles.emptyIcon} />
                  <CustomText variant="body" weight="medium" fontFamily="figtree" style={styles.emptyText}>
                    No analytics data yet
                  </CustomText>
                  <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.emptySubtext}>
                    Start getting views to see your stats
                  </CustomText>
                </View>
              )}
            </View>
          )}

          {/* What's Near You Section - Only for customers */}
          {!isBusiness && (
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
          )}

          {/* Available Rewards Section - Only for customers */}
          {!isBusiness && (
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
          )}

          {/* Punch Cards Section - Only for customers */}
          {!isBusiness && (
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
          )}
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

      {/* Notifications Modal */}
      <NotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        stats={businessStats}
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
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  logoSquare: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  topRightContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationContainer: {
    // No additional styling needed for the TouchableOpacity
  },
  notificationCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileContainer: {
    // Remove absolute positioning since it's now inside topRightContainer
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  greetingContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  businessGreetingContainer: {
    marginTop: 60,
  },
  statsSectionContainer: {
    marginBottom: 24,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  statTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
  },
  statValue: {
    color: 'white',
    fontSize: 24,
    marginBottom: 4,
  },
  statSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
  },
  statsLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  statsEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  graphContainer: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  graphTitle: {
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  graphContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  graphBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    height: 120,
    justifyContent: 'space-around',
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  bar: {
    width: 40,
    borderRadius: 8,
    marginBottom: 8,
    minHeight: 4,
  },
  barLabel: {
    color: COLORS.text.secondary,
    fontSize: 12,
    textAlign: 'center',
  },
  graphLegend: {
    marginLeft: 20,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: COLORS.text.secondary,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationsModal: {
    width: '90%',
    height: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    color: COLORS.primary,
    fontSize: 20,
  },
  closeButton: {
    padding: 4,
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyNotifications: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.text.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: COLORS.text.light,
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    color: COLORS.primary,
    fontSize: 14,
  },
  notificationTime: {
    color: COLORS.text.light,
    fontSize: 12,
  },
  notificationMessage: {
    color: COLORS.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  totalViewsCard: {
    backgroundColor: 'rgba(44, 62, 80, 0.95)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    marginHorizontal: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statNumberContainer: {
    flex: 1,
  },
  statNumber: {
    color: 'white',
    fontSize: 42,
    fontWeight: 'bold',
    lineHeight: 50,
  },
  miniGraphContainer: {
    width: 80,
    height: 60,
    justifyContent: 'center',
  },
  miniGraph: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    justifyContent: 'space-between',
  },
  miniGraphBar: {
    width: 6,
    borderRadius: 3,
    minHeight: 2,
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
  businessAccountContainer: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  businessBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(251, 122, 32, 0.1)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restaurantNameBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.3)',
  },
  businessAccountText: {
    color: '#FB7A20',
    fontSize: 14,
  },
  restaurantNameText: {
    color: '#3498DB',
    fontSize: 14,
  },

  proBadge: {
    backgroundColor: '#FB7A20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  proBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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