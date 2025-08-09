import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs, query, where, deleteDoc, increment } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';

const ORANGE = '#fb7a20';

export default function FollowingScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('following');


  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId as string));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser(userData);
        
        // Fetch current user data
        const currentUserDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid || ''));
        if (currentUserDoc.exists()) {
          setCurrentUser(currentUserDoc.data());
        }
        
        // Fetch followers and following
        await fetchFollowers(userData.followerUids || []);
        await fetchFollowing(userData.followingUids || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async (followerUids: string[]) => {
    try {
      const followersData = [];
      for (const uid of followerUids) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          followersData.push({ id: uid, ...userDoc.data() });
        }
      }
      setFollowers(followersData);
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const fetchFollowing = async (followingUids: string[]) => {
    try {
      const followingData = [];
      const pendingRequests = currentUser?.pendingFollowRequests || [];
      
      for (const uid of followingUids) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const isPendingRequest = pendingRequests.includes(uid);
          
          // Only include users that are actually following (not pending requests)
          // unless the current user is viewing their own following list
          if (!isPendingRequest) {
            followingData.push({ 
              id: uid, 
              ...userData,
              isPendingRequest 
            });
          }
        }
      }
      setFollowing(followingData);
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!auth.currentUser) return;
    
    try {
      const currentUserId = auth.currentUser.uid;
      const isFollowing = currentUser?.followingUids?.includes(targetUserId);
      const isPendingRequest = currentUser?.pendingFollowRequests?.includes(targetUserId);
      
      if (isPendingRequest) {
        // Cancel follow request
        await updateDoc(doc(db, 'users', targetUserId), {
          pendingFollowRequests: arrayRemove(currentUserId)
        });
        
        // Remove from followingUids if it was added
        await updateDoc(doc(db, 'users', currentUserId), {
          followingUids: arrayRemove(targetUserId),
          pendingFollowRequests: arrayRemove(targetUserId)
        });
        
        // Delete the follow request notification
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('type', '==', 'follow_request'),
          where('fromUserId', '==', currentUserId),
          where('toUserId', '==', targetUserId),
          where('status', '==', 'pending')
        );
        const notificationSnapshot = await getDocs(notificationsQuery);
        
        // Delete all matching notifications (should be only one)
        const deletePromises = notificationSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        
        Alert.alert('Request Cancelled', 'Your follow request has been cancelled.');
      } else if (isFollowing) {
        // Unfollow
        await updateDoc(doc(db, 'users', currentUserId), {
          followingUids: arrayRemove(targetUserId),
          followingCount: increment(-1),
        });
        await updateDoc(doc(db, 'users', targetUserId), {
          followerUids: arrayRemove(currentUserId),
          followersCount: increment(-1),
        });
      } else {
        // Check if target user has private profile
        const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
        const targetUserData = targetUserDoc.data();
        
        if (targetUserData?.privacySettings?.profileVisibility === 'private') {
          // Send follow request
          await sendFollowRequest(currentUserId, targetUserId);
        } else {
          // Public profile - auto follow
          await updateDoc(doc(db, 'users', currentUserId), {
            followingUids: arrayUnion(targetUserId),
            followingCount: increment(1),
          });
          await updateDoc(doc(db, 'users', targetUserId), {
            followerUids: arrayUnion(currentUserId),
            followersCount: increment(1),
          });
        }
      }
      
      // Update local state
      fetchUserData();
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const sendFollowRequest = async (fromUserId: string, toUserId: string) => {
    try {
      // Get current user's display name
      const currentUserDoc = await getDoc(doc(db, 'users', fromUserId));
      const currentUserData = currentUserDoc.data();
      const requesterName = currentUserData?.name || currentUserData?.username || 'Someone';

      // Create follow request notification
      const notificationData = {
        type: 'follow_request',
        fromUserId,
        toUserId,
        timestamp: new Date(),
        read: false,
        status: 'pending',
        message: `${requesterName} wants to be friends`,
        requesterName: requesterName,
      };

      // Add to notifications collection
      await addDoc(collection(db, 'notifications'), notificationData);
      
      // Add to user's pending requests
      await updateDoc(doc(db, 'users', toUserId), {
        pendingFollowRequests: arrayUnion(fromUserId)
      });

      Alert.alert('Follow Request Sent', 'Your follow request has been sent!');
    } catch (error) {
      console.error('Error sending follow request:', error);
      Alert.alert('Error', 'Failed to send follow request. Please try again.');
    }
  };

  const getFollowButtonText = (targetUserId: string) => {
    if (!currentUser) return 'Follow';
    
    const isFollowing = currentUser.followingUids?.includes(targetUserId);
    const isFollowedBy = currentUser.followerUids?.includes(targetUserId);
    const isPendingRequest = currentUser.pendingFollowRequests?.includes(targetUserId);
    
    if (isPendingRequest) return 'Request Sent';
    if (isFollowing && isFollowedBy) return 'Friends';
    if (isFollowing) return 'Following';
    if (isFollowedBy) return 'Follow Back';
    return 'Follow';
  };

  const getFollowButtonStyle = (targetUserId: string) => {
    if (!currentUser) return styles.followButton;
    
    const isFollowing = currentUser.followingUids?.includes(targetUserId);
    const isFollowedBy = currentUser.followerUids?.includes(targetUserId);
    const isPendingRequest = currentUser.pendingFollowRequests?.includes(targetUserId);
    
    if (isPendingRequest) return styles.pendingRequestButton;
    if (isFollowing && isFollowedBy) return styles.friendsButton;
    if (isFollowing) return styles.followingButton;
    return styles.followButton;
  };

  const filteredUsers = (activeTab === 'followers' ? followers : following).filter(user =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );



  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => router.push(`/screens/user-profile?userId=${item.id}`)}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.profilePictureUrl ? (
            <Image source={{ uri: item.profilePictureUrl }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-circle" size={50} color="#bbb" />
          )}
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name || 'Unknown User'}</Text>
          <Text style={styles.userUid}>@{item.username || item.id}</Text>
        </View>
      </View>
      {auth.currentUser?.uid !== item.id && (
        <TouchableOpacity
          style={getFollowButtonStyle(item.id)}
          onPress={(e) => {
            e.stopPropagation();
            handleFollowToggle(item.id);
          }}
        >
          <Text style={styles.followButtonText}>
            {getFollowButtonText(item.id)}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={ORANGE} style={styles.loading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={ORANGE} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerTitleContainer}
          onPress={() => router.push(`/screens/user-profile?userId=${userId}`)}
        >
          <Text style={styles.headerTitle}>@{user?.username || 'user'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => {
          router.push('/authenticated_tabs/profile?openSearch=true&searchSource=following');
        }}>
          <Ionicons name="person-add" size={28} color={ORANGE} />
        </TouchableOpacity>
      </View>



      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <TouchableOpacity 
          style={[styles.statTab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.statText, activeTab === 'followers' && styles.activeStatText]}>
            Followers {followers.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.statTab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.statText, activeTab === 'following' && styles.activeStatText]}>
            Following {following.length}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username or name"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
      </View>

      {/* User List */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'followers' ? 'Followers' : 'Following'}
        </Text>
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No {activeTab} found
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    textDecorationLine: 'underline',
  },
  addButton: {
    padding: 4,
  },
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: ORANGE,
  },
  statText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeStatText: {
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 12,
    fontSize: 16,
    color: '#222',
  },
  searchIcon: {
    position: 'absolute',
    left: 32,
    top: 28,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  userUid: {
    fontSize: 12,
    color: '#999',
  },
  followButton: {
    backgroundColor: ORANGE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  followingButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  friendsButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pendingRequestButton: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
}); 