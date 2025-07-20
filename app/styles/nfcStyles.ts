import { StyleSheet } from 'react-native';

const nfcStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'flex-end',   // pushes content to bottom
    alignItems: 'center',
    paddingBottom: 60,            // space from bottom edge
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
});

export default nfcStyles;