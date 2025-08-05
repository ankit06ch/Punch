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
import { doc, getDoc, addDoc, collection, serverTimestamp, onSnapshot, query, where, orderBy } from 'firebase/firestore';
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

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]);

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
        });
      }
      setChatInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
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
        >
          {messages.map((msg, idx) => {
            const isOutgoing = msg.fromUserId === auth.currentUser?.uid;
            const isPuncho = msg.fromUserId === 'puncho_bot';
            return (
              <View
                key={msg.id || idx}
                style={[
                  styles.messageBubble,
                  isOutgoing ? styles.outgoingMessage : null,
                  isPuncho ? styles.punchoMessage : null,
                ]}
              >
                <Text style={[styles.messageText, isOutgoing || isPuncho ? { color: '#fff' } : null]}>
                  {msg.message}
                </Text>
                <Text style={[styles.messageTime, isOutgoing || isPuncho ? { color: 'rgba(255,255,255,0.7)' } : null]}>
                  {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
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
    alignSelf: 'flex-end',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 40,
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