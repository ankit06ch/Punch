import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, StyleSheet, ScrollView, TextInput, Dimensions, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment, writeBatch } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import RestaurantModal from '../../components/RestaurantModal';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Restaurant Metrics Tracking Functions
const trackRestaurantView = async (restaurantId: string, userId: string) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    
    // Update total views and add user to viewed list
    await updateDoc(restaurantRef, {
      totalViews: increment(1),
      lastViewDate: new Date(),
      searchImpressions: increment(1), // Count as impression when viewed
    });
    
    console.log(`Tracked view for restaurant ${restaurantId} by user ${userId}`);
  } catch (error) {
    console.error('Error tracking restaurant view:', error);
  }
};

const trackRestaurantLike = async (restaurantId: string, userId: string, isLiking: boolean) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);
    
    if (!restaurantDoc.exists()) return;
    
    const currentData = restaurantDoc.data();
    const currentLikedByUsers = currentData.likedByUsers || [];
    
    if (isLiking) {
      // User is liking the restaurant
      if (!currentLikedByUsers.includes(userId)) {
        await updateDoc(restaurantRef, {
          totalLikes: increment(1),
          likedByUsers: arrayUnion(userId),
          firstLikeDate: currentData.firstLikeDate || new Date(),
          lastLikeDate: new Date(),
          weeklyLikes: increment(1),
          monthlyLikes: increment(1),
        });
      }
    } else {
      // User is unliking the restaurant
      if (currentLikedByUsers.includes(userId)) {
        await updateDoc(restaurantRef, {
          totalLikes: increment(1),
          likedByUsers: arrayRemove(userId),
          lastLikeDate: new Date(),
          weeklyLikes: increment(-1),
          monthlyLikes: increment(-1),
        });
      }
    }
    
    console.log(`${isLiking ? 'Liked' : 'Unliked'} restaurant ${restaurantId} by user ${userId}`);
  } catch (error) {
    console.error('Error tracking restaurant like:', error);
  }
};

const trackRestaurantClick = async (restaurantId: string) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    
    // Update search clicks when restaurant is clicked
    await updateDoc(restaurantRef, {
      searchClicks: increment(1),
      lastViewDate: new Date(),
    });
    
    console.log(`Tracked click for restaurant ${restaurantId}`);
  } catch (error) {
    console.error('Error tracking restaurant click:', error);
  }
};

// Function to reset weekly metrics (call this weekly)
const resetWeeklyMetrics = async () => {
  try {
    const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
    
    const batch = writeBatch(db);
    restaurantsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        weeklyViews: 0,
        weeklyLikes: 0,
      });
    });
    
    await batch.commit();
    console.log('Weekly metrics reset for all restaurants');
  } catch (error) {
    console.error('Error resetting weekly metrics:', error);
  }
};

// Function to reset monthly metrics (call this monthly)
const resetMonthlyMetrics = async () => {
  try {
    const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
    
    const batch = writeBatch(db);
    restaurantsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        monthlyViews: 0,
        monthlyLikes: 0,
      });
    });
    
    await batch.commit();
    console.log('Monthly metrics reset for all restaurants');
  } catch (error) {
    console.error('Error resetting monthly metrics:', error);
  }
};

export default function Discover() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<any[]>([]);
  const [currentRestaurantIndex, setCurrentRestaurantIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isImageScrolling, setIsImageScrolling] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Like animation states
  const [likedRestaurantId, setLikedRestaurantId] = useState<string | null>(null);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const likeAnimationScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchRestaurants();
    fetchPromotions();
    fetchLiked();
    requestLocationPermission();
  }, []);

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
          : '0.5 mi'
      }));
      setFilteredRestaurants(restaurantsWithDistance);
    } else if (restaurants.length > 0) {
      setFilteredRestaurants(restaurants);
    }
  }, [userLocation, restaurants]);

  // Debug restaurants state changes
  useEffect(() => {
    console.log('Restaurants state updated:', restaurants.length);
    restaurants.forEach((restaurant, index) => {
      console.log(`Restaurant ${index}: ${restaurant.name} has ${restaurant.images?.length || 0} images`);
      if (restaurant.images && restaurant.images.length > 0) {
        console.log(`First image URL: ${restaurant.images[0]}`);
      }
    });
  }, [restaurants]);

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

  // Convert numeric price to dollar signs
  const getPriceLevel = (price: number | string | undefined): string => {
    console.log(`Converting price: ${price} (type: ${typeof price})`);
    
    if (!price) {
      console.log('No price provided, returning $');
      return '$';
    }
    
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    console.log(`Parsed price: ${numPrice}`);
    
    if (isNaN(numPrice)) {
      console.log('Invalid price, returning $');
      return '$';
    }
    
    let result = '$';
    if (numPrice <= 15) result = '$';
    else if (numPrice <= 30) result = '$$';
    else if (numPrice <= 60) result = '$$$';
    else result = '$$$$';
    
    console.log(`Price ${numPrice} converted to: ${result}`);
    return result;
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation(location);
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  async function fetchRestaurants() {
    try {
      const querySnapshot = await getDocs(collection(db, 'restaurants'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      console.log('Fetched restaurants:', data.length);
      console.log('Restaurant names:', data.map(r => r.name));
      console.log('Full restaurant data:', JSON.stringify(data, null, 2));
      
      // Manually add images to restaurants
      const restaurantsWithImages = data.map(restaurant => {
        let images = [];
        
        console.log(`Processing restaurant: ${restaurant.name}`);
        console.log(`Restaurant images field:`, restaurant.images);
        console.log(`Restaurant businessPictures field:`, restaurant.businessPictures);
        console.log(`Restaurant logoUrl field:`, restaurant.logoUrl);
        console.log(`Restaurant all fields:`, Object.keys(restaurant));
        
        // Check for any field that might contain image URLs
        const allImageFields = ['images', 'businessPictures', 'businessPictureUrls', 'photos', 'pictureUrls'];
        allImageFields.forEach(field => {
          if (restaurant[field]) {
            console.log(`Restaurant ${restaurant.name} has ${field}:`, restaurant[field]);
            console.log(`Field ${field} type:`, typeof restaurant[field]);
            console.log(`Field ${field} length:`, Array.isArray(restaurant[field]) ? restaurant[field].length : 'not array');
          }
        });
        
        // Use actual business photos if they exist, otherwise fall back to default images
        if (restaurant.images && restaurant.images.length > 0) {
          console.log(`Restaurant ${restaurant.name} images field type:`, typeof restaurant.images);
          console.log(`Restaurant ${restaurant.name} images field length:`, restaurant.images.length);
          console.log(`Restaurant ${restaurant.name} first image:`, restaurant.images[0]);
          console.log(`Restaurant ${restaurant.name} first image type:`, typeof restaurant.images[0]);
          
          // Validate that the images are valid URLs
          const validImages = restaurant.images.filter((url: any) => {
            const isValid = url && typeof url === 'string' && url.startsWith('http');
            if (!isValid) {
              console.warn(`Invalid image URL for ${restaurant.name}:`, url);
              console.warn(`URL type:`, typeof url);
              console.warn(`URL value:`, url);
            }
            return isValid;
          });
          
          if (validImages.length > 0) {
            images = validImages;
            console.log(`Restaurant ${restaurant.name} using ${images.length} valid photos from images field:`, images);
          } else {
            console.warn(`Restaurant ${restaurant.name} has no valid image URLs in images field, falling back to businessPictures`);
          }
        } else if (restaurant.businessPictures && restaurant.businessPictures.length > 0) {
          console.log(`Restaurant ${restaurant.name} businessPictures field type:`, typeof restaurant.businessPictures);
          console.log(`Restaurant ${restaurant.name} businessPictures field length:`, restaurant.businessPictures.length);
          console.log(`Restaurant ${restaurant.name} first businessPicture:`, restaurant.businessPictures[0]);
          console.log(`Restaurant ${restaurant.name} first businessPicture type:`, typeof restaurant.businessPictures[0]);
          
          // Validate that the businessPictures are valid URLs
          const validImages = restaurant.businessPictures.filter((url: any) => {
            const isValid = url && typeof url === 'string' && url.startsWith('http');
            if (!isValid) {
              console.warn(`Invalid businessPictures URL for ${restaurant.name}:`, url);
              console.warn(`URL type:`, typeof url);
              console.warn(`URL value:`, url);
            }
            return isValid;
          });
          
          if (validImages.length > 0) {
            images = validImages;
            console.log(`Restaurant ${restaurant.name} using ${images.length} valid photos from businessPictures field:`, validImages);
          } else {
            console.warn(`Restaurant ${restaurant.name} has no valid businessPictures URLs, falling back to defaults`);
          }
        } else {
          console.log(`Restaurant ${restaurant.name} has no images or businessPictures, using default images`);
          
          // Only use default images for specific known restaurants, not for new businesses
          if (restaurant.name?.toLowerCase().includes('alessio') || 
              restaurant.name?.toLowerCase().includes('village') ||
              restaurant.name?.toLowerCase().includes('tam') ||
              restaurant.name?.toLowerCase().includes('branchwater') ||
              restaurant.name?.toLowerCase().includes('marlow') ||
              restaurant.name?.toLowerCase().includes('rreal') ||
              restaurant.name?.toLowerCase().includes('ihop') ||
              restaurant.name?.toLowerCase().includes('kfc') ||
              restaurant.name?.toLowerCase().includes('krystal')) {
            
            // Use hardcoded images only for these specific restaurants
            if (restaurant.name?.toLowerCase().includes('alessio')) {
              images = [
                require('../../assets/images/test/360_F_252388016_KjPnB9vglSCuUJAumCDNbmMzGdzPAucK.jpg'),
                require('../../assets/images/test/KC310124-27.webp'),
                require('../../assets/images/test/top-view-table-full-food_23-2149209253.avif'),
                require('../../assets/images/test/istockphoto-1457433817-612x612.jpg')
              ];
            } else if (restaurant.name?.toLowerCase().includes('village')) {
              images = [
                require('../../assets/images/test/istockphoto-1457433817-612x612.jpg'),
                require('../../assets/images/test/360_F_252388016_KjPnB9vglSCuUJAumCDNbmMzGdzPAucK.jpg'),
                require('../../assets/images/test/KC310124-27.webp'),
                require('../../assets/images/test/top-view-table-full-food_23-2149209253.avif')
              ];
            } else if (restaurant.name?.toLowerCase().includes('tam')) {
              images = [
                require('../../assets/images/test/top-view-table-full-food_23-2149209253.avif'),
                require('../../assets/images/test/istockphoto-1457433817-612x612.jpg'),
                require('../../assets/images/test/360_F_252388016_KjPnB9vglSCuUJAumCDNbmMzGdzPAucK.jpg'),
                require('../../assets/images/test/KC310124-27.webp')
              ];
            } else if (restaurant.name?.toLowerCase().includes('branchwater')) {
              images = [
                require('../../assets/images/test/KC310124-27.webp'),
                require('../../assets/images/test/top-view-table-full-food_23-2149209253.avif'),
                require('../../assets/images/test/istockphoto-1457433817-612x612.jpg'),
                require('../../assets/images/test/360_F_252388016_KjPnB9vglSCuUJAumCDNbmMzGdzPAucK.jpg')
              ];
            } else if (restaurant.name?.toLowerCase().includes('marlow')) {
              images = [
                require('../../assets/images/test/istockphoto-1457433817-612x612.jpg'),
                require('../../assets/images/test/KC310124-27.webp'),
                require('../../assets/images/test/360_F_252388016_KjPnB9vglSCuUJAumCDNbmMzGdzPAucK.jpg'),
                require('../../assets/images/test/top-view-table-full-food_23-2149209253.avif')
              ];
            } else if (restaurant.name?.toLowerCase().includes('rreal')) {
              images = [
                require('../../assets/images/test/istockphoto-1457433817-612x612.jpg'),
                require('../../assets/images/test/360_F_252388016_KjPnB9vglSCuUJAumCDNbmMzGdzPAucK.jpg'),
                require('../../assets/images/test/KC310124-27.webp'),
                require('../../assets/images/test/top-view-table-full-food_23-2149209253.avif')
              ];
            } else if (restaurant.name?.toLowerCase().includes('ihop')) {
              images = [
                require('../../assets/images/test/istockphoto-1457433817-612x612.jpg'),
                require('../../assets/images/test/360_F_252388016_KjPnB9vglSCuUJAumCDNbmMzGdzPAucK.jpg'),
                require('../../assets/images/test/KC310124-27.webp'),
                require('../../assets/images/test/top-view-table-full-food_23-2149209253.avif')
              ];
            } else if (restaurant.name?.toLowerCase().includes('kfc')) {
              images = [
                require('../../assets/images/test/KC310124-27.webp'),
                require('../../assets/images/test/top-view-table-full-food_23-2149209253.avif'),
                require('../../assets/images/test/istockphoto-1457433817-612x612.jpg'),
                require('../../assets/images/test/360_F_252388016_KjPnB9vglSCuUJAumCDNbmMzGdzPAucK.jpg')
              ];
            } else if (restaurant.name?.toLowerCase().includes('krystal')) {
              images = [
                require('../../assets/images/test/top-view-table-full-food_23-2149209253.avif'),
                require('../../assets/images/test/istockphoto-1457433817-612x612.jpg'),
                require('../../assets/images/test/360_F_252388016_KjPnB9vglSCuUJAumCDNbmMzGdzPAucK.jpg'),
                require('../../assets/images/test/KC310124-27.webp')
              ];
            }
          } else {
            // For new businesses, don't use any default images - they should have their own photos
            console.log(`Restaurant ${restaurant.name} is a new business with no photos - will show without images`);
            images = [];
          }
        }
        
        console.log(`Restaurant ${restaurant.name} final images array:`, images);
        console.log(`Restaurant ${restaurant.name} final images array length:`, images.length);
        console.log(`Restaurant ${restaurant.name} first image URL:`, images[0]);
        
        return {
          ...restaurant,
          images: images
        };
      });
      
      console.log('Final restaurantsWithImages:', restaurantsWithImages.map(r => ({ name: r.name, imageCount: r.images?.length || 0, firstImage: r.images?.[0] })));
      
      setRestaurants(restaurantsWithImages);
      setLoading(false);
      
      // Track views for displayed restaurants
      if (auth.currentUser) {
        restaurantsWithImages.forEach(async (restaurant) => {
          await trackRestaurantView(restaurant.id, auth.currentUser!.uid);
        });
      }
      
      // Generate dynamic categories from restaurant data
      const cuisineTypes = new Set<string>();
      data.forEach((restaurant) => {
        const cuisineArray: string[] = Array.isArray(restaurant.cuisines)
          ? restaurant.cuisines
          : (typeof restaurant.cuisine === 'string'
              ? restaurant.cuisine.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
              : []);

        cuisineArray.forEach((t) => cuisineTypes.add(t));

        const typeArray: string[] = Array.isArray(restaurant.types)
          ? restaurant.types
          : (typeof restaurant.type === 'string'
              ? restaurant.type.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
              : []);

        typeArray.forEach((t) => cuisineTypes.add(t));
      });
      
      const dynamicCategories = ['All', ...Array.from(cuisineTypes).sort()];
      setCategories(dynamicCategories);
      setActiveCategory('All');
      
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setLoading(false);
    }
  }

  async function fetchPromotions() {
    setPromotions([
      { business: "Alessio's Restaurant & Pizzeria", promo: 'Free Appetizer with 5 punches', image: require('../../assets/images/adaptive-icon.png') },
      { business: 'Village Italian', promo: '10% Off on Birthday Month', image: require('../../assets/images/adaptive-icon.png') },
      { business: "Tam's Backstage", promo: 'Free Dessert with 10 punches', image: require('../../assets/images/adaptive-icon.png') },
      { business: 'Branchwater', promo: 'Free Appetizer with 5 punches', image: require('../../assets/images/adaptive-icon.png') },
      { business: "Marlow's Tavern", promo: 'Free Appetizer with 7 punches', image: require('../../assets/images/adaptive-icon.png') },
    ]);
  }

  async function fetchLiked() {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setLiked(userDoc.data().likedRestaurants || []);
        }
      } catch (error) {
        console.error('Error fetching liked restaurants:', error);
      }
    }
  }

  const toggleLike = async (restaurantId: string) => {
    if (!auth.currentUser) return;
    
    const userId = auth.currentUser.uid;
    
    try {
      if (liked.includes(restaurantId)) {
        // Unlike restaurant
        setLiked(prev => prev.filter(id => id !== restaurantId));
        
        // Update Firestore
        await updateDoc(doc(db, 'users', userId), {
          likedRestaurants: arrayRemove(restaurantId)
        });
        
        // Track the unlike action
        await trackRestaurantLike(restaurantId, userId, false);
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        // Like restaurant
        setLiked(prev => [...prev, restaurantId]);
        
        // Update Firestore
        await updateDoc(doc(db, 'users', userId), {
          likedRestaurants: arrayUnion(restaurantId)
        });
        
        // Track the like action
        await trackRestaurantLike(restaurantId, userId, true);
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleRestaurantPress = async (restaurant: any) => {
    if (!auth.currentUser) return;
    
    // Track restaurant click
    await trackRestaurantClick(restaurant.id);
    
    setSelectedRestaurant(restaurant);
    setModalVisible(true);
  };

  const handleImageDoubleTap = (restaurantId: string) => {
    // Toggle like status
    toggleLike(restaurantId);
    
    // Show like animation
    setLikedRestaurantId(restaurantId);
    setShowLikeAnimation(true);
    
    // Animate heart scale
    likeAnimationScale.setValue(0);
    Animated.spring(likeAnimationScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      // Hide animation after delay
      setTimeout(() => {
        setShowLikeAnimation(false);
        setLikedRestaurantId(null);
      }, 1000);
    });
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchRestaurants(),
        fetchPromotions(),
        fetchLiked()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const openSearch = () => {
    setSearchActive(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSearch = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSearchActive(false);
      setSearchQuery('');
      setSearchResults([]);
    });
  };



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
      onPress={() => handleRestaurantPress(item)}
      style={{ marginBottom: 20 }}
    >
      <Animated.View style={[styles.restaurantCard, { transform: [{ scale: scaleAnim }] }]}> 
        <View style={styles.restaurantLogoWrap}>
          {item.logoUrl ? (
            <Image source={{ uri: item.logoUrl }} style={styles.restaurantLogo} />
          ) : (
            <Image source={require('../../assets/Punch_Logos/Punch_T/black_logo.png')} style={styles.restaurantLogo} />
          )}
        </View>
        <View style={{ flex: 1, marginRight: 4 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>{item.distance}</Text></View>
            <View style={styles.badge}><Text style={styles.badgeText}>
              {(() => {
                if (typeof item.hours === 'object' && item.hours !== null) {
                  // Check if any day is open and get the first open day's hours
                  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                  const openDay = days.find(day => item.hours[day]?.isOpen);
                  if (openDay && item.hours[openDay].slots && item.hours[openDay].slots.length > 0) {
                    const firstSlot = item.hours[openDay].slots[0];
                    return `${firstSlot.open} - ${firstSlot.close}`;
                  }
                  const hasOpenDay = days.some(day => item.hours[day]?.isOpen);
                  return hasOpenDay ? 'Open' : 'Closed';
                }
                // Always return a string, never an object
                return typeof item.hours === 'string' ? item.hours : 'Open';
              })()}
            </Text></View>
            <View style={styles.badge}><Text style={styles.badgeText}>{getPriceLevel(item.price)}</Text></View>
            {(() => {
              const cuisineArray: string[] = Array.isArray(item.cuisines)
                ? item.cuisines
                : (typeof item.cuisine === 'string' ? item.cuisine.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0) : []);
              return cuisineArray.slice(0, 2).map((tag: string, idx: number) => (
                <View key={`cuisine-${item.id}-${idx}`} style={styles.badge}><Text style={styles.badgeText}>{tag}</Text></View>
              ));
            })()}
            {(() => {
              const typeArray: string[] = Array.isArray(item.types)
                ? item.types
                : (typeof item.type === 'string' ? item.type.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0) : []);
              return typeArray.slice(0, 1).map((tag: string, idx: number) => (
                <View key={`type-${item.id}-${idx}`} style={styles.badge}><Text style={styles.badgeText}>{tag}</Text></View>
              ));
            })()}
          </View>
        </View>
        <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.heartButton}>
          <AntDesign name={liked.includes(item.id) ? 'heart' : 'hearto'} size={26} color={liked.includes(item.id) ? '#fb7a20' : '#bbb'} />
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );

  // Navigation functions
  const goToNextRestaurant = () => {
    if (currentRestaurantIndex < filteredRestaurants.length - 1) {
      setCurrentRestaurantIndex(currentRestaurantIndex + 1);
      setCurrentImageIndex(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const goToPreviousRestaurant = () => {
    if (currentRestaurantIndex > 0) {
      setCurrentRestaurantIndex(currentRestaurantIndex - 1);
      setCurrentImageIndex(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const goToNextImage = () => {
    const currentRestaurant = filteredRestaurants[currentRestaurantIndex];
    if (currentRestaurant?.images && currentImageIndex < currentRestaurant.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const goToPreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading restaurants...</Text>
      </View>
    );
  }

  const currentRestaurant = filteredRestaurants[currentRestaurantIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#fff" translucent={true} />
      
             {/* Header */}
       <View style={styles.header}>
         <BlurView intensity={20} tint="light" style={styles.glassHeader}>
           <Text style={styles.headerTitle}>Explore</Text>
           <TouchableOpacity onPress={openSearch}>
             <Feather name="search" size={28} color="#2C3E50" />
           </TouchableOpacity>
         </BlurView>
       </View>

      

             {/* Scrollable Restaurant List */}
       <ScrollView 
         style={styles.restaurantList}
         showsVerticalScrollIndicator={false}
         contentContainerStyle={styles.restaurantListContent}
         snapToInterval={screenHeight}
         snapToAlignment="start"
         decelerationRate={0.8}
         nestedScrollEnabled
         scrollEnabled={!isImageScrolling}
         scrollEventThrottle={16}
         directionalLockEnabled={false}
         bounces={false}
         refreshControl={
           <RefreshControl
             refreshing={refreshing}
             onRefresh={onRefresh}
             tintColor="#fb7a20"
             colors={["#fb7a20"]}
           />
         }
       >
         {filteredRestaurants.map((restaurant, index) => (
           <View
             key={restaurant.id}
             style={styles.restaurantCard}
           >
             {/* Restaurant Images - Horizontal Scroll */}
             <View style={styles.cardImageContainer}>
               <ScrollView
                 horizontal
                 showsHorizontalScrollIndicator={false}
                 pagingEnabled
                 snapToInterval={screenWidth}
                 decelerationRate={0.8}
                 scrollEventThrottle={8}
                 directionalLockEnabled={false}
                 alwaysBounceHorizontal={false}
                 nestedScrollEnabled
                 bounces={false}
                 scrollEnabled={true}
                 keyboardShouldPersistTaps="handled"
                 removeClippedSubviews={false}
                 showsVerticalScrollIndicator={false}
                 contentInsetAdjustmentBehavior="never"
                 automaticallyAdjustContentInsets={false}
                 onScroll={(event) => {
                   const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                   if (newIndex !== currentImageIndex) {
                     setCurrentImageIndex(newIndex);
                   }
                 }}
                 onScrollBeginDrag={() => {
                   console.log(`Starting horizontal scroll for ${restaurant.name}`);
                   setIsImageScrolling(true);
                 }}
                 onScrollEndDrag={() => {
                   console.log(`Ending horizontal scroll for ${restaurant.name}`);
                   setIsImageScrolling(false);
                 }}
                 onMomentumScrollBegin={() => {
                   console.log(`Starting momentum scroll for ${restaurant.name}`);
                   setIsImageScrolling(true);
                 }}
                 onMomentumScrollEnd={() => {
                   console.log(`Ending momentum scroll for ${restaurant.name}`);
                   setIsImageScrolling(false);
                 }}
                 style={styles.imageScrollView}
                 contentContainerStyle={[
                   styles.imageScrollContent,
                   { width: screenWidth * (restaurant.images?.length || 1) }
                 ]}
               >
                 {restaurant.images && restaurant.images.length > 0 ? (
                   restaurant.images.map((image: any, imageIndex: number) => {
                     console.log(`Rendering image ${imageIndex} for ${restaurant.name}:`, image, 'Type:', typeof image);
                     return (
                       <View
                         key={imageIndex}
                         style={styles.imageSlide}
                       >
                         <Image 
                           source={typeof image === 'string' ? { uri: image } : image}
                           style={styles.cardImage}
                           resizeMode="cover"
                           onError={(error) => console.warn(`Failed to load image for ${restaurant.name}:`, error.nativeEvent.error)}
                           onLoad={() => console.log(`Successfully loaded image for ${restaurant.name}:`, image)}
                         />
                         {/* Like Animation Overlay */}
                         {restaurant.id === likedRestaurantId && showLikeAnimation && (
                           <Animated.View style={[styles.likeAnimation, { transform: [{ scale: likeAnimationScale }] }]}>
                             <AntDesign name="heart" size={80} color="#E74C3C" />
                           </Animated.View>
                         )}
                       </View>
                     );
                   })
                 ) : (
                   <View style={styles.imageSlide}>
                     <Image 
                       source={require('../../assets/Punch_Logos/Punch_T/black_logo.png')}
                       style={styles.cardImage}
                       resizeMode="cover"
                     />
                     {/* Like Animation Overlay */}
                     {restaurant.id === likedRestaurantId && showLikeAnimation && (
                       <Animated.View style={[styles.likeAnimation, { transform: [{ scale: likeAnimationScale }] }]}>
                         <AntDesign name="heart" size={80} color="#E74C3C" />
                       </Animated.View>
                     )}
                   </View>
                 )}
               </ScrollView>
               
               {/* Image Navigation Dots */}
               {restaurant.images && restaurant.images.length > 1 && (
                 <View style={styles.cardImageDots}>
                   {restaurant.images.map((_: any, index: number) => (
                     <View 
                       key={index} 
                       style={[
                         styles.cardImageDot,
                         currentImageIndex === index && styles.cardImageDotActive
                       ]}
                     />
                   ))}
                 </View>
               )}
               
               {/* Dark Gradient Overlay */}
               <LinearGradient
                 colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                 style={styles.cardGradientOverlay}
               />
               
               {/* Restaurant Info */}
               <View style={styles.cardInfo}>
                 <TouchableOpacity onPress={() => handleRestaurantPress(restaurant)} style={styles.restaurantNameContainer}>
                   <View style={styles.restaurantLogoCircle}>
                     {restaurant.logoUrl ? (
                       <Image source={{ uri: restaurant.logoUrl }} style={styles.restaurantLogoImage} />
                     ) : (
                       <Image source={require('../../assets/Punch_Logos/Punch_T/black_logo.png')} style={styles.restaurantLogoImage} />
                     )}
                   </View>
                   <Text style={styles.cardRestaurantName} numberOfLines={0}>{restaurant.name}</Text>
                 </TouchableOpacity>
                 
                 {/* Promotion Bar */}
                 {restaurant.activeRewards && restaurant.activeRewards.length > 0 && (
                   <View style={styles.cardPromotionBar}>
                     <Ionicons name="gift" size={16} color="#fff" />
                     <Text style={styles.cardPromotionText}>
                       {restaurant.activeRewards[0].title}
                     </Text>
                   </View>
                 )}
                 
                 {/* Tags */}
                 <View style={styles.cardTagsContainer}>
                   <TouchableOpacity onPress={() => handleRestaurantPress(restaurant)}>
                     <View style={styles.cardTag}>
                       <Text style={styles.cardTagText}>{restaurant.distance || '0.5 mi'}</Text>
                     </View>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => handleRestaurantPress(restaurant)}>
                     <View style={styles.cardTag}>
                       <Text style={styles.cardTagText}>
                         {(() => {
                           if (typeof restaurant.hours === 'object' && restaurant.hours !== null) {
                             // Check if any day is open and get the first open day's hours
                             const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                             const openDay = days.find(day => restaurant.hours[day]?.isOpen);
                             if (openDay && restaurant.hours[openDay].slots && restaurant.hours[openDay].slots.length > 0) {
                               const firstSlot = restaurant.hours[openDay].slots[0];
                               return `${firstSlot.open} - ${firstSlot.close}`;
                             }
                             const hasOpenDay = days.some(day => restaurant.hours[day]?.isOpen);
                             return hasOpenDay ? 'Open' : 'Closed';
                           }
                           // Always return a string, never an object
                           return typeof restaurant.hours === 'string' ? restaurant.hours : 'Open';
                         })()}
                       </Text>
                     </View>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => handleRestaurantPress(restaurant)}>
                     <View style={styles.cardTag}>
                       <Text style={styles.cardTagText}>{getPriceLevel(restaurant.price)}</Text>
                     </View>
                   </TouchableOpacity>
                   {(() => {
                     const cuisineArray: string[] = Array.isArray(restaurant.cuisines)
                       ? restaurant.cuisines
                       : (typeof restaurant.cuisine === 'string' 
                          ? restaurant.cuisine.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
                          : []);
                     return cuisineArray.slice(0, 1).map((tag: string, idx: number) => (
                       <TouchableOpacity key={`cuisine-${idx}`} onPress={() => handleRestaurantPress(restaurant)}>
                         <View style={styles.cardTag}>
                           <Text style={styles.cardTagText}>{tag}</Text>
                         </View>
                       </TouchableOpacity>
                     ));
                   })()}
                 </View>
               </View>
             </View>
           </View>
         ))}
       </ScrollView>

      {/* Search Overlay */}
      {searchActive && (
        <View style={styles.searchOverlay}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={closeSearch} style={styles.searchBackButton}>
              <AntDesign name="arrowleft" size={30} color="#fff" />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="Search restaurants..."
              placeholderTextColor="#2C3E50"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
          
          {/* Search Results */}
          <ScrollView style={styles.searchResults}>
            {searchQuery.trim() ? (
              searchResults.length > 0 ? (
                searchResults.map((r: any) => (
                  <TouchableOpacity 
                    key={r.id} 
                    style={styles.searchResultItem}
                    onPress={() => {
                      handleRestaurantPress(r);
                      closeSearch();
                    }}
                  >
                    <Text style={styles.searchResultTitle}>{r.name}</Text>
                    <Text style={styles.searchResultSubtitle}>{r.cuisine || r.cuisines?.join(', ')}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResultsText}>No restaurants found.</Text>
              )
            ) : (
              <Text style={styles.searchPromptText}>Start typing to search for restaurants...</Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* Restaurant Modal */}
      <RestaurantModal
        restaurant={selectedRestaurant}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        likedRestaurants={liked}
        onLikeUpdate={toggleLike}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
               header: {
       position: 'absolute',
       top: 0,
       left: 0,
       right: 0,
       zIndex: 100,
     },
     glassHeader: {
       flexDirection: 'row',
       alignItems: 'center',
       justifyContent: 'space-between',
       paddingHorizontal: 20,
       paddingTop: 60,
       paddingBottom: 16,
       borderRadius: 0,
       borderBottomWidth: 1,
       borderBottomColor: 'rgba(255, 255, 255, 0.2)',
       backgroundColor: 'rgba(255, 255, 255, 0.9)',
     },
   headerTitle: {
     fontSize: 32,
     fontWeight: 'bold',
     color: '#2C3E50',
     marginTop: 0,
   },
  debugPanel: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 10,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugSubtitle: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  navigationControls: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  navButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    flex: 1,
  },
  navButtonDisabled: {
    backgroundColor: '#ccc',
  },
  navButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  restaurantDisplay: {
    flex: 1,
    position: 'relative',
  },
  imageContainer: {
    width: '100%',
    height: screenHeight - 300,
    position: 'relative',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
     legacyImageDots: {
     position: 'absolute',
     top: 20,
     left: 0,
     right: 0,
     flexDirection: 'row',
     justifyContent: 'center',
     alignItems: 'center',
     gap: 8,
   },
   legacyImageDot: {
     width: 8,
     height: 8,
     borderRadius: 4,
   },
  imageNavigation: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imageNavButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  imageNavButtonDisabled: {
    opacity: 0.5,
  },
  imageNavText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  restaurantInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  promotionBar: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  promotionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fb7a20',
    zIndex: 100,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchBackButton: {
    marginRight: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 17,
    color: '#2C3E50',
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  searchResultItem: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  searchResultTitle: {
    color: '#fff',
    fontSize: 22,
  },
  searchResultSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 4,
  },
  noResultsText: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 60,
  },
  searchPromptText: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 60,
  },
  // Legacy styles for search results
     legacyRestaurantCard: {
     backgroundColor: '#fff',
     borderRadius: 16,
     padding: 16,
     flexDirection: 'row',
     alignItems: 'center',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 8,
     elevation: 3,
   },
  restaurantLogoWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 16,
  },
  restaurantLogo: {
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  badgeText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  heartButton: {
    padding: 8,
  },
     // New scrollable restaurant list styles
   restaurantList: {
     flex: 1,
   },
   restaurantListContent: {
     paddingBottom: 0,
     paddingTop: 0,
   },
   restaurantCard: {
     width: '100%',
     height: screenHeight, // Full screen height
     minHeight: screenHeight, // Ensure minimum height
     maxHeight: screenHeight, // Ensure maximum height
     overflow: 'hidden',
     elevation: 8,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.3,
     shadowRadius: 12,
   },
   cardImageContainer: {
     width: '100%',
     height: '100%', // Full height of the card
     position: 'relative',
     overflow: 'visible', // Changed from 'hidden' to allow proper touch events
     minHeight: screenHeight, // Force minimum height
     maxHeight: screenHeight, // Force maximum height
   },
   cardImage: {
     width: '100%',
     height: '100%',
     resizeMode: 'cover', // Force cover mode to maintain aspect ratio
   },
   cardGradientOverlay: {
     position: 'absolute',
     bottom: 0,
     left: 0,
     right: 0,
     height: '50%',
   },
   cardInfo: {
     position: 'absolute',
     bottom: 80, // Above navigation bar with proper spacing
     left: 0,
     right: 0,
     padding: 24,
   },
   cardRestaurantName: {
     fontSize: 24,
     fontWeight: 'bold',
     color: '#fff',
     marginBottom: 12,
     textShadowColor: 'rgba(0,0,0,0.8)',
     textShadowOffset: { width: 0, height: 2 },
     textShadowRadius: 4,
     flex: 1, // Allow text to take remaining space
     flexWrap: 'wrap', // Enable text wrapping
   },
   cardPromotionBar: {
     backgroundColor: '#E74C3C',
     paddingHorizontal: 16,
     paddingVertical: 8,
     borderRadius: 20,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     alignSelf: 'flex-start',
     marginBottom: 12,
   },
   cardPromotionText: {
     color: '#fff',
     fontSize: 14,
     fontWeight: '600',
     marginLeft: 6,
   },
   cardTagsContainer: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: 8,
   },
   cardTag: {
     backgroundColor: 'rgba(255,255,255,0.2)',
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderRadius: 16,
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.3)',
   },
   cardTagText: {
     color: '#fff',
     fontSize: 14,
     fontWeight: '600',
     textShadowColor: 'rgba(0,0,0,0.5)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 2,
   },
   // Horizontal image scrolling styles
   imageScrollView: {
     width: '100%',
     height: screenHeight, // Use full screen height as before
   },
   imageScrollContent: {
     // Width is now set dynamically based on image count
   },
   imageSlide: {
     width: screenWidth,
     height: screenHeight, // Use full screen height to match ScrollView
   },
   imageTouchArea: {
     width: '100%',
     height: '100%',
   },
   cardImageDots: {
     position: 'absolute',
     top: screenHeight * 0.7, // Position dots lower on the image
     left: 0,
     right: 0,
     flexDirection: 'row',
     justifyContent: 'center',
     alignItems: 'center',
     gap: 8,
     zIndex: 10,
   },
   cardImageDot: {
     width: 8,
     height: 8,
     borderRadius: 4,
     backgroundColor: 'rgba(255,255,255,0.6)',
   },
   cardImageDotActive: {
     width: 8,
     height: 8,
     borderRadius: 4,
     backgroundColor: '#fff',
   },
   likeAnimation: {
     position: 'absolute',
     top: '50%',
     left: '50%',
     marginLeft: -40,
     marginTop: -40,
     zIndex: 20,
   },
   restaurantNameContainer: {
     flexDirection: 'row',
     alignItems: 'flex-start', // Changed from 'center' to allow text wrapping
     marginBottom: 12,
   },
   restaurantLogoCircle: {
     width: 40,
     height: 40,
     borderRadius: 20,
     overflow: 'hidden',
     marginRight: 12,
     backgroundColor: 'rgba(255,255,255,0.2)',
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.3)',
     marginTop: 2, // Add small top margin to align with first line of text
   },
   restaurantLogoImage: {
     width: '100%',
     height: '100%',
   },
});