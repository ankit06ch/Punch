import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Platform, View, TouchableOpacity, Alert, Dimensions, Animated, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { doc, getDoc, updateDoc, arrayUnion, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import CustomText from '../../components/CustomText';
import AnimatedBubblesBackground from '../components/AnimatedBubblesBackground';
import CustomLoadingScreen from '../components/CustomLoadingScreen';

// Import NFC manager
let nfcManager: any = null;
let NfcTech: any = null;

if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    const nfcModule = require('react-native-nfc-manager');
    nfcManager = nfcModule.default;
    NfcTech = nfcModule.NfcTech;
  } catch (error) {
    console.log('NFC module not available:', error);
  }
}

const { width, height } = Dimensions.get('window');

// Color palette matching the app theme
const COLORS = {
  primary: '#FB7A20',
  secondary: '#2C3E50',
  background: '#FFFFFF',
  text: {
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    light: '#BDC3C7',
  },
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
};

function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <BlurView
      intensity={40}
      tint="light"
      style={[styles.glassCard, style]}
    >
      {children}
    </BlurView>
  );
}

function NFCIcon({ scanning, onPress }: { scanning: boolean; onPress: () => void }) {
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (scanning) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Rotation animation
      Animated.loop(
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnimation.setValue(1);
      rotateAnimation.setValue(0);
    }
  }, [scanning]);

  const animatedStyle = {
    transform: [
      { scale: pulseAnimation },
      {
        rotate: rotateAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }) as any,
      },
    ],
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[styles.nfcIconContainer, animatedStyle]}>
        <View style={[styles.nfcIcon, scanning && styles.nfcIconScanning]}>
          <MaterialIcons 
            name="nfc" 
            size={48} 
            color={scanning ? COLORS.primary : COLORS.text.secondary} 
          />
        </View>
        {scanning && (
          <View style={styles.scanningRings}>
            <View style={[styles.scanningRing, styles.scanningRing1]} />
            <View style={[styles.scanningRing, styles.scanningRing2]} />
            <View style={[styles.scanningRing, styles.scanningRing3]} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

function StatusCard({ status, nfcSupported, scanning }: { 
  status: string; 
  nfcSupported: boolean; 
  scanning: boolean;
}) {
  const getStatusColor = () => {
    if (scanning) return COLORS.primary;
    if (nfcSupported) return COLORS.success;
    return COLORS.error;
  };

  const getStatusIcon = () => {
    if (scanning) return 'radio-button-on';
    if (nfcSupported) return 'checkmark-circle';
    return 'close-circle';
  };

  return (
    <GlassCard style={styles.statusCard}>
      <View style={styles.statusContent}>
        <Ionicons 
          name={getStatusIcon() as any} 
          size={24} 
          color={getStatusColor()} 
        />
        <CustomText 
          fontFamily="figtree" 
          weight="medium" 
          style={[styles.statusText, { color: getStatusColor() }]}
        >
          {status}
        </CustomText>
      </View>
    </GlassCard>
  );
}

function ActionButton({ 
  title, 
  onPress, 
  disabled, 
  icon, 
  variant = 'primary' 
}: { 
  title: string; 
  onPress: () => void; 
  disabled: boolean; 
  icon: string;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        disabled && styles.disabledButton
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <AntDesign 
        name={icon as any} 
        size={20} 
        color={variant === 'primary' ? 'white' : COLORS.primary} 
      />
      <CustomText 
        fontFamily="figtree" 
        weight="semibold" 
        style={[
          styles.buttonText,
          { color: variant === 'primary' ? 'white' : COLORS.primary }
        ]}
      >
        {title}
      </CustomText>
    </TouchableOpacity>
  );
}

export default function NFC() {
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcStatus, setNfcStatus] = useState('');
  const [tagData, setTagData] = useState<any>(null);

  useEffect(() => {
    checkNFCSupport();
  }, []);

  // Auto-start NFC scan when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (nfcSupported && !scanning) {
        // Small delay to ensure screen is fully loaded
        const timer = setTimeout(() => {
          startNFCScan();
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [nfcSupported, scanning])
  );

  const checkNFCSupport = async () => {
    console.log('🔍 Checking NFC support...');
    console.log('nfcManager available:', !!nfcManager);
    console.log('NfcTech available:', !!NfcTech);
    
    if (!nfcManager) {
      console.log('❌ NFC manager not available');
      setNfcSupported(false);
      setNfcStatus('NFC module not available');
      setLoading(false);
      return;
    }

    try {

      console.log('📱 Checking if device supports NFC...');
      const supported = await nfcManager.isSupported();
      console.log('✅ NFC supported:', supported);
      setNfcSupported(supported);
      
      if (supported) {
        console.log('🚀 Starting NFC manager...');
        await nfcManager.start();
        console.log('✅ NFC manager started successfully');
        setNfcStatus('Ready to scan');


      } else {
        console.log('❌ NFC not supported on this device');

      }
    } catch (error) {
      console.log('❌ NFC check error:', error);
      setNfcSupported(false);
      
    }
    setLoading(false);
  };

    const startNFCScan = async () => {
    console.log('🚀 Starting NFC scan...');
    console.log('Platform:', Platform.OS);
    console.log('nfcManager available:', !!nfcManager);
    console.log('NfcTech available:', !!NfcTech);

    if (!nfcManager || !NfcTech) {
      console.log('❌ NFC module not available');
      Alert.alert('Error', 'NFC module not available');
      return;
    }

    // Reset NFC manager state for iOS to ensure modal shows up again
    if (Platform.OS === 'ios') {
      try {
        console.log('🔄 Resetting NFC manager for iOS...');
        await nfcManager.invalidateSession();
        await nfcManager.start();
        console.log('✅ NFC manager reset successfully');
      } catch (error) {
        console.log('⚠️ NFC manager reset warning:', error);
        // Continue anyway - this is just a precaution
      }
    }

    setScanning(true);
    setTagData(null);


    try {
      console.log('📱 Requesting NFC technology...');
      // For iOS, we need to handle the session differently
      if (Platform.OS === 'ios') {
        console.log('🍎 iOS: Requesting NDEF technology...');
        await nfcManager.requestTechnology(NfcTech.Ndef);
        console.log('✅ iOS: NDEF technology requested successfully');
      } else {
        console.log('🤖 Android: Requesting NDEF technology...');
        await nfcManager.requestTechnology(NfcTech.Ndef);
        console.log('✅ Android: NDEF technology requested successfully');
      }
      
      const tag = await nfcManager.getTag();
      setTagData(tag);
      
      
      // Try to read NDEF messages and determine device type
      try {
        const ndefMessages = await nfcManager.getNdefMessage();
        if (ndefMessages && ndefMessages.length > 0) {
          const message = ndefMessages[0];
          if (message.records && message.records.length > 0) {
            const record = message.records[0];
            if (record.payload) {
              const payload = new TextDecoder().decode(record.payload);
              console.log('📱 Payload received:', payload);
              
              // Check if this is a restaurant NFC tag by looking it up in the database
              const isRestaurantTag = await checkIfRestaurantTag(tag.id);
              if (isRestaurantTag) {
                // Add punch to the restaurant
                await addPunchToRestaurant(tag.id);
              }
              // Check if this is another phone with the Punch app
              else if (payload.includes('punch') || payload.includes('punchrewards') || payload.includes('phone')) {

                // Handle phone-to-phone connection
                setTimeout(() => {

                  Alert.alert('Phone Connected!', 'Successfully connected to another Punch app user!\n\nYou can now share loyalty cards, rewards, and more.');
                }, 2000);
              } else {
                // Handle regular NFC card/tag

                Alert.alert('NFC Card Read', `Card ID: ${tag.id}\nData: ${payload}`);
              }
            } else {

              Alert.alert('NFC Tag Read', `Tag ID: ${tag.id}\nNo readable data found`);
            }
          }
        } else {

          Alert.alert('NFC Tag Read', `Tag ID: ${tag.id}\nNo NDEF messages found`);
        }
      } catch (ndefError) {
        console.log('❌ Error reading NDEF:', ndefError);

        Alert.alert('NFC Tag Read', `Tag ID: ${tag.id}\nCould not read NDEF data`);
      }
      
      // Immediately close the NFC session after reading to dismiss Apple prompt
      try {
        nfcManager.cancelTechnologyRequest();
        if (Platform.OS === 'ios') {
          nfcManager.invalidateSession();
        }
      } catch (error) {
        console.log('Error closing NFC session:', error);
      }
    } catch (error: any) {
      console.log('NFC scan error:', error);
      if (error?.toString().includes('User cancelled') || error?.toString().includes('Session invalidated')) {

      } else {

      }
    } finally {
      setScanning(false);
      try {
        // Properly close the NFC session to dismiss the Apple prompt
        nfcManager.cancelTechnologyRequest();
        // Also invalidate the session to ensure it's completely closed
        if (Platform.OS === 'ios') {
          nfcManager.invalidateSession();
        }
      } catch (error) {
        console.log('Error canceling NFC request:', error);
      }
    }
  };

  // Function to check if an NFC tag ID belongs to a restaurant
  const checkIfRestaurantTag = async (tagId: string): Promise<boolean> => {
    try {
      const restaurantsRef = collection(db, 'restaurants');
      const q = query(restaurantsRef, where('nfcTagId', '==', tagId));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking restaurant tag:', error);
      return false;
    }
  };

  // Function to add a punch to a restaurant based on NFC tag ID
  const addPunchToRestaurant = async (tagId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to add punches');
        return;
      }

      // Find the restaurant that has this NFC tag ID
      const restaurantsRef = collection(db, 'restaurants');
      const q = query(restaurantsRef, where('nfcTagId', '==', tagId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        Alert.alert('Restaurant Not Found', 'This NFC card is not associated with any restaurant in our system.');
        return;
      }

      const restaurantDoc = querySnapshot.docs[0];
      const restaurantData = restaurantDoc.data();
      const restaurantId = restaurantDoc.id;

      // Check if user already has a punch card for this restaurant
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        Alert.alert('Error', 'User profile not found');
        return;
      }

      const userData = userDoc.data();
      let currentPunches = userData.punchCards?.[restaurantId] || 0;
      const maxPunches = restaurantData.total || 10;

      // Add one punch
      currentPunches = Math.min(currentPunches + 1, maxPunches);

      // Update user's punch card
      await updateDoc(userRef, {
        [`punchCards.${restaurantId}`]: currentPunches
      });

      // Check if they've completed the punch card
      if (currentPunches >= maxPunches) {
        Alert.alert(
          '🎉 Punch Card Complete!', 
          `Congratulations! You've completed your punch card for ${restaurantData.name}!\n\nYou can now redeem your reward: ${restaurantData.activeRewards?.[0]?.title || 'Free item'}`
        );
      } else {
        const punchesLeft = maxPunches - currentPunches;
        Alert.alert(
          '✅ Punch Added!', 
          `Great! You now have ${currentPunches}/${maxPunches} punches at ${restaurantData.name}.\n\n${punchesLeft} more punches needed for your reward!`
        );
      }

    } catch (error) {
      console.error('Error adding punch:', error);
      Alert.alert('Error', 'Failed to add punch. Please try again.');
    }
  };

  const showQRCode = () => {
    Alert.alert('QR Code', 'Your QR code would be displayed here!');
  };

  return (
    <View style={styles.container}>
      <AnimatedBubblesBackground />
      <SafeAreaView style={styles.safeArea}>
        {/* Custom Loading Screen */}
        <CustomLoadingScreen visible={loading} size="medium" />
        {/* Fixed Glass Header */}
        <View style={styles.fixedGlassHeader}>
          <BlurView intensity={20} tint="light" style={styles.glassHeader}>
            <CustomText variant="title" weight="bold" fontFamily="figtree" style={styles.glassTitle}>
              NFC Scanner
            </CustomText>
            <CustomText variant="body" weight="normal" fontFamily="figtree" style={styles.glassSubtitle}>
              Scan cards or connect to phones
            </CustomText>
          </BlurView>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* NFC Icon */}
          <View style={styles.nfcSection}>
            <NFCIcon 
              scanning={scanning} 
              onPress={nfcSupported ? startNFCScan : showQRCode}
            />
          </View>

          {/* Status Message */}
          {nfcStatus && (
            <View style={styles.statusContainer}>
              <CustomText fontFamily="figtree" style={styles.statusMessageText}>
                {nfcStatus}
              </CustomText>
            </View>
          )}



          {/* Tag Data Display */}
          {tagData && (
            <GlassCard style={styles.tagDataCard}>
              <CustomText fontFamily="figtree" weight="semibold" style={styles.tagDataTitle}>
                Last Scanned Tag
              </CustomText>
              <CustomText fontFamily="figtree" style={styles.tagDataText}>
                ID: {tagData.id}
              </CustomText>
              <CustomText fontFamily="figtree" style={styles.tagDataText}>
                Type: {tagData.techTypes?.join(', ') || 'Unknown'}
              </CustomText>
            </GlassCard>
          )}
        </ScrollView>


      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  fixedGlassHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  glassHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  glassTitle: {
    color: COLORS.text.primary,
    textAlign: 'left',
    marginBottom: 4,
  },
  glassSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'left',
    opacity: 0.8,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusCard: {
    marginBottom: 30,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 16,
    marginLeft: 12,
  },
  nfcSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    marginTop: 80,
    flex: 1,
  },
  nfcIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  nfcIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(251, 122, 32, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(251, 122, 32, 0.2)',
  },
  nfcIconScanning: {
    backgroundColor: 'rgba(251, 122, 32, 0.2)',
    borderColor: COLORS.primary,
  },
  scanningRings: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningRing: {
    position: 'absolute',
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.primary,
    opacity: 0.3,
  },
  scanningRing1: {
    width: 140,
    height: 140,
    borderColor: COLORS.primary,
  },
  scanningRing2: {
    width: 160,
    height: 160,
    borderColor: COLORS.primary,
  },
  scanningRing3: {
    width: 180,
    height: 180,
    borderColor: COLORS.primary,
  },
  instructionText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    maxWidth: width * 0.8,
  },
  actionButtons: {
    gap: 16,
    marginBottom: 20,
    marginTop: 60,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: 'rgba(251, 122, 32, 0.1)',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    flex: 1,
  },
  nfcNotSupportedContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  nfcNotSupportedText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  statusMessageText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  bottomActionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  tagDataCard: {
    marginBottom: 20,
  },
  tagDataTitle: {
    fontSize: 18,
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  tagDataText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
});