import React from 'react';
import { View, Image, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import loginStyles from '../styles/loginStyles';

interface SignupBackgroundProps {
  height: number;
  logoSizeAnim: Animated.Value;
  orangeBackgroundAnim: Animated.Value;
  onBackPress: () => void;
}

export default function SignupBackground({
  height,
  logoSizeAnim,
  orangeBackgroundAnim,
  onBackPress
}: SignupBackgroundProps) {
  return (
    <>
      {/* Background image - extends to status bar */}
              <Image 
          source={require('../../assets/images/login:signup/bg.png')} 
          style={{
            position: 'absolute',
            top: -100, // Extend even higher above the safe area to cover status bar completely
            left: 0,
            right: 0,
            width: '100%',
            height: height * 0.8, // Increase height further to cover more area
            resizeMode: 'cover',
            zIndex: 1,
          }}
        />
      
      {/* Back Arrow at top left */}
      <TouchableOpacity 
        style={[loginStyles.backButton, { position: 'absolute', top: 16, left: 16, zIndex: 20, backgroundColor: 'rgba(255,255,255,0.12)' }]} 
        onPress={onBackPress}
      >
        <AntDesign name="arrowleft" size={28} color="#FB7A20" />
      </TouchableOpacity>
      
      {/* Logo above card */}
      <Animated.View style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 10, 
        alignItems: 'center',
        transform: [{ scale: logoSizeAnim }]
      }}>
        <View style={{
          width: 110,
          height: 110,
          borderRadius: 55,
          backgroundColor: '#FFFFFF',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 10,
          marginTop: 20,
        }}>
                      <Image 
              source={require('../../assets/Punch_Logos/Punch_T/black_logo.png')} 
              style={{ width: 80, height: 80, resizeMode: 'contain' }} 
            />
        </View>
      </Animated.View>

      {/* Orange circular rectangle background - behind the modal */}
      <Animated.View style={{
        position: 'absolute',
        top: '20%', // Raised by 40 (from 28% to 20%)
        left: '3%',
        right: '3%',
        height: 200,
        backgroundColor: '#FB7A20',
        borderRadius: 20,
        zIndex: 8,
        transform: [{ translateY: orangeBackgroundAnim }],
      }} />

      {/* Image 10 on top right */}
              <Image 
          source={require('../../assets/images/onboarding/onboarding2/10.png')} 
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 350,
            height: 350,
            resizeMode: 'contain',
            zIndex: 9,
          }}
        />
    </>
  );
} 