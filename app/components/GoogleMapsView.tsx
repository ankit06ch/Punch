import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Alert, Platform, useColorScheme } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { AntDesign } from '@expo/vector-icons';
import CustomText from '../../components/CustomText';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = 280; // Increased from 200 to 280

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

export interface GoogleMapsViewRef {
  resetToUserLocation: () => void;
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

const GoogleMapsView = forwardRef<GoogleMapsViewRef, GoogleMapsViewProps>(({ restaurants, onRestaurantPress, fullScreen = false }, ref) => {
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

  // Expose resetToUserLocation method via ref
  useImperativeHandle(ref, () => ({
    resetToUserLocation: () => {
      if (userLocation && mapRef.current) {
        const newRegion = {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        mapRef.current.animateToRegion(newRegion, 1000);
      } else if (locationPermission) {
        // If we don't have user location but have permission, get it
        getCurrentLocation();
      }
    },
  }));

  const handleMapPress = () => {
    if (!fullScreen) {
      // Navigate to full map screen
      router.push('/authenticated_tabs/full-map');
    }
  };

  const restaurantsWithLocation = restaurants.filter(
    restaurant => restaurant.latitude && restaurant.longitude
  );

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
        
        {/* Location reset button */}
        {locationPermission && !fullScreen && (
          <TouchableOpacity 
            style={styles.locationButton}
            onPress={() => {
              if (userLocation && mapRef.current) {
                const newRegion = {
                  latitude: userLocation.coords.latitude,
                  longitude: userLocation.coords.longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                };
                mapRef.current.animateToRegion(newRegion, 1000);
              } else {
                getCurrentLocation();
              }
            }}
          >
            <AntDesign name="arrowup" size={24} color={COLORS.primary} />
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
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
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
  locationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    zIndex: 9999,
  },
});

export default GoogleMapsView;