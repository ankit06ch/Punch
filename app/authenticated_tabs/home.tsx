import React, { useRef, useState, useEffect } from 'react';
import { View, Text, FlatList, Dimensions, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring, runOnJS } from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import PunchCard from '../components/PunchCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = 180;
const CARD_COLORS = ['#7B61FF', '#FFB443', '#FF6171', '#2EC4B6', '#FFB703', '#A259FF', '#FF6F61', '#43B0FF', '#FFD166', '#06D6A0'];

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
      style={{ marginHorizontal: 8 }}
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
      <Text style={{ fontSize: 28, fontWeight: '700', color: '#fb7a20', marginBottom: 8 }}>
        👋 Hello, {name || 'Friend'}
      </Text>
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
    <Text style={{ fontSize: 20, color: '#222', marginBottom: 24 }}>
      You have <Text style={{ color: '#fb7a20', fontWeight: '700' }}>{display}</Text> punches
    </Text>
  );
}

function AnimatedBackground() {
  // Subtle animated gradient background
  return (
    <LinearGradient
      colors={["#fff", "#f7f0ff", "#e0e7ff"]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

export default function Home() {
  const [name, setName] = useState('');
  const [punches, setPunches] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [lastTapped, setLastTapped] = useState<string | null>(null);

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

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', overflow: 'visible' }}>
      <AnimatedBackground />
      <View style={{ flex: 1, overflow: 'visible' }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 120, paddingBottom: 24, overflow: 'visible' }}>
          {loadingUser ? (
            <ActivityIndicator size="large" color="#fb7a20" style={{ marginTop: 40 }} />
          ) : (
            <>
              <AnimatedGreeting name={name} />
              <AnimatedPunchCount punches={punches} />
            </>
          )}
          <Text style={{ fontSize: 20, fontWeight: '600', color: '#fb7a20', marginBottom: 12, marginTop: 12 }}>
            Your Punch Cards
          </Text>
          <View style={{ height: CARD_HEIGHT + 24, marginBottom: 24, overflow: 'visible' }}>
            {loadingCards ? (
              <ActivityIndicator size="small" color="#fb7a20" />
            ) : favoriteCards.length === 0 ? (
              <Text style={{ color: '#aaa', fontStyle: 'italic', marginTop: 24 }}>No favorite punch cards yet! Like a restaurant to see it here.</Text>
            ) : (
              <FlatList
                data={favoriteCards}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 8 }}
                renderItem={({ item }) => (
                  <AnimatedCard card={item} onPress={() => setLastTapped(item.id)} />
                )}
              />
            )}
          </View>
          {/* Available Rewards Section */}
          <Text style={{ fontSize: 20, fontWeight: '600', color: '#fb7a20', marginBottom: 8, marginTop: 28 }}>
            Available Rewards
          </Text>
          <FlatList
            data={[
              { id: 'r1', label: 'Free Coffee', icon: '☕️', color: '#7B61FF' },
              { id: 'r2', label: '10% Off', icon: '🎉', color: '#FFB443' },
              { id: 'r3', label: 'Free Fries', icon: '🍟', color: '#2EC4B6' },
              { id: 'r4', label: 'Yoga Class', icon: '🧘‍♂️', color: '#FF6171' },
              { id: 'r5', label: 'Book Discount', icon: '📚', color: '#FFD166' },
            ]}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={{ backgroundColor: item.color, borderRadius: 16, padding: 18, marginRight: 14, width: 120, justifyContent: 'center', alignItems: 'center', shadowColor: item.color, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
                <Text style={{ fontSize: 32, marginBottom: 6 }}>{item.icon}</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff', textAlign: 'center' }}>{item.label}</Text>
              </View>
            )}
          />
          <Text style={{ fontSize: 20, fontWeight: '600', color: '#fb7a20', marginBottom: 8, marginTop: 28 }}>
            Favorites
          </Text>
          <FlatList
            data={favorites}
            keyExtractor={item => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={{ backgroundColor: '#f7f7f7', borderRadius: 10, padding: 16, marginRight: 12, width: 120, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#333' }}>{item}</Text>
              </View>
            )}
          />
        </View>
      </View>
    </View>
  );
}