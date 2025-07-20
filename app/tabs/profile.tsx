import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ScrollView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import styles from '../styles/profileStyles';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export default function Profile() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/splash');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!userData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'white' }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/tabs/find-friends')}>
          <Feather name="user-plus" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Feather name="menu" size={24} color="white" />
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

      {/* Past Stores */}
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