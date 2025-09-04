import { Tabs, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import tabBarStyles from '../styles/tabBarStyles';
import { useRouter } from 'expo-router';

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  
  // Animation value for the circle background
  const circlePosition = useRef(new Animated.Value(0)).current;
  
  // Animation value for gradient opacity
  const gradientOpacity = useRef(new Animated.Value(1)).current;
  
  // State to track the active tab
  const [activeTab, setActiveTab] = useState('home');
  
  // Calculate positions for each tab (excluding the center punch button)
  const getTabPosition = (tab: string) => {
    const navBarWidth = screenWidth - 40; // 20px margin on each side
    const availableWidth = navBarWidth - 40; // 20px padding on each side
    const punchButtonWidth = 65;
    const remainingWidth = availableWidth - punchButtonWidth;
    const tabSpacing = remainingWidth / 4; // 4 tabs (2 on each side of punch button)
    const circleSize = 40;
    const iconSize = 24;
    const iconOffset = (circleSize - iconSize) / 2; // Center the circle on the icon
    
    // Calculate the center position of each icon
    const homeCenter = 20 + (tabSpacing / 2);
    const discoverCenter = 20 + tabSpacing + (tabSpacing / 2);
    const walletCenter = 20 + (tabSpacing * 2) + punchButtonWidth + (tabSpacing / 2);
    const profileCenter = 20 + (tabSpacing * 3) + punchButtonWidth + (tabSpacing / 2);
    
    // Adjustments for different pages
    const homeAdjustment = 4; // Move 4px left for home (less than before)
    const discoverAdjustment = 12; // Move 12px left for discover (more than home)
    const profileAdjustment = 4; // Move 4px right for profile (less than before)
    const walletAdjustment = 12; // Move 12px right for wallet (more than profile)
    
    switch (tab) {
      case 'home': return homeCenter - (circleSize / 2) - homeAdjustment; // Move slightly left for home
      case 'discover': return discoverCenter - (circleSize / 2) - discoverAdjustment; // Move more left for discover
      case 'wallet': return walletCenter - (circleSize / 2) + walletAdjustment; // Move more right for wallet
      case 'profile': return profileCenter - (circleSize / 2) + profileAdjustment; // Move slightly right for profile
      default: return homeCenter - (circleSize / 2) - homeAdjustment;
    }
  };
  
  // Animate circle position and gradient when tab changes
  useEffect(() => {
    const targetPosition = getTabPosition(activeTab);
    
    // Animate circle position
    Animated.spring(circlePosition, {
      toValue: targetPosition,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
    
    // Animate gradient transition smoothly
    Animated.sequence([
      Animated.timing(gradientOpacity, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(gradientOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab]);
  
  const handlePunchLogoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveTab('nfc');
    // Navigate to NFC tab for both card reading and phone-to-phone connections
    router.push('/authenticated_tabs/nfc');
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#fb7a20',
                  tabBarStyle: {
          backgroundColor: 'transparent',
          height: 0,
          borderTopWidth: 0,
          borderWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingHorizontal: 0,
          paddingTop: 0,
          paddingBottom: 0,
          marginHorizontal: 0,
          marginBottom: 0,
          position: 'absolute',
          bottom: -1000, // Move it way off-screen
          left: 0,
          right: 0,
          opacity: 0, // Make it completely invisible
        },
          tabBarShowLabel: false,
          headerShown: false,
          tabBarBackground: () => null, // Remove default tab bar background
        }}
      >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }: { color: string }) => <Feather name="home" size={24} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          tabBarIcon: ({ color }: { color: string }) => <Feather name="search" size={24} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="nfc"
        options={{
          tabBarButton: ({ style, onPress }: { style: any; onPress: () => void }) => (
            <View style={tabBarStyles.centerButtonWrapper}>
              <TouchableOpacity
                onPress={handlePunchLogoPress}
                style={tabBarStyles.centerButton}
              >
                <Image 
                  source={require('../../assets/Punch_Logos/PunchP_logo/punchPlogo.png')} 
                  style={{ width: 28, height: 28, tintColor: 'white' }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="wallet"
        options={{
          tabBarIcon: ({ color }: { color: string }) => <Feather name="credit-card" size={24} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }: { color: string }) => <Feather name="user" size={24} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="full-map"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      </Tabs>
      

      
      {/* White gradient behind navigation bar */}
      <LinearGradient
        colors={['transparent', 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.8)', 'white', 'white']}
        locations={[0, 0.2, 0.4, 0.6, 0.8, 1]}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Math.max(120, insets.bottom + 100),
          zIndex: 1,
        }}
      />

      {/* Shadow container for navigation bar */}
      <View style={{
        position: 'absolute',
        bottom: Math.max(10, insets.bottom + 5),
        left: 20,
        right: 20,
        height: 60,
        borderRadius: 30,
        elevation: 20,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 20,
        backgroundColor: 'transparent',
        zIndex: 2,
      }}>
        {/* Custom pill-shaped navigation bar */}
        <View style={{
          height: 60,
          backgroundColor: 'white',
          borderRadius: 30,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingHorizontal: 20,
        }}>
        {/* Animated circle background */}
        <Animated.View
          style={{
            position: 'absolute',
            left: circlePosition,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(251, 122, 32, 0.15)', // Light orange background
            top: 10, // Center vertically in the 60px height nav bar
          }}
        />
        
        <TouchableOpacity onPress={() => {
          setActiveTab('home');
          router.push('/authenticated_tabs/home');
        }}>
          <Feather name="home" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          setActiveTab('discover');
          router.push('/authenticated_tabs/discover');
        }}>
          <Feather name="search" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handlePunchLogoPress}
          style={{
            width: 65,
            height: 65,
            borderRadius: 32.5,
            backgroundColor: activeTab === 'nfc' ? '#fb7a20' : '#fb7a20', // Always orange for punch logo
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 12,
            elevation: 12,
            borderWidth: 3,
            borderColor: 'white',
            marginTop: -2.5, // Slight adjustment to perfect vertical centering
          }}
        >
          <Image 
            source={require('../../assets/Punch_Logos/PunchP_logo/punchPlogo.png')} 
            style={{ width: 36, height: 36, tintColor: 'white' }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          setActiveTab('wallet');
          router.push('/authenticated_tabs/wallet');
        }}>
          <Feather name="credit-card" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          setActiveTab('profile');
          router.push('/authenticated_tabs/profile');
        }}>
          <Feather name="user" size={24} color="#666" />
        </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}