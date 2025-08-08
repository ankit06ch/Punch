import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase/config';
import { doc, getDoc, addDoc, collection, serverTimestamp, onSnapshot, query, where, orderBy, updateDoc, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
import { StyleSheet } from 'react-native';

const ORANGE = '#fb7a20';

export default function ChatScreen() {
  const router = useRouter();
  const { conversationId, name } = useLocalSearchParams();
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (messages.length > 0 && !hasMarkedAsRead) {
      markMessagesAsRead();
    }
  }, [messages, hasMarkedAsRead]);

  // Mark messages as read when they come into view
  const handleMessageView = (message: any) => {
    if (message && (message.read === false || message.read === undefined) && message.toUserId === auth.currentUser?.uid) {
      markSingleMessageAsRead(message);
    }
  };

  const markSingleMessageAsRead = async (message: any) => {
    try {
      if (conversationId === 'puncho_bot') {
        // For Puncho messages, update in notifications collection
        await updateDoc(doc(db, 'notifications', message.id), { read: true });
      } else {
        // For regular messages, update in messages collection
        await updateDoc(doc(db, 'messages', message.id), { read: true });
      }
    } catch (error) {
      console.error('Error marking single message as read:', error);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const unreadMessages = messages.filter(msg => 
        (msg.read === false || msg.read === undefined) && 
        msg.toUserId === currentUser.uid && 
        msg.fromUserId !== currentUser.uid
      );

      if (unreadMessages.length === 0) return;

      const batch = writeBatch(db);

      unreadMessages.forEach(msg => {
        if (conversationId === 'puncho_bot') {
          // For Puncho messages, update in notifications collection
          const notificationRef = doc(db, 'notifications', msg.id);
          batch.update(notificationRef, { read: true });
        } else {
          // For regular messages, update in messages collection
          const messageRef = doc(db, 'messages', msg.id);
          batch.update(messageRef, { read: true });
        }
      });

      await batch.commit();
      setHasMarkedAsRead(true);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const fetchConversation = async () => {
    try {
      if (conversationId === 'puncho_bot') {
        // For Puncho, fetch messages from notifications collection
        const notificationsRef = collection(db, 'notifications');
        
        // Fetch messages FROM Puncho TO user
        const fromPunchoQuery = query(
          notificationsRef,
          where('toUserId', '==', auth.currentUser?.uid),
          where('fromUserId', '==', 'puncho_bot')
        );
        
        // Fetch messages FROM user TO Puncho (puncho_reply type)
        const toPunchoQuery = query(
          notificationsRef,
          where('fromUserId', '==', auth.currentUser?.uid),
          where('toUserId', '==', auth.currentUser?.uid),
          where('type', '==', 'puncho_reply')
        );
        
        // Listen to both queries
        const unsubscribeFromPuncho = onSnapshot(fromPunchoQuery, (snapshot) => {
          const fromPunchoMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Get the other query results
          const unsubscribeToPuncho = onSnapshot(toPunchoQuery, (snapshot2) => {
            const toPunchoMessages = snapshot2.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Combine and sort all messages
            const allMessages = [...fromPunchoMessages, ...toPunchoMessages];
            setMessages(allMessages.sort((a, b) => a.timestamp?.toDate() - b.timestamp?.toDate()));
          });
          
          return unsubscribeToPuncho;
        });
        
        return unsubscribeFromPuncho;
      } else {
        // For other conversations, fetch from messages collection
        const messagesRef = collection(db, 'messages');
        const chatId = [auth.currentUser?.uid, conversationId].sort().join('_');
        
        // Fetch messages where user is sender or receiver
        const q = query(
          messagesRef,
          where('chatId', '==', chatId)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const messageList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMessages(messageList.sort((a, b) => a.timestamp?.toDate() - b.timestamp?.toDate()));
        });
        
        return unsubscribe;
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !conversationId) return;
    
    setSending(true);
    try {
      if (conversationId === 'puncho_bot') {
        // Send as notification to self from Puncho
        await addDoc(collection(db, 'notifications'), {
          type: 'puncho_reply',
          fromUserId: auth.currentUser?.uid,
          toUserId: auth.currentUser?.uid,
          timestamp: serverTimestamp(),
          read: false,
          message: chatInput.trim(),
          senderName: 'You',
          senderAvatar: null
        });
      } else {
        // Send to friend (store in messages collection)
        const chatId = [auth.currentUser?.uid, conversationId].sort().join('_');
        await addDoc(collection(db, 'messages'), {
          chatId,
          fromUserId: auth.currentUser?.uid,
          toUserId: conversationId,
          timestamp: serverTimestamp(),
          message: chatInput.trim(),
          read: false, // Messages start as unread
        });
      }
      setChatInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFollowRequestResponse = async (notificationId: string, response: 'accept' | 'deny') => {
    try {
      // Get the notification to find the requester
      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationSnap = await getDoc(notificationRef);
      
      if (!notificationSnap.exists()) return;
      
      const notificationData = notificationSnap.data();
      const requesterId = notificationData.fromUserId;
      const currentUserId = auth.currentUser?.uid;
      
      if (!currentUserId || !requesterId) return;

      // Update notification status
      await updateDoc(notificationRef, {
        status: response,
        read: true
      });

      if (response === 'accept') {
        // Add each user to the other's following/followers lists
        await updateDoc(doc(db, 'users', currentUserId), {
          followingUids: arrayUnion(requesterId),
          followingCount: (await getDoc(doc(db, 'users', currentUserId))).data()?.followingCount + 1 || 1,
        });
        
        await updateDoc(doc(db, 'users', requesterId), {
          followerUids: arrayUnion(currentUserId),
          followersCount: (await getDoc(doc(db, 'users', requesterId))).data()?.followersCount + 1 || 1,
        });

        // Remove from pending requests
        await updateDoc(doc(db, 'users', currentUserId), {
          pendingFollowRequests: arrayRemove(requesterId)
        });

        // Send acceptance message to requester
        await addDoc(collection(db, 'notifications'), {
          type: 'follow_request_accepted',
          fromUserId: 'puncho_bot',
          toUserId: requesterId,
          timestamp: serverTimestamp(),
          read: false,
          message: `${(await getDoc(doc(db, 'users', currentUserId))).data()?.name || 'Someone'} has accepted your request!`,
          acceptedBy: currentUserId,
        });
      } else {
        // Remove from pending requests
        await updateDoc(doc(db, 'users', currentUserId), {
          pendingFollowRequests: arrayRemove(requesterId)
        });
      }

    } catch (error) {
      console.error('Error handling follow request response:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ORANGE} />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/authenticated_tabs/profile?showMessages=true')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={ORANGE} />
        </TouchableOpacity>
        <Text style={styles.title}>{name || 'Chat'}</Text>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            // Mark messages as read when user scrolls to view them
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
            
            if (isNearBottom) {
              messages.forEach(msg => {
                if ((msg.read === false || msg.read === undefined) && msg.toUserId === auth.currentUser?.uid) {
                  handleMessageView(msg);
                }
              });
            }
          }}
          scrollEventThrottle={16}
        >
          {messages.map((msg, idx) => {
            const isOutgoing = msg.fromUserId === auth.currentUser?.uid;
            const isPuncho = msg.fromUserId === 'puncho_bot';
            const isFollowRequest = msg.type === 'follow_request' && msg.status === 'pending';
            
            return (
              <View
                key={msg.id || idx}
                style={[
                  styles.messageBubble,
                  isOutgoing ? styles.outgoingMessage : null,
                  isPuncho ? styles.punchoMessage : null,
                  isFollowRequest ? styles.followRequestMessage : null,
                ]}
              >
                <Text style={[styles.messageText, isOutgoing || isPuncho ? { color: '#fff' } : null]}>
                  {msg.message}
                </Text>
                
                {/* Follow Request Buttons */}
                {isFollowRequest && (
                  <View style={styles.followRequestButtons}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleFollowRequestResponse(msg.id, 'accept')}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.denyButton}
                      onPress={() => handleFollowRequestResponse(msg.id, 'deny')}
                    >
                      <Text style={styles.denyButtonText}>Deny</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                <View style={styles.messageFooter}>
                  <Text style={[styles.messageTime, isOutgoing || isPuncho ? { color: 'rgba(255,255,255,0.7)' } : null]}>
                    {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                  {isOutgoing && (
                    <Ionicons 
                      name={msg.read ? "checkmark-done" : "checkmark"} 
                      size={16} 
                      color={msg.read ? (isOutgoing ? 'rgba(255,255,255,0.9)' : '#4CAF50') : 'rgba(255,255,255,0.5)'} 
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
              </View>
            );
          })}
          {messages.length === 0 && (
            <Text style={styles.emptyText}>No messages yet.</Text>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#666"
            value={chatInput}
            onChangeText={setChatInput}
            editable={!sending}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={sending || !chatInput.trim()}
          >
            <Ionicons name="send" size={22} color={chatInput.trim() ? ORANGE : '#ccc'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    maxWidth: '80%',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  outgoingMessage: {
    backgroundColor: ORANGE,
    alignSelf: 'flex-end',
  },
  punchoMessage: {
    backgroundColor: '#ffa366',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    color: '#222',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 40,
  },
  followRequestMessage: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  followRequestButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    flex: 1,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  denyButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    flex: 1,
    alignItems: 'center',
  },
  denyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
    color: '#222',
  },
  sendButton: {
    padding: 8,
  },
}); 