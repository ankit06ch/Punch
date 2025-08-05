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
    backgroundColor: '#fff4ed',
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
    backgroundColor: '#f7f7f7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 100,
  },
  restaurantLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
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
  },
  badge: {
    backgroundColor: '#fb7a20',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8, // Add bottom margin for vertical spacing
  },
  badgeText: {
    color: 'white',
    fontSize: 13,
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