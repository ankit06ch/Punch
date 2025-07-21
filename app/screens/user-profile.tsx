import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, collection } from 'firebase/firestore';
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
  const [privacySettings, setPrivacySettings] = useState<any>({});
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const docRef = doc(db, 'users', userId as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUser(data);
        setPrivacySettings(data.privacySettings || {});
        
        // Check if profile is private and user is not following
        if (data.privacySettings?.profileVisibility === 'private' && 
            currentUser && 
            !data.followerUids?.includes(currentUser.uid) &&
            currentUser.uid !== userId) {
          // Profile is private and user doesn't have access
          setFollowersCount(0);
          setFollowingCount(0);
          setIsFollowing(false);
        } else {
          // Profile is public or user has access
          setFollowersCount(data.followersCount || 0);
          setFollowingCount(data.followingCount || 0);
          if (currentUser && data.followerUids?.includes(currentUser.uid)) {
            setIsFollowing(true);
          } else {
            setIsFollowing(false);
          }
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [userId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser) return;
    
    try {
      const currentUserId = currentUser.uid;
      const targetUserId = userId as string;
      const isFollowing = user?.followerUids?.includes(currentUserId);
      
      if (isFollowing) {
        // Unfollow (works for both public and private)
        await updateDoc(doc(db, 'users', currentUserId), {
          followingUids: arrayRemove(targetUserId),
          followingCount: (followingCount || 1) - 1,
        });
        await updateDoc(doc(db, 'users', targetUserId), {
          followerUids: arrayRemove(currentUserId),
          followersCount: (followersCount || 1) - 1,
        });
        setIsFollowing(false);
        setFollowersCount(followersCount - 1);
      } else {
        // Check if target user has private profile
        if (user?.privacySettings?.profileVisibility === 'private') {
          // Send follow request
          await sendFollowRequest(currentUserId, targetUserId);
        } else {
          // Public profile - auto follow
          await updateDoc(doc(db, 'users', currentUserId), {
            followingUids: arrayUnion(targetUserId),
            followingCount: (followingCount || 0) + 1,
          });
          await updateDoc(doc(db, 'users', targetUserId), {
            followerUids: arrayUnion(currentUserId),
            followersCount: (followersCount || 0) + 1,
          });
          setIsFollowing(true);
          setFollowersCount(followersCount + 1);
        }
      }
      
      // Refresh user data by calling the useEffect
      const docRef = doc(db, 'users', userId as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUser(data);
        setPrivacySettings(data.privacySettings || {});
        setFollowersCount(data.followersCount || 0);
        setFollowingCount(data.followingCount || 0);
        if (currentUser && data.followerUids?.includes(currentUser.uid)) {
          setIsFollowing(true);
        } else {
          setIsFollowing(false);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const sendFollowRequest = async (fromUserId: string, toUserId: string) => {
    try {
      // Create follow request notification
      const notificationData = {
        type: 'follow_request',
        fromUserId,
        toUserId,
        timestamp: new Date(),
        read: false,
        status: 'pending', // pending, approved, denied
        message: `@${currentUser?.displayName || 'user'} wants to follow you`,
      };

      // Add to notifications collection
      await addDoc(collection(db, 'notifications'), notificationData);
      
      // Add to user's pending requests
      await updateDoc(doc(db, 'users', toUserId), {
        pendingFollowRequests: arrayUnion(fromUserId)
      });

      // Show success message
      alert('Follow request sent!');
    } catch (error) {
      console.error('Error sending follow request:', error);
    }
  };

  const canViewStats = (statType: string) => {
    if (!user) return false;
    if (currentUser?.uid === userId) return true; // User viewing their own profile
    if (user.privacySettings?.profileVisibility === 'private' && !isFollowing) return false;
    return user.privacySettings?.[`show${statType}`] !== false;
  };

  const canViewProfile = () => {
    if (!user) return false;
    if (currentUser?.uid === userId) return true; // User viewing their own profile
    if (user.privacySettings?.profileVisibility === 'public') return true;
    if (user.privacySettings?.profileVisibility === 'private' && isFollowing) return true;
    return false;
  };

  const getDisplayStats = () => {
    const stats = [];
    
    if (canViewStats('Followers')) {
      stats.push({
        label: 'Followers',
        count: followersCount,
        onPress: () => router.push(`/screens/followers?userId=${userId}`)
      });
    }
    
    if (canViewStats('Following')) {
      stats.push({
        label: 'Following',
        count: followingCount,
        onPress: () => router.push(`/screens/following?userId=${userId}`)
      });
    }
    
    if (canViewStats('StoresVisited')) {
      stats.push({
        label: 'Stores Visited',
        count: user.storesVisitedCount || 0,
        onPress: () => {} // Could open stores visited list
      });
    }
    
    return stats;
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

  const profileAccessible = canViewProfile();

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
        
        {!profileAccessible ? (
          <View style={styles.privateProfileContainer}>
            <Ionicons name="lock-closed" size={48} color="#ccc" />
            <Text style={styles.privateProfileText}>This profile is private</Text>
            <Text style={styles.privateProfileSubtext}>
              Follow this user to see their profile
            </Text>
            {currentUser && currentUser.uid !== userId && (
              <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
                      <>
              <View style={styles.statsRow}>
                {getDisplayStats().map((stat, index) => (
                  <TouchableOpacity 
                    key={stat.label}
                    onPress={stat.onPress}
                  >
                    <Text style={styles.statNumber}>{stat.count}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            
            {currentUser && currentUser.uid !== userId && (
              <TouchableOpacity style={[styles.followButton, isFollowing && styles.unfollowButton]} onPress={handleFollow}>
                <Text style={[styles.followButtonText, isFollowing && styles.unfollowButtonText]}>
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </>
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
  privateProfileContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 20,
  },
  privateProfileText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  privateProfileSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
}); 