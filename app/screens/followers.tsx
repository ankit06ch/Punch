import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FollowersScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 22, color: '#fb7a20', fontWeight: 'bold' }}>Followers Page</Text>
      <Text style={{ color: '#666', marginTop: 12 }}>This is a placeholder for the followers list.</Text>
    </SafeAreaView>
  );
} 