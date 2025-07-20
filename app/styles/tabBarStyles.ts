import { StyleSheet } from 'react-native';

const tabBarStyles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopWidth: 0,
    elevation: 5,
    height: 20,
  },
  centerButtonWrapper: {
    top: -30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fb7a20',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 5,
  },
});

export default tabBarStyles;