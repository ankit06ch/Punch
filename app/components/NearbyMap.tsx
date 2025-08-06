import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import CustomText from '../../components/CustomText';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const MAP_HEIGHT = 280; // Increased from 200 to 280

interface Restaurant {
  id: string;
  name: string;
  businessName?: string;
  latitude?: number;
  longitude?: number;
  color: string;
  distance?: string;
}

interface NearbyMapProps {
  restaurants: Restaurant[];
  onRestaurantPress: (restaurant: Restaurant) => void;
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

export default function NearbyMap({ restaurants, onRestaurantPress }: NearbyMapProps) {
  const router = useRouter();
  
  const handleMapPress = () => {
    // Navigate to full map screen
    router.push('/authenticated_tabs/full-map');
  };

  const restaurantsWithLocation = restaurants.filter(
    restaurant => restaurant.latitude && restaurant.longitude
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.mapContainer} 
        onPress={handleMapPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FB7A20', '#F97316', '#1E3A8A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mapBackground}
        >
          <View style={styles.mapContent}>
            <View style={styles.locationIndicator}>
              <View style={styles.userLocationDot} />
              <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.locationText}>
                You are here
              </CustomText>
            </View>
            
            <View style={styles.restaurantsContainer}>
              {restaurantsWithLocation.slice(0, 3).map((restaurant, index) => (
                <TouchableOpacity
                  key={restaurant.id}
                  style={[styles.restaurantMarker, { backgroundColor: restaurant.color }]}
                  onPress={() => onRestaurantPress(restaurant)}
                >
                  <AntDesign name="home" size={12} color="white" />
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.mapInfo}>
              <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.mapInfoText}>
                {restaurantsWithLocation.length} places nearby
              </CustomText>
            </View>
          </View>
        </LinearGradient>
        
        <BlurView intensity={20} tint="light" style={styles.overlay}>
          <View style={styles.overlayContent}>
            <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.overlayText}>
              Tap to view full map
            </CustomText>
                            <AntDesign name="right" size={16} color={COLORS.primary} />
          </View>
        </BlurView>
      </TouchableOpacity>
      
      {restaurantsWithLocation.length === 0 && (
        <View style={styles.emptyContainer}>
          <AntDesign name="enviroment" size={20} color={COLORS.primary} />
          <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.emptyText}>
            No nearby places found
          </CustomText>
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
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  mapBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContent: {
    width: '100%',
    height: '100%',
    padding: 20,
    justifyContent: 'space-between',
  },
  locationIndicator: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: 'white',
    marginBottom: 8,
  },
  locationText: {
    color: 'white',
    fontSize: 12,
  },
  restaurantsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flex: 1,
  },
  restaurantMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  mapInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  mapInfoText: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  overlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overlayText: {
    color: COLORS.text.secondary,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 122, 32, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyText: {
    color: COLORS.text.secondary,
    marginLeft: 8,
  },
}); 