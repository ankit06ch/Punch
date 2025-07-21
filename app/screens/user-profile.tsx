import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const docRef = doc(db, 'users', userId as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUser(data);
        setFollowersCount(data.followersCount || 0);
        setFollowingCount(data.followingCount || 0);
        if (currentUser && data.followerUids?.includes(currentUser.uid)) {
          setIsFollowing(true);
        } else {
          setIsFollowing(false);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [userId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', userId as string);
    const currentUserRef = doc(db, 'users', currentUser.uid);
    if (isFollowing) {
      await updateDoc(userRef, {
        followerUids: arrayRemove(currentUser.uid),
        followersCount: followersCount - 1,
      });
      await updateDoc(currentUserRef, {
        followingUids: arrayRemove(userId),
        followingCount: followingCount - 1,
      });
      setIsFollowing(false);
      setFollowersCount(followersCount - 1);
    } else {
      await updateDoc(userRef, {
        followerUids: arrayUnion(currentUser.uid),
        followersCount: followersCount + 1,
      });
      await updateDoc(currentUserRef, {
        followingUids: arrayUnion(userId),
        followingCount: followingCount + 1,
      });
      setIsFollowing(true);
      setFollowersCount(followersCount + 1);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#fb7a20" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.status}>User not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fb7a20" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <View style={styles.profileSection}>
        <View style={styles.avatarCircle}>
          {user.profilePictureUrl ? (
            <Image source={{ uri: user.profilePictureUrl }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-circle" size={80} color="#fb7a20" />
          )}
        </View>
        <Text style={styles.username}>@{user.username}</Text>
        <Text style={styles.name}>{user.name}</Text>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        <View style={styles.statsRow}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/screens/followers', params: { userId } })}>
            <Text style={styles.statNumber}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push({ pathname: '/screens/following', params: { userId } })}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
        {currentUser && currentUser.uid !== userId && (
          <TouchableOpacity style={[styles.followButton, isFollowing && styles.unfollowButton]} onPress={handleFollow}>
            <Text style={[styles.followButtonText, isFollowing && styles.unfollowButtonText]}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: 'white' },
  backButton: { marginRight: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fb7a20', flex: 1, textAlign: 'center', marginRight: 36 },
  profileSection: { alignItems: 'center', marginTop: 32, paddingHorizontal: 24 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f7f7f7', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  username: { color: '#fb7a20', fontWeight: 'bold', fontSize: 22, marginTop: 8 },
  name: { color: '#222', fontSize: 18, marginBottom: 8 },
  bio: { color: '#666', fontSize: 15, marginBottom: 16, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 16 },
  statNumber: { color: '#fb7a20', fontWeight: 'bold', fontSize: 18, textAlign: 'center' },
  statLabel: { color: '#222', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  followButton: { backgroundColor: '#fb7a20', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 40, marginTop: 16 },
  followButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  unfollowButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#fb7a20' },
  unfollowButtonText: { color: '#fb7a20' },
  status: { color: '#fb7a20', marginTop: 48, textAlign: 'center', fontSize: 18 },
}); 