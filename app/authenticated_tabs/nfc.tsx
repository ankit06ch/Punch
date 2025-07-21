import React, { useState, useCallback, useEffect } from 'react';
import { Platform, View, Text, Button, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import nfcStyles from '../styles/nfcStyles';

// Import NFC manager directly
let nfcManager: any = null;
let NfcTech: any = null;

console.log('Platform:', Platform.OS);

if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    console.log('Attempting to load NFC module...');
    const nfcModule = require('react-native-nfc-manager');
    console.log('NFC module loaded:', nfcModule);
    nfcManager = nfcModule.default;
    NfcTech = nfcModule.NfcTech;
    console.log('nfcManager:', nfcManager);
    console.log('NfcTech:', NfcTech);
  } catch (error) {
    console.log('NFC module not available:', error);
  }
}

export default function NFC() {
  const [scanning, setScanning] = useState(false);
  const [tag, setTag] = useState(null);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcStatus, setNfcStatus] = useState('Checking NFC support...');

  useEffect(() => {
    const checkNFC = async () => {
      console.log('Checking NFC support...');
      console.log('nfcManager available:', !!nfcManager);
      console.log('NfcTech available:', !!NfcTech);
      
      if (!nfcManager) {
        setNfcStatus('NFC module not available - module failed to load');
        return;
      }

      try {
        setNfcStatus('Checking NFC support...');
        console.log('Calling nfcManager.isSupported()...');
        const supported = await nfcManager.isSupported();
        console.log('NFC supported result:', supported);
        setNfcSupported(supported);
        
        if (supported) {
          setNfcStatus('NFC is supported, starting...');
          console.log('Starting NFC manager...');
          await nfcManager.start();
          setNfcStatus('NFC ready to scan');
        } else {
          setNfcStatus('NFC is not supported on this device');
        }
      } catch (error) {
        console.log('NFC check error:', error);
        setNfcSupported(false);
        setNfcStatus('Error checking NFC support: ' + error);
      }
    };
    
    checkNFC();
  }, []);

  const scanNfc = useCallback(async () => {
    if (!nfcManager || !NfcTech) {
      Alert.alert('Error', 'NFC module not available');
      return;
    }

    setTag(null);
    setScanning(true);
    try {
      setNfcStatus('Starting NFC scan...');
      await nfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await nfcManager.getTag();
      setTag(tag);
      setNfcStatus('NFC tag detected!');
      Alert.alert('NFC Tag Detected', JSON.stringify(tag));
    } catch (ex: any) {
      console.log('NFC scan error:', ex);
      if (ex?.toString().includes('User cancelled')) {
        setNfcStatus('Scan cancelled by user');
        Alert.alert('Scan Cancelled', 'NFC scan was cancelled by user');
      } else {
        setNfcStatus('NFC scan error: ' + ex?.toString());
        Alert.alert('NFC Error', 'Error scanning NFC tag: ' + ex?.toString());
      }
    } finally {
      setScanning(false);
      nfcManager.cancelTechnologyRequest();
    }
  }, []);

  const scanNfcAlternative = useCallback(async () => {
    if (!nfcManager || !NfcTech) {
      Alert.alert('Error', 'NFC module not available');
      return;
    }

    setTag(null);
    setScanning(true);
    try {
      setNfcStatus('Starting alternative NFC scan...');
      await nfcManager.requestTechnology(NfcTech.IsoDep);
      const tag = await nfcManager.getTag();
      setTag(tag);
      setNfcStatus('NFC tag detected!');
      Alert.alert('NFC Tag Detected', JSON.stringify(tag));
    } catch (ex: any) {
      console.log('Alternative NFC scan error:', ex);
      setNfcStatus('Alternative NFC scan error: ' + ex?.toString());
      Alert.alert('NFC Error', 'Error scanning NFC tag: ' + ex?.toString());
    } finally {
      setScanning(false);
      nfcManager.cancelTechnologyRequest();
    }
  }, []);

  return (
    <SafeAreaView style={nfcStyles.container}>
      <Text style={{ color: '#fb7a20', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
        {nfcStatus}
      </Text>
      
      <Text style={{ color: '#666', fontSize: 12, textAlign: 'center', marginBottom: 20 }}>
        Debug: nfcManager={nfcManager ? 'Loaded' : 'Not loaded'}, NfcTech={NfcTech ? 'Loaded' : 'Not loaded'}
      </Text>
      
      {nfcSupported ? (
        <>
          <Text style={nfcStyles.text}>Tap your phone to an NFC tag to scan.</Text>
          <Button
            title={scanning ? 'Scanning...' : 'Start Apple NFC Scan'}
            onPress={scanNfc}
            disabled={scanning}
            color="#fb7a20"
          />
          <View style={{ marginTop: 16 }}>
            <Button
              title="Alternative NFC Scan"
              onPress={scanNfcAlternative}
              disabled={scanning}
              color="#fb7a20"
            />
          </View>
          {tag && (
            <View style={{ marginTop: 24 }}>
              <Text style={{ color: '#fb7a20', fontWeight: 'bold' }}>Tag Data:</Text>
              <Text style={{ color: '#222' }}>{JSON.stringify(tag)}</Text>
            </View>
          )}
        </>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={nfcStyles.text}>NFC is not supported on this device.</Text>
          <Text style={{ color: '#666', marginVertical: 16, fontSize: 14, textAlign: 'center' }}>
            Status: {nfcStatus}
          </Text>
          <Text style={{ color: '#fb7a20', marginVertical: 16, fontSize: 18, fontWeight: 'bold' }}>Scan QR Code</Text>
          <Button title="Show My QR Code" color="#fb7a20" onPress={() => Alert.alert('QR Code', 'Show your QR code here!')} />
        </View>
      )}
    </SafeAreaView>
  );
}