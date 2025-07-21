import { StyleSheet } from 'react-native';

const tabBarStyles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopWidth: 0,
    elevation: 10,
    height: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    // Optionally add padding for icons
    paddingBottom: 10,
    paddingTop: 10,
  },
  centerButtonWrapper: {
    top: -15, // Move the NFC button lower (was -30)
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fb7a20',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 4,
    borderColor: 'white',
  },
});

export default tabBarStyles;