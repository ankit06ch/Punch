import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ScrollView, FlatList, Share, Animated, TextInput, Dimensions, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons, Feather, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, query, where, orderBy, onSnapshot, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { SafeAreaView } from 'react-native-safe-area-context';
import profileStyles from '../styles/profileStyles';
import { PanResponder } from 'react-native';

const ORANGE = '#fb7a20';

export default function Profile() {
  // All hooks at the top (already correct in your file)
  const [modalVisible, setModalVisible] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [userData, setUserData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showStoresVisited: true,
    showLikedRestaurants: true,
    showFollowers: true,
    showFollowing: true,
    showHistory: true, // Added showHistory
  });
  const [friends, setFriends] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasSeenPunchoIntro, setHasSeenPunchoIntro] = useState(false);
  const animationValue = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const [containerLayout, setContainerLayout] = useState({ width: screenWidth, height: screenHeight });
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [panY] = useState(new Animated.Value(0));
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          setSelectedConversation(null);
          panY.setValue(0);
        } else {
          Animated.spring(panY, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;
  const [selectedProfileTab, setSelectedProfileTab] = useState<'liked' | 'rewards'>('liked');
  // Add scale animation for profile zoom-out
  const profileScale = useRef(new Animated.Value(1)).current;

  // Animate scale when modalVisible changes
  useEffect(() => {
    if (modalVisible) {
      Animated.timing(profileScale, {
        toValue: 0.93,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(profileScale, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible]);

  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && isMounted) {
          const data = userDoc.data();
          setUserData(data);
          if (data.privacySettings) {
            setPrivacySettings(data.privacySettings);
          }
          setHasSeenPunchoIntro(data.hasSeenPunchoIntro || false);
          
          // Fetch friends (mutual following)
          if (data.followingUids && data.followerUids) {
            const mutualIds = data.followingUids.filter((id: string) => data.followerUids.includes(id));
            const friendsList: any[] = [];
            for (const id of mutualIds) {
              if (id === user.uid) continue;
              const friendDoc = await getDoc(doc(db, 'users', id));
              if (friendDoc.exists()) {
                friendsList.push({ id, ...friendDoc.data() });
              }
            }
            if (isMounted) setFriends(friendsList);
          } else {
            if (isMounted) setFriends([]);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchUserData();
    return () => { isMounted = false; };
  }, []);

  // Listen for notifications
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('toUserId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter((n: any) => !n.read).length);
    });

    return () => unsubscribe();
  }, []);

  // Create Puncho intro message for new users
  useEffect(() => {
    const createPunchoIntro = async () => {
      const user = auth.currentUser;
      if (!user || hasSeenPunchoIntro) return;

      try {
        // Check if Puncho intro already exists
        const existingIntro = notifications.find(n => n.type === 'puncho_intro');
        if (existingIntro) return;

        const introData = {
          type: 'puncho_intro',
          fromUserId: 'puncho_bot',
          toUserId: user.uid,
          timestamp: new Date(),
          read: false,
          message: "Hi! I'm Puncho, your Punch assistant! 👋 I'll notify you about follow requests and other important updates. Welcome to Punch! 🎉",
          senderName: 'Puncho',
          senderAvatar: '🤖'
        };

        await addDoc(collection(db, 'notifications'), introData);
        await updateDoc(doc(db, 'users', user.uid), {
          hasSeenPunchoIntro: true
        });
        setHasSeenPunchoIntro(true);
      } catch (error) {
        console.error('Error creating Puncho intro:', error);
      }
    };

    createPunchoIntro();
  }, [hasSeenPunchoIntro, notifications]);

  const handleFollowRequest = async (notificationId: string, action: 'approve' | 'deny') => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      const { fromUserId, toUserId } = notification;

      if (action === 'approve') {
        // Approve follow request
        await updateDoc(doc(db, 'users', toUserId), {
          followerUids: arrayUnion(fromUserId),
          followersCount: (userData.followersCount || 0) + 1,
          pendingFollowRequests: arrayRemove(fromUserId)
        });

        await updateDoc(doc(db, 'users', fromUserId), {
          followingUids: arrayUnion(toUserId),
          followingCount: (userData.followingCount || 0) + 1
        });

        // Send approval notification
        const approvalData = {
          type: 'follow_approved',
          fromUserId: toUserId,
          toUserId: fromUserId,
          timestamp: new Date(),
          read: false,
          message: `@${userData.username || 'user'} approved your follow request!`,
          senderName: 'Puncho',
          senderAvatar: '🤖'
        };
        await addDoc(collection(db, 'notifications'), approvalData);

        // Suggest follow back
        const followBackData = {
          type: 'follow_suggestion',
          fromUserId: 'puncho_bot',
          toUserId: toUserId,
          timestamp: new Date(),
          read: false,
          message: `@${notification.fromUsername || 'user'} is now following you! Consider following them back to stay connected.`,
          senderName: 'Puncho',
          senderAvatar: '🤖',
          suggestedUserId: fromUserId
        };
        await addDoc(collection(db, 'notifications'), followBackData);

      } else {
        // Deny follow request
        await updateDoc(doc(db, 'users', toUserId), {
          pendingFollowRequests: arrayRemove(fromUserId)
        });

        // Send denial notification
        const denialData = {
          type: 'follow_denied',
          fromUserId: toUserId,
          toUserId: fromUserId,
          timestamp: new Date(),
          read: false,
          message: `@${userData.username || 'user'} declined your follow request.`,
          senderName: 'Puncho',
          senderAvatar: '🤖'
        };
        await addDoc(collection(db, 'notifications'), denialData);
      }

      // Mark notification as read and update status
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        status: action === 'approve' ? 'approved' : 'denied'
      });

    } catch (error) {
      console.error('Error handling follow request:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const startChatWithFriend = (friendId: string) => {
    // This would open a chat screen
    Alert.alert('Chat', 'Chat functionality coming soon!');
  };

  const handleShare = async () => {
    try {
      // Use a more realistic deep link format
      const profileUrl = `punch://profile/${userData.username}`;
      const webUrl = `https://punchapp.com/profile/${userData.username}`;
      
      const result = await Share.share({
        title: `${userData.username}'s Punch Profile`,
        message: `Check out ${userData.username}'s profile on Punch!\nStores Visited: ${userData.storesVisitedCount || 0}\nFollowers: ${userData.followersCount || 0}\n\nView Profile: ${webUrl}`,
        url: webUrl
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const updatePrivacySetting = async (setting: string, value: any) => {
    if (!auth.currentUser) return;
    
    try {
      const newSettings = { ...privacySettings, [setting]: value };
      setPrivacySettings(newSettings);
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        privacySettings: newSettings
      });
      
              // Also update local userData to reflect changes
        setUserData((prev: any) => ({
          ...prev,
          privacySettings: newSettings
        }));
    } catch (error) {
      console.error('Error updating privacy settings:', error);
    }
  };

  // Search animation setup (same as discover page)
  const diagonal = Math.sqrt(containerLayout.width * containerLayout.width + containerLayout.height * containerLayout.height);
  const CIRCLE_SIZE = diagonal + Math.max(containerLayout.width, containerLayout.height);
  const startX = containerLayout.width - CIRCLE_SIZE / 2;
  const startY = 0 - CIRCLE_SIZE / 2;
  const endX = containerLayout.width / 2 - CIRCLE_SIZE / 2;
  const endY = containerLayout.height / 2 - CIRCLE_SIZE / 2;
  
  const circleTranslateX = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, endX],
  });
  const circleTranslateY = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, endY],
  });
  const circleScale = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 1],
  });

  const openSearch = () => {
    setSearchActive(true);
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  };

  const closeSearch = () => {
    Animated.timing(animationValue, {
      toValue: 0,
      duration: 900,
      useNativeDriver: true,
    }).start(() => {
      setSearchActive(false);
      setSearchQuery('');
      setSearchResults([]);
    });
  };

  // Search Firestore for users
  useEffect(() => {
    if (!searchActive || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    let isCancelled = false;
    const fetchSearchResults = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        const filtered = data.filter((user: any) =>
          user.username && user.username.toLowerCase().includes(searchQuery.trim().toLowerCase())
        );
        if (!isCancelled) {
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Error searching users:', error);
      }
    };
    
    const timeoutId = setTimeout(fetchSearchResults, 300); // Debounce search
    
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, searchActive]);

  const navigateToUserProfile = (userId: string) => {
    closeSearch();
    router.push(`/screens/user-profile?userId=${userId}`);
  };

  // Modal swipe-to-close logic
  const onGestureEvent = (event: any) => {
    if (event.nativeEvent.translationY > 100) {
      setModalVisible(false);
    }
  };

  // Group notifications and friends into conversations
  const getConversations = () => {
    // Puncho bot conversation
    const punchoMessages = notifications.filter(n => n.fromUserId === 'puncho_bot' || n.type.startsWith('follow_') || n.type === 'puncho_intro' || n.type === 'puncho_reply');
    const conversations = [];
    if (punchoMessages.length > 0) {
      const lastMsg = punchoMessages[0];
      conversations.push({
        id: 'puncho_bot',
        name: 'Puncho',
        avatar: '🤖',
        lastMessage: lastMsg.message,
        lastTime: lastMsg.timestamp ? new Date(lastMsg.timestamp.toDate ? lastMsg.timestamp.toDate() : lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        messages: punchoMessages,
        unread: punchoMessages.some(m => !m.read)
      });
    }
    // Friend conversations (future: real chat, for now just preview)
    friends.forEach(friend => {
      // Find last message in messages collection (future: real chat)
      // For now, just show a placeholder
      conversations.push({
        id: friend.id,
        name: friend.name,
        username: friend.username,
        avatar: null,
        lastMessage: 'Tap to start a conversation',
        lastTime: '',
        messages: [],
        unread: false
      });
    });
    return conversations;
  };

  // Render conversation preview
  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={profileStyles.conversationPreview}
      onPress={() => setSelectedConversation(item)}
      activeOpacity={0.85}
    >
      <View style={profileStyles.conversationAvatar}>
        {item.avatar ? <Text style={{ fontSize: 30 }}>{item.avatar}</Text> : <Ionicons name="person-circle" size={40} color="#bbb" />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text
            style={[
              profileStyles.conversationName,
              item.id === 'puncho_bot' ? { color: '#fb7a20' } : { color: '#222' },
            ]}
            numberOfLines={1}
          >
            {item.name || '@' + item.username}
          </Text>
          {item.lastTime ? (
            <Text style={profileStyles.conversationLastTime}>{item.lastTime}</Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
          <Text style={profileStyles.conversationLastMessage} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unread && <View style={profileStyles.unreadDotSmall} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Send message handler
  const sendMessage = async () => {
    if (!chatInput.trim() || !selectedConversation) return;
    setSending(true);
    const user = auth.currentUser;
    if (!user) return;
    try {
      if (selectedConversation.id === 'puncho_bot') {
        // Send as notification to self from Puncho
        await addDoc(collection(db, 'notifications'), {
          type: 'puncho_reply',
          fromUserId: user.uid,
          toUserId: user.uid,
          timestamp: new Date(),
          read: false,
          message: chatInput,
          senderName: userData.username || user.displayName || 'You',
          senderAvatar: null
        });
      } else {
        // Send to friend (store in messages collection)
        const chatId = [user.uid, selectedConversation.id].sort().join('_');
        await addDoc(collection(db, 'messages'), {
          chatId,
          fromUserId: user.uid,
          toUserId: selectedConversation.id,
          timestamp: new Date(),
          message: chatInput,
        });
      }
      setChatInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Render full chat view
  const renderChatView = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!selectedConversation}
      onRequestClose={() => {
        setSelectedConversation(null);
        setShowMessages(true); // Show conversation list again
      }}
    >
      <View style={[profileStyles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.25)' }]}> 
        <Animated.View
          style={[
            profileStyles.fullChatModal,
            { flex: 1, transform: [{ translateY: panY }] },
          ]}
          {...panResponder.panHandlers}
        >
          <SafeAreaView style={profileStyles.chatHeader} edges={['top']}>
            <TouchableOpacity onPress={() => {
              setSelectedConversation(null);
              setShowMessages(true);
            }} style={profileStyles.chatBackButton}>
              <Ionicons name="arrow-back" size={26} color={ORANGE} />
            </TouchableOpacity>
            <Text style={profileStyles.chatTitle}>{selectedConversation?.name || '@' + selectedConversation?.username}</Text>
          </SafeAreaView>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <ScrollView
              style={profileStyles.chatMessages}
              contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: 'flex-end' }}
              ref={ref => { if (ref) ref.scrollToEnd({ animated: true }); }}
            >
              {[...(selectedConversation?.messages || [])].reverse().map((msg: any, idx: number) => {
                const isOutgoing = msg.fromUserId === auth.currentUser?.uid;
                const isPuncho = msg.fromUserId === 'puncho_bot';
                return (
                  <View
                    key={msg.id || idx}
                    style={[
                      profileStyles.chatMessageBubble,
                      isOutgoing ? profileStyles.outgoingMessage : null,
                      isPuncho ? profileStyles.punchoMessage : null,
                    ]}
                  >
                    <Text style={[profileStyles.chatMessageText, isOutgoing || isPuncho ? { color: '#fff' } : null]}>{msg.message}</Text>
                    <Text style={[profileStyles.chatMessageTime, isOutgoing || isPuncho ? { color: 'rgba(255,255,255,0.7)' } : null]}>{new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                );
              }) || <Text style={{ color: '#888', marginTop: 40 }}>No messages yet.</Text>}
            </ScrollView>
            <View style={profileStyles.chatInputBar}>
              <TextInput
                style={profileStyles.chatInput}
                placeholder="Type a message..."
                value={chatInput}
                onChangeText={setChatInput}
                editable={!sending}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={profileStyles.sendButton}
                onPress={sendMessage}
                disabled={sending || !chatInput.trim()}
              >
                <Ionicons name="send" size={22} color={chatInput.trim() ? ORANGE : '#ccc'} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );

  // Move the loading check AFTER all hooks
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const renderNotification = ({ item }: { item: any }) => {
    if (item.type === 'follow_request') {
      return (
        <View style={profileStyles.notificationItem}>
          <View style={profileStyles.notificationHeader}>
            <Text style={profileStyles.notificationSender}>🤖 Puncho</Text>
            <Text style={profileStyles.notificationTime}>
              {new Date(item.timestamp.toDate()).toLocaleDateString()}
            </Text>
          </View>
          <Text style={profileStyles.notificationMessage}>{item.message}</Text>
          {item.status === 'pending' && (
            <View style={profileStyles.actionButtons}>
              <TouchableOpacity 
                style={[profileStyles.actionButton, profileStyles.approveButton]}
                onPress={() => handleFollowRequest(item.id, 'approve')}
              >
                <Text style={profileStyles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[profileStyles.actionButton, profileStyles.denyButton]}
                onPress={() => handleFollowRequest(item.id, 'deny')}
              >
                <Text style={profileStyles.actionButtonText}>Deny</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={profileStyles.notificationItem}>
        <View style={profileStyles.notificationHeader}>
          <Text style={profileStyles.notificationSender}>
            {item.senderAvatar} {item.senderName || 'Puncho'}
          </Text>
          <Text style={profileStyles.notificationTime}>
            {new Date(item.timestamp.toDate()).toLocaleDateString()}
          </Text>
        </View>
        <Text style={profileStyles.notificationMessage}>{item.message}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container} onLayout={e => setContainerLayout(e.nativeEvent.layout)}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Feather name="menu" size={24} color={ORANGE} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openSearch}>
            <Ionicons name="people-outline" size={26} color={ORANGE} />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-outline" size={26} color={ORANGE} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMessages(true)} style={profileStyles.messagesButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={26} color={ORANGE} />
            {unreadCount > 0 && (
              <View style={profileStyles.unreadDot}>
                <Text style={profileStyles.unreadCount}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile content with zoom-out animation */}
      <Animated.View style={[styles.profileContent, { transform: [{ scale: profileScale }] }]}> 
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person-circle" size={90} color="#bbb" />
          </View>
        </View>
        {/* Username at the top */}
        <Text style={styles.username}>@{userData.username || 'username'}</Text>
        <Text style={styles.name}>{userData.name || 'Your Name'}</Text>
        {/* Followers, Following, Stores Visited in order, all clickable */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem} onPress={() => router.push(`/screens/followers?userId=${userData.id || auth.currentUser?.uid}`)}>
            <Text style={styles.statNumber}>{userData.followersCount || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={() => router.push(`/screens/following?userId=${userData.id || auth.currentUser?.uid}`)}>
            <Text style={styles.statNumber}>{userData.followingCount || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{userData.storesVisitedCount || 0}</Text>
            <Text style={styles.statLabel}>Stores Visited</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Toggle for Liked Restaurants and Rewards History */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 8 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: selectedProfileTab === 'liked' ? ORANGE : '#fff6ee',
              borderRadius: 20,
              paddingVertical: 8,
              paddingHorizontal: 20,
              marginRight: 8,
              borderWidth: 1,
              borderColor: ORANGE,
            }}
            onPress={() => setSelectedProfileTab('liked')}
          >
            <Ionicons name="heart" size={18} color={selectedProfileTab === 'liked' ? '#fff' : ORANGE} style={{ marginRight: 6 }} />
            <Text style={{ color: selectedProfileTab === 'liked' ? '#fff' : ORANGE, fontWeight: 'bold' }}>Liked</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: selectedProfileTab === 'rewards' ? ORANGE : '#fff6ee',
              borderRadius: 20,
              paddingVertical: 8,
              paddingHorizontal: 20,
              marginLeft: 8,
              borderWidth: 1,
              borderColor: ORANGE,
            }}
            onPress={() => setSelectedProfileTab('rewards')}
          >
            <Ionicons name="gift" size={18} color={selectedProfileTab === 'rewards' ? '#fff' : ORANGE} style={{ marginRight: 6 }} />
            <Text style={{ color: selectedProfileTab === 'rewards' ? '#fff' : ORANGE, fontWeight: 'bold' }}>Rewards</Text>
          </TouchableOpacity>
        </View>

        {/* Liked Restaurants Section */}
        {selectedProfileTab === 'liked' && (
          <View style={{ width: '100%', marginTop: 8 }}>
            {userData.likedRestaurants && userData.likedRestaurants.length > 0 ? (
              userData.likedRestaurants.map((restaurant: any, idx: number) => (
                <View key={restaurant || idx} style={{ backgroundColor: '#fff6ee', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#fb7a20', flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="restaurant" size={22} color={ORANGE} style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 16, color: '#222', fontWeight: '600' }}>{restaurant}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: '#888', fontSize: 15, marginBottom: 12 }}>No liked restaurants yet.</Text>
            )}
          </View>
        )}

        {/* Rewards History Section */}
        {selectedProfileTab === 'rewards' && (
          <View style={{ width: '100%', marginTop: 8 }}>
            {userData.rewardsHistory && userData.rewardsHistory.length > 0 ? (
              userData.rewardsHistory.map((reward: any, idx: number) => (
                <View key={reward.id || idx} style={{ backgroundColor: '#f8f8f8', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="gift" size={22} color={ORANGE} style={{ marginRight: 12 }} />
                  <View>
                    <Text style={{ fontSize: 16, color: '#222', fontWeight: '600' }}>{reward.title || reward.reward || 'Reward'}</Text>
                    <Text style={{ fontSize: 14, color: '#888' }}>{reward.restaurant || ''} {reward.date ? `- ${new Date(reward.date).toLocaleDateString()}` : ''}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ color: '#888', fontSize: 15, marginBottom: 12 }}>No rewards history yet.</Text>
            )}
          </View>
        )}
      </Animated.View>

      {/* Orange Search Overlay with Spilling Animation */}
      {searchActive && (
        <>
          <Animated.View
            pointerEvents="auto"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              borderRadius: CIRCLE_SIZE / 2,
              backgroundColor: '#fb7a20',
              zIndex: 100,
              transform: [
                { translateX: circleTranslateX },
                { translateY: circleTranslateY },
                { scale: circleScale },
              ],
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: containerLayout.width,
              height: containerLayout.height,
              zIndex: 101,
              opacity: animationValue,
              justifyContent: 'flex-start',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 64, paddingHorizontal: 20, marginBottom: 16 }}>
              <TouchableOpacity onPress={closeSearch} style={{ marginRight: 16 }}>
                <AntDesign name="arrowleft" size={28} color="#fff" />
              </TouchableOpacity>
              <TextInput
                style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#222' }}
                placeholder="Search users..."
                placeholderTextColor="#fb7a20"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
            <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
              {searchQuery.trim() ? (
                searchResults.length > 0 ? (
                  searchResults.map((user: any) => (
                    <TouchableOpacity 
                      key={user.id} 
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        paddingVertical: 16, 
                        borderBottomWidth: 1, 
                        borderColor: 'rgba(255,255,255,0.15)' 
                      }}
                      onPress={() => navigateToUserProfile(user.id)}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Ionicons name="person" size={20} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>@{user.username}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{user.name}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 40 }}>
                    No users found.
                  </Text>
                )
              ) : (
                <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 40 }}>
                  Start typing to search for users...
                </Text>
              )}
            </View>
          </Animated.View>
        </>
      )}

      {/* Settings Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={profileStyles.modalBackdrop} 
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[profileStyles.settingsModalContent, { position: 'absolute', left: 0, right: 0, bottom: 0 }]}> 
            <View style={profileStyles.modalHandle} />
            <Text style={profileStyles.modalTitle}>{showPrivacySettings ? 'Privacy Settings' : 'Settings'}</Text>
            <ScrollView style={profileStyles.modalScrollView}>
              {!showPrivacySettings ? (
                <>
                  <TouchableOpacity style={profileStyles.modalItem}>
                    <Ionicons name="person-outline" size={24} color="#fff" />
                    <Text style={profileStyles.modalItemText}>Account</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={profileStyles.modalItem}
                    onPress={() => setShowPrivacySettings(true)}
                  >
                    <Ionicons name="shield-outline" size={24} color="#fff" />
                    <Text style={profileStyles.modalItemText}>Privacy Settings</Text>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={profileStyles.modalItem}>
                    <Ionicons name="settings-outline" size={24} color="#fff" />
                    <Text style={profileStyles.modalItemText}>Settings & Privacy</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={profileStyles.modalItem}
                    onPress={() => {
                      setModalVisible(false);
                      setShowHelp(true);
                    }}
                  >
                    <Ionicons name="help-circle-outline" size={24} color="#fff" />
                    <Text style={profileStyles.modalItemText}>Help & Support</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={profileStyles.modalItem}
                    onPress={() => {
                      setModalVisible(false);
                      setShowAbout(true);
                    }}
                  >
                    <Ionicons name="information-circle-outline" size={24} color="#fff" />
                    <Text style={profileStyles.modalItemText}>About</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={profileStyles.modalItem} onPress={async () => {
                    try {
                      await auth.signOut();
                      setModalVisible(false);
                      router.replace('/unauthenticated_tabs/login');
                    } catch (e) {
                      alert('Error signing out.');
                    }
                  }}>
                    <Ionicons name="log-out-outline" size={24} color="#fff" />
                    <Text style={profileStyles.modalItemText}>Sign Out</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={profileStyles.modalItem} onPress={() => setShowPrivacySettings(false)}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                    <Text style={profileStyles.modalItemText}>Back</Text>
                  </TouchableOpacity>
                  
                  <View style={profileStyles.privacySection}>
                    <Text style={profileStyles.privacySectionTitle}>Profile Visibility</Text>
                    <TouchableOpacity 
                      style={profileStyles.privacyOption}
                      onPress={() => updatePrivacySetting('profileVisibility', 'public')}
                    >
                      <Text style={profileStyles.privacyOptionText}>Public Profile</Text>
                      {privacySettings.profileVisibility === 'public' && (
                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={profileStyles.privacyOption}
                      onPress={() => updatePrivacySetting('profileVisibility', 'private')}
                    >
                      <Text style={profileStyles.privacyOptionText}>Private Profile</Text>
                      {privacySettings.profileVisibility === 'private' && (
                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                      )}
                    </TouchableOpacity>
                  </View>
                  
                  <View style={profileStyles.privacySection}>
                    <Text style={profileStyles.privacySectionTitle}>What Others Can See</Text>
                    <TouchableOpacity 
                      style={profileStyles.privacyOption}
                      onPress={() => updatePrivacySetting('showStoresVisited', !privacySettings.showStoresVisited)}
                    >
                      <Text style={profileStyles.privacyOptionText}>Stores Visited</Text>
                      <Ionicons 
                        name={privacySettings.showStoresVisited ? "eye" : "eye-off"} 
                        size={24} 
                        color={privacySettings.showStoresVisited ? "#fff" : "rgba(255,255,255,0.5)"} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={profileStyles.privacyOption}
                      onPress={() => updatePrivacySetting('showLikedRestaurants', !privacySettings.showLikedRestaurants)}
                    >
                      <Text style={profileStyles.privacyOptionText}>Liked Restaurants</Text>
                      <Ionicons 
                        name={privacySettings.showLikedRestaurants ? "eye" : "eye-off"} 
                        size={24} 
                        color={privacySettings.showLikedRestaurants ? "#fff" : "rgba(255,255,255,0.5)"} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={profileStyles.privacyOption}
                      onPress={() => updatePrivacySetting('showHistory', !privacySettings.showHistory)}
                    >
                      <Text style={profileStyles.privacyOptionText}>History</Text>
                      <Ionicons 
                        name={privacySettings.showHistory ? "eye" : "eye-off"} 
                        size={24} 
                        color={privacySettings.showHistory ? "#fff" : "rgba(255,255,255,0.5)"} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={profileStyles.privacyOption}
                      onPress={() => updatePrivacySetting('showFollowers', !privacySettings.showFollowers)}
                    >
                      <Text style={profileStyles.privacyOptionText}>Followers Count</Text>
                      <Ionicons 
                        name={privacySettings.showFollowers ? "eye" : "eye-off"} 
                        size={24} 
                        color={privacySettings.showFollowers ? "#fff" : "rgba(255,255,255,0.5)"} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={profileStyles.privacyOption}
                      onPress={() => updatePrivacySetting('showFollowing', !privacySettings.showFollowing)}
                    >
                      <Text style={profileStyles.privacyOptionText}>Following Count</Text>
                      <Ionicons 
                        name={privacySettings.showFollowing ? "eye" : "eye-off"} 
                        size={24} 
                        color={privacySettings.showFollowing ? "#fff" : "rgba(255,255,255,0.5)"} 
                      />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Messages Modal: Only show conversation list if showMessages is true and selectedConversation is null */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMessages && !selectedConversation}
        onRequestClose={() => setShowMessages(false)}
      >
        <TouchableOpacity 
          style={profileStyles.modalBackdrop} 
          activeOpacity={1}
          onPress={() => setShowMessages(false)}
        >
          <TouchableOpacity 
            style={profileStyles.messagesModalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={profileStyles.modalHandle} />
            <Text style={[profileStyles.modalTitle, { color: '#fb7a20' }]}>Messages</Text>
            <TouchableOpacity style={profileStyles.newChatButton} onPress={() => {/* TODO: open new chat UI */}}>
              <Ionicons name="add-circle-outline" size={22} color="#fb7a20" style={{ marginRight: 6 }} />
              <Text style={profileStyles.newChatButtonText}>Start New Chat</Text>
            </TouchableOpacity>
            <View style={[profileStyles.messagesContent, {paddingHorizontal: 0}]}> 
              <FlatList
                data={getConversations()}
                keyExtractor={item => item.id}
                renderItem={renderConversation}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16 }}
                ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No conversations yet. Messages from Puncho and friends will appear here.</Text>}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Chat Modal: Only show when selectedConversation is not null */}
      {selectedConversation && renderChatView()}

      {/* About Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAbout}
        onRequestClose={() => setShowAbout(false)}
      >
        <TouchableOpacity 
          style={profileStyles.modalBackdrop} 
          activeOpacity={1}
          onPress={() => setShowAbout(false)}
        >
          <View style={profileStyles.aboutModalContent}>
            <View style={profileStyles.modalHandle} />
            <Text style={profileStyles.modalTitle}>About Punch</Text>
            <ScrollView style={profileStyles.aboutContent}>
              <Text style={profileStyles.aboutText}>
                Punch is a social dining app that helps you discover and share your favorite restaurants with friends.
              </Text>
              <Text style={profileStyles.aboutText}>
                Version: 1.0.0{'\n'}
                Build: 2024.1.0
              </Text>
              <Text style={profileStyles.aboutText}>
                Features:{'\n'}
                • Discover new restaurants{'\n'}
                • Track your dining history{'\n'}
                • Connect with friends{'\n'}
                • Share your experiences{'\n'}
                • Privacy controls
              </Text>
              <Text style={profileStyles.aboutText}>
                Made with ❤️ for food lovers everywhere.
              </Text>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showHelp}
        onRequestClose={() => setShowHelp(false)}
      >
        <TouchableOpacity 
          style={profileStyles.modalBackdrop} 
          activeOpacity={1}
          onPress={() => setShowHelp(false)}
        >
          <View style={profileStyles.helpModalContent}>
            <View style={profileStyles.modalHandle} />
            <Text style={profileStyles.modalTitle}>Help & Support</Text>
            <ScrollView style={profileStyles.helpContent}>
              <Text style={profileStyles.helpSectionTitle}>Frequently Asked Questions</Text>
              
              <Text style={profileStyles.helpQuestion}>How do I add a restaurant?</Text>
              <Text style={profileStyles.helpAnswer}>Use the Discover tab to find restaurants and tap the heart to add them to your favorites.</Text>
              
              <Text style={profileStyles.helpQuestion}>How do I follow someone?</Text>
              <Text style={profileStyles.helpAnswer}>Search for users in the Profile tab and tap "Follow" on their profile.</Text>
              
                             <Text style={profileStyles.helpQuestion}>How do I change my privacy settings?</Text>
               <Text style={profileStyles.helpAnswer}>Go to Settings {'>'} Privacy Settings to control what others can see about your profile.</Text>
              
              <Text style={profileStyles.helpQuestion}>How do I share my profile?</Text>
              <Text style={profileStyles.helpAnswer}>Tap the share button in the top right of your profile to share your profile link.</Text>
              
              <Text style={profileStyles.helpSectionTitle}>Contact Support</Text>
              <Text style={profileStyles.helpText}>
                Need more help? Contact us at:{'\n'}
                support@punchapp.com{'\n'}
                We'll get back to you within 24 hours.
              </Text>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  profileContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: ORANGE,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  editButton: {
    backgroundColor: ORANGE,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: ORANGE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
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
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalItemText: {
    fontSize: 18,
    color: '#fff',
    marginLeft: 16,
  },
  messagesModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  messagesContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  messagesEmptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    marginTop: 16,
    marginBottom: 8,
  },
  messagesSubText: {
    fontSize: 16,
    color: '#666',
  },
  privacySection: {
    marginBottom: 24,
  },
  privacySectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  privacyOptionText: {
    fontSize: 16,
    color: '#fff',
  },
  aboutModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  aboutContent: {
    paddingHorizontal: 20,
  },
  aboutText: {
    fontSize: 16,
    color: '#222',
    lineHeight: 24,
    marginBottom: 16,
  },
  helpModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  helpContent: {
    paddingHorizontal: 20,
  },
  helpSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 16,
    marginBottom: 12,
  },
  helpQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginTop: 16,
    marginBottom: 4,
  },
  helpAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  messagesButton: {
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: ORANGE,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationSender: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  denyButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  friendsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 24,
    marginBottom: 12,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 8,
  },
  conversationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  conversationLastMessage: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  unreadDotSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ORANGE,
    marginLeft: 8,
  },
  fullChatModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 0,
    backgroundColor: '#fff',
    minHeight: 56,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 12,
  },
  chatMessages: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  chatMessageBubble: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  chatMessageText: {
    fontSize: 15,
    color: '#222',
  },
  chatMessageTime: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
    textAlign: 'right',
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  chatInput: {
    flex: 1,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    color: '#222',
  },
  sendButton: {
    padding: 8,
  },
  conversationLastTime: {
    fontSize: 12,
    color: '#bbb',
    marginLeft: 4,
  },
  punchoMessage: {
    backgroundColor: '#f0f0f0', // A light gray background for Puncho messages
    borderLeftWidth: 4,
    borderLeftColor: ORANGE,
    paddingLeft: 10,
  },
  chatBackButton: {
    padding: 8,
  },
  outgoingMessage: {
    backgroundColor: ORANGE,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    alignSelf: 'flex-end',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ORANGE,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});