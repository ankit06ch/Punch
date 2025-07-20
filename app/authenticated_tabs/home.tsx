import { useEffect, useState } from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import { collection, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import homeStyles from '../styles/homeStyles';

export default function Home() {
  const [name, setName] = useState('');
  const [punches, setPunches] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [rewards, setRewards] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setName(userData.name || '');
          setPunches(userData.punches || 0);
          setFavorites(userData.favorites || []);
          setRewards(userData.rewards || []);
        }
      }
    };

    fetchUserData();
  }, []);

  return (
    <ScrollView style={homeStyles.container}>
      <Text style={homeStyles.greeting}>Hello, {name}</Text>
      <Text style={homeStyles.punchCount}>You have {punches} punches</Text>

      <Text style={homeStyles.sectionHeader}>Favorites</Text>
      {favorites.length === 0 ? (
        <Text style={homeStyles.emptyText}>You don’t have any favorites yet!</Text>
      ) : (
        favorites.map((fav, idx) => (
          <Text key={idx} style={{ marginBottom: 8 }}>{fav}</Text>
        ))
      )}

      <Text style={homeStyles.sectionHeader}>My Rewards</Text>
      {rewards.length === 0 ? (
        <Text style={homeStyles.emptyText}>You don’t have any rewards yet!</Text>
      ) : (
        <FlatList
          horizontal
          data={rewards}
          contentContainerStyle={homeStyles.rewardScrollContainer}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={homeStyles.rewardCard}>
              <Text style={homeStyles.rewardText}>{item}</Text>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}