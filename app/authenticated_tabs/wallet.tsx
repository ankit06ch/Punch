import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, Dimensions, Easing, TouchableOpacity, Animated as RNAnimated } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import PunchCard from '../components/PunchCard';
import styles from '../styles/walletStyles';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring, runOnJS } from 'react-native-reanimated';

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
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
      <View>
        <Text style={{ fontWeight: '600', color: '#fff', fontSize: 16 }}>{tx.business}</Text>
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

  return (
    <View style={[styles.container, { overflow: 'visible', paddingHorizontal: 0 }]}>
      <MovingOrangeGlow />
      {/* Title with Explore-style spacing */}
      <View style={{ marginTop: 32, marginBottom: 16, paddingHorizontal: 20, overflow: 'visible' }}>
        <Text style={styles.title}>My Punch Cards</Text>
      </View>
      {/* Carousel of cards */}
      <View style={{ height: CARD_HEIGHT + 24, marginBottom: 24, overflow: 'visible', paddingHorizontal: 20 }}>
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item }) => (
            <AnimatedCard card={item}>
              <CreditCard card={item} />
            </AnimatedCard>
          )}
          ListEmptyComponent={loading ? <Text>Loading...</Text> : <Text>No cards yet.</Text>}
        />
      </View>
      {/* Transaction History at the bottom */}
      <View style={styles.transactionHistoryContainer}>
        <LinearGradient
          colors={['#18325a', '#0a2342']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.transactionHistoryBackground}
        />
        <View style={[{ zIndex: 1 }, styles.transactionHistoryContent]}>
          <Text style={[styles.transactionTitle, { color: '#fff' }]}>Transaction History</Text>
          <FlatList
            data={SAMPLE_TRANSACTIONS}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <TransactionItem tx={item} />}
            style={{ marginTop: 8 }}
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.addPassContainer}>
            <Text style={[styles.addPassText, { color: '#b3c6e0' }]}>Add to Apple Wallet coming soon</Text>
          </View>
        </View>
      </View>
    </View>
  );
}