import { Slot } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <SafeAreaView style={styles.container}>
      <Slot />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7F2', // match signup background
  },
});