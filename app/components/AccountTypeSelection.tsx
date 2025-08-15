import React from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import CustomText from '../../components/CustomText';
import loginStyles from '../styles/loginStyles';
import signupStyles from '../styles/signupStyles';

interface AccountTypeSelectionProps {
  onSelect: (isBusiness: boolean) => void;
  welcomeModalAnim: Animated.Value;
  onLoginPress: () => void;
}

export default function AccountTypeSelection({ 
  onSelect, 
  welcomeModalAnim, 
  onLoginPress 
}: AccountTypeSelectionProps) {
  return (
    <Animated.View style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 20,
      width: '100%',
      zIndex: 10,
      height: '75%',
      backgroundColor: 'transparent',
      justifyContent: 'flex-start',
      alignSelf: 'center',
      transform: [{ translateY: welcomeModalAnim }],
    }}>
      <View
        style={{
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          paddingHorizontal: 32,
          paddingTop: 32,
          paddingBottom: 32,
          flex: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -15 },
          shadowOpacity: 0.5,
          shadowRadius: 25,
          elevation: 25,
          alignItems: 'center',
          justifyContent: 'flex-start',
          width: '100%',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        }}
      >
        <CustomText variant="title" weight="bold" fontFamily="figtree" style={[loginStyles.title, { marginBottom: 24, textAlign: 'center' }]}>
          Which side of the counter are you on?
        </CustomText>
        
        {/* Customer Account - Primary option */}
        <TouchableOpacity 
          style={signupStyles.accountTypeButton} 
          onPress={() => onSelect(false)}
        >
          <View style={signupStyles.accountTypeContent}>
            <AntDesign name="user" size={24} color="#FB7A20" />
            <View style={signupStyles.accountTypeText}>
              <CustomText variant="title" weight="bold" fontFamily="figtree" style={{ color: '#333', marginBottom: 4, fontSize: 18 }}>
                I'm a customer.
              </CustomText>
              <CustomText variant="body" weight="medium" fontFamily="figtree" style={{ color: '#666', fontSize: 14 }}>
                Collect rewards, not just receipts.
              </CustomText>
            </View>
          </View>
          <AntDesign name="right" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* Business Account - Secondary option */}
        <TouchableOpacity 
          style={signupStyles.accountTypeButton} 
          onPress={() => onSelect(true)}
        >
          <View style={signupStyles.accountTypeContent}>
            <AntDesign name="home" size={24} color="#FB7A20" />
            <View style={signupStyles.accountTypeText}>
              <CustomText variant="title" weight="bold" fontFamily="figtree" style={{ color: '#333', marginBottom: 4, fontSize: 18 }}>
                I'm a business.
              </CustomText>
              <CustomText variant="body" weight="medium" fontFamily="figtree" style={{ color: '#666', fontSize: 14 }}>
                Turn customers into regulars, not one-time tourists.
              </CustomText>
            </View>
          </View>
          <AntDesign name="right" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* Login Link */}
        <View style={[loginStyles.signupContainer, { marginTop: 24, marginBottom: 0 }]}>
          <CustomText variant="body" weight="normal" fontFamily="figtree" style={loginStyles.signupText}>
            Already have an account?{' '}
          </CustomText>
          <TouchableOpacity onPress={onLoginPress}>
            <CustomText variant="body" weight="bold" fontFamily="figtree" style={loginStyles.signupLink}>
              Login
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
} 