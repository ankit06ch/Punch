import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Figtree_600SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  screen: {
    width,
    height: height - 100, // Reduced to prevent scroll bar overlap
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 120,
    paddingBottom: 20, // Reduced bottom padding
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 80,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
    fontFamily: 'Figtree_700Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
    opacity: 1,
    fontFamily: 'Figtree_500Medium',
  },
  description: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    fontWeight: '500',
    opacity: 1,
    fontFamily: 'Figtree_400Regular',
  },
  bottomSection: {
    alignItems: 'center',
    marginBottom: 20, // Add margin to prevent overlap
  },
  ctaButton: {
    backgroundColor: '#FB7A20',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Figtree_700Bold',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FB7A20',
    width: 24,
  },
  inactiveDot: {
    backgroundColor: '#eee',
  },
  // Vector design styles
  vectorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  floatingShape: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.1,
  },
  shape1: {
    width: 120,
    height: 120,
    backgroundColor: 'white',
    top: '15%',
    right: -30,
  },
  shape2: {
    width: 80,
    height: 80,
    backgroundColor: 'white',
    top: '45%',
    left: -20,
  },
  shape3: {
    width: 60,
    height: 60,
    backgroundColor: 'white',
    bottom: '30%',
    right: '10%',
  },
  shape4: {
    width: 100,
    height: 100,
    backgroundColor: 'white',
    bottom: '15%',
    left: '5%',
  },
  // Content wrapper to ensure proper spacing
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 60, // Space for dots
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    width: '90%',
    maxWidth: 340,
    alignSelf: 'center',
  },
}); 