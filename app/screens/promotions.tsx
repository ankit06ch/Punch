import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import CustomText from '../../components/CustomText';
import AnimatedBubblesBackground from '../components/AnimatedBubblesBackground';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Define COLORS locally
const COLORS = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#00d4aa',
  warning: '#ff9a56',
  accent: '#ff6b6b',
  text: {
    primary: '#2d3748',
    secondary: '#718096',
    light: '#a0aec0',
    white: '#FFFFFF',
  },
  card: {
    primary: '#667eea',
    secondary: '#764ba2',
    accent: '#ff6b6b',
    success: '#00d4aa',
    warning: '#ff9a56',
    info: '#4facfe',
  },
  gradient: {
    primary: ['#667eea', '#764ba2'],
    secondary: ['#4facfe', '#00f2fe'],
    success: ['#00d4aa', '#00b4d8'],
    warning: ['#ff9a56', '#ff6b6b'],
  }
};

const { width, height } = Dimensions.get('window');

export default function PromotionsScreen() {
  const router = useRouter();
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [buttonScale] = useState(new Animated.Value(1));

  // Initialize promotion data if editing
  useEffect(() => {
    const params = router.params as any;
    if (params?.promotion) {
      try {
        const promotion = JSON.parse(params.promotion);
        setEditingPromotion(promotion);
        setIsEditing(true);
      } catch (error) {
        console.error('Error parsing promotion data:', error);
      }
    } else {
      // New promotion
      setEditingPromotion({
        title: '',
        description: '',
        requiredPunches: 0,
        rewardType: 'Free Item',
        discountPercentage: 0,
        discountAmount: 0,
        expirationDate: null,
      });
      setIsEditing(false);
    }
  }, [router.params]);

  // Date picker handlers
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setEditingPromotion((prev: any) => ({ ...prev, expirationDate: selectedDate }));
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const hideDatePickerModal = () => {
    setShowDatePicker(false);
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSavePromotion = async () => {
    if (!editingPromotion?.title || !editingPromotion?.requiredPunches) {
      Alert.alert('Missing Information', 'Please fill in the title and punches required.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const promotionData = {
        title: editingPromotion.title,
        description: editingPromotion.description || '',
        requiredPunches: editingPromotion.requiredPunches,
        rewardType: editingPromotion.rewardType || 'Free Item',
        discountPercentage: editingPromotion.discountPercentage || 0,
        discountAmount: editingPromotion.discountAmount || 0,
        expirationDate: editingPromotion.expirationDate || null,
        createdAt: editingPromotion.createdAt || new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      // Update Firebase
      const restaurantRef = doc(db, 'restaurants', user.uid);
      const restaurantDoc = await getDoc(restaurantRef);
      
      if (restaurantDoc.exists()) {
        const currentData = restaurantDoc.data();
        const currentRewards = currentData.activeRewards || [];
        
        if (editingPromotion.id) {
          // Update existing promotion
          const updatedRewards = currentRewards.map((reward: any) => 
            reward.id === editingPromotion.id ? { ...reward, ...promotionData } : reward
          );
          await updateDoc(restaurantRef, { activeRewards: updatedRewards });
        } else {
          // Add new promotion
          const newPromotion = { ...promotionData, id: Date.now().toString() };
          await updateDoc(restaurantRef, { 
            activeRewards: [...currentRewards, newPromotion] 
          });
        }
        
        Alert.alert('Success', 'Promotion saved successfully!', [
          { text: 'OK', onPress: () => router.push('/authenticated_tabs/wallet') }
        ]);
      }
    } catch (error) {
      console.error('Error saving promotion:', error);
      Alert.alert('Error', 'Failed to save promotion. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedBubblesBackground />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <LinearGradient
          colors={COLORS.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => router.push('/authenticated_tabs/wallet')} style={styles.backButton}>
            <View style={styles.backButtonInner}>
              <AntDesign name="arrowleft" size={20} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <CustomText variant="title" weight="bold" fontFamily="figtree" style={styles.headerTitle}>
              {isEditing ? 'Edit Promotion' : 'Create Promotion'}
            </CustomText>
            <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.headerSubtitle}>
              {isEditing ? 'Update your promotion details' : 'Design an amazing offer for your customers'}
            </CustomText>
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSavePromotion}>
            <LinearGradient
              colors={COLORS.gradient.success}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveButtonGradient}
            >
              <CustomText variant="button" weight="bold" fontFamily="figtree" style={styles.saveButtonText}>
                {isEditing ? 'Update' : 'Save'}
              </CustomText>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Form */}
        <ScrollView 
          style={styles.form} 
          contentContainerStyle={styles.formContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <MaterialIcons name="title" size={20} color={COLORS.white} />
              </View>
              <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.formLabel}>
                Promotion Title
              </CustomText>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Free Coffee, 50% Off, Buy One Get One"
                placeholderTextColor={COLORS.text.light}
                value={editingPromotion?.title || ''}
                onChangeText={(text) => setEditingPromotion((prev: any) => ({ ...prev, title: text }))}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <MaterialIcons name="description" size={20} color={COLORS.white} />
              </View>
              <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.formLabel}>
                Description
              </CustomText>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.formTextArea}
                placeholder="Describe what customers get with this promotion..."
                placeholderTextColor={COLORS.text.light}
                value={editingPromotion?.description || ''}
                onChangeText={(text) => setEditingPromotion((prev: any) => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <MaterialIcons name="stars" size={20} color={COLORS.white} />
              </View>
              <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.formLabel}>
                Punches Required
              </CustomText>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., 5, 10, 15"
                placeholderTextColor={COLORS.text.light}
                value={editingPromotion?.requiredPunches?.toString() || ''}
                onChangeText={(text) => setEditingPromotion((prev: any) => ({ ...prev, requiredPunches: parseInt(text) || 0 }))}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <MaterialIcons name="card-giftcard" size={20} color={COLORS.white} />
              </View>
              <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.formLabel}>
                Reward Type
              </CustomText>
            </View>
            <View style={styles.rewardTypeContainer}>
              {['Free Item', 'Percentage Off', 'Fixed Amount Off', 'Buy One Get One'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.rewardTypeButton,
                    editingPromotion?.rewardType === type && styles.rewardTypeButtonActive
                  ]}
                  onPress={() => setEditingPromotion((prev: any) => ({ ...prev, rewardType: type }))}
                >
                  <CustomText 
                    variant="caption" 
                    weight="medium" 
                    fontFamily="figtree" 
                    style={[
                      styles.rewardTypeButtonText,
                      editingPromotion?.rewardType === type && styles.rewardTypeButtonTextActive
                    ]}
                  >
                    {type}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {editingPromotion?.rewardType === 'Percentage Off' && (
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <MaterialIcons name="percent" size={20} color={COLORS.white} />
                </View>
                <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.formLabel}>
                  Discount Percentage
                </CustomText>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., 20, 50, 75"
                  placeholderTextColor={COLORS.text.light}
                  value={editingPromotion?.discountPercentage?.toString() || ''}
                  onChangeText={(text) => setEditingPromotion((prev: any) => ({ ...prev, discountPercentage: parseInt(text) || 0 }))}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {editingPromotion?.rewardType === 'Fixed Amount Off' && (
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <MaterialIcons name="attach-money" size={20} color={COLORS.white} />
                </View>
                <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.formLabel}>
                  Discount Amount ($)
                </CustomText>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., 5, 10, 25"
                  placeholderTextColor={COLORS.text.light}
                  value={editingPromotion?.discountAmount?.toString() || ''}
                  onChangeText={(text) => setEditingPromotion((prev: any) => ({ ...prev, discountAmount: parseFloat(text) || 0 }))}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

                    <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <MaterialIcons name="event" size={20} color={COLORS.white} />
              </View>
              <CustomText variant="body" weight="bold" fontFamily="figtree" style={styles.formLabel}>
                Expiration Date (Optional)
              </CustomText>
            </View>
            <View style={styles.datePickerRow}>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => {
                    animateButtonPress();
                    showDatePickerModal();
                  }}
                  activeOpacity={0.8}
                >
                  <CustomText variant="body" weight="normal" fontFamily="figtree" style={styles.datePickerButtonText}>
                    {editingPromotion?.expirationDate ? 
                      new Date(editingPromotion.expirationDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 
                      'Select Date'
                    }
                  </CustomText>
                  <AntDesign name="calendar" size={20} color={COLORS.info} />
                </TouchableOpacity>
              </Animated.View>
              {editingPromotion?.expirationDate && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={() => setEditingPromotion((prev: any) => ({ ...prev, expirationDate: null }))}
                >
                  <AntDesign name="close" size={16} color="#E74C3C" />
                </TouchableOpacity>
              )}
            </View>
            <CustomText variant="caption" weight="normal" fontFamily="figtree" style={styles.datePickerHint}>
              Tap to select when this promotion expires
            </CustomText>
          </View>
        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={editingPromotion?.expirationDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* iOS Date Picker Modal */}
        {Platform.OS === 'ios' && showDatePicker && (
          <View style={styles.iosDatePickerOverlay}>
            <View style={styles.iosDatePickerContainer}>
              <View style={styles.iosDatePickerHeader}>
                <TouchableOpacity onPress={hideDatePickerModal}>
                  <CustomText variant="button" weight="bold" fontFamily="figtree" style={styles.iosDatePickerButton}>
                    Cancel
                  </CustomText>
                </TouchableOpacity>
                <CustomText variant="subtitle" weight="bold" fontFamily="figtree" style={styles.iosDatePickerTitle}>
                  Select Date
                </CustomText>
                <TouchableOpacity onPress={hideDatePickerModal}>
                  <CustomText variant="button" weight="bold" fontFamily="figtree" style={styles.iosDatePickerButton}>
                    Done
                  </CustomText>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={editingPromotion?.expirationDate || new Date()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={styles.iosDatePicker}
              />
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    padding: 8,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  saveButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  formContentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gradient.primary[0],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  formLabel: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  inputContainer: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formInput: {
    borderWidth: 0,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left',
    color: COLORS.text.primary,
  },
  formTextArea: {
    borderWidth: 0,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left',
    color: COLORS.text.primary,
  },
  rewardTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
  },
  rewardTypeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.text.light,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rewardTypeButtonActive: {
    backgroundColor: COLORS.gradient.primary[0],
    borderColor: COLORS.gradient.primary[0],
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  rewardTypeButtonText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  rewardTypeButtonTextActive: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0,
    borderRadius: 16,
    padding: 16,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  clearDateButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  datePickerButtonText: {
    color: COLORS.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  datePickerHint: {
    color: COLORS.text.secondary,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
    width: '100%',
  },
  // iOS Date Picker styles
  iosDatePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  iosDatePickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 16,
  },
  iosDatePickerTitle: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  iosDatePickerButton: {
    color: COLORS.gradient.primary[0],
    fontSize: 16,
    fontWeight: '600',
  },
  iosDatePicker: {
    backgroundColor: 'transparent',
  },
}); 