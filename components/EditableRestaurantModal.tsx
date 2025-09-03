import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Text, 
  Animated, 
  Image, 
  PanResponder, 
  ScrollView, 
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { AntDesign } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import CustomText from './CustomText';
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
  hours?: any;
  price?: string;
  cuisine?: string;
  rating?: string;
  logoUrl?: string;
  activeRewards?: any[];
  location?: string;
  address?: string;
  cuisines?: string[];
  description?: string;
  phone?: string;
  website?: string;
}

interface EditableRestaurantModalProps {
  restaurant: Restaurant | null;
  visible: boolean;
  onClose: () => void;
  onUpdate?: (updatedRestaurant: Restaurant) => void;
}

const COLORS = {
  primary: '#2C3E50',
  secondary: '#34495E',
  background: '#FFFFFF',
  text: {
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    light: '#BDC3C7',
  },
  accent: '#FB7A20',
  success: '#27AE60',
  error: '#E74C3C',
};

export default function EditableRestaurantModal({ 
  restaurant, 
  visible, 
  onClose, 
  onUpdate 
}: EditableRestaurantModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<Partial<Restaurant>>({});
  
  const backdropAnimation = useRef(new Animated.Value(0)).current;
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const panAnimation = useRef(new Animated.Value(0)).current;

  // Initialize edited data when restaurant changes
  useEffect(() => {
    if (restaurant) {
      setEditedData({
        name: restaurant.name || '',
        businessName: restaurant.businessName || '',
        description: restaurant.description || '',
        address: restaurant.address || '',
        location: restaurant.location || '',
        phone: restaurant.phone || '',
        website: restaurant.website || '',
        cuisine: restaurant.cuisine || '',
        cuisines: restaurant.cuisines || [],
        price: restaurant.price || '',
        hours: restaurant.hours || {},
      });
    }
  }, [restaurant]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 10;
    },
    onPanResponderGrant: () => {
      panAnimation.setValue(0);
    },
    onPanResponderMove: (_, gestureState) => {
      if (isExpanded && gestureState.dy < 0) {
        return;
      }
      panAnimation.setValue(gestureState.dy);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100 || gestureState.vy > 0.5) {
        closeModal();
      } else if (gestureState.dy < -50 || gestureState.vy < -0.5) {
        if (!isExpanded) {
          setIsExpanded(true);
          Animated.spring(panAnimation, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        } else {
          Animated.spring(panAnimation, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }
      } else {
        Animated.spring(panAnimation, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    },
  });

  useEffect(() => {
    if (visible && restaurant) {
      openModal();
    } else {
      closeModal();
    }
  }, [visible, restaurant]);

  const openModal = () => {
    Animated.timing(backdropAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(backdropAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      panAnimation.setValue(0);
      setIsExpanded(false);
      setEditingField(null);
    });
  };

  const handleSaveField = async (field: string, value: string) => {
    if (!restaurant || !auth.currentUser) return;

    setIsSaving(true);
    try {
      const restaurantRef = doc(db, 'restaurants', restaurant.id);
      const updateData = { [field]: value };
      
      await updateDoc(restaurantRef, updateData);

      // Update local state
      const updatedRestaurant = { ...restaurant, ...updateData };
      onUpdate?.(updatedRestaurant);

      setEditingField(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to update restaurant information. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImagePicker = async (type: 'logo' | 'profile') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to grant camera roll permissions to change images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Here you would typically upload the image to your storage service
        // For now, we'll just update the local state
        const field = type === 'logo' ? 'logoUrl' : 'profilePictureUrl';
        const updateData = { [field]: imageUri };
        
        // Update local state immediately for preview
        const updatedRestaurant = { ...restaurant, ...updateData } as Restaurant;
        onUpdate?.(updatedRestaurant);
        
        // TODO: Upload image to Firebase Storage and update the URL
        Alert.alert('Success', `${type === 'logo' ? 'Logo' : 'Profile picture'} updated successfully!`);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to update image. Please try again.');
    }
  };

  const startEditing = (field: string) => {
    setEditingField(field);
  };

  const cancelEditing = () => {
    setEditingField(null);
  };

  const renderEditableField = (field: string, label: string, value: string, placeholder: string, multiline = false) => {
    const isEditing = editingField === field;
    const currentValue = editedData[field as keyof Restaurant] || value || '';

    if (isEditing) {
      return (
        <View style={styles.editingField}>
          <TextInput
            style={[styles.editInput, multiline && styles.editInputMultiline]}
            value={currentValue}
            onChangeText={(text) => setEditedData(prev => ({ ...prev, [field]: text }))}
            placeholder={placeholder}
            placeholderTextColor={COLORS.text.light}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            autoFocus
            onBlur={() => {
              if (currentValue !== value) {
                handleSaveField(field, currentValue);
              } else {
                cancelEditing();
              }
            }}
            onSubmitEditing={() => {
              if (currentValue !== value) {
                handleSaveField(field, currentValue);
              } else {
                cancelEditing();
              }
            }}
          />
          {isSaving && (
            <ActivityIndicator size="small" color={COLORS.accent} style={styles.savingIndicator} />
          )}
        </View>
      );
    }

    return (
      <TouchableOpacity 
        style={styles.editableField}
        onPress={() => startEditing(field)}
      >
        <CustomText variant="body" weight="normal" fontFamily="figtree" style={styles.fieldValue}>
          {currentValue || placeholder}
        </CustomText>
        <AntDesign name="edit" size={14} color={COLORS.text.light} style={styles.editIcon} />
      </TouchableOpacity>
    );
  };

  if (!restaurant) return null;

  return (
    <Animated.View 
      style={[
        styles.modalOverlay,
        {
          opacity: backdropAnimation,
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.modalBackdrop}
        onPress={closeModal}
        activeOpacity={1}
      />
      
      <Animated.View 
        style={[
          styles.modalContainer,
          {
            height: isExpanded ? height * 0.9 : height * 0.3,
            transform: [{
              translateY: Animated.add(
                modalAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height, 0],
                }),
                isExpanded ? panAnimation : Animated.add(panAnimation, 0)
              ),
            }],
          }
        ]}
        {...panResponder.panHandlers}
      >
        <BlurView intensity={30} tint="light" style={styles.modalContent}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />
          
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.logoContainer}
              onPress={() => handleImagePicker('logo')}
            >
              {restaurant.logoUrl ? (
                <Image source={{ uri: restaurant.logoUrl }} style={styles.logo} />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: restaurant.color }]}>
                  <AntDesign name="home" size={24} color="white" />
                </View>
              )}
              <View style={styles.imageEditOverlay}>
                <AntDesign name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              {renderEditableField('name', 'Restaurant Name', restaurant.name, 'Enter restaurant name')}
              <View style={styles.titleRow}>
                {renderEditableField('cuisine', 'Cuisine', restaurant.cuisine || '', 'Enter cuisine type')}
              </View>
            </View>
            
                         <TouchableOpacity 
               style={styles.closeButton}
               onPress={() => {
                 setEditingField(null);
                 closeModal();
               }}
               activeOpacity={0.7}
             >
               <AntDesign name="close" size={24} color={COLORS.text.primary} />
             </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Quick Info Row */}
            <View style={styles.quickInfoRow}>
              <View style={styles.quickInfoItem}>
                <AntDesign name="star" size={12} color={COLORS.text.secondary} />
                <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.quickInfoText}>
                  {restaurant.rating || 'No rating'}
                </CustomText>
              </View>
              <View style={styles.quickInfoItem}>
                <AntDesign name="star" size={12} color={COLORS.text.secondary} />
                <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.quickInfoText}>
                  {restaurant.price || 'No price'}
                </CustomText>
              </View>
              <View style={styles.quickInfoItem}>
                <AntDesign name="clockcircle" size={12} color={COLORS.text.secondary} />
                <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.quickInfoText}>
                  Open
                </CustomText>
              </View>
            </View>

            {/* Description Section */}
            <View style={styles.section}>
              <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.sectionTitle}>
                About
              </CustomText>
              {renderEditableField('description', 'Description', restaurant.description || '', 'Enter restaurant description', true)}
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.sectionTitle}>
                Contact Information
              </CustomText>
              
              <View style={styles.contactItem}>
                <AntDesign name="enviromento" size={16} color={COLORS.text.secondary} />
                {renderEditableField('address', 'Address', restaurant.address || '', 'Enter address')}
              </View>
              
              <View style={styles.contactItem}>
                <AntDesign name="phone" size={16} color={COLORS.text.secondary} />
                {renderEditableField('phone', 'Phone', restaurant.phone || '', 'Enter phone number')}
              </View>
              
              <View style={styles.contactItem}>
                <AntDesign name="link" size={16} color={COLORS.text.secondary} />
                {renderEditableField('website', 'Website', restaurant.website || '', 'Enter website URL')}
              </View>
            </View>

            {/* Business Details */}
            <View style={styles.section}>
              <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.sectionTitle}>
                Business Details
              </CustomText>
              
              <View style={styles.detailItem}>
                <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.detailLabel}>
                  Business Name
                </CustomText>
                {renderEditableField('businessName', 'Business Name', restaurant.businessName || '', 'Enter business name')}
              </View>
              
              <View style={styles.detailItem}>
                <CustomText variant="caption" weight="medium" fontFamily="figtree" style={styles.detailLabel}>
                  Price Range
                </CustomText>
                {renderEditableField('price', 'Price', restaurant.price || '', 'e.g., $, $$, $$$')}
              </View>
            </View>
          </ScrollView>
        </BlurView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10000,
    paddingBottom: 0,
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'flex-start',
  },
  dragHandle: {
    width: 60,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  quickInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickInfoText: {
    color: COLORS.text.secondary,
    marginLeft: 4,
    fontSize: 12,
  },
     section: {
     marginBottom: 24,
     paddingHorizontal: 20,
   },
  sectionTitle: {
    color: COLORS.text.primary,
    marginBottom: 8,
    fontSize: 16,
  },
     editableField: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingVertical: 12,
     paddingHorizontal: 16,
     backgroundColor: 'rgba(0, 0, 0, 0.02)',
     borderRadius: 8,
     borderWidth: 1,
     borderColor: 'rgba(0, 0, 0, 0.05)',
     marginBottom: 12,
   },
  fieldValue: {
    color: COLORS.text.primary,
    flex: 1,
    fontSize: 14,
  },
  editIcon: {
    marginLeft: 8,
  },
  editingField: {
    position: 'relative',
  },
     editInput: {
     backgroundColor: 'white',
     borderRadius: 8,
     paddingHorizontal: 16,
     paddingVertical: 12,
     fontSize: 14,
     color: COLORS.text.primary,
     borderWidth: 1,
     borderColor: COLORS.accent,
     minHeight: 48,
     marginBottom: 12,
   },
  editInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  savingIndicator: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailItem: {
    marginBottom: 12,
  },
     detailLabel: {
     color: COLORS.text.light,
     marginBottom: 4,
     fontSize: 12,
   },
   imageEditOverlay: {
     position: 'absolute',
     bottom: 0,
     right: 0,
     backgroundColor: COLORS.accent,
     borderRadius: 12,
     width: 24,
     height: 24,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: 'white',
   },
}); 