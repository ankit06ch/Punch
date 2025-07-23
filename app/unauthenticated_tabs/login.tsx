import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';

import CustomText from '../../components/CustomText';
import { auth } from '../../firebase/config';
import loginStyles from '../styles/loginStyles';

export default function LoginScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'input' | 'password'>('input');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [anim] = useState(new Animated.Value(60)); // Start 60px below

  function getFriendlyErrorMessage(errorCode: string) {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No user found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':
        return 'The email address is not valid.';
      default:
        return 'Login failed. Please try again.';
    }
  }

  const handleNext = () => {
    setError('');
    if (tab === 'email') {
      if (!email) {
        setError('Please enter your email.');
        return;
      }
      setStep('password');
      Animated.timing(anim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
    } else {
      if (!phone) {
        setError('Please enter your phone number.');
        return;
      }
      // For now, just go to password step (could be OTP in future)
      setStep('password');
      Animated.timing(anim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'email') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Implement phone login here if needed
        setError('Phone login not implemented.');
        setLoading(false);
        return;
      }
      router.replace('../authenticated_tabs/home');
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  // Tab button styles
  const tabButton = (selected: boolean) => ({
    flex: 1,
    backgroundColor: selected ? 'white' : 'rgba(0,0,0,0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center' as const,
    borderWidth: selected ? 1.5 : 0,
    borderColor: selected ? '#FB7A20' : 'transparent',
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={loginStyles.container}>
        <ScrollView contentContainerStyle={loginStyles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Back Arrow */}
          <TouchableOpacity style={loginStyles.backButton} onPress={() => router.back()}>
            <AntDesign name="arrowleft" size={28} color="#FB7A20" />
          </TouchableOpacity>

          {/* Logo and Welcome Text */}
          <View style={loginStyles.logoContainer}>
            <Image source={require('../../assets/Punch_Logos/Punch_T/black_logo.png')} style={loginStyles.logo} />
          </View>
          <View style={loginStyles.textContainer}>
            <CustomText variant="title" weight="bold" style={loginStyles.title}>
              Welcome Back!
            </CustomText>
            <CustomText variant="subtitle" weight="medium" style={loginStyles.subtitle}>
              Login to your Punch account
            </CustomText>
          </View>

          {/* Tab Switcher */}
          <View style={{ flexDirection: 'row', width: '100%', marginBottom: 24, gap: 8 }}>
            <TouchableOpacity style={tabButton(tab === 'email')} onPress={() => { setTab('email'); setStep('input'); setError(''); }}>
              <CustomText style={{ color: tab === 'email' ? '#3A3A3A' : '#7A7A7A', fontWeight: '600', fontSize: 16 }}>Email</CustomText>
            </TouchableOpacity>
            <TouchableOpacity style={tabButton(tab === 'phone')} onPress={() => { setTab('phone'); setStep('input'); setError(''); }}>
              <CustomText style={{ color: tab === 'phone' ? '#3A3A3A' : '#7A7A7A', fontWeight: '600', fontSize: 16 }}>Phone</CustomText>
            </TouchableOpacity>
          </View>

          <View style={loginStyles.formContainer}>
            {/* Email or Phone Input (always visible) */}
            {tab === 'email' && (
              <View style={loginStyles.inputContainer}>
                <AntDesign name="mail" size={20} color="#FB7A20" style={loginStyles.inputIcon} />
                <TextInput
                  placeholder="Email"
                  style={loginStyles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  placeholderTextColor="#aaa"
                />
              </View>
            )}
            {tab === 'phone' && (
              <View style={loginStyles.inputContainer}>
                <AntDesign name="phone" size={20} color="#FB7A20" style={loginStyles.inputIcon} />
                <TextInput
                  placeholder="Phone"
                  style={loginStyles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  editable={!loading}
                  placeholderTextColor="#aaa"
                />
              </View>
            )}
            {/* Next button (only if password not shown yet) */}
            {step === 'input' && (
              <TouchableOpacity
                style={[loginStyles.loginButton, loading && loginStyles.loginButtonDisabled]}
                onPress={handleNext}
                disabled={loading}
              >
                <CustomText variant="button" weight="bold" style={loginStyles.loginButtonText}>
                  Next
                </CustomText>
              </TouchableOpacity>
            )}
            {/* Password and Login (animated slide in) */}
            <Animated.View style={{
              opacity: step === 'password' ? 1 : 0,
              transform: [{ translateY: anim }],
              width: '100%',
              position: 'relative',
            }} pointerEvents={step === 'password' ? 'auto' : 'none'}>
              {step === 'password' && (
                <>
                  <View style={loginStyles.inputContainer}>
                    <AntDesign name="lock" size={20} color="#FB7A20" style={loginStyles.inputIcon} />
                    <TextInput
                      placeholder="Password"
                      style={loginStyles.input}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      editable={!loading}
                      placeholderTextColor="#aaa"
                    />
                  </View>
                  <TouchableOpacity
                    style={[loginStyles.loginButton, loading && loginStyles.loginButtonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <CustomText variant="button" weight="bold" style={loginStyles.loginButtonText}>
                        Log in
                      </CustomText>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
            {error ? (
              <View style={loginStyles.errorContainer}>
                <AntDesign name="exclamationcircleo" size={16} color="#FB7A20" />
                <CustomText variant="body" weight="medium" style={loginStyles.errorText}>
                  {error}
                </CustomText>
              </View>
            ) : null}
          </View>

          {/* Sign Up Link */}
          <View style={loginStyles.signupContainer}>
            <CustomText variant="body" weight="normal" style={loginStyles.signupText}>
              {"Don't have an account? "}
            </CustomText>
            <TouchableOpacity onPress={() => router.push('../unauthenticated_tabs/signup')}>
              <CustomText variant="body" weight="bold" style={loginStyles.signupLink}>
                Sign Up
              </CustomText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}