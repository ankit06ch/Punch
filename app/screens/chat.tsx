import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  findNodeHandle,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase/config';
import { doc, getDoc, addDoc, collection, serverTimestamp, onSnapshot, query, where, orderBy, updateDoc, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
import { StyleSheet } from 'react-native';

const ORANGE = '#fb7a20';

export default function ChatScreen() {
  const router = useRouter();
  const { conversationId, name, focusMessageId } = useLocalSearchParams();
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const contentRef = useRef<View | null>(null);
  const messageRefs = useRef<Record<string, View | null>>({});
  const [peerName, setPeerName] = useState<string | null>(null);
  const [peerUsername, setPeerUsername] = useState<string | null>(null);

  useEffect(() => {
    const loadPeer = async () => {
      try {
        if (conversationId && conversationId !== 'puncho_bot') {
          const userDoc = await getDoc(doc(db, 'users', String(conversationId)));
          if (userDoc.exists()) {
            const d: any = userDoc.data();
            setPeerName(d.name || null);
            setPeerUsername(d.username || null);
          }
        } else {
          setPeerName('Puncho');
          setPeerUsername(null);
        }
      } catch (e) {
        // ignore
      }
    };
    loadPeer();
  }, [conversationId]);

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

  // Scroll to a focused message if provided via params
  useEffect(() => {
    if (!focusMessageId) return;
    // Allow layout to settle
    const timeout = setTimeout(() => {
      const target = messageRefs.current[String(focusMessageId)];
      const contentNode = contentRef.current ? findNodeHandle(contentRef.current) : null;
      if (target && contentNode && scrollRef.current) {
        // @ts-ignore measureLayout exists on native components
        target.measureLayout(contentNode, (_x: number, y: number) => {
          scrollRef.current?.scrollTo({ y: Math.max(y - 80, 0), animated: true });
        }, () => {});
      }
    }, 150);
    return () => clearTimeout(timeout);
  }, [messages, focusMessageId]);

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
            const allMessages: any[] = [...fromPunchoMessages as any, ...toPunchoMessages as any] as any;
            setMessages(allMessages.sort((a: any, b: any) => a.timestamp?.toDate() - b.timestamp?.toDate()));
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
          setMessages((messageList as any).sort((a: any, b: any) => a.timestamp?.toDate() - b.timestamp?.toDate()));
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
          message: chatInput.trim(),
          timestamp: serverTimestamp(),
          read: false,
        });
      } else {
        const messagesRef = collection(db, 'messages');
        const chatId = [auth.currentUser?.uid, conversationId].sort().join('_');
        await addDoc(messagesRef, {
          chatId,
          fromUserId: auth.currentUser?.uid,
          toUserId: conversationId,
          message: chatInput.trim(),
          timestamp: serverTimestamp(),
          read: false,
        });
      }
      setChatInput('');
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFollowRequestResponse = async (requesterId: string, action: 'accept' | 'deny') => {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;

      if (action === 'accept') {
        // Add to follower list and send notification
        await updateDoc(doc(db, 'users', currentUserId), {
          followerUids: arrayUnion(requesterId)
        });
        
        await addDoc(collection(db, 'notifications'), {
          type: 'follow_request_accepted',
          fromUserId: currentUserId,
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
      <ImageBackground
        source={require('../../assets/images/login:signup/bg.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
        imageStyle={{ opacity: 0.4 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/authenticated_tabs/profile?showMessages=true')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color={ORANGE} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {peerName || (typeof name === 'string' ? name : 'Chat')}
            </Text>
            {!!conversationId && conversationId !== 'puncho_bot' && (
              <Text style={styles.subtitle} numberOfLines={1}>@{peerUsername || name}</Text>
            )}
          </View>
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
          ref={scrollRef}
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
          <View ref={contentRef}>
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
                ref={(el) => { if (msg.id) messageRefs.current[msg.id] = el; }}
              >
                <Text style={[styles.messageText, isOutgoing || isPuncho ? { color: '#fff' } : null]}>
                  {msg.message}
                </Text>
                
                {/* Follow Request Buttons */}
                {isFollowRequest && (
                  <View style={styles.followRequestButtons}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleFollowRequestResponse(msg.fromUserId, 'accept')}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.denyButton}
                      onPress={() => handleFollowRequestResponse(msg.fromUserId, 'deny')}
                    >
                      <Text style={styles.denyButtonText}>Deny</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                <View style={[
                  styles.messageFooter,
                  isOutgoing ? styles.outgoingMessageFooter : styles.incomingMessageFooter
                ]}>
                  <Text style={[styles.messageTime, isOutgoing || isPuncho ? { color: 'rgba(255,255,255,0.7)' } : null]}>
                    {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                </View>
              </View>
            );
          })}
          {messages.length === 0 && (
            <Text style={styles.emptyText}>No messages yet.</Text>
          )}
          </View>
        </ScrollView>

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Type a message..."
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={sending}>
            <Ionicons name="send" size={20} color={ORANGE} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      </ImageBackground>
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
    marginTop: 8,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginLeft: -40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 12,
    paddingBottom: 24,
  },
  messageBubble: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    maxWidth: '80%',
    alignSelf: 'flex-start',
    marginHorizontal: 8,
  },
  outgoingMessage: {
    backgroundColor: ORANGE,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  punchoMessage: {
    backgroundColor: ORANGE,
    borderLeftWidth: 4,
    borderLeftColor: ORANGE,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#222',
  },
  messageFooter: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  outgoingMessageFooter: {
    alignItems: 'flex-end',
  },
  incomingMessageFooter: {
    alignItems: 'flex-start',
  },
  messageTime: {
    fontSize: 11,
    color: '#aaa',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    paddingBottom: 32,
    marginBottom: 0,
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
    paddingVertical: 8,
    marginRight: 8,
    color: '#222',
  },
  sendButton: {
    padding: 8,
  },
  followRequestMessage: {
    backgroundColor: '#fff8e1',
    borderLeftColor: '#ffcc00',
    borderLeftWidth: 4,
  },
  followRequestButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  denyButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  denyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 40,
  },
}); 