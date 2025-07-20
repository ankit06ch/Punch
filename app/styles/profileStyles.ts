// /app/styles/profileStyles.ts
import { StyleSheet } from 'react-native';

const profileStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
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
});

export default profileStyles;