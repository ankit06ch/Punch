import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Alert, Platform, useColorScheme } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { AntDesign } from '@expo/vector-icons';
import CustomText from '../../components/CustomText';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring, withTiming } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = 380; // Increased from 280 to 380 for bigger map

interface Restaurant {
  id: string;
  name: string;
  businessName?: string;
  latitude?: number;
  longitude?: number;
  color: string;
}

interface GoogleMapsViewProps {
  restaurants: Restaurant[];
  onRestaurantPress: (restaurant: Restaurant) => void;
  fullScreen?: boolean; // New prop for full screen mode
}

const COLORS = {
  primary: '#FB7A20',
  secondary: '#1E3A8A',
  background: '#FFFFFF',
  text: {
    primary: '#000000',
    secondary: '#374151',
  },
};

export default function GoogleMapsView({ restaurants, onRestaurantPress, fullScreen = false }: GoogleMapsViewProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 34.2073, // Cumming, GA coordinates
    longitude: -84.1402,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  
  // Animation values
  const buttonScale = useSharedValue(1);
  const buttonRotation = useSharedValue(0);

  useEffect(() => {
    requestLocationPermission();
  }, []);

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

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission',
          'Please enable location services to see nearby places.',
          [{ text: 'OK' }]
        );
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

  const handleRecenter = async () => {
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

    if (!locationPermission) {
      await requestLocationPermission();
      return;
    }
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      
      setUserLocation(location);
      setRegion(newRegion);
      
      // Animate to the new region with a smooth fly-back effect
      mapRef.current?.animateToRegion(newRegion, 1500);
    } catch (error) {
      console.error('Error recentering map:', error);
      Alert.alert('Error', 'Unable to get your current location. Please try again.');
    }
  };

  const handleMapPress = () => {
    if (!fullScreen) {
      // Navigate to full map screen
      router.push('/authenticated_tabs/full-map');
    }
  };

  const restaurantsWithLocation = restaurants.filter(
    restaurant => restaurant.latitude && restaurant.longitude
  );

  // Animated styles
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: buttonScale.value },
      { rotate: `${buttonRotation.value}deg` }
    ],
  }));

  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.mapContainer,
          fullScreen && {
            height: height * 0.7,
            borderRadius: 0,
          }
        ]} 
      >
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          showsUserLocation={locationPermission}
          showsMyLocationButton={false}
          showsCompass={fullScreen}
          showsScale={fullScreen}
          showsBuildings={false}
          showsTraffic={false}
          showsIndoors={false}
          mapType="standard"
          zoomEnabled={true}
          scrollEnabled={true}
          rotateEnabled={fullScreen}
          pitchEnabled={fullScreen}
        >
          {restaurantsWithLocation.map((restaurant) => (
            <Marker
              key={restaurant.id}
              coordinate={{
                latitude: restaurant.latitude!,
                longitude: restaurant.longitude!,
              }}
              onPress={() => onRestaurantPress(restaurant)}
            >
              <View style={[styles.markerContainer, { backgroundColor: restaurant.color }]}>
                <AntDesign name="home" size={12} color="white" />
              </View>
            </Marker>
          ))}
        </MapView>
        
        {/* Recenter Button */}
        <Animated.View style={[styles.recenterButton, buttonAnimatedStyle]}>
          <TouchableOpacity 
            onPress={handleRecenter}
            activeOpacity={0.8}
            style={styles.recenterButtonTouchable}
          >
            <BlurView intensity={40} tint="light" style={styles.recenterButtonBackground}>
              <AntDesign name="arrowup" size={20} color={COLORS.primary} />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>
        
        {!fullScreen && (
          <TouchableOpacity 
            style={styles.overlay}
            onPress={handleMapPress}
            activeOpacity={0.9}
          >
            <BlurView intensity={20} tint="light" style={styles.overlayBackground}>
              <View style={styles.overlayContent}>
                <CustomText variant="caption" weight="medium" fontFamily="figtree" style={[styles.overlayText, { color: colorScheme === 'dark' ? 'white' : 'black' }]}>
                  Tap to view full map
                </CustomText>
                <AntDesign name="right" size={16} color={COLORS.primary} />
              </View>
            </BlurView>
          </TouchableOpacity>
        )}
      </View>
      
      {!locationPermission && (
        <View style={styles.permissionContainer}>
          <AntDesign name="enviroment" size={20} color={COLORS.primary} />
          <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.permissionText}>
            Enable location to see nearby places
          </CustomText>
          <TouchableOpacity onPress={requestLocationPermission} style={styles.permissionButton}>
            <CustomText variant="caption" weight="bold" fontFamily="figtree" style={styles.permissionButtonText}>
              Enable
            </CustomText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: -4, // Negative margin to extend beyond container padding
  },
  map: {
    width: '100%',
    height: '100%',
  },
  recenterButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1000,
  },
  recenterButtonTouchable: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  recenterButtonBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  overlayBackground: {
    flex: 1,
    marginHorizontal: 0,
  },
  overlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  overlayText: {
    color: COLORS.text.secondary,
  },
  markerContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  permissionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(251, 122, 32, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  permissionText: {
    color: COLORS.text.secondary,
    flex: 1,
    marginLeft: 8,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
  },
}); 