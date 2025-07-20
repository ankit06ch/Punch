import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import PassKit, { AddPassButton } from 'react-native-passkit-wallet';

export default function Wallet() {
  const punches = 7;
  const total = 10;

  const handleAddPass = async () => {
    try {
      await PassKit.addPassFromUrl('https://yourserver.com/path/to/your.pkpass'); // Replace with your hosted pass URL
    } catch (error) {
      console.error('Failed to add pass:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Punch Card</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Loyalty Card</Text>
        <View style={styles.punchRow}>
          {Array.from({ length: total }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.punch,
                index < punches ? styles.filledPunch : styles.emptyPunch,
              ]}
            />
          ))}
        </View>
        <Text style={styles.cardSubtitle}>{punches} / {total} punches</Text>
      </View>

      <View style={styles.addPassContainer}>
        <AddPassButton onPress={handleAddPass} style={styles.pkAddPassButton} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fb7a20',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff4ed',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 30,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  cardSubtitle: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  punchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  punch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    margin: 5,
    borderWidth: 1.5,
    borderColor: '#fb7a20',
  },
  filledPunch: {
    backgroundColor: '#fb7a20',
  },
  emptyPunch: {
    backgroundColor: '#fff',
  },
  addPassContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  pkAddPassButton: {
    width: 200,
    height: 44,
  },
});