import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const ORANGE = '#fb7a20';
const COLORS = {
  primary: '#2C3E50',
  secondary: '#7F8C8D',
  accent: '#E74C3C',
  background: '#FFFFFF',
  card: '#F8F9FA',
  text: {
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    light: '#BDC3C7',
  }
};

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followRequestSent, setFollowRequestSent] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [privacySettings, setPrivacySettings] = useState<any>({});
  const [followButtonLoading, setFollowButtonLoading] = useState(false);
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

        // Check if follow request was already sent
        if (currentUser && data.pendingFollowRequests?.includes(currentUser.uid)) {
          setFollowRequestSent(true);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [userId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser) return;
    
    setFollowButtonLoading(true);
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
        setFollowRequestSent(false);
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
      
      // Refresh user data
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
        if (currentUser && data.pendingFollowRequests?.includes(currentUser.uid)) {
          setFollowRequestSent(true);
        } else {
          setFollowRequestSent(false);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    } finally {
      setFollowButtonLoading(false);
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
        timestamp: serverTimestamp(),
        read: false,
        status: 'pending', // pending, approved, denied
        message: `${requesterName} wants to be friends`,
        requesterName: requesterName,
      };

      // Add to notifications collection
      await addDoc(collection(db, 'notifications'), notificationData);
      
      // Add to user's pending requests
      await updateDoc(doc(db, 'users', toUserId), {
        pendingFollowRequests: arrayUnion(fromUserId)
      });

      setFollowRequestSent(true);
    } catch (error) {
      console.error('Error sending follow request:', error);
      Alert.alert('Error', 'Failed to send follow request. Please try again.');
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

  const getFollowButtonText = () => {
    if (followButtonLoading) return 'Loading...';
    if (isFollowing) return 'Following';
    if (followRequestSent) return 'Follow request sent!';
    return 'Follow';
  };

  const getFollowButtonStyle = () => {
    if (followButtonLoading) return styles.loadingButton;
    if (isFollowing) return styles.followingButton;
    if (followRequestSent) return styles.requestSentButton;
    return styles.followButton;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ORANGE} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={64} color={COLORS.text.light} />
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const profileAccessible = canViewProfile();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={['rgba(251, 122, 32, 0.1)', 'rgba(251, 122, 32, 0.05)']}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            {user.profilePictureUrl ? (
              <Image source={{ uri: user.profilePictureUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={ORANGE} />
              </View>
            )}
            {user.privacySettings?.profileVisibility === 'private' && (
              <View style={styles.privateBadge}>
                <Ionicons name="lock-closed" size={12} color="#fff" />
              </View>
            )}
          </View>
          
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.name}>{user.name}</Text>
          {user.bio ? (
            <Text style={styles.bio}>{user.bio}</Text>
          ) : (
            <Text style={styles.noBio}>No bio yet</Text>
          )}
        </LinearGradient>

        {!profileAccessible ? (
          <View style={styles.privateProfileContainer}>
            <BlurView intensity={20} style={styles.privateCard}>
              <Ionicons name="lock-closed" size={48} color={COLORS.text.light} />
              <Text style={styles.privateProfileText}>This profile is private</Text>
              <Text style={styles.privateProfileSubtext}>
                Follow this user to see their profile
              </Text>
              {currentUser && currentUser.uid !== userId && (
                <TouchableOpacity 
                  style={getFollowButtonStyle()} 
                  onPress={handleFollow}
                  disabled={followButtonLoading}
                >
                  <Text style={styles.followButtonText}>{getFollowButtonText()}</Text>
                </TouchableOpacity>
              )}
            </BlurView>
          </View>
        ) : (
          <>
            {/* Stats Section */}
            <View style={styles.statsContainer}>
              {getDisplayStats().map((stat, index) => (
                <TouchableOpacity 
                  key={stat.label}
                  style={styles.statItem}
                  onPress={stat.onPress}
                >
                  <Text style={styles.statNumber}>{stat.count}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Follow Button */}
            {currentUser && currentUser.uid !== userId && (
              <View style={styles.followButtonContainer}>
                <TouchableOpacity 
                  style={getFollowButtonStyle()} 
                  onPress={handleFollow}
                  disabled={followButtonLoading}
                >
                  {followButtonLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.followButtonText}>{getFollowButtonText()}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Additional Profile Content */}
            <View style={styles.profileContent}>
              <Text style={styles.sectionTitle}>Profile Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.text.secondary} />
                  <Text style={styles.infoText}>Joined {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'Recently'}</Text>
                </View>
                {user.location && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={20} color={COLORS.text.secondary} />
                    <Text style={styles.infoText}>{user.location}</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  container: {
    flex: 1,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderColor: '#eee', 
    backgroundColor: COLORS.background 
  },
  backButton: { 
    marginRight: 8 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: COLORS.primary, 
    flex: 1, 
    textAlign: 'center' 
  },
  headerSpacer: {
    width: 36,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: COLORS.text.secondary,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: { 
    width: 100, 
    height: 100, 
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.background,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.background,
  },
  privateBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.text.secondary,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  username: { 
    color: ORANGE, 
    fontWeight: 'bold', 
    fontSize: 20, 
    marginBottom: 4 
  },
  name: { 
    color: COLORS.text.primary, 
    fontSize: 18, 
    fontWeight: '600',
    marginBottom: 8 
  },
  bio: { 
    color: COLORS.text.secondary, 
    fontSize: 15, 
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: '80%',
  },
  noBio: {
    color: COLORS.text.light,
    fontSize: 15,
    fontStyle: 'italic',
  },
  statsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: { 
    color: COLORS.primary, 
    fontWeight: 'bold', 
    fontSize: 20, 
    textAlign: 'center' 
  },
  statLabel: { 
    color: COLORS.text.secondary, 
    fontSize: 12, 
    textAlign: 'center', 
    marginTop: 4 
  },
  followButtonContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  followButton: { 
    backgroundColor: ORANGE, 
    borderRadius: 24, 
    paddingVertical: 14, 
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: ORANGE,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  followingButton: { 
    backgroundColor: COLORS.background, 
    borderRadius: 24, 
    paddingVertical: 14, 
    paddingHorizontal: 40,
    borderWidth: 2,
    borderColor: ORANGE,
    alignItems: 'center',
  },
  requestSentButton: {
    backgroundColor: COLORS.text.light,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  loadingButton: {
    backgroundColor: COLORS.text.light,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  followButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  privateProfileContainer: {
    padding: 16,
    marginTop: 16,
  },
  privateCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  privateProfileText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  privateProfileSubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  profileContent: {
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
}); 