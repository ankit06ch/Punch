// /app/styles/profileStyles.ts
import { StyleSheet } from 'react-native';

const profileStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', padding: 16 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  profileSection: { alignItems: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 8 },
  username: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginVertical: 12 },
  statItem: { alignItems: 'center' },
  statNumber: { color: 'white', fontSize: 18 },
  statLabel: { color: 'gray', fontSize: 12 },
  bioButton: {
    backgroundColor: '#ff2f68',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 20,
  },
  bioButtonText: { color: 'white' },
  storesContainer: { flex: 1 },
  sectionHeader: { color: 'white', fontSize: 18, marginVertical: 10 },
  storeItem: { color: 'white', paddingVertical: 5, paddingLeft: 10 },
  modalContainer: {
    backgroundColor: '#222',
    padding: 20,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '70%',
  },
  modalItem: { color: 'white', fontSize: 18, marginVertical: 10 },
});

export default profileStyles;