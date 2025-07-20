import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity } from 'react-native';
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
                onPress={onPress}
                style={tabBarStyles.centerButton}
              >
                <Ionicons name="radio" size={28} color="white" />
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
    </Tabs>
  );
}