import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Image, ActivityIndicator, Keyboard, Modal, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';

const ORANGE = '#fb7a20';

export default function FollowersScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = React.useRef<TextInput>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

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
      for (const uid of followingUids) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          followingData.push({ id: uid, ...userDoc.data() });
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
      
      if (isFollowing) {
        // Unfollow
        await updateDoc(doc(db, 'users', currentUserId), {
          followingUids: arrayRemove(targetUserId),
          followingCount: (currentUser.followingCount || 1) - 1,
        });
        await updateDoc(doc(db, 'users', targetUserId), {
          followerUids: arrayRemove(currentUserId),
          followersCount: (followers.find(f => f.id === targetUserId)?.followersCount || 1) - 1,
        });
      } else {
        // Follow
        await updateDoc(doc(db, 'users', currentUserId), {
          followingUids: arrayUnion(targetUserId),
          followingCount: (currentUser.followingCount || 0) + 1,
        });
        await updateDoc(doc(db, 'users', targetUserId), {
          followerUids: arrayUnion(currentUserId),
          followersCount: (followers.find(f => f.id === targetUserId)?.followersCount || 0) + 1,
        });
      }
      
      // Update local state
      fetchUserData();
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const getFollowButtonText = (targetUserId: string) => {
    if (!currentUser) return 'Follow';
    
    const isFollowing = currentUser.followingUids?.includes(targetUserId);
    const isFollowedBy = currentUser.followerUids?.includes(targetUserId);
    
    if (isFollowing && isFollowedBy) return 'Friends';
    if (isFollowing) return 'Following';
    if (isFollowedBy) return 'Follow Back';
    return 'Follow';
  };

  const getFollowButtonStyle = (targetUserId: string) => {
    if (!currentUser) return styles.followButton;
    
    const isFollowing = currentUser.followingUids?.includes(targetUserId);
    const isFollowedBy = currentUser.followerUids?.includes(targetUserId);
    
    if (isFollowing && isFollowedBy) return styles.friendsButton;
    if (isFollowing) return styles.followingButton;
    return styles.followButton;
  };

  const filteredUsers = (activeTab === 'followers' ? followers : following).filter(user =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserItem = ({ item }: { item: any }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={50} color="#bbb" />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name || 'Unknown User'}</Text>
          <Text style={styles.userUid}>{item.id}</Text>
        </View>
      </View>
      {auth.currentUser?.uid !== item.id && (
        <TouchableOpacity
          style={getFollowButtonStyle(item.id)}
          onPress={() => handleFollowToggle(item.id)}
        >
          <Text style={styles.followButtonText}>
            {getFollowButtonText(item.id)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
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
        <TouchableOpacity onPress={() => router.push('/authenticated_tabs/profile')} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={ORANGE} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerTitleContainer}
          onPress={() => router.push(`/screens/user-profile?userId=${userId}`)}
        >
          <Text style={styles.headerTitle}>@{user?.username || 'user'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => {
          setSearchActive(true);
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }}>
          <Ionicons name="search-outline" size={26} color={ORANGE} />
        </TouchableOpacity>
      </View>

      {/* Search Overlay */}
      {searchActive && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={searchActive}
          onRequestClose={() => {
            setSearchActive(false);
            setSearchQuery('');
            Keyboard.dismiss();
          }}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={() => {
              setSearchActive(false);
              setSearchQuery('');
              Keyboard.dismiss();
            }}
          >
            <TouchableOpacity 
              style={styles.modalContent}
              activeOpacity={1}
              onPress={() => {}}
            >
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Search Users</Text>
              <View style={[styles.searchBarRow, { marginHorizontal: 20, marginBottom: 20 }]}>
                <TextInput
                  ref={searchInputRef}
                  style={[styles.searchInput, { 
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: '#222'
                  }]}
                  placeholder="Search users"
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity 
                    style={{ marginLeft: 12 }}
                    onPress={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView style={styles.modalScrollView}>
                {searchQuery.trim() ? (
                  filteredUsers.length > 0 ? (
                    filteredUsers.map((user: any) => (
                      <TouchableOpacity 
                        key={user.id}
                        style={styles.modalItem}
                        onPress={() => {
                          setSearchActive(false);
                          setSearchQuery('');
                          Keyboard.dismiss();
                          router.push(`/screens/user-profile?userId=${user.id}`);
                        }}
                      >
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="person" size={20} color="#fff" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>@{user.username}</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{user.name}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 40 }}>
                      No users found
                    </Text>
                  )
                ) : (
                  <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 40 }}>
                    Start typing to search for users...
                  </Text>
                )}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

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
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  modalContent: {
    backgroundColor: '#fb7a20',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%', // Make modal taller
    position: 'absolute',
    left: 0,
    right: 0,
    top: '15%', // Start higher up
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    paddingTop: 12,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalScrollView: {
    paddingHorizontal: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  modalItemText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 16,
  },
}); 