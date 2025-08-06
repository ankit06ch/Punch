import { StyleSheet } from 'react-native';

const discoverStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fb7a20',
    marginBottom: 16,
    marginTop: 28,
  },
  horizontalList: {
    paddingVertical: 12,
    paddingLeft: 6,
    paddingRight: 10,
  },
  verticalList: {
    paddingVertical: 12,
    paddingBottom: 50,
    paddingHorizontal: 10,
  },
  promoCard: {
    backgroundColor: 'rgba(255, 244, 237, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    width: 200,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 244, 237, 0.6)',
  },
  promoLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#fb7a20',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  promoLogo: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  restaurantCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  restaurantLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#fb7a20',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    flexShrink: 0,
  },
  restaurantLogo: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow badges to wrap to next line
    alignItems: 'center',
    marginTop: 8,
    rowGap: 8, // Add vertical gap between rows (supported in RN 0.71+)
    justifyContent: 'flex-start', // Align badges to the left
    flex: 1, // Take up available space
  },
  badge: {
    backgroundColor: '#fb7a20',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 3, // Reduced from 4 to allow more badges
    marginBottom: 4, // Reduced from 6 for tighter spacing
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    flexShrink: 1,
  },
  cardText: {
    fontSize: 15,
    color: '#666',
  },
});

export default discoverStyles;