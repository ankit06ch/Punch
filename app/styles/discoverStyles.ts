import { StyleSheet } from 'react-native';

const discoverStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fb7a20',
    marginBottom: 12,
    marginTop: 24,
  },
  horizontalList: {
    paddingVertical: 10,
    paddingLeft: 4,
    paddingRight: 8,
  },
  verticalList: {
    paddingVertical: 10,
    paddingBottom: 40,
    paddingHorizontal: 8,
  },
  promoCard: {
    backgroundColor: '#fff4ed',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 180,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  promoLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#fb7a20',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  promoLogo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  restaurantCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#fb7a20',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  restaurantLogo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow badges to wrap to next line
    alignItems: 'center',
    marginTop: 6,
    rowGap: 6, // Add vertical gap between rows (supported in RN 0.71+)
  },
  badge: {
    backgroundColor: '#fb7a20',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 6, // Add bottom margin for vertical spacing
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
  },
});

export default discoverStyles;