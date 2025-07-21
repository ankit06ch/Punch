import { StyleSheet, Dimensions } from 'react-native';
const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 64, // match Discover page top spacing
    paddingBottom: 40, // add or increase this value
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fb7a20',
    marginBottom: 20,
  },
  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: '#fff4ed',
    borderRadius: 20,
    padding: 20,
    marginRight: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  businessName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 15,
    color: '#333',
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
  addPassContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
});

export default styles;