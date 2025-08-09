import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ScrollView, FlatList, Share, Animated, TextInput, Dimensions, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl, Keyboard } from 'react-native';
import { Ionicons, Feather, AntDesign } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, query, where, orderBy, onSnapshot, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { SafeAreaView } from 'react-native-safe-area-context';
import profileStyles from '../styles/profileStyles';
import { PanResponder } from 'react-native';
import RestaurantModal from '../../components/RestaurantModal';
import * as Haptics from 'expo-haptics';
import { pickProfilePicture, uploadProfilePicture, deleteProfilePicture } from '../../utils/profilePictureUtils';
import {
  useFonts,
  Figtree_300Light,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  Figtree_900Black,
} from '@expo-google-fonts/figtree';

const ORANGE = '#fb7a20';

export default function Profile() {
  // Load Figtree fonts
  const [fontsLoaded] = useFonts({
    Figtree_300Light,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
    Figtree_900Black,
  });

  const { showMessages: showMessagesParam, openSearch: openSearchParam, searchSource } = useLocalSearchParams();
  
  // All hooks at the top (already correct in your file)
  const [modalVisible, setModalVisible] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [userData, setUserData] = useState<any>({});
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
  const [unreadMessages, setUnreadMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [allUserMessages, setAllUserMessages] = useState<any[]>([]);
  const [showNewChatSearch, setShowNewChatSearch] = useState(false);
  const [newChatQuery, setNewChatQuery] = useState('');
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [newUserResults, setNewUserResults] = useState<any[]>([]);

  // Search for new users (exclude current conversations and self)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!showNewChatSearch) return;
      const term = newChatQuery.trim().toLowerCase();
      if (term.length < 2) { setNewUserResults([]); return; }
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '>=', term), where('username', '<=', term + '\uf8ff'));
        const snapshot = await getDocs(q);
        if (cancelled) return;
        const existingIds = new Set(getConversations().map((c: any) => c.id));
        const results = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => u.id !== auth.currentUser?.uid && !existingIds.has(u.id));
        setNewUserResults(results);
      } catch (e) {
        console.error('New chat search error:', e);
        if (!cancelled) setNewUserResults([]);
      }
    };
    const t = setTimeout(run, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [showNewChatSearch, newChatQuery]);
  
  // Lift the messages preview modal when the keyboard opens during searches
  useEffect(() => {
    const onShow = (e: any) => {
      if (!(showNewChatSearch || showMessageSearch)) return;
      const targetShift = -Math.round((containerLayout?.height || screenHeight) * 0.3);
      Animated.timing(messagesKeyboardShift, {
        toValue: targetShift,
        duration: Platform.OS === 'ios' ? 220 : 0,
        useNativeDriver: true,
      }).start();
    };
    const onHide = () => {
      Animated.timing(messagesKeyboardShift, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? 200 : 0,
        useNativeDriver: true,
      }).start();
    };
    const subShow = Platform.select({
      ios: Keyboard.addListener('keyboardWillShow', onShow),
      default: Keyboard.addListener('keyboardDidShow', onShow),
    });
    const subHide = Platform.select({
      ios: Keyboard.addListener('keyboardWillHide', onHide),
      default: Keyboard.addListener('keyboardDidHide', onHide),
    });
    return () => {
      // @ts-ignore
      subShow?.remove?.();
      // @ts-ignore
      subHide?.remove?.();
    };
  }, [showNewChatSearch, showMessageSearch]);
  const [hasSeenPunchoIntro, setHasSeenPunchoIntro] = useState(false);
  const animationValue = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const [containerLayout, setContainerLayout] = useState({ width: screenWidth, height: screenHeight });

  const [panY] = useState(new Animated.Value(0));
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          panY.setValue(0);
        } else {
          Animated.spring(panY, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;
  const [selectedProfileTab, setSelectedProfileTab] = useState<'liked' | 'rewards'>('liked');
  const [likedRestaurantsWithNames, setLikedRestaurantsWithNames] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [restaurantModalVisible, setRestaurantModalVisible] = useState(false);
  const [liked, setLiked] = useState<string[]>([]);
  // Add scale animation for profile zoom-out
  const profileScale = useRef(new Animated.Value(1)).current;
  
  // Drag-to-dismiss animations
  const menuModalTranslateY = useRef(new Animated.Value(0)).current;
  const messagesModalTranslateY = useRef(new Animated.Value(0)).current;
  const messagesKeyboardShift = useRef(new Animated.Value(0)).current;
  
  // Edit Profile state
  const [editProfileData, setEditProfileData] = useState({
    name: '',
    bio: '',
    email: '',
    phone: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);

  // PanResponder for hamburger menu modal
  const menuModalPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        menuModalTranslateY.setOffset(0);
        menuModalTranslateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          menuModalTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        menuModalTranslateY.flattenOffset();
        if (gestureState.dy > 100) {
          // Dismiss modal
          Animated.timing(menuModalTranslateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setModalVisible(false);
            menuModalTranslateY.setValue(0);
          });
        } else {
          // Snap back
          Animated.spring(menuModalTranslateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // PanResponder for messages modal
  const messagesModalPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        messagesModalTranslateY.setOffset(0);
        messagesModalTranslateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          messagesModalTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        messagesModalTranslateY.flattenOffset();
        if (gestureState.dy > 100) {
          // Dismiss modal
          Animated.timing(messagesModalTranslateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowMessages(false);
            messagesModalTranslateY.setValue(0);
          });
        } else {
          // Snap back
          Animated.spring(messagesModalTranslateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Handle showMessages parameter from navigation
  useEffect(() => {
    if (showMessagesParam === 'true') {
      setShowMessages(true);
    }
  }, [showMessagesParam]);

  useEffect(() => {
    if (openSearchParam === 'true') {
      openSearch();
    }
  }, [openSearchParam]);

  // Animate scale when modalVisible or showMessages changes
  useEffect(() => {
    if (modalVisible || showMessages) {
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
  }, [modalVisible, showMessages]);

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
          
          // Fetch restaurant names for liked restaurants
          if (isMounted) {
            await fetchLikedRestaurantsWithNames(data.likedRestaurants || []);
          }
          
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

      }
    };
    fetchUserData();
    
    // Set up real-time listener for user data changes
    const user = auth.currentUser;
    if (user) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (doc) => {
        if (doc.exists() && isMounted) {
          const data = doc.data();
          setUserData(data);
          if (data.privacySettings) {
            setPrivacySettings(data.privacySettings);
          }
          setHasSeenPunchoIntro(data.hasSeenPunchoIntro || false);
          
          // Update liked restaurants when they change
          if (isMounted) {
            await fetchLikedRestaurantsWithNames(data.likedRestaurants || []);
          }
        }
      });
      
      return () => { 
        isMounted = false; 
        unsubscribe();
      };
    }
    
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
      const notificationsList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as any));
      setNotifications(notificationsList);
    }, (error) => {
      console.error('Error listening to notifications:', error);
    });

    return () => unsubscribe();
  }, []);

  // Listen for unread messages
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('toUserId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const unreadMessagesList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as any));
      setUnreadMessages(unreadMessagesList);
    }, (error) => {
      console.error('Error listening to unread messages:', error);
    });

    return () => unsubscribe();
  }, []);

  // Listen for all messages involving current user (both directions) to derive last message previews
  useEffect(() => {
    const current = auth.currentUser;
    if (!current) return;
    const messagesRef = collection(db, 'messages');
    const qFrom = query(messagesRef, where('fromUserId', '==', current.uid));
    const qTo = query(messagesRef, where('toUserId', '==', current.uid));
    const unsubFrom = onSnapshot(qFrom, (snap) => {
      const fromMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllUserMessages(prev => {
        const others = prev.filter(m => m.fromUserId !== current.uid);
        return [...others, ...fromMsgs].sort((a: any, b: any) => (b.timestamp?.toDate?.() || 0) - (a.timestamp?.toDate?.() || 0));
      });
    });
    const unsubTo = onSnapshot(qTo, (snap) => {
      const toMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllUserMessages(prev => {
        const others = prev.filter(m => m.toUserId !== current.uid);
        return [...others, ...toMsgs].sort((a: any, b: any) => (b.timestamp?.toDate?.() || 0) - (a.timestamp?.toDate?.() || 0));
      });
    });
    return () => { unsubFrom(); unsubTo(); };
  }, []);

  // Calculate total unread count (notifications + messages)
  useEffect(() => {
    const unreadNotifications = notifications.filter((n: any) => 
      (n.read === false || n.read === undefined) && 
      n.fromUserId !== auth.currentUser?.uid // Don't count own messages
    ).length;
    const unreadMessagesCount = unreadMessages.filter((msg: any) => 
      msg.fromUserId !== auth.currentUser?.uid // Don't count own messages
    ).length;
    
    const totalUnread = unreadNotifications + unreadMessagesCount;
    setUnreadCount(totalUnread);
    
    // Debug logging
    console.log('Unread count update:', {
      unreadNotifications,
      unreadMessagesCount,
      totalUnread,
      notificationsCount: notifications.length,
      messagesCount: unreadMessages.length
    });
  }, [notifications, unreadMessages]);

  // Function to fetch restaurant names for liked restaurants
  const fetchLikedRestaurantsWithNames = async (likedRestaurantIds: string[]) => {
    if (likedRestaurantIds.length === 0) {
      setLikedRestaurantsWithNames([]);
      setLiked([]);
      return;
    }
    
    const restaurantsWithNames = [];
    for (const restaurantId of likedRestaurantIds) {
      try {
        const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId));
        if (restaurantDoc.exists()) {
          const restaurantData = restaurantDoc.data();
          restaurantsWithNames.push({
            id: restaurantId,
            name: restaurantData.name || restaurantData.businessName || 'Unknown Restaurant',
            cuisine: restaurantData.cuisine,
            location: restaurantData.location,
            description: restaurantData.description,
            rating: restaurantData.rating,
            priceRange: restaurantData.priceRange,
            hours: restaurantData.hours,
            phone: restaurantData.phone,
            website: restaurantData.website,
            images: restaurantData.images,
            menu: restaurantData.menu,
            // Include all other fields that might be in the restaurant document
            ...restaurantData
          });
        }
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        restaurantsWithNames.push({
          id: restaurantId,
          name: 'Unknown Restaurant'
        });
      }
    }
    setLikedRestaurantsWithNames(restaurantsWithNames);
    setLiked(likedRestaurantIds);
  };

  // Expose a reusable fetch function for refreshers and other effects
  const fetchUserData = async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as any;
        setUserData(data);
        if (data.privacySettings) {
          setPrivacySettings(data.privacySettings);
        }
        setHasSeenPunchoIntro(data.hasSeenPunchoIntro || false);
        await fetchLikedRestaurantsWithNames(data.likedRestaurants || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleRestaurantPress = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setRestaurantModalVisible(true);
  };

  const handleModalClose = () => {
    setRestaurantModalVisible(false);
    setSelectedRestaurant(null);
  };

  const toggleLike = async (restaurantId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const currentLiked = userDoc.data()?.likedRestaurants || [];
        const isLiked = currentLiked.includes(restaurantId);
        
        if (isLiked) {
          await updateDoc(userRef, {
            likedRestaurants: arrayRemove(restaurantId)
          });
          setLiked(currentLiked.filter((id: string) => id !== restaurantId));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          await updateDoc(userRef, {
            likedRestaurants: arrayUnion(restaurantId)
          });
          setLiked([...currentLiked, restaurantId]);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Refresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchUserData();
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Create Puncho intro message for new users
  useEffect(() => {
    const createPunchoIntro = async () => {
      const user = auth.currentUser;
      if (!user || hasSeenPunchoIntro) return;

      try {
        // Check if Puncho intro already exists in the database
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('toUserId', '==', user.uid),
          where('type', '==', 'puncho_intro')
        );
        const existingIntroSnapshot = await getDocs(notificationsQuery);
        
        if (!existingIntroSnapshot.empty) {
          // Intro already exists, mark user as having seen it
          await updateDoc(doc(db, 'users', user.uid), {
            hasSeenPunchoIntro: true
          });
          setHasSeenPunchoIntro(true);
          return;
        }

        const introData = {
          type: 'puncho_intro',
          fromUserId: 'puncho_bot',
          toUserId: user.uid,
          timestamp: serverTimestamp(),
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
  }, [hasSeenPunchoIntro]);

  // Handle follow request acceptance notifications
  useEffect(() => {
    const handleFollowRequestAccepted = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Check for follow request acceptance notifications
      const acceptanceNotifications = notifications.filter(n => 
        n.type === 'follow_request_accepted' && 
        n.toUserId === user.uid &&
        !n.read
      );

      for (const notification of acceptanceNotifications) {
        // Mark as read
        await updateDoc(doc(db, 'notifications', notification.id), { read: true });
        
        // Refresh user data to update follower counts
        await fetchUserData();
      }
    };

    handleFollowRequestAccepted();
  }, [notifications]);

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
      // Universal link for profile deep linking
      const webUrl = `https://punchrewards.app/screens/user-profile?userId=${userData.id || auth.currentUser?.uid}`;
      
      const result = await Share.share({
        title: `${userData.username}'s Punch Profile`,
        message: `Check out ${userData.username}'s profile on Punch!\n\nView Profile: ${webUrl}`
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
      
      // Navigate back to source page if search was accessed from followers/following
      if (searchSource === 'followers') {
        router.push('/screens/followers');
      } else if (searchSource === 'following') {
        router.push('/screens/following');
      }
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
        const filtered = data.filter((user: any) => {
          const searchTerm = searchQuery.trim().toLowerCase();
          const username = user.username?.toLowerCase() || '';
          const name = user.name?.toLowerCase() || '';
          
          return username.includes(searchTerm) || name.includes(searchTerm);
        });
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
    router.push(`/screens/user-profile?userId=${userId}`);
  };

  const onGestureEvent = (event: any) => {
    // Handle gesture events if needed
  };

  // Profile Picture Functions
  const handleProfilePictureChange = async () => {
    try {
      setUploadingProfilePicture(true);
      const result = await pickProfilePicture();
      if (result) {
        const user = auth.currentUser;
        if (!user) return;

        // Delete previous storage object if it exists
        try {
          if (userData?.profilePictureUrl) {
            await deleteProfilePicture(user.uid);
          }
        } catch (e) {
          // Non-fatal: continue to upload
          console.warn('Previous profile picture delete skipped:', e);
        }

        const profilePictureUrl = await uploadProfilePicture(user.uid, result.uri);
        if (profilePictureUrl) {
          await updateDoc(doc(db, 'users', user.uid), {
            profilePictureUrl: profilePictureUrl
          });
          
          // Update local state
          setUserData((prev: any) => ({
            ...prev,
            profilePictureUrl: profilePictureUrl
          }));
          
          Alert.alert('Success', 'Profile picture updated successfully!');
        } else {
          Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setUploadingProfilePicture(false);
    }
  };

  // Edit Profile Functions
  const openEditProfile = () => {
    setEditProfileData({
      name: userData.name || '',
      bio: userData.bio || '',
      email: userData.email || '',
      phone: userData.phone || ''
    });
    setShowEditProfile(true);
    setModalVisible(false);
  };

  const saveProfileChanges = async () => {
    setSavingProfile(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: editProfileData.name,
        bio: editProfileData.bio,
        phone: editProfileData.phone
      });

      // Update local state
      setUserData((prev: any) => ({
        ...prev,
        name: editProfileData.name,
        bio: editProfileData.bio,
        phone: editProfileData.phone
      }));

      setShowEditProfile(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Group notifications and friends into conversations
  const getConversations = () => {
    // Puncho bot conversation
    const punchoMessages = notifications.filter(n => 
      n.fromUserId === 'puncho_bot' || 
      n.type.startsWith('follow_') || 
      n.type === 'puncho_intro' || 
      n.type === 'puncho_reply'
    );
    const conversations = [];
    if (punchoMessages.length > 0) {
      const lastMsg = punchoMessages[0];
      const unreadPunchoMessages = punchoMessages.filter(m => 
        (m.read === false || m.read === undefined) && 
        m.fromUserId !== auth.currentUser?.uid
      );
      
      conversations.push({
        id: 'puncho_bot',
        name: 'Puncho',
        avatar: '🤖',
        lastMessage: lastMsg.message,
        lastTime: lastMsg.timestamp ? new Date(lastMsg.timestamp.toDate ? lastMsg.timestamp.toDate() : lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        messages: punchoMessages,
        unread: unreadPunchoMessages.length > 0
      });
    }
    // Friend conversations
    friends.forEach(friend => {
      const current = auth.currentUser;
      const chatId = [current?.uid, friend.id].sort().join('_');
      const convMessages = allUserMessages
        .filter((m: any) => m.chatId === chatId)
        .sort((a: any, b: any) => (b.timestamp?.toDate?.() || 0) - (a.timestamp?.toDate?.() || 0));
      const lastMsg = convMessages[0];
      const hasUnreadMessages = unreadMessages.some(msg => msg.fromUserId === friend.id);

      conversations.push({
        id: friend.id,
        name: friend.name,
        username: friend.username,
        avatar: null,
        lastMessage: lastMsg ? lastMsg.message : 'Tap to start a conversation',
        lastTime: lastMsg ? new Date(lastMsg.timestamp?.toDate ? lastMsg.timestamp.toDate() : lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        messages: convMessages,
        unread: hasUnreadMessages
      });
    });
    return conversations;
  };

  // Render conversation preview
  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={profileStyles.conversationPreview}
      onPress={() => openChat(item)}
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



  // Navigate to chat screen
  const openChat = (conversation: any) => {
    setShowMessages(false);
    // Mark messages as read when opening chat
    if (conversation.unread && conversation.messages.length > 0) {
      markConversationAsRead(conversation);
    }
    router.push(`/screens/chat?conversationId=${conversation.id}&name=${encodeURIComponent(conversation.name || conversation.username)}`);
  };

  // Mark all messages in a conversation as read
  const markConversationAsRead = async (conversation: any) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !conversation.messages.length) return;

      const batch = writeBatch(db);
      let hasUpdates = false;

      conversation.messages.forEach((msg: any) => {
        // Only mark messages as read if they're unread and not from the current user
        if ((msg.read === false || msg.read === undefined) && msg.fromUserId !== currentUser.uid) {
          if (conversation.id === 'puncho_bot') {
            // For Puncho messages, update in notifications collection
            const notificationRef = doc(db, 'notifications', msg.id);
            batch.update(notificationRef, { read: true });
            hasUpdates = true;
          } else {
            // For regular messages, update in messages collection
            const messageRef = doc(db, 'messages', msg.id);
            batch.update(messageRef, { read: true });
            hasUpdates = true;
          }
        }
      });

      if (hasUpdates) {
        await batch.commit();
        console.log('Marked conversation as read:', conversation.id);
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };



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

  // Calculate actual following count (excluding pending requests)
  const actualFollowingCount = useMemo(() => {
    const followingUids: string[] = userData?.followingUids || [];
    const pending: string[] = userData?.pendingFollowRequests || [];
    if (!followingUids.length) return 0;
    // Exclude pending requests if your schema stores outgoing requests on the current user
    const accepted = pending.length
      ? followingUids.filter((uid: string) => !pending.includes(uid))
      : followingUids;
    return accepted.length;
  }, [userData?.followingUids, userData?.pendingFollowRequests]);

  // Calculate followers based on followerUids to avoid stale numeric counters
  const actualFollowersCount = useMemo(() => {
    const followerUids: string[] = userData?.followerUids || [];
    return followerUids.length;
  }, [userData?.followerUids]);

  // Don't render until fonts are loaded
  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={e => setContainerLayout(e.nativeEvent.layout)}>
      {/* Circle Background */}
      <View style={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#fb7a20',
        opacity: 0.1,
        zIndex: -1,
      }} />
      <View style={{
        position: 'absolute',
        top: 150,
        left: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#fb7a20',
        opacity: 0.08,
        zIndex: -1,
      }} />
      <View style={{
        position: 'absolute',
        top: 300,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fb7a20',
        opacity: 0.06,
        zIndex: -1,
      }} />
      
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
        <View style={{ width: '100%', alignItems: 'center' }}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity 
              style={styles.avatarCircle} 
              onPress={handleProfilePictureChange}
              disabled={uploadingProfilePicture}
            >
              {userData.profilePictureUrl ? (
                <Image 
                  source={{ uri: userData.profilePictureUrl }} 
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons name="person-circle" size={90} color="#bbb" />
              )}
              {uploadingProfilePicture && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={handleProfilePictureChange}
              disabled={uploadingProfilePicture}
            >
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          {/* Username at the top */}
          <Text style={styles.username}>@{userData.username || 'username'}</Text>
          <Text style={styles.bio}>{userData.bio || 'No bio yet'}</Text>
          
          {/* Followers, Following, Stores Visited in order, all clickable */}
          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statItem} onPress={() => router.push(`/screens/followers?userId=${userData.id || auth.currentUser?.uid}`)}>
              <Text style={styles.statNumber}>{actualFollowersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            
            {/* Separator line */}
            <View style={styles.statSeparator} />
            
            <TouchableOpacity style={styles.statItem} onPress={() => router.push(`/screens/following?userId=${userData.id || auth.currentUser?.uid}`)}>
              <Text style={styles.statNumber}>{actualFollowingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            
            {/* Separator line */}
            <View style={styles.statSeparator} />
            
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{userData.storesVisitedCount || 0}</Text>
              <Text style={styles.statLabel}>Stores Visited</Text>
            </TouchableOpacity>
          </View>

        {/* Toggle for Liked Restaurants and Rewards History */}
        <View style={{ width: '100%', marginTop: 8, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 24,
                marginRight: 32,
                borderBottomWidth: selectedProfileTab === 'liked' ? 2 : 0,
                borderBottomColor: ORANGE,
              }}
              onPress={() => setSelectedProfileTab('liked')}
            >
              <Ionicons name="heart" size={18} color={selectedProfileTab === 'liked' ? ORANGE : '#999'} style={{ marginRight: 6 }} />
              <Text style={{ 
                color: selectedProfileTab === 'liked' ? ORANGE : '#999', 
                fontWeight: selectedProfileTab === 'liked' ? 'bold' : 'normal',
                fontSize: 16
              }}>Liked</Text>
            </TouchableOpacity>
            
            {/* Separator */}
            <View style={{ 
              width: 1, 
              height: 24, 
              backgroundColor: '#E0E0E0', 
              marginHorizontal: 8,
              alignSelf: 'center'
            }} />
            
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 24,
                marginLeft: 32,
                borderBottomWidth: selectedProfileTab === 'rewards' ? 2 : 0,
                borderBottomColor: ORANGE,
              }}
              onPress={() => setSelectedProfileTab('rewards')}
            >
              <Ionicons name="gift" size={18} color={selectedProfileTab === 'rewards' ? ORANGE : '#999'} style={{ marginRight: 6 }} />
              <Text style={{ 
                color: selectedProfileTab === 'rewards' ? ORANGE : '#999', 
                fontWeight: selectedProfileTab === 'rewards' ? 'bold' : 'normal',
                fontSize: 16
              }}>Rewards</Text>
            </TouchableOpacity>
          </View>
          
          {/* Bottom separator line */}
          <View style={{ 
            height: 1, 
            backgroundColor: '#E0E0E0', 
            marginHorizontal: 20 
          }} />
        </View>
        </View>
        {/* Scrollable section only for Liked/Rewards */}
        <ScrollView 
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={{ paddingBottom: 120, alignItems: 'center' }}
          showsVerticalScrollIndicator={false}
        >
        {/* Liked Restaurants Section */}
        {selectedProfileTab === 'liked' && (
          <View style={{ width: '100%', marginTop: 8 }}>
            {likedRestaurantsWithNames.length > 0 ? (
              likedRestaurantsWithNames.map((restaurant: any, idx: number) => (
                <TouchableOpacity 
                  key={restaurant.id || idx} 
                  style={profileStyles.likedRestaurantCard}
                  onPress={() => handleRestaurantPress(restaurant)}
                >
                  <View style={profileStyles.likedRestaurantContent}>
                    <View style={profileStyles.likedRestaurantIcon}>
                      {restaurant.logoUrl ? (
                        <Image
                          source={{ uri: restaurant.logoUrl }}
                          style={profileStyles.likedRestaurantLogo}
                        />
                      ) : (
                        <AntDesign name="star" size={20} color="#FF6B6B" />
                      )}
                    </View>
                    <View style={profileStyles.likedRestaurantInfo}>
                      <Text style={profileStyles.likedRestaurantName}>{restaurant.name}</Text>
                      {restaurant.cuisine && (
                        <Text style={profileStyles.likedRestaurantCuisine}>{restaurant.cuisine}</Text>
                      )}
                      {restaurant.location && (
                        <Text style={profileStyles.likedRestaurantLocation}>{restaurant.location}</Text>
                      )}
                    </View>
                    <View style={profileStyles.likedRestaurantButton}>
                      <AntDesign name="right" size={16} color="#2C3E50" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={profileStyles.emptyState}>
                <AntDesign name="hearto" size={48} color="#BDC3C7" style={profileStyles.emptyIcon} />
                <Text style={profileStyles.emptyText}>No liked restaurants yet</Text>
                <Text style={profileStyles.emptySubtext}>Start exploring and like your favorite places</Text>
              </View>
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
        </ScrollView>
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
                placeholder="Search by username or name..."
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
          <Animated.View
            style={[
              profileStyles.settingsModalContent,
              { position: 'absolute', left: 0, right: 0, bottom: 0, transform: [{ translateY: menuModalTranslateY }] },
            ]}
            {...menuModalPanResponder.panHandlers}
          >
            <View style={profileStyles.modalHandle} />
            <Text style={profileStyles.modalTitle}>{showPrivacySettings ? 'Privacy Settings' : 'Settings'}</Text>
            <ScrollView style={profileStyles.modalScrollView}>
              {!showPrivacySettings ? (
                <>
                  <TouchableOpacity 
                    style={profileStyles.modalItem}
                    onPress={openEditProfile}
                  >
                    <Ionicons name="create-outline" size={24} color="#fff" />
                    <Text style={profileStyles.modalItemText}>Edit Profile</Text>
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
                  
                  <TouchableOpacity style={profileStyles.modalItem} onPress={() => {
                    console.log('Signing out...');
                    setModalVisible(false);
                    
                    // Sign out and handle navigation
                    auth.signOut()
                      .then(() => {
                        console.log('Sign out successful');
                        // Force navigation to splash screen
                        router.replace('/unauthenticated_tabs/splash');
                      })
                      .catch((e) => {
                        console.error('Sign out error:', e);
                        alert('Error signing out.');
                      });
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
          </Animated.View>
        </TouchableOpacity>
      </Modal>

              {/* Messages Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showMessages}
        onRequestClose={() => setShowMessages(false)}
      >
        <TouchableOpacity 
          style={profileStyles.modalBackdrop} 
          activeOpacity={1}
          onPress={() => setShowMessages(false)}
        >
          <Animated.View
            style={[
              profileStyles.messagesModalContent,
              { transform: [{ translateY: Animated.add(messagesModalTranslateY, messagesKeyboardShift) }] },
            ]}
          >
            <View {...messagesModalPanResponder.panHandlers}>
              <View style={profileStyles.messagesModalHandle} />
            </View>
            <Text style={[profileStyles.modalTitle, { color: '#fb7a20' }]}>Messages</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 }}>
              {!(showNewChatSearch || showMessageSearch) ? (
                <>
                  <TouchableOpacity 
                    style={profileStyles.newChatButton} 
                    onPress={() => { setShowNewChatSearch(true); setShowMessageSearch(false); setMessageSearchQuery(''); }}
                  >
                    <Ionicons name={'add-circle-outline'} size={22} color="#fb7a20" style={{ marginRight: 6 }} />
                    <Text style={profileStyles.newChatButtonText}>Start New Chat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setShowMessageSearch(true); setShowNewChatSearch(false); setNewChatQuery(''); }} style={{ padding: 8, marginLeft: 'auto' }}>
                    <Ionicons name={'search'} size={22} color="#fb7a20" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff6ee', borderRadius: 12, borderWidth: 1, borderColor: '#fb7a20', paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 }}>
                  <Ionicons name="search" size={18} color="#fb7a20" />
                  <TextInput
                    style={{ flex: 1, marginLeft: 8, color: '#222' }}
                    placeholder={showNewChatSearch ? 'Search new users by username' : 'Search messages'}
                    placeholderTextColor="#fb7a20"
                    value={showNewChatSearch ? newChatQuery : messageSearchQuery}
                    onChangeText={(text) => (showNewChatSearch ? setNewChatQuery(text) : setMessageSearchQuery(text))}
                    autoFocus
                  />
                  {(showNewChatSearch ? newChatQuery.length > 0 : messageSearchQuery.length > 0) && (
                    <TouchableOpacity onPress={() => (showNewChatSearch ? setNewChatQuery('') : setMessageSearchQuery(''))}>
                      <Ionicons name="close-circle" size={18} color="#fb7a20" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => { 
                      setShowNewChatSearch(false); 
                      setShowMessageSearch(false); 
                      setNewChatQuery(''); 
                      setMessageSearchQuery(''); 
                      Keyboard.dismiss();
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    <Ionicons name="close" size={18} color="#fb7a20" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {showNewChatSearch && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                {/* New users search results (exclude existing conversations and self) */}
                <FlatList
                  data={newUserResults}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
                      onPress={() => {
                        setShowNewChatSearch(false);
                        setNewChatQuery('');
                        openChat({ id: item.id, name: item.name, username: item.username, messages: [], unread: false });
                      }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff6ee', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 2, borderColor: '#fb7a20' }}>
                        <Text style={{ fontSize: 20 }}>🤖</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#222', fontWeight: '600' }}>{item.name || '@' + item.username}</Text>
                        {item.username && <Text style={{ color: '#999', fontSize: 12 }}>@{item.username}</Text>}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#bbb" />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={newChatQuery ? (
                    <Text style={{ color: '#888', textAlign: 'center', marginTop: 8 }}>No users found</Text>
                  ) : null}
                  style={{ maxHeight: 280, marginTop: 8 }}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                />
                {/* Search within messages for quick jump */}
                {showMessageSearch && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: '#999', fontSize: 12, marginTop: 6, marginBottom: 6 }}>Messages matching “{messageSearchQuery.trim()}”</Text>
                    <FlatList
                      data={getConversations()
                        .flatMap(c => (c.messages || []).map((m: any) => ({ conv: c, msg: m })))
                        .filter(({ msg }) => String(msg.message || '').toLowerCase().includes(messageSearchQuery.trim().toLowerCase()))
                        .slice(0, 10)
                      }
                      keyExtractor={({ msg }) => msg.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={{ paddingVertical: 8 }}
                          onPress={() => {
                            setShowNewChatSearch(false);
                            setNewChatQuery('');
                            setShowMessageSearch(false);
                            setMessageSearchQuery('');
                            // Navigate to chat and focus the message
                            router.push(`/screens/chat?conversationId=${item.conv.id}&name=${encodeURIComponent(item.conv.name || '')}&focusMessageId=${encodeURIComponent(item.msg.id)}`);
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff6ee', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 2, borderColor: '#fb7a20' }}>
                              <Text style={{ fontSize: 20 }}>🤖</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: '#fb7a20', fontWeight: '700' }} numberOfLines={1}>{item.conv.name || 'Conversation'}</Text>
                              <Text style={{ color: '#222' }} numberOfLines={1}>{item.msg.message}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      )}
                      ListEmptyComponent={null}
                      showsVerticalScrollIndicator={false}
                      style={{ maxHeight: 280 }}
                      keyboardShouldPersistTaps="handled"
                    />
                  </View>
                )}
              </View>
            )}
            <View style={[profileStyles.messagesContent, {paddingHorizontal: 0}]}> 
              <FlatList
                data={
                  (showMessageSearch && messageSearchQuery.trim().length > 0)
                    ? getConversations().filter((c: any) => {
                        const term = messageSearchQuery.trim().toLowerCase();
                        const nameMatch = (c.name || '').toLowerCase().includes(term);
                        const tagMatch = ('@' + (c.username || '')).toLowerCase().includes(term);
                        const messageMatch = (c.messages || []).some((m: any) => String(m.message || '').toLowerCase().includes(term));
                        return nameMatch || tagMatch || messageMatch;
                      })
                    : getConversations()
                }
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={profileStyles.conversationPreview}
                    onPress={() => openChat(item)}
                    activeOpacity={0.85}
                  >
                    <View style={profileStyles.conversationAvatar}>
                      <Ionicons name="person-circle" size={40} color="#bbb" />
                      {!!(item as any).username && (
                        <Text style={{ position: 'absolute', bottom: -14, fontSize: 11, color: '#B0B0B0' }}>@{(item as any).username}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text
                          style={[profileStyles.conversationName, item.id === 'puncho_bot' ? { color: '#fb7a20' } : { color: '#222' }]}
                          numberOfLines={1}
                        >
                          {item.name || '@' + ((item as any).username || '')}
                        </Text>
                        {item.lastTime ? (
                          <Text style={profileStyles.conversationLastTime}>{item.lastTime}</Text>
                        ) : null}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Text style={profileStyles.conversationLastMessage} numberOfLines={2}>{String(item.lastMessage || '')}</Text>
                        {item.unread && <View style={profileStyles.unreadDotSmall} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 120 }}
                ListFooterComponent={<View style={{ height: 32 }} />}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No conversations yet. Messages from Puncho and friends will appear here.</Text>}
              />
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      

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

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEditProfile}
        onRequestClose={() => setShowEditProfile(false)}
      >
        <TouchableOpacity 
          style={profileStyles.modalBackdrop} 
          activeOpacity={1}
          onPress={() => setShowEditProfile(false)}
        >
          <View style={profileStyles.editProfileModalContent}>
            <View style={profileStyles.modalHandle} />
            <Text style={profileStyles.modalTitle}>Edit Profile</Text>
            <ScrollView style={profileStyles.editProfileContent}>
              <View style={profileStyles.editProfileSection}>
                <Text style={profileStyles.editProfileLabel}>Name</Text>
                <TextInput
                  style={profileStyles.editProfileInput}
                  value={editProfileData.name}
                  onChangeText={(text) => setEditProfileData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={profileStyles.editProfileSection}>
                <Text style={profileStyles.editProfileLabel}>Bio</Text>
                <TextInput
                  style={[profileStyles.editProfileInput, { height: 80, textAlignVertical: 'top' }]}
                  value={editProfileData.bio}
                  onChangeText={(text) => setEditProfileData(prev => ({ ...prev, bio: text }))}
                  placeholder="Tell us about yourself"
                  placeholderTextColor="#999"
                  multiline
                />
              </View>

              <View style={profileStyles.editProfileSection}>
                <Text style={profileStyles.editProfileLabel}>Phone Number</Text>
                <TextInput
                  style={profileStyles.editProfileInput}
                  value={editProfileData.phone}
                  onChangeText={(text) => setEditProfileData(prev => ({ ...prev, phone: text }))}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={profileStyles.editProfileSection}>
                <Text style={profileStyles.editProfileLabel}>Email</Text>
                <TextInput
                  style={[profileStyles.editProfileInput, { color: '#999' }]}
                  value={editProfileData.email}
                  editable={false}
                  placeholder="Email (cannot be changed)"
                  placeholderTextColor="#999"
                />
                <Text style={profileStyles.editProfileNote}>Email cannot be changed for security reasons</Text>
              </View>

              <View style={profileStyles.editProfileButtons}>
                <TouchableOpacity 
                  style={[profileStyles.editProfileButton, profileStyles.cancelButton]}
                  onPress={() => setShowEditProfile(false)}
                >
                  <Text style={profileStyles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[profileStyles.editProfileButton, profileStyles.saveButton]}
                  onPress={saveProfileChanges}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={profileStyles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Restaurant Modal */}
      <RestaurantModal
        restaurant={selectedRestaurant}
        visible={restaurantModalVisible}
        onClose={handleModalClose}
        likedRestaurants={liked}
        onLikeUpdate={toggleLike}
      />
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: ORANGE,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: ORANGE,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bio: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statSeparator: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});