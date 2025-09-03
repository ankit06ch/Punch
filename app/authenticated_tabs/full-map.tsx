import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, TextInput, ScrollView, Text, Image, PanResponder, Alert, Keyboard, Animated as RNAnimated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AntDesign, Feather } from '@expo/vector-icons';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { trackRestaurantLike, trackRestaurantMapInteraction } from '../../utils/restaurantTracking';
import CustomText from '../../components/CustomText';
import RestaurantModal from '../../components/RestaurantModal';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface Restaurant {
  id: string;
  name: string;
  businessName?: string;
  latitude?: number;
  longitude?: number;
  color: string;
  distance?: string;
  hours?: string;
  price?: string;
  cuisine?: string;
  rating?: string;
  logoUrl?: string;
  activeRewards?: any[];
  location?: string;
}

const COLORS = {
  primary: '#2C3E50',      // Dark blue-gray (matching wallet)
  secondary: '#34495E',    // Medium blue-gray
  background: '#FFFFFF',
  text: {
    primary: '#2C3E50',    // Dark blue-gray (matching wallet)
    secondary: '#7F8C8D',  // Medium gray (matching wallet)
    light: '#BDC3C7',      // Light gray (matching wallet)
  },
};

export default function FullMapScreen() {
  const router = useRouter();
  const { lat, lng, name } = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: lat ? parseFloat(lat as string) : 34.2073, // Default to Cumming, GA
    longitude: lng ? parseFloat(lng as string) : -84.1402,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchResultsOpacity = useRef(new RNAnimated.Value(0)).current;
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [liked, setLiked] = useState<string[]>([]);
  
  // Animation values for location button
  const buttonScale = useSharedValue(1);
  const buttonRotation = useSharedValue(0);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance < 1 ? `${(distance * 5280).toFixed(0)} ft` : `${distance.toFixed(1)} mi`;
  };



  useEffect(() => {
    fetchRestaurants();
    requestLocationPermission();
    fetchLiked();
  }, []);

  // Handle URL parameters for restaurant navigation
  useEffect(() => {
    if (lat && lng) {
      const targetLat = parseFloat(lat as string);
      const targetLng = parseFloat(lng as string);
      
      setRegion({
        latitude: targetLat,
        longitude: targetLng,
        latitudeDelta: 0.01, // Zoom in closer for specific restaurant
        longitudeDelta: 0.01,
      });
    }
  }, [lat, lng]);

  useEffect(() => {
    if (userLocation) {
      setRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [userLocation]);

  // Recalculate distances when user location changes
  useEffect(() => {
    if (userLocation && restaurants.length > 0) {
      const restaurantsWithDistance = restaurants.map(restaurant => ({
        ...restaurant,
        distance: restaurant.latitude && restaurant.longitude 
          ? calculateDistance(
              userLocation.coords.latitude,
              userLocation.coords.longitude,
              restaurant.latitude,
              restaurant.longitude
            )
          : 'N/A'
      }));
      setRestaurants(restaurantsWithDistance);
    }
  }, [userLocation]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
      if (filtered.length > 0) {
        RNAnimated.timing(searchResultsOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } else {
      setSearchResults([]);
      RNAnimated.timing(searchResultsOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [searchQuery, restaurants]);

  const fetchRestaurants = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'restaurants'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Restaurant[];
      
      // Calculate distances if user location is available
      if (userLocation) {
        const restaurantsWithDistance = data.map(restaurant => ({
          ...restaurant,
          distance: restaurant.latitude && restaurant.longitude 
            ? calculateDistance(
                userLocation.coords.latitude,
                userLocation.coords.longitude,
                restaurant.latitude,
                restaurant.longitude
              )
            : 'N/A'
        }));
        setRestaurants(restaurantsWithDistance);
      } else {
        setRestaurants(data);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    // Animate button press
    buttonScale.value = withSequence(
      withSpring(0.9, { damping: 8 }),
      withSpring(1, { damping: 8 })
    );
    
    // Rotate the arrow icon
    buttonRotation.value = withSequence(
      withTiming(360, { duration: 300 }),
      withTiming(0, { duration: 0 })
    );

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation(location);
      
      // Animate to the new region with a smooth fly-back effect
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setRegion(newRegion);
      
      // Animate to the new region
      mapRef.current?.animateToRegion(newRegion, 1500);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Unable to get your current location. Please try again.');
    }
  };

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
  }

  const handleRestaurantPress = (restaurant: Restaurant) => {
    console.log('Restaurant pressed:', restaurant.name);
    // Track map interaction
    trackRestaurantMapInteraction(restaurant.id);
    setSelectedRestaurant(restaurant);
    setModalVisible(true);
  };



  const handleSearchResultPress = (restaurant: Restaurant) => {
    console.log('Search result pressed:', restaurant.name, restaurant.latitude, restaurant.longitude);
    console.log('Setting modal visible to true');
    
    // Dismiss keyboard
    Keyboard.dismiss();
    
    // Show restaurant modal immediately
    setSelectedRestaurant(restaurant);
    setModalVisible(true);
    
    console.log('Modal state should be:', { selectedRestaurant: restaurant, modalVisible: true });
    
    // Clear search and close search results
    setSearchQuery(restaurant.name);
    setIsSearchFocused(false);
    setSearchResults([]);
    
    if (restaurant.latitude && restaurant.longitude) {
      // Zoom to restaurant location
      setRegion({
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        latitudeDelta: 0.005, // Zoom in closer
        longitudeDelta: 0.005,
      });
    } else {
      console.log('Restaurant has no coordinates:', restaurant);
    }
  };

  const restaurantsWithLocation = restaurants.filter(
    restaurant => restaurant.latitude && restaurant.longitude
  );

  // Animated styles for location button
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: buttonScale.value },
      { rotate: `${buttonRotation.value}deg` }
    ],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation={locationPermission}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        mapType="standard"
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
      >
        {restaurantsWithLocation.map((restaurant) => (
          <Marker
            key={restaurant.id}
            coordinate={{
              latitude: restaurant.latitude!,
              longitude: restaurant.longitude!,
            }}
            onPress={() => handleRestaurantPress(restaurant)}
          >
            <View style={[styles.markerContainer, { backgroundColor: restaurant.color }]}>
              <AntDesign name="home" size={12} color="white" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Unified Glassy Search Component */}
      <SafeAreaView style={styles.headerContainer}>
        <BlurView intensity={30} tint="light" style={[
          styles.header,
          isSearchFocused && searchResults.length > 0 && styles.headerExpanded
        ]}>
          <View style={styles.headerContent}>
            <View style={styles.searchRow}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => router.back()}
              >
                <AntDesign name="arrowleft" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              
              <View style={styles.searchInputContainer}>
                <Feather name="search" size={20} color={COLORS.text.light} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search restaurants..."
                  placeholderTextColor={COLORS.text.light}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <AntDesign name="close" size={20} color={COLORS.text.light} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Search Results spanning full width */}
            {isSearchFocused && searchResults.length > 0 && (
              <View style={styles.searchResultsInline}>
                {searchResults.slice(0, 3).map((restaurant) => (
                  <TouchableOpacity
                    key={restaurant.id}
                    style={styles.searchResultItem}
                    onPress={() => handleSearchResultPress(restaurant)}
                  >
                      <View style={styles.searchResultContent}>
                        <CustomText variant="body" weight="medium" fontFamily="figtree" style={styles.searchResultName}>
                          {restaurant.name}
                        </CustomText>
                        <View style={styles.searchResultDetails}>
                          {restaurant.distance && (
                            <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.searchResultDetail}>
                              {restaurant.distance}
                            </CustomText>
                          )}
                          {restaurant.cuisine && (
                            <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.searchResultDetail}>
                              • {restaurant.cuisine}
                            </CustomText>
                          )}
                        </View>
                      </View>
                      <AntDesign name="right" size={16} color={COLORS.text.light} />
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>
        </BlurView>
      </SafeAreaView>



      {/* Location Button */}
      <Animated.View style={[styles.locationButton, buttonAnimatedStyle]}>
        <TouchableOpacity 
          onPress={getCurrentLocation}
          activeOpacity={0.8}
          style={styles.locationButtonTouchable}
        >
          <BlurView intensity={40} tint="light" style={styles.locationButtonBackground}>
            <AntDesign name="arrowup" size={24} color={COLORS.primary} />
          </BlurView>
        </TouchableOpacity>
      </Animated.View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  header: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerExpanded: {
    minHeight: 200, // Expand when search results are shown
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  searchContainer: {
    flex: 1,
  },
  searchResultsInline: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 8,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
    fontFamily: 'figtree',
  },

  searchResultsList: {
    maxHeight: 180, // Limit to 3 items
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  searchResultDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchResultDetail: {
    color: COLORS.text.light,
    marginRight: 8,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  bottomPanel: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: 'white',
    marginRight: 8,
  },
  locationText: {
    color: COLORS.text.primary,
  },
  restaurantCount: {
    color: COLORS.text.light,
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  locationButton: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    zIndex: 9999,
  },
  locationButtonTouchable: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  locationButtonBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },

}); 