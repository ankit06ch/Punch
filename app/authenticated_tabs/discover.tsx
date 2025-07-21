import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Animated, StyleSheet, ScrollView, TextInput, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AntDesign, Feather } from '@expo/vector-icons';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import discoverStyles from '../styles/discoverStyles';

const CATEGORIES = ['FOOD', 'COFFEE', 'DESSERTS', 'BEAUTY'];

export default function Discover() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [liked, setLiked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('COFFEE');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const animationValue = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    fetchRestaurants();
    fetchPromotions();
    fetchLiked();
  }, []);

  async function fetchRestaurants() {
    const querySnapshot = await getDocs(collection(db, 'restaurants'));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setRestaurants(data);
    setLoading(false);
  }

  async function fetchPromotions() {
    setPromotions([
      { business: 'Cafe Delight', promo: 'Free Drink with Meal', image: require('../../assets/images/adaptive-icon.png') },
      { business: 'Sushi Place', promo: '10% Off Rolls', image: require('../../assets/images/adaptive-icon.png') },
      { business: 'Pizza Hub', promo: 'Buy 1 Get 1 Free', image: require('../../assets/images/adaptive-icon.png') },
    ]);
  }

  async function fetchLiked() {
    const user = auth.currentUser;
    if (!user) return;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      setLiked(userDoc.data()?.likedRestaurants || []);
    }
  }

  async function toggleLike(restaurantId: string) {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    let newLiked;
    if (liked.includes(restaurantId)) {
      await updateDoc(userRef, { likedRestaurants: arrayRemove(restaurantId) });
      newLiked = liked.filter(id => id !== restaurantId);
    } else {
      await updateDoc(userRef, { likedRestaurants: arrayUnion(restaurantId) });
      newLiked = [...liked, restaurantId];
    }
    setLiked(newLiked);
  }

  const handleCardPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };
  const handleCardPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Animation handlers
  const [containerLayout, setContainerLayout] = useState({ width: screenWidth, height: screenHeight });
  const diagonal = Math.sqrt(containerLayout.width * containerLayout.width + containerLayout.height * containerLayout.height);
  const CIRCLE_SIZE = diagonal + Math.max(containerLayout.width, containerLayout.height);

  // Start at top-right (center of circle at top-right), end with center of scaled circle at screen center
  const startX = containerLayout.width - CIRCLE_SIZE / 2;
  const startY = 0 - CIRCLE_SIZE / 2;
  const endX = containerLayout.width / 2 - CIRCLE_SIZE / 2;
  const endY = containerLayout.height / 2 - CIRCLE_SIZE / 2;
  const circleTranslateX = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, endX],
  });
  const circleTranslateY = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, endY],
  });
  const circleScale = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 1],
  });

  // Animation handlers (restored)
  const openSearch = () => {
    setSearchActive(true);
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  };
  const closeSearch = () => {
    Animated.timing(animationValue, {
      toValue: 0,
      duration: 900,
      useNativeDriver: true,
    }).start(() => {
      setSearchActive(false);
      setSearchQuery('');
      setSearchResults([]);
    });
  };

  // Filter by category (for demo, just show all)
  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  // Search Firestore for restaurants by name as user types
  useEffect(() => {
    if (!searchActive || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    let isCancelled = false;
    const fetchSearchResults = async () => {
      const querySnapshot = await getDocs(collection(db, 'restaurants'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      const filtered = data.filter((r: any) =>
        r.name && r.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
      if (!isCancelled) setSearchResults(filtered);
    };
    fetchSearchResults();
    return () => { isCancelled = true; };
  }, [searchQuery, searchActive]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }} onLayout={e => setContainerLayout(e.nativeEvent.layout)}>
      <StatusBar style="dark" backgroundColor="#fff" translucent={true} />
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 64, paddingBottom: 6 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#222', marginTop: 8 }}>Explore</Text>
        <TouchableOpacity onPress={openSearch}>
          <Feather name="search" size={26} color="#fb7a20" />
        </TouchableOpacity>
      </View>
      {/* Popular Section */}
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#222', marginLeft: 20, marginBottom: 8 }}>POPULAR <Text style={{ fontSize: 18 }}>👀</Text></Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingBottom: 16, paddingTop: 2 }}>
        {promotions.map((item, idx) => (
          <View key={idx} style={{ backgroundColor: '#fff', borderRadius: 18, marginRight: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, padding: 0, alignItems: 'center', justifyContent: 'center', minWidth: 220 }}>
            <Image source={item.image} style={{ width: 220, height: 90, borderRadius: 18 }} resizeMode="cover" />
            <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#222', marginTop: 8 }}>{item.business}</Text>
            <Text style={{ color: '#fb7a20', fontSize: 13, marginBottom: 8 }}>{item.promo}</Text>
          </View>
        ))}
      </ScrollView>
      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingBottom: 8 }}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={{ marginRight: 18 }}
          >
            <Text style={{ fontSize: 16, fontWeight: activeCategory === cat ? 'bold' : '600', color: activeCategory === cat ? '#222' : '#aaa', letterSpacing: 1, borderBottomWidth: activeCategory === cat ? 2 : 0, borderColor: '#222', paddingBottom: 2 }}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Restaurant Cards */}
      <FlatList
        data={filteredRestaurants}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, backgroundColor: '#fff', paddingTop: 8 }}
        refreshing={loading}
        onRefresh={fetchRestaurants}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPressIn={handleCardPressIn}
            onPressOut={handleCardPressOut}
            style={{ marginBottom: 16 }}
          >
            <Animated.View style={[discoverStyles.restaurantCard, { transform: [{ scale: scaleAnim }], marginHorizontal: 0 }]}> 
              <View style={discoverStyles.restaurantLogoWrap}>
                {item.logoUrl ? (
                  <Image source={{ uri: item.logoUrl }} style={discoverStyles.restaurantLogo} />
                ) : (
                  <Image source={require('../../assets/Punch_Logos/Punch_T/black_logo.png')} style={discoverStyles.restaurantLogo} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={discoverStyles.cardTitle}>{item.name}</Text>
                <View style={discoverStyles.badgeRow}>
                  <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>{item.distance}</Text></View>
                  <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>{item.hours}</Text></View>
                  <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>{item.price}</Text></View>
                  {item.cuisine && <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>{item.cuisine}</Text></View>}
                  {item.rating && <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>★ {item.rating}</Text></View>}
                </View>
              </View>
              <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.heartButton}>
                <AntDesign name={liked.includes(item.id) ? 'heart' : 'hearto'} size={24} color={liked.includes(item.id) ? '#fb7a20' : '#bbb'} />
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        )}
      />
      {/* Orange Search Overlay with Spilling Animation */}
      {searchActive && (
        <>
          <Animated.View
            pointerEvents="auto"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              borderRadius: CIRCLE_SIZE / 2,
              backgroundColor: '#fb7a20',
              zIndex: 100,
              transform: [
                { translateX: circleTranslateX },
                { translateY: circleTranslateY },
                { scale: circleScale },
              ],
            }}
          />
          {/* Overlay content, fades in with animation */}
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: containerLayout.width,
              height: containerLayout.height,
              zIndex: 101,
              opacity: animationValue,
              justifyContent: 'flex-start',
            }}
            // pointerEvents logic removed for linter safety
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 64, paddingHorizontal: 20, marginBottom: 16 }}>
              <TouchableOpacity onPress={closeSearch} style={{ marginRight: 16 }}>
                <AntDesign name="arrowleft" size={28} color="#fff" />
              </TouchableOpacity>
              <TextInput
                style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#222' }}
                placeholder="Search restaurants..."
                placeholderTextColor="#fb7a20"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
            {/* Search results */}
            <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
              {searchQuery.trim() ? (
                searchResults.length > 0 ? (
                  searchResults.map((r: any) => (
                    <TouchableOpacity key={r.id} style={{ paddingVertical: 16, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
                      <Text style={{ color: '#fff', fontSize: 20 }}>{r.name}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 40 }}>
                    No restaurants found.
                  </Text>
                )
              ) : (
                <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 40 }}>
                  Start typing to search for restaurants...
                </Text>
              )}
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 18,
    marginTop: 8,
    color: '#222',
  },
  heartButton: {
    marginLeft: 12,
    alignSelf: 'flex-start',
    padding: 4,
  },
});