import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, Dimensions, Easing, TouchableOpacity, Animated as RNAnimated, PanResponder, StyleSheet } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import PunchCard from '../components/PunchCard';
import styles from '../styles/walletStyles';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const CARD_COLORS = ['#7B61FF', '#FFB443', '#FF6171', '#2EC4B6', '#FFB703', '#A259FF', '#FF6F61', '#43B0FF', '#FFD166', '#06D6A0'];
const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = 180;

function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={{
      height: 10,
      width: '100%',
      backgroundColor: '#eee',
      borderRadius: 5,
      marginTop: 16,
      overflow: 'hidden',
    }}>
      <View style={{
        height: '100%',
        width: `${Math.min(100, Math.max(0, progress * 100))}%`,
        backgroundColor: '#fb7a20',
        borderRadius: 5,
      }} />
    </View>
  );
}

function MovingOrangeGlow() {
  const anim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.timing(anim, {
        toValue: 1,
        duration: 12000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      })
    ).start();
  }, [anim]);
  // Animate X and Y in a looping, smooth path
  const translateX = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [width * 0.1, width * 0.7, width * 0.2] });
  const translateY = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [height * 0.2, height * 0.7, height * 0.5] });
  return (
    <RNAnimated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: width,
        height: height,
        zIndex: -100,
      }}
    >
      <RNAnimated.View
        style={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: 160,
          opacity: 0.10, // even lighter
          transform: [
            { translateX },
            { translateY },
          ],
          shadowColor: '#fb7a20',
          shadowOpacity: 0.4,
          shadowRadius: 80,
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        <LinearGradient
          colors={["#fb7a20", "#fff0", "#fff0"]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: 160 }}
        />
      </RNAnimated.View>
    </RNAnimated.View>
  );
}

function CreditCard({ card }: { card: any }) {
  const progress = (card.punches || 0) / (card.total || 10);
  // Create a lighter, more transparent version of the card color for the gradient
  // We'll use a simple function for this (works for hex colors like #RRGGBB)
  function lighten(hex: string, amount: number) {
    let col = hex.replace('#', '');
    if (col.length === 3) col = col.split('').map(x => x + x).join('');
    const num = parseInt(col, 16);
    let r = Math.min(255, ((num >> 16) & 0xff) + amount);
    let g = Math.min(255, ((num >> 8) & 0xff) + amount);
    let b = Math.min(255, (num & 0xff) + amount);
    return `rgba(${r},${g},${b},0.85)`;
  }
  const gradientColors: [string, string] = [card.color, lighten(card.color, 32)];
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0.1, y: 0.1 }}
      end={{ x: 0.9, y: 0.9 }}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 24,
        marginHorizontal: 12,
        padding: 24,
        justifyContent: 'space-between',
        shadowColor: card.color,
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      }}
    >
      <View>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8 }}>
          {card.name || card.businessName || 'Business'}
        </Text>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500', opacity: 0.8 }}>
          {card.location || 'Location'}
        </Text>
      </View>
      <View>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
          {card.punches || 0} / {card.total || 10} punches
        </Text>
        <ProgressBar progress={progress} />
      </View>
    </LinearGradient>
  );
}

const AnimatedTouchable = Animated.createAnimatedComponent(View);

function AnimatedCard({ card, children }: { card: any; children: React.ReactNode }) {
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
  };

  return (
    <AnimatedTouchable style={[{ marginHorizontal: 8 }, animatedStyle]}>
      <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
        <TouchableOpacity activeOpacity={0.85} onPress={handlePress} style={{ flex: 1 }}>
          {children}
        </TouchableOpacity>
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
      </View>
    </AnimatedTouchable>
  );
}

// Sample transaction data for UI
const SAMPLE_TRANSACTIONS = [
  {
    id: '1',
    business: 'Joe’s Coffee',
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
    business: 'Joe’s Coffee',
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

function TransactionItem({ tx }: { tx: any }) {
  let iconName = 'card-outline';
  let iconColor = '#fb7a20';
  if (tx.type === 'Punch Earned') {
    iconName = 'checkmark-circle';
    iconColor = '#2EC4B6';
  } else if (tx.type === 'Reward Redeemed') {
    iconName = 'gift';
    iconColor = '#FFD166';
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: 'rgba(255,128,32,0.08)' }}>
      <Ionicons name={iconName as any} size={28} color={iconColor} style={{ marginRight: 16 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600', color: '#fb7a20', fontSize: 16 }}>{tx.business}</Text>
        <Text style={{ color: '#b3c6e0', fontSize: 14 }}>{tx.type}</Text>
        <Text style={{ color: '#7a8fa6', fontSize: 13 }}>{tx.date}</Text>
      </View>
      <Text style={{ fontWeight: '700', color: tx.amount.startsWith('+') ? '#2EC4B6' : '#FFD166', fontSize: 16 }}>{tx.amount}</Text>
    </View>
  );
}

export default function Wallet() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<any>>(null);

  // Bottom sheet animation state
  const screenHeight = Dimensions.get('window').height;
  const minSheetHeight = 400; // Height for preview (top bar + Transaction History title + 2-3 transactions visible)
  const maxSheetHeight = screenHeight * 0.85; // Take up most of the screen when expanded
  const sheetAnim = useRef(new RNAnimated.Value(minSheetHeight)).current;
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const sheetAnimValueRef = useRef(minSheetHeight);

  // PanResponder for drag up/down
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        let newHeight = (sheetExpanded ? maxSheetHeight : minSheetHeight) - gestureState.dy;
        newHeight = Math.max(minSheetHeight, Math.min(maxSheetHeight, newHeight));
        sheetAnim.setValue(newHeight);
        sheetAnimValueRef.current = newHeight;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -40) {
          // Dragged up
          RNAnimated.timing(sheetAnim, {
            toValue: maxSheetHeight,
            duration: 200,
            useNativeDriver: false,
          }).start(() => setSheetExpanded(true));
        } else if (gestureState.dy > 40) {
          // Dragged down
          RNAnimated.timing(sheetAnim, {
            toValue: minSheetHeight,
            duration: 200,
            useNativeDriver: false,
          }).start(() => setSheetExpanded(false));
        } else {
          // Snap to closest
          if (sheetAnimValueRef.current > (minSheetHeight + maxSheetHeight) / 2) {
            RNAnimated.timing(sheetAnim, {
              toValue: maxSheetHeight,
              duration: 200,
              useNativeDriver: false,
            }).start(() => setSheetExpanded(true));
          } else {
            RNAnimated.timing(sheetAnim, {
              toValue: minSheetHeight,
              duration: 200,
              useNativeDriver: false,
            }).start(() => setSheetExpanded(false));
          }
        }
      },
    })
  ).current;

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'restaurants'));
      const data = querySnapshot.docs.map((doc, idx) => ({
        id: doc.id,
        ...doc.data(),
        color: CARD_COLORS[idx % CARD_COLORS.length],
      }));
      setRestaurants(data);
      setLoading(false);
    };
    fetchRestaurants();
  }, []);

  // Handler for FlatList scroll to update current index
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  // Function to jump to a card when a dot is pressed
  const scrollToIndex = (idx: number) => {
    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
  };

  return (
    <View style={[styles.container, { overflow: 'visible', paddingHorizontal: 0, flex: 1 }]}> 
      <MovingOrangeGlow />
      {/* Title with Explore-style spacing */}
      <View style={{ marginTop: 32, marginBottom: 16, paddingHorizontal: 20, overflow: 'visible' }}>
        <Text style={styles.title}>My Punch Cards</Text>
      </View>
      {/* Carousel of cards */}
      <View style={{ height: CARD_HEIGHT + 24, marginBottom: 16, overflow: 'visible', paddingHorizontal: 0 }}>
        <FlatList
          ref={flatListRef}
          data={restaurants}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 32 }}
          snapToInterval={360 + 24} // card width + margin
          decelerationRate="fast"
          snapToAlignment="center"
          ItemSeparatorComponent={() => <View style={{ width: 24 }} />}
          renderItem={({ item }) => (
            <AnimatedCard card={item}>
              <PunchCard
                businessName={item.name || item.businessName || 'Business'}
                punches={item.punches || 0}
                total={item.total || 10}
                color={item.color}
                logo={item.logoUrl ? { uri: item.logoUrl } : undefined}
              />
            </AnimatedCard>
          )}
          ListEmptyComponent={loading ? <Text>Loading...</Text> : <Text>No cards yet.</Text>}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewConfigRef.current}
        />
        {/* Slider Dots */}
        {restaurants.length > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, marginBottom: 8 }}>
            {restaurants.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => scrollToIndex(idx)}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  marginHorizontal: 5,
                  backgroundColor: idx === currentIndex ? '#fb7a20' : '#ffe3c2',
                  borderWidth: idx === currentIndex ? 1.5 : 1,
                  borderColor: idx === currentIndex ? '#fb7a20' : '#ffe3c2',
                }}
              />
            ))}
          </View>
        )}
      </View>
      {/* Member Status Badge */}
      <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 8 }}>
        <View style={{ backgroundColor: '#fb7a20', borderRadius: 18, paddingVertical: 6, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#fb7a20', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 }}>Member Status: Gold</Text>
        </View>
      </View>
      {/* Extra content in white space below member status */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        {/* Motivational message */}
        <Text style={{ color: '#fb7a20', fontWeight: '600', fontSize: 18, marginBottom: 8, marginTop: 8, textAlign: 'center' }}>
          Keep earning punches to unlock your next reward!
        </Text>
        {/* Progress bar toward next reward */}
        <View style={{ width: 220, height: 14, backgroundColor: '#ffe3c2', borderRadius: 7, overflow: 'hidden', marginBottom: 8 }}>
          <View style={{ width: '60%', height: '100%', backgroundColor: '#fb7a20', borderRadius: 7 }} />
        </View>
        {/* Fun icon */}
        <View style={{ marginTop: 4 }}>
          <Ionicons name="trophy" size={32} color="#fb7a20" />
        </View>
      </View>
      {/* Slide-up Transaction History Bottom Sheet */}
      <RNAnimated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 11, // Add margin from the bottom
            height: sheetAnim,
            backgroundColor: '#fff',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: -8 },
            elevation: 30,
            zIndex: 100,
            overflow: 'hidden',
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Handle Bar */}
        <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <View style={{ width: 48, height: 6, borderRadius: 3, backgroundColor: '#eee', marginBottom: 8 }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#fb7a20' }}>Transaction History</Text>
          <Text style={{ color: '#fb7a20', fontWeight: '600', fontSize: 14 }}>{sheetExpanded ? 'Swipe down to close' : 'Swipe up to expand'}</Text>
        </View>
        <FlatList
          data={SAMPLE_TRANSACTIONS}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <TransactionItem tx={item} />}
          style={{ flex: 1, paddingHorizontal: 24, marginTop: 0 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={sheetExpanded}
        />
        <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 12 }}>
          <Text style={{ color: '#aaa', fontSize: 15 }}>Add to Apple Wallet coming soon</Text>
        </View>
      </RNAnimated.View>
    </View>
  );
}