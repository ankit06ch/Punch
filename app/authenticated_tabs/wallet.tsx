import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, Dimensions, TouchableOpacity, StyleSheet, TextInput, ScrollView, Modal, Animated } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../../components/CustomText';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import AnimatedBubblesBackground from '../components/AnimatedBubblesBackground';
import styles, { CARD_WIDTH, CARD_HEIGHT } from '../styles/walletStyles';
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

function CreditCardPunchCard({ card, onMenuPress, isFocused }: { 
  card: any; 
  onMenuPress: () => void; 
  isFocused: boolean;
}) {
  const progress = (card.punches || 0) / (card.total || 10);
  const punchesToReward = (card.total || 10) - (card.punches || 0);
  
  return (
    <View style={[
      styles.creditCard, 
      { 
        backgroundColor: card.color,
        width: CARD_WIDTH, // Always use full width
        transform: [{ scale: isFocused ? 1 : 0.9 }], // Only scale, don't change width
      }
    ]}>
      {/* Menu Button */}
      <TouchableOpacity style={styles.cardMenuButton} onPress={onMenuPress}>
        <AntDesign name="ellipsis1" size={16} color="white" />
      </TouchableOpacity>

      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardLogoSection}>
          <View style={styles.cardLogo}>
            <AntDesign name="star" size={20} color="white" />
          </View>
          <CustomText variant="title" weight="bold" fontFamily="figtree" style={styles.cardBusinessName}>
            {card.name || card.businessName || 'Business'}
          </CustomText>
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color="rgba(255,255,255,0.8)" />
            <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.cardLocation}>
              {card.location || '123 Main St, City'}
            </CustomText>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="time" size={16} color="rgba(255,255,255,0.8)" />
            <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.cardLastUsed}>
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
        </View>
      </View>
    </View>
  );
}

function AnimatedSearchOverlay({ visible, onSearch, onClose }: { visible: boolean; onSearch: (query: string) => void; onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const slideAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible]);

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
    <Animated.View style={[
      styles.animatedSearchOverlay,
      {
        transform: [{
          translateX: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [width, 0],
          })
        }],
        opacity: slideAnim,
      }
    ]}>
      <AntDesign name="search1" size={20} color={COLORS.primary} />
      <TextInput
        style={styles.overlaySearchInput}
        placeholder="Search punch cards..."
        placeholderTextColor={COLORS.text.light}
        value={searchQuery}
        onChangeText={handleSearch}
        autoFocus={visible}
      />
      <TouchableOpacity onPress={handleClose} style={styles.clearButton}>
        <AntDesign name="close" size={16} color={COLORS.text.light} />
      </TouchableOpacity>
    </Animated.View>
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
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const flatListRef = useRef<FlatList<any>>(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'restaurants'));
      const data = querySnapshot.docs.map((doc, idx) => ({
        id: doc.id,
        ...doc.data(),
        color: CARD_COLORS[idx % CARD_COLORS.length],
        location: '123 Main St, Downtown',
        lastUsed: '2 days ago',
        punches: Math.floor(Math.random() * 10) + 1,
        total: 10,
      }));
      setRestaurants(data);
      setLoading(false);
    };
    fetchRestaurants();
  }, []);

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

  const handleViewAllTransactions = () => {
    setShowAllTransactions(!showAllTransactions);
  };

  const handleSearchToggle = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible) {
      setSearchQuery('');
    }
  };

  const handleSearchClose = () => {
    setSearchVisible(false);
    setSearchQuery('');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentCardIndex(viewableItems[0].index || 0);
    }
  }).current;

  const displayedTransactions = showAllTransactions ? SAMPLE_TRANSACTIONS : SAMPLE_TRANSACTIONS.slice(0, 3);

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
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <CustomText variant="title" weight="bold" fontFamily="figtree" style={styles.title}>
              My Wallet
            </CustomText>
            <CustomText variant="subtitle" weight="normal" fontFamily="figtree" style={styles.subtitle}>
              Manage your punch cards and rewards
            </CustomText>
          </View>

          {/* Punch Cards Section - No white box */}
          <View style={styles.punchCardSection}>
            <View style={styles.punchCardHeader}>
              <CustomText variant="subtitle" weight="bold" fontFamily="figtree" style={styles.punchCardTitle}>
                Punch Cards ({filteredRestaurants.length})
              </CustomText>
              <TouchableOpacity style={styles.searchIconButton} onPress={handleSearchToggle}>
                <AntDesign name={searchVisible ? "close" : "search1"} size={20} color={COLORS.primary} />
              </TouchableOpacity>
              
              {/* Animated Search Overlay */}
              <AnimatedSearchOverlay 
                visible={searchVisible} 
                onSearch={handleSearch} 
                onClose={handleSearchClose}
              />
            </View>

            {/* Filter Chips - Moved here under the title */}
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
                      onMenuPress={() => handleMenuPress(item)}
                      isFocused={index === currentCardIndex}
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
              {displayedTransactions.map((tx) => (
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
    </View>
  );
}