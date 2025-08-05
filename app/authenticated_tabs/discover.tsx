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

  const renderRestaurantItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPressIn={handleCardPressIn}
      onPressOut={handleCardPressOut}
      style={{ marginBottom: 20 }}
    >
      <Animated.View style={[discoverStyles.restaurantCard, { transform: [{ scale: scaleAnim }], marginHorizontal: 0 }]}> 
        <View style={discoverStyles.restaurantLogoWrap}>
          {item.logoUrl ? (
            <Image source={{ uri: item.logoUrl }} style={discoverStyles.restaurantLogo} />
          ) : (
            <Image source={require('../../assets/Punch_Logos/Punch_T/black_logo.png')} style={discoverStyles.restaurantLogo} />
          )}
        </View>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={discoverStyles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <View style={discoverStyles.badgeRow}>
            <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>{item.distance}</Text></View>
            <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>{item.hours}</Text></View>
            <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>{item.price}</Text></View>
            {item.cuisine && <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>{item.cuisine}</Text></View>}
            {item.rating && <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>★ {item.rating}</Text></View>}
          </View>
        </View>
        <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.heartButton}>
          <AntDesign name={liked.includes(item.id) ? 'heart' : 'hearto'} size={26} color={liked.includes(item.id) ? '#fb7a20' : '#bbb'} />
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }} onLayout={e => setContainerLayout(e.nativeEvent.layout)}>
      <StatusBar style="dark" backgroundColor="#fff" translucent={true} />
      
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 16 }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#222', marginTop: 8 }}>Explore</Text>
        <TouchableOpacity onPress={openSearch}>
          <Feather name="search" size={28} color="#fb7a20" />
        </TouchableOpacity>
      </View>
      
      {/* Main Scrollable Content */}
      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Popular Section */}
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#222', marginLeft: 24, marginBottom: 16, marginTop: 8 }}>POPULAR <Text style={{ fontSize: 20 }}>👀</Text></Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 24, paddingBottom: 24, paddingTop: 4 }}>
          {promotions.map((item, idx) => (
            <View key={idx} style={{ backgroundColor: '#fff', borderRadius: 20, marginRight: 24, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, padding: 0, alignItems: 'center', justifyContent: 'center', minWidth: 240, height: 160 }}>
              <Image source={item.image} style={{ width: 240, height: 100, borderRadius: 20 }} resizeMode="cover" />
              <View style={{ padding: 16, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#222', marginBottom: 4, textAlign: 'center' }} numberOfLines={1}>{item.business}</Text>
                <Text style={{ color: '#fb7a20', fontSize: 14, textAlign: 'center' }} numberOfLines={1}>{item.promo}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        
        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 24, paddingBottom: 20, paddingTop: 8 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={{ marginRight: 24 }}
            >
              <Text style={{ fontSize: 17, fontWeight: activeCategory === cat ? 'bold' : '600', color: activeCategory === cat ? '#222' : '#aaa', letterSpacing: 1, borderBottomWidth: activeCategory === cat ? 2 : 0, borderColor: '#222', paddingBottom: 4 }}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Restaurant Cards */}
        <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
          {filteredRestaurants.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPressIn={handleCardPressIn}
              onPressOut={handleCardPressOut}
              style={{ marginBottom: 20 }}
            >
              <Animated.View style={[discoverStyles.restaurantCard, { transform: [{ scale: scaleAnim }], marginHorizontal: 0 }]}> 
                <View style={discoverStyles.restaurantLogoWrap}>
                  {item.logoUrl ? (
                    <Image source={{ uri: item.logoUrl }} style={discoverStyles.restaurantLogo} />
                  ) : (
                    <Image source={require('../../assets/Punch_Logos/Punch_T/black_logo.png')} style={discoverStyles.restaurantLogo} />
                  )}
                </View>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={discoverStyles.cardTitle} numberOfLines={1}>{item.name}</Text>
                  <View style={discoverStyles.badgeRow}>
                    <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>{item.distance}</Text></View>
                    <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>{item.hours}</Text></View>
                    <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>{item.price}</Text></View>
                    {item.cuisine && <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>{item.cuisine}</Text></View>}
                    {item.rating && <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>★ {item.rating}</Text></View>}
                  </View>
                </View>
                <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.heartButton}>
                  <AntDesign name={liked.includes(item.id) ? 'heart' : 'hearto'} size={26} color={liked.includes(item.id) ? '#fb7a20' : '#bbb'} />
                </TouchableOpacity>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
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
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 64, paddingHorizontal: 24, marginBottom: 20 }}>
              <TouchableOpacity onPress={closeSearch} style={{ marginRight: 20 }}>
                <AntDesign name="arrowleft" size={30} color="#fff" />
              </TouchableOpacity>
              <TextInput
                style={{ flex: 1, backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, fontSize: 17, color: '#222' }}
                placeholder="Search restaurants..."
                placeholderTextColor="#fb7a20"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
            {/* Search results */}
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
              {searchQuery.trim() ? (
                searchResults.length > 0 ? (
                  searchResults.map((r: any) => (
                    <TouchableOpacity key={r.id} style={{ paddingVertical: 20, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
                      <Text style={{ color: '#fff', fontSize: 22 }}>{r.name}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={{ color: '#fff', fontSize: 20, textAlign: 'center', marginTop: 60 }}>
                    No restaurants found.
                  </Text>
                )
              ) : (
                <Text style={{ color: '#fff', fontSize: 20, textAlign: 'center', marginTop: 60 }}>
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
    marginLeft: 16,
    alignSelf: 'flex-start',
    padding: 6,
  },
});