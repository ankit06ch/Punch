import { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const slides = [
  { key: "1", title: "Welcome to Punch", description: "Track your rewards easily!" },
  { key: "2", title: "Discover Businesses", description: "Find rewards near you." },
  { key: "3", title: "Earn & Redeem", description: "Punch and claim!" },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const router = useRouter();

  const next = () => {
    if (index < slides.length - 1) setIndex(index + 1);
    else router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{slides[index].title}</Text>
      <Text style={styles.description}>{slides[index].description}</Text>
      <Button title={index === slides.length - 1 ? 'Get Started' : 'Next'} onPress={next} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  description: { fontSize: 16, marginBottom: 40, textAlign: 'center' },
});