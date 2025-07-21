import { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function FindFriendsScreen() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        const data = doc.data() as { username: string; name: string; profilePictureUrl?: string };
        return { id: doc.id, username: data.username, name: data.name, profilePictureUrl: data.profilePictureUrl };
      });
      setResults(users);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fb7a20" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Friends</Text>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={22} color="#fb7a20" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          placeholder="Search by username"
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
          <Ionicons name="arrow-forward" size={22} color="white" />
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator size="large" color="#fb7a20" style={{ marginTop: 24 }} />}
      {!loading && results.length === 0 && search !== '' && (
        <Text style={styles.status}>No users found.</Text>
      )}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userCard} onPress={() => router.push({ pathname: '/screens/user-profile', params: { userId: item.id } })}>
            <View style={styles.avatarCircle}>
              {item.profilePictureUrl ? (
                <View style={styles.avatarImageWrapper}>
                  <Image source={{ uri: item.profilePictureUrl }} style={styles.avatarImage} />
                </View>
              ) : (
                <Ionicons name="person-circle" size={48} color="#fb7a20" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.username}>@{item.username}</Text>
              <Text style={styles.name}>{item.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fb7a20" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: 'white' },
  backButton: { marginRight: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fb7a20', flex: 1, textAlign: 'center', marginRight: 36 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: '#f7f7f7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  input: { flex: 1, fontSize: 16, color: '#222', paddingVertical: 8, backgroundColor: 'transparent' },
  searchButton: { backgroundColor: '#fb7a20', borderRadius: 20, padding: 8, marginLeft: 8 },
  status: { color: '#fb7a20', marginTop: 24, textAlign: 'center', fontSize: 16 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  avatarCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#f7f7f7', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarImageWrapper: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  username: { color: '#fb7a20', fontWeight: 'bold', fontSize: 18 },
  name: { color: '#222', fontSize: 15 },
});