import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, Dimensions, TouchableOpacity, StyleSheet, TextInput, ScrollView, Modal, Animated, PanResponder, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { collection, getDocs, doc, getDoc, updateDoc, arrayRemove, arrayUnion, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../../components/CustomText';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import AnimatedBubblesBackground from '../components/AnimatedBubblesBackground';
import styles, { CARD_WIDTH, CARD_HEIGHT } from '../styles/walletStyles';
import RestaurantModal from '../../components/RestaurantModal';
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

// Define COLORS locally since it's not exported
const COLORS = {
  primary: '#2C3E50',
  success: '#27AE60',
  warning: '#F39C12',
  text: {
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    light: '#BDC3C7',
    white: '#FFFFFF',
  },
  card: {
    primary: '#2C3E50',
    secondary: '#34495E',
    accent: '#E74C3C',
    success: '#27AE60',
    warning: '#F39C12',
    info: '#3498DB',
  }
};

const { width } = Dimensions.get('window');
const CARD_SPACING = 20;
const VISIBLE_CARD_WIDTH = CARD_WIDTH * 0.9; // Slightly smaller when not focused

// Sophisticated card colors
const CARD_COLORS = [
  COLORS.card.primary,    // Dark blue-gray
  COLORS.card.secondary,  // Medium blue-gray
  COLORS.card.accent,     // Red
  COLORS.card.success,    // Green
  COLORS.card.warning,    // Orange
  COLORS.card.info,       // Blue
];

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

function CreditCardPunchCard({ 
  card, 
  isFocused, 
  isShaking, 
  onPress, 
  onLongPress, 
  onDeletePress 
}: { 
  card: any; 
  isFocused: boolean;
  isShaking: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onDeletePress: () => void;
}) {
  const progress = (card.punches || 0) / (card.total || 10);
  const punchesToReward = (card.total || 10) - (card.punches || 0);
  
  // Shaking animation with rotation
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (isShaking) {
      const shake = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnimation, { toValue: 10, duration: 150, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: -10, duration: 150, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: 10, duration: 150, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: 0, duration: 150, useNativeDriver: true }),
        ])
      );
      
      const rotate = Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnimation, { toValue: 0.05, duration: 200, useNativeDriver: true }),
          Animated.timing(rotateAnimation, { toValue: -0.05, duration: 200, useNativeDriver: true }),
          Animated.timing(rotateAnimation, { toValue: 0.05, duration: 200, useNativeDriver: true }),
          Animated.timing(rotateAnimation, { toValue: 0, duration: 200, useNativeDriver: true }),
        ])
      );
      
      shake.start();
      rotate.start();
      return () => {
        shake.stop();
        rotate.stop();
      };
    } else {
      shakeAnimation.setValue(0);
      rotateAnimation.setValue(0);
    }
  }, [isShaking]);
  
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onLongPress();
      }}
      activeOpacity={0.9}
    >
      <Animated.View style={[
        styles.creditCard, 
        { 
          backgroundColor: card.color,
          width: CARD_WIDTH,
                  transform: [
          { scale: isFocused ? 1 : 0.9 },
          { translateX: shakeAnimation },
          { rotate: rotateAnimation.interpolate({
            inputRange: [-0.05, 0.05],
            outputRange: ['-3deg', '3deg']
          })}
        ],
        }
      ]}>
        {/* Delete Button - only show when shaking */}
        {isShaking && (
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={onDeletePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.deleteButtonCircle}>
              <AntDesign name="close" size={12} color="white" />
            </View>
          </TouchableOpacity>
        )}

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
            {card.name || card.businessName || 'Business'}
          </CustomText>
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
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
          
          <View style={styles.infoRow}>
            <Ionicons name="time" size={16} color="rgba(255,255,255,0.8)" />
            <CustomText 
              variant="caption" 
              weight="normal" 
              fontFamily="figtree" 
              style={styles.cardLastUsed}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Last used: {card.lastUsed || '2 days ago'}
            </CustomText>
          </View>

          {/* Reward Progress - Compact layout */}
          <View style={styles.rewardProgressInline}>
            <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.rewardText}>
              {card.punches || 0} / {card.total || 10} punches
            </CustomText>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
          
          {/* Punch Logo - Bottom Right */}
          <View style={styles.punchLogoContainer}>
            <Image 
              source={require('../../assets/Punch_Logos/PunchP_logo/punchPlogo.png')} 
              style={styles.punchLogoImage}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  </TouchableOpacity>
  );
}

function AnimatedSearchOverlay({ visible, onSearch, onClose }: { visible: boolean; onSearch: (query: string) => void; onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    onSearch(text);
  };

  const handleClose = () => {
    setSearchQuery('');
    onSearch('');
    onClose();
  };

  return (
    <View style={styles.searchBarContainer}>
      <AntDesign name="search1" size={20} color={COLORS.primary} />
      <TextInput
        style={styles.searchBarInput}
        placeholder="Search transactions..."
        placeholderTextColor={COLORS.text.light}
        value={searchQuery}
        onChangeText={handleSearch}
        autoFocus={visible}
      />
      <TouchableOpacity onPress={handleClose} style={styles.clearButton}>
        <AntDesign name="close" size={16} color={COLORS.text.light} />
      </TouchableOpacity>
    </View>
  );
}

function CardMenuModal({ visible, onClose, card, onAction }: { 
  visible: boolean; 
  onClose: () => void; 
  card: any; 
  onAction: (action: string) => void;
}) {
  const menuItems = [
    { icon: 'eye', label: 'View Details', action: 'view' },
    { icon: 'location', label: 'Get Directions', action: 'directions' },
    { icon: 'sharealt', label: 'Share Card', action: 'share' },
    { icon: 'delete', label: 'Remove Card', action: 'remove' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.menuModal} activeOpacity={1} onPress={onClose}>
        <View style={styles.menuContent}>
          <CustomText variant="subtitle" weight="bold" fontFamily="figtree" style={styles.menuTitle}>
            {card?.name || card?.businessName || 'Business'}
          </CustomText>
          
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                onAction(item.action);
                onClose();
              }}
            >
              <AntDesign name={item.icon as any} size={20} color={COLORS.primary} />
                              <CustomText variant="body" weight="medium" fontFamily="figtree" style={styles.menuItemText}>
                  {item.label}
                </CustomText>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function FilterChips({ activeFilter, setActiveFilter }: { activeFilter: string; setActiveFilter: (filter: string) => void }) {
  const filters = [
    { key: 'all', label: 'All Cards' },
    { key: 'nearby', label: 'Nearby' },
    { key: 'recent', label: 'Recently Used' },
    { key: 'close', label: 'Close to Reward' },
  ];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterChip,
            activeFilter === filter.key && styles.filterChipActive
          ]}
          onPress={() => setActiveFilter(filter.key)}
        >
          <CustomText 
            variant="caption" 
            weight="medium" 
            fontFamily="figtree"
            style={[
              styles.filterChipText,
              activeFilter === filter.key && styles.filterChipTextActive
            ]}
          >
            {filter.label}
          </CustomText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function TransactionItem({ tx }: { tx: any }) {
  let iconName = 'card-outline';
  let iconColor = COLORS.primary;
  if (tx.type === 'Punch Earned') {
    iconName = 'checkmark-circle';
    iconColor = COLORS.success;
  } else if (tx.type === 'Reward Redeemed') {
    iconName = 'gift';
    iconColor = COLORS.warning;
  }
  
  return (
    <GlassCard style={styles.transactionCard}>
      <View style={styles.transactionContent}>
        <View style={[styles.transactionIcon, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={iconName as any} size={20} color={iconColor} />
        </View>
        <View style={styles.transactionInfo}>
          <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.transactionBusiness}>
            {tx.business}
          </CustomText>
          <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.transactionType}>
            {tx.type}
          </CustomText>
          <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.transactionDate}>
            {tx.date}
          </CustomText>
        </View>
        <CustomText 
          variant="body" 
          weight="bold" 
          fontFamily="figtree"
          style={[
            styles.transactionAmount,
            { color: tx.amount.startsWith('+') ? COLORS.success : COLORS.warning }
          ]}
        >
          {tx.amount}
        </CustomText>
      </View>
    </GlassCard>
  );
}



// Sample transaction data for UI
const SAMPLE_TRANSACTIONS = [
  {
    id: '1',
    business: 'Joe\'s Coffee',
    date: '2024-06-01',
    type: 'Punch Earned',
    amount: '+1 Punch',
  },
  {
    id: '2',
    business: 'Pizza Palace',
    date: '2024-05-28',
    type: 'Reward Redeemed',
    amount: '-10 Punches',
  },
  {
    id: '3',
    business: 'Burger Bros',
    date: '2024-05-25',
    type: 'Punch Earned',
    amount: '+1 Punch',
  },
  {
    id: '4',
    business: 'Joe\'s Coffee',
    date: '2024-05-20',
    type: 'Punch Earned',
    amount: '+1 Punch',
  },
  {
    id: '5',
    business: 'Pizza Palace',
    date: '2024-05-15',
    type: 'Punch Earned',
    amount: '+1 Punch',
  },
];

export default function Wallet() {
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

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchAnimation] = useState(new Animated.Value(-300)); // Start off-screen to the left
  const [transactionSearchVisible, setTransactionSearchVisible] = useState(false);
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [restaurantModalVisible, setRestaurantModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<any>(null);
  const [shakingCards, setShakingCards] = useState<Set<string>>(new Set());
  const [liked, setLiked] = useState<string[]>([]);
  const [userPunchCards, setUserPunchCards] = useState<{[key: string]: number}>({});
  const flatListRef = useRef<FlatList<any>>(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      
      try {
        // Fetch all restaurants (same as home page)
        const querySnapshot = await getDocs(collection(db, 'restaurants'));
        const data = querySnapshot.docs.map((doc, idx) => ({
          id: doc.id,
          ...doc.data(),
          color: CARD_COLORS[doc.id.charCodeAt(0) % CARD_COLORS.length], // Consistent color based on ID
          punches: 0, // Will be updated with real data from user profile
        }));
        setRestaurants(data);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        setRestaurants([]);
      }
      
      setLoading(false);
    };
    
    fetchRestaurants();
  }, []);

  // Set up real-time listener for liked restaurants
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc: any) => {
      if (doc.exists()) {
        const userData = doc.data();
        setLiked(userData.likedRestaurants || []);
        setUserPunchCards(userData.punchCards || {}); // Get real punch card data
      }
    }, (error: any) => {
      console.error('Error listening to liked restaurants:', error);
    });

    return () => unsubscribe();
  }, []);

  // Update restaurants with real punch data when userPunchCards changes
  useEffect(() => {
    if (Object.keys(userPunchCards).length > 0) {
      setRestaurants(prevRestaurants => 
        prevRestaurants.map(restaurant => ({
          ...restaurant,
          punches: userPunchCards[restaurant.id] || 0
        }))
      );
    }
  }, [userPunchCards]);

  // Filter restaurants based on search and filter
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.businessName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (activeFilter) {
      case 'nearby':
        return restaurant.distance < 5; // Assuming distance in miles
      case 'recent':
        return restaurant.lastUsed?.includes('today') || restaurant.lastUsed?.includes('yesterday');
      case 'close':
        return (restaurant.total - restaurant.punches) <= 2;
      default:
        return true;
    }
  });



  const handleMenuPress = (card: any) => {
    setSelectedCard(card);
    setMenuVisible(true);
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'view':
        console.log('View details for:', selectedCard?.name);
        break;
      case 'directions':
        console.log('Get directions to:', selectedCard?.name);
        break;
      case 'share':
        console.log('Share card:', selectedCard?.name);
        break;
      case 'remove':
        console.log('Remove card:', selectedCard?.name);
        break;
    }
  };



  const handleCardLongPress = (card: any) => {
    // Long press - start shaking and show delete button on all cards
    setShakingCards(new Set(filteredRestaurants.map(c => c.id)));
  };

  const handleDeleteButtonPress = (card: any) => {
    setCardToDelete(card);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!cardToDelete) return;
    
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Remove from user's punch cards
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        punchCards: arrayRemove(cardToDelete.id)
      });

      // Update local state
      setRestaurants(prev => prev.filter(card => card.id !== cardToDelete.id));
      setShakingCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardToDelete.id);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting card:', error);
    }

    setDeleteModalVisible(false);
    setCardToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setCardToDelete(null);
    // Stop shaking all cards
    setShakingCards(new Set());
  };

  const handleCardPress = (card: any) => {
    // If cards are shaking, stop shaking and don't open restaurant modal
    if (shakingCards.size > 0) {
      setShakingCards(new Set());
      return;
    }
    // Single tap - show restaurant modal
    setSelectedRestaurant(card);
    setRestaurantModalVisible(true);
  };

  const handleBackgroundPress = () => {
    // If cards are shaking, stop shaking when pressing anywhere
    if (shakingCards.size > 0) {
      setShakingCards(new Set());
    }
  };

  const handleRestaurantModalClose = () => {
    setRestaurantModalVisible(false);
    setSelectedRestaurant(null);
  };

  const toggleLike = async (restaurantId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const currentLiked = userDoc.data()?.likedRestaurants || [];
        const currentPunchCards = userDoc.data()?.punchCards || [];
        const isLiked = currentLiked.includes(restaurantId);
        
        if (isLiked) {
          await updateDoc(userRef, {
            likedRestaurants: arrayRemove(restaurantId)
          });
          setLiked(currentLiked.filter((id: string) => id !== restaurantId));
        } else {
          await updateDoc(userRef, {
            likedRestaurants: arrayUnion(restaurantId)
          });
          setLiked([...currentLiked, restaurantId]);
          
          // If this is a new like and the restaurant isn't already in punch cards, add it
          if (!currentPunchCards.includes(restaurantId)) {
            await updateDoc(userRef, {
              punchCards: arrayUnion(restaurantId)
            });
          }
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleViewAllTransactions = () => {
    setShowAllTransactions(!showAllTransactions);
  };

  const handleSearchToggle = () => {
    if (searchVisible) {
      // Animate search bar out to the left
      Animated.timing(searchAnimation, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setSearchVisible(false);
        setSearchQuery('');
      });
    } else {
      // Show search bar and animate in from the left
      setSearchVisible(true);
      Animated.timing(searchAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSearchClose = () => {
    // Animate search bar out to the left
    Animated.timing(searchAnimation, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSearchVisible(false);
      setSearchQuery('');
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleTransactionSearchToggle = () => {
    setTransactionSearchVisible(!transactionSearchVisible);
    if (transactionSearchVisible) {
      setTransactionSearchQuery('');
    }
  };

  const handleTransactionSearchClose = () => {
    setTransactionSearchVisible(false);
    setTransactionSearchQuery('');
  };

  const handleTransactionSearch = (query: string) => {
    setTransactionSearchQuery(query);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentCardIndex(viewableItems[0].index || 0);
    }
  }).current;

  const displayedTransactions = showAllTransactions ? SAMPLE_TRANSACTIONS : SAMPLE_TRANSACTIONS.slice(0, 3);

  // Filter transactions based on search query
  const filteredTransactions = displayedTransactions.filter(tx => {
    if (!transactionSearchQuery) return true;
    return tx.business?.toLowerCase().includes(transactionSearchQuery.toLowerCase()) ||
           tx.type?.toLowerCase().includes(transactionSearchQuery.toLowerCase()) ||
           tx.amount?.toString().includes(transactionSearchQuery);
  });

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedBubblesBackground />
      <SafeAreaView style={styles.safeArea}>
        {/* Fixed Glass Header */}
        <View style={styles.fixedGlassHeader}>
          <BlurView intensity={20} tint="light" style={styles.glassHeader}>
            <CustomText variant="title" weight="bold" fontFamily="figtree" style={styles.glassTitle}>
              My Wallet
            </CustomText>
          </BlurView>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Punch Cards Section */}
          <View style={styles.punchCardSection}>
            <View style={styles.punchCardHeader}>
              {!searchVisible && (
                <CustomText variant="subtitle" weight="bold" fontFamily="figtree" style={styles.punchCardTitle}>
                  Punch Cards ({filteredRestaurants.length})
                </CustomText>
              )}
              
              {/* Search Bar - Full width overlay */}
              {searchVisible && (
                <Animated.View 
                  style={[
                    styles.fullWidthSearchContainer,
                    {
                      transform: [{ translateX: searchAnimation }]
                    }
                  ]}
                >
                  <AnimatedSearchOverlay 
                    visible={searchVisible} 
                    onSearch={handleSearch} 
                    onClose={handleSearchClose}
                  />
                </Animated.View>
              )}
              
              <TouchableOpacity style={styles.searchIconButton} onPress={handleSearchToggle}>
                <AntDesign name={searchVisible ? "close" : "search1"} size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Filter Chips */}
            <FilterChips activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
              </View>
            ) : filteredRestaurants.length === 0 ? (
              <View style={styles.emptyState}>
                <AntDesign name="creditcard" size={48} color={COLORS.primary} style={styles.emptyIcon} />
                <CustomText variant="body" weight="medium" fontFamily="figtree" style={styles.emptyText}>
                  No punch cards found
                </CustomText>
                <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.emptySubtext}>
                  {searchQuery ? 'Try adjusting your search' : 'Start earning punches at local businesses'}
                </CustomText>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={filteredRestaurants}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsList}
                snapToInterval={CARD_WIDTH + CARD_SPACING}
                decelerationRate="fast"
                snapToAlignment="center"
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                getItemLayout={(data, index) => ({
                  length: CARD_WIDTH + CARD_SPACING,
                  offset: (CARD_WIDTH + CARD_SPACING) * index,
                  index,
                })}
                renderItem={({ item, index }) => (
                  <View style={styles.cardWrapper}>
                    <CreditCardPunchCard 
                      card={item} 
                      isFocused={index === currentCardIndex}
                      isShaking={shakingCards.has(item.id)}
                      onPress={() => handleCardPress(item)}
                      onLongPress={() => handleCardLongPress(item)}
                      onDeletePress={() => handleDeleteButtonPress(item)}
                    />
                  </View>
                )}
              />
            )}
          </View>

          {/* Transaction History Section */}
          <GlassCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <CustomText variant="subtitle" weight="bold" fontFamily="figtree" style={styles.sectionTitle}>
                Recent Activity
              </CustomText>
              <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAllTransactions}>
                <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.viewAllText}>
                  {showAllTransactions ? 'Show Less' : 'View All'}
                </CustomText>
                <AntDesign name={showAllTransactions ? "up" : "right"} size={12} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.transactionsList}>
              {filteredTransactions.map((tx) => (
                <TransactionItem key={tx.id} tx={tx} />
              ))}
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>

      {/* Card Menu Modal */}
      <CardMenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        card={selectedCard}
        onAction={handleMenuAction}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleDeleteCancel}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={handleDeleteCancel}
        >
          <BlurView intensity={40} tint="light" style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <AntDesign name="exclamationcircle" size={48} color="#FF3B30" />
              <CustomText variant="title" weight="bold" fontFamily="figtree" style={styles.deleteModalTitle}>
                Delete Punch Card
              </CustomText>
              <CustomText variant="body" weight="normal" fontFamily="figtree" style={styles.deleteModalText}>
                Are you sure you want to delete "{cardToDelete?.name}"? This action cannot be undone.
              </CustomText>
            </View>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity style={styles.deleteCancelButton} onPress={handleDeleteCancel}>
                <CustomText variant="button" weight="bold" fontFamily="figtree" style={styles.deleteCancelButtonText}>
                  Cancel
                </CustomText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={handleDeleteConfirm}>
                <CustomText variant="button" weight="bold" fontFamily="figtree" style={styles.deleteConfirmButtonText}>
                  Delete
                </CustomText>
              </TouchableOpacity>
            </View>
          </BlurView>
        </TouchableOpacity>
      </Modal>

      {/* Restaurant Modal */}
      <RestaurantModal
        restaurant={selectedRestaurant}
        visible={restaurantModalVisible}
        onClose={handleRestaurantModalClose}
        likedRestaurants={liked}
        onLikeUpdate={toggleLike}
      />
    </View>
  );
}