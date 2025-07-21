import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ScrollView, FlatList } from 'react-native';
import { Ionicons, Feather, AntDesign } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import styles from '../styles/profileStyles';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import discoverStyles from '../styles/discoverStyles';

export default function Profile() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [tab, setTab] = useState<'visited' | 'liked'>('visited');
  const [likedRestaurants, setLikedRestaurants] = useState<any[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
      fetchAllRestaurants();
    }, [])
  );

  useEffect(() => {
    if (userData && userData.likedRestaurants) {
      const liked = allRestaurants.filter(r => userData.likedRestaurants.includes(r.id));
      setLikedRestaurants(liked);
    }
  }, [userData, allRestaurants]);

  const fetchUserData = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setUserData(docSnap.data());
    }
  };

  const fetchAllRestaurants = async () => {
    const querySnapshot = await getDocs(collection(db, 'restaurants'));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAllRestaurants(data);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('../unauthenticated_tabs/splash');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!userData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> <Text style={{ color: 'white' }}>Loading profile...</Text> </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Feather name="menu" size={24} color="orange" />
        </TouchableOpacity>
      </View>

      {/* Profile Picture + Username + Stats */}
      <View style={styles.profileSection}>
        <Image source={{ uri: userData.profilePictureUrl || 'https://placehold.co/100x100' }} style={styles.avatar} />
        <Text style={styles.username}>@{userData.username || 'unknown'}</Text>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userData.followingCount ?? 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userData.followersCount ?? 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userData.storesVisitedCount ?? 0}</Text>
            <Text style={styles.statLabel}>Stores</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.bioButton}>
          <Text style={styles.bioButtonText}>{userData.bio || 'Add Bio'}</Text>
        </TouchableOpacity>
      </View>

      {/* Toggle Tabs */}
      <View style={local.tabToggleRow}>
        <TouchableOpacity onPress={() => setTab('visited')} style={[local.tabButton, tab === 'visited' && local.tabButtonActive]}>
          <Text style={[local.tabButtonText, tab === 'visited' && local.tabButtonTextActive]}>Visited Stores</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('liked')} style={[local.tabButton, tab === 'liked' && local.tabButtonActive]}>
          <Text style={[local.tabButtonText, tab === 'liked' && local.tabButtonTextActive]}>Liked Restaurants</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {tab === 'visited' ? (
        <ScrollView style={styles.storesContainer}>
          <Text style={styles.sectionHeader}>Visited Stores</Text>
          {userData.storesVisitedHistory && userData.storesVisitedHistory.length > 0 ? (
            userData.storesVisitedHistory.map((store: string, idx: number) => (
              <Text key={idx} style={styles.storeItem}>⭐ {store}</Text>
            ))
          ) : (
            <Text style={styles.storeItem}>No stores visited yet.</Text>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={likedRestaurants}
          keyExtractor={item => item.id}
          contentContainerStyle={discoverStyles.verticalList}
          renderItem={({ item }) => (
            <View style={discoverStyles.restaurantCard}>
              <View style={discoverStyles.restaurantLogoWrap}>
                {item.logoUrl ? (
                  <Image source={{ uri: item.logoUrl }} style={discoverStyles.restaurantLogo} />
                ) : (
                  <Image source={require('../../assets/Punch_Logos/Punch_T/black_logo.png')} style={discoverStyles.restaurantLogo} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={discoverStyles.cardTitle}>{item.name}</Text>
                <View style={discoverStyles.badgeRow}>
                  <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>{item.distance}</Text></View>
                  <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>{item.hours}</Text></View>
                  <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>{item.price}</Text></View>
                  {item.cuisine && <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>{item.cuisine}</Text></View>}
                  {item.rating && <View style={discoverStyles.badge}><Text style={discoverStyles.badgeText}>★ {item.rating}</Text></View>}
                </View>
              </View>
              <AntDesign name={'heart'} size={24} color={'#fb7a20'} style={{ marginLeft: 12, alignSelf: 'flex-start', padding: 4 }} />
            </View>
          )}
        />
      )}

      {/* Modal for Settings */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Text style={styles.modalItem}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.modalItem}>Account Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.modalItem}>Reset Password</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.modalItem}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const local = StyleSheet.create({
  tabToggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#f7f7f7',
    marginHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: '#fb7a20',
  },
  tabButtonText: {
    color: '#fb7a20',
    fontWeight: '600',
    fontSize: 15,
  },
  tabButtonTextActive: {
    color: 'white',
  },
});