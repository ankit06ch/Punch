import { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase/config';

export default function FindFriendsScreen() {
  const [search, setSearch] = useState('');
  type User = {
    id: string;
    username: string;
    name: string;
  };
  
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('username', '>=', search),
        where('username', '<=', search + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => {
        const data = doc.data() as { username: string; name: string };
        return { id: doc.id, username: data.username, name: data.name };
      });
      setResults(users);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search by username"
        placeholderTextColor="gray"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={handleSearch}
      />

      {loading && <Text style={styles.status}>Searching...</Text>}
      {!loading && results.length === 0 && search !== '' && (
        <Text style={styles.status}>No users found.</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userCard}>
            <Text style={styles.username}>@{item.username}</Text>
            <Text style={styles.name}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#222',
    color: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  status: { color: 'white', marginBottom: 12 },
  userCard: {
    backgroundColor: '#1c1c1c',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  username: { color: '#ff2f68', fontWeight: 'bold', fontSize: 16 },
  name: { color: 'white' },
});