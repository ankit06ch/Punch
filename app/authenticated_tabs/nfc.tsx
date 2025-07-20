import React from 'react';
import { View, Text } from 'react-native';
import nfcStyles from '../styles/nfcStyles';

export default function NFC() {
  return (
    <View style={nfcStyles.container}>
      <Text style={nfcStyles.text}>NFC Screen Placeholder</Text>
    </View>
  );
}