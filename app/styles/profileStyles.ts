// /app/styles/profileStyles.ts
import { StyleSheet } from 'react-native';

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 64, // match Discover page top spacing
    paddingBottom: 40, // add or increase this value
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileSection: { alignItems: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 8 },
  username: { color: '#333', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginVertical: 12 },
  statItem: { alignItems: 'center' },
  statNumber: { color: '#333', fontSize: 18 },
  statLabel: { color: 'gray', fontSize: 12 },
  bioButton: {
    backgroundColor: '#fb7a20',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 20,
  },
  bioButtonText: { color: '#fff' },
  storesContainer: { flex: 1 },
  sectionHeader: { color: '#fb7a20', fontSize: 18, marginVertical: 10 },
  storeItem: { color: '#333', paddingVertical: 5, paddingLeft: 10 },
  modalContainer: {
    backgroundColor: '#fff',           // pure white for a clean look
    padding: 24,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '70%',
    borderTopLeftRadius: 20,           // rounded corners on left side
    borderBottomLeftRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: -2, height: 0 },
    elevation: 8,
    borderLeftWidth: 1,
    borderColor: '#eee',               // lighter border
  },
  modalItem: {
    color: '#444',                    // slightly lighter dark text
    fontSize: 18,
    marginVertical: 16,               // more spacing between items
    fontWeight: '500',
  },
  findFriendsStatus: { color: '#fb7a20', marginTop: 24, textAlign: 'center', fontSize: 16 },
  findFriendsUserCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  findFriendsAvatarCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#f7f7f7', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  findFriendsAvatarImageWrapper: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  findFriendsAvatarImage: { width: 48, height: 48, borderRadius: 24 },
  findFriendsUsername: { color: '#fb7a20', fontWeight: 'bold', fontSize: 18 },
});

export default profileStyles;