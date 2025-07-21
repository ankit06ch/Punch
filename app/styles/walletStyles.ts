import { StyleSheet, Dimensions } from 'react-native';
const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = 180; // Assuming a default height for cards

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 40, // reduced from 64 for better spacing
    paddingBottom: 0, // Remove bottom padding to avoid space below
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fb7a20',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: 180,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginRight: 0,
    marginLeft: 0,
    marginBottom: 0,
    shadowColor: '#fb7a20',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#ffe3c2',
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 36,
    backgroundColor: '#fb7a20',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 1,
  },
  businessName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 15,
    color: '#222',
    marginTop: 44,
    zIndex: 2,
  },
  punchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
    marginBottom: 15,
  },
  punch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fb7a20',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
    shadowColor: '#fb7a20',
    shadowOpacity: 0,
  },
  filledPunch: {
    backgroundColor: '#fb7a20',
    shadowOpacity: 0.4,
  },
  emptyPunch: {
    backgroundColor: '#fff',
  },
  nextPunch: {
    borderColor: '#ffa94d',
    borderWidth: 3,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
  },
  cardStackArea: {
    height: width * 0.7 + 60, // enough for stacked cards
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 120,
  },
  cardStackContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + 24 * 3, // enough for 4 stacked cards
    position: 'relative',
    alignSelf: 'center',
  },
  moreCardsContainer: {
    position: 'absolute',
    bottom: -36,
    left: 0,
    right: 0,
    width: CARD_WIDTH * 0.7,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    alignSelf: 'center',
  },
  moreCardsText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 16,
  },
  transactionHistoryContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    marginTop: 8,
    // Remove borderTopLeftRadius and borderTopRightRadius here
    // Remove padding here
    position: 'relative',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: -12 },
    elevation: 20,
    width: '100%',
    alignSelf: 'center',
  },
  transactionHistoryContent: {
    padding: 20,
  },
  transactionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  transactionEmpty: {
    color: '#aaa',
    fontSize: 16,
  },
  addPassContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  addPassText: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 24,
  },
  transactionHistoryBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    zIndex: 0,
    width: '100%',
    alignSelf: 'center',
  },
});

export default styles;