import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = width * 0.85;
export const CARD_HEIGHT = 200; // Increased from 180 to fit all content
export const CARD_SPACING = 16;

// Sophisticated color palette
const COLORS = {
  primary: '#2C3E50',      // Dark blue-gray
  secondary: '#34495E',    // Medium blue-gray
  accent: '#E74C3C',       // Red accent
  success: '#27AE60',      // Green
  warning: '#F39C12',      // Orange
  info: '#3498DB',         // Blue
  light: '#ECF0F1',        // Light gray
  white: '#FFFFFF',
  text: {
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    light: '#BDC3C7',
    white: '#FFFFFF',
  },
  background: {
    primary: '#F8F9FA',
    secondary: '#FFFFFF',
    glass: 'rgba(255,255,255,0.85)',
  },
  card: {
    primary: '#2C3E50',
    secondary: '#34495E',
    accent: '#E74C3C',
    success: '#27AE60',
    warning: '#F39C12',
    info: '#3498DB',
  }
};

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  fixedGlassHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  glassHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  glassTitle: {
    color: COLORS.primary,
    textAlign: 'left',
  },
  title: {
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.text.secondary,
  },
  glassCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  searchContainer: {
    marginBottom: 16,
    padding: 16,
  },
  inlineSearchContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  fullWidthSearchContainer: {
    flex: 1,
    marginRight: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  searchIcon: {
    marginRight: 12,
    color: COLORS.primary,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.light,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.text.secondary,
  },
  filterChipTextActive: {
    color: COLORS.text.white,
  },
  sectionCard: {
    marginBottom: 20,
    marginHorizontal: 20,
  },
  recentActivityCard: {
    marginBottom: 20,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.primary,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(44, 62, 80, 0.1)',
  },
  searchOverlayContainer: {
    paddingTop: 8,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(44, 62, 80, 0.1)',
    gap: 12,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: COLORS.primary,
  },
  searchIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(44, 62, 80, 0.1)',
  },
  animatedSearchContainer: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  searchCard: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
    color: COLORS.primary,
  },
  emptyText: {
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  emptySubtext: {
    color: COLORS.text.light,
    textAlign: 'center',
  },
  cardsList: {
    paddingVertical: 8,
    paddingLeft: (width - CARD_WIDTH) / 2 - 30 + 20, // Show left card + extra padding for first card
    paddingRight: (width - CARD_WIDTH) / 2 - 30 + CARD_SPACING + 20, // Show more of right card
  },
  cardWrapper: {
    marginRight: CARD_SPACING, // Use consistent spacing
  },
  creditCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardLogoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBusinessName: {
    color: COLORS.text.white,
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  cardChip: {
    width: 48,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipLines: {
    width: 32,
    height: 20,
    justifyContent: 'space-between',
  },
  chipLine: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 1,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardInfo: {
    gap: 8,
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLocation: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    flex: 1,
  },
  cardLastUsed: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  punchProgress: {
    alignItems: 'flex-start',
  },
  punchCount: {
    color: COLORS.text.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  punchLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  rewardProgress: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: 16,
  },
  rewardProgressInline: {
    marginTop: 8,
    gap: 4,
  },
  rewardText: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 0,
    marginTop: 0,
    fontSize: 14,
    fontWeight: 'bold',
  },
  punchLogoContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  punchLogoImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  progressBar: {
    width: 80,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.text.white,
    borderRadius: 2,
  },
  cardNumber: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  cardNumberText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  cardMenuButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionBusiness: {
    color: COLORS.text.primary,
    marginBottom: 4,
    fontSize: 16,
    fontWeight: '600',
  },
  transactionType: {
    color: COLORS.text.secondary,
    marginBottom: 2,
    fontSize: 14,
  },
  transactionDate: {
    color: COLORS.text.light,
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContent: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  // New styles for punch card section without white box
  punchCardSection: {
    marginBottom: 20,
  },
  punchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    paddingHorizontal: 20,
  },
  punchCardTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  animatedSearchOverlay: {
    position: 'absolute',
    top: 0,
    right: 20, // Add right padding
    left: 20, // Add left padding
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10, // Ensure it appears above filter chips
  },
  overlaySearchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 12,
  },
  // Delete button styles
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  deleteButtonCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  // Delete modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  deleteModalTitle: {
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalText: {
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteCancelButton: {
    backgroundColor: '#BDC3C7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 100,
    alignItems: 'center',
  },
  deleteCancelButtonText: {
    color: '#2C3E50',
  },
  deleteConfirmButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 100,
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    color: 'white',
  },
  // Delete mode touchable style
  deleteModeTouchable: {
    flex: 1,
  },
});