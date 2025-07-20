import { StyleSheet } from 'react-native';

const homeStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      paddingHorizontal: 20,
      paddingTop: 60,
    },
    greeting: {
      fontSize: 24,
      fontWeight: '600',
      marginBottom: 8,
      color: '#333',
    },
    punchCount: {
      fontSize: 18,
      color: '#666',
      marginBottom: 24,
    },
    sectionHeader: {
      fontSize: 20,
      fontWeight: '600',
      color: '#fb7a20',
      marginBottom: 8,
      marginTop: 24,
    },
    emptyText: {
      color: '#aaa',
      fontStyle: 'italic',
      marginBottom: 12,
    },
    rewardScrollContainer: {
      flexDirection: 'row',
      paddingVertical: 12,
    },
    rewardCard: {
      backgroundColor: '#f7f7f7',
      borderRadius: 10,
      padding: 16,
      marginRight: 12,
      width: 140,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rewardText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
    },
  });
export default homeStyles;
