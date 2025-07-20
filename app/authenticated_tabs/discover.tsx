import { View, Text, StyleSheet } from 'react-native';

export default function Discover() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discover Nearby Businesses</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
});