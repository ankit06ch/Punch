import { Tabs, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import tabBarStyles from '../styles/tabBarStyles';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#fb7a20',
        tabBarStyle: tabBarStyles.tabBar,
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="nfc"
        options={{
          tabBarButton: ({ style, onPress }) => (
            <View style={tabBarStyles.centerButtonWrapper}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onPress();
                }}
                style={tabBarStyles.centerButton}
              >
                <Image 
                  source={require('../../assets/Punch_Logos/PunchP_logo/punchPlogo.png')} 
                  style={{ width: 32, height: 32, tintColor: 'white' }}
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
          tabBarIcon: ({ color }) => <Ionicons name="wallet" size={24} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="full-map"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}