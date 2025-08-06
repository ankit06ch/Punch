# Message Read Feature Implementation

## Overview

This implementation adds a comprehensive read feature for messages that tracks when messages are seen and updates notification numbers accordingly.

## Features Implemented

### 1. Message Read Status Tracking

- **Database Schema**: Messages now include a `read` field (boolean) that defaults to `false`
- **Backward Compatibility**: Handles existing messages without the `read` field by treating them as unread
- **Real-time Updates**: Uses Firebase Firestore listeners to track read status changes

### 2. Automatic Read Marking

- **Chat Opening**: Messages are automatically marked as read when a chat is opened
- **Scroll Detection**: Messages are marked as read when the user scrolls near the bottom of the chat
- **Batch Updates**: Uses Firebase batch writes for efficient database updates

### 3. Notification Count Integration

- **Combined Count**: Notification badge shows total unread count (notifications + messages)
- **Real-time Updates**: Badge updates automatically when messages are read
- **Visual Indicators**: Unread conversations show a small orange dot

### 4. Visual Read Indicators

- **Message Status**: Outgoing messages show checkmark icons (single for sent, double for read)
- **Color Coding**: Read messages show green checkmarks, unread show gray
- **Conversation Preview**: Unread conversations display the unread dot indicator

## Technical Implementation

### Database Collections

- **`messages`**: Regular chat messages with `read` field
- **`notifications`**: System notifications (Puncho messages) with `read` field

### Key Functions

#### Chat Screen (`punch/app/screens/chat.tsx`)

- `markMessagesAsRead()`: Marks all unread messages in a conversation as read
- `markSingleMessageAsRead()`: Marks individual messages as read
- `handleMessageView()`: Handles message view events

#### Profile Screen (`punch/app/authenticated_tabs/profile.tsx`)

- `markConversationAsRead()`: Marks all messages in a conversation as read when opened
- Real-time listeners for both notifications and unread messages
- Combined unread count calculation

### Firebase Queries

```javascript
// Listen for unread messages
const messagesQuery = query(
  collection(db, "messages"),
  where("toUserId", "==", user.uid),
  where("read", "==", false)
);

// Listen for notifications
const notificationsQuery = query(
  collection(db, "notifications"),
  where("toUserId", "==", user.uid),
  orderBy("timestamp", "desc")
);
```

## User Experience

### Message Flow

1. **Message Sent**: New messages are created with `read: false`
2. **Chat Opened**: All unread messages in the conversation are marked as read
3. **Scroll Detection**: Messages are marked as read when user scrolls to view them
4. **Notification Update**: Badge count updates in real-time
5. **Visual Feedback**: Read status is shown with checkmark icons

### Conversation List

- **Unread Indicator**: Orange dot shows for conversations with unread messages
- **Last Message**: Shows the most recent unread message preview
- **Timestamp**: Displays when the last message was received
- **Badge Count**: Total unread count displayed on messages button

## Backward Compatibility

- Existing messages without the `read` field are treated as unread
- Graceful handling of missing fields prevents app crashes
- Automatic migration when messages are first accessed

## Performance Considerations

- **Batch Writes**: Multiple message updates are batched for efficiency
- **Real-time Listeners**: Optimized queries with proper indexing
- **Scroll Throttling**: Message read marking is throttled to prevent excessive updates

## Future Enhancements

- **Read Receipts**: Show when other users have read your messages
- **Typing Indicators**: Real-time typing status
- **Message Status**: Delivered, read, failed status for each message
- **Push Notifications**: Integrate with push notification system for unread counts
