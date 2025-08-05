import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("AUTH STATE CHANGED:", user);
      if (user) {
        router.replace('/authenticated_tabs/home');
      } else {
        router.replace('/unauthenticated_tabs/splash');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return null;
}