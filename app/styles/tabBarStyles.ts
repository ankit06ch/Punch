import { StyleSheet } from 'react-native';

const tabBarStyles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 150, // Very large horizontal margin to make pill much narrower
    right: 150, // Very large horizontal margin to make pill much narrower
    bottom: 20, // Add bottom margin so it doesn't touch the bottom
    backgroundColor: '#f0f0f0', // Temporary color change to verify styles are applied
    borderTopWidth: 0,
    elevation: 15, // Increased elevation for floating effect
    height: 60, // Reduced height for more compact pill shape
    paddingBottom: 12, // Adjusted padding
    paddingTop: 12, // Adjusted padding for vertical centering
    paddingHorizontal: 12, // Reduced horizontal padding for narrower pill
    borderRadius: 30, // Full border radius for pill shape (half of height)
    shadowColor: '#000',
    shadowOpacity: 0.2, // Increased shadow opacity for floating effect
    shadowOffset: { width: 0, height: 6 }, // Increased shadow offset
    shadowRadius: 16, // Increased shadow radius
  },
  centerButtonWrapper: {
    top: -15, // Center the button within the 60px pill height (60/2 - 30/2 = 15)
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    width: 50, // Smaller to fit better within the compact pill
    height: 50, // Smaller to fit better within the compact pill
    borderRadius: 25, // Half of width/height for perfect circle
    backgroundColor: '#fb7a20',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25, // Increased shadow for floating effect
    shadowOffset: { width: 0, height: 6 }, // Increased shadow offset
    shadowRadius: 12, // Increased shadow radius
    elevation: 12, // Increased elevation
    borderWidth: 3, // Slightly thinner border
    borderColor: 'white',
  },
});

export default tabBarStyles;