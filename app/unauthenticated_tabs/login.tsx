import { AntDesign, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRef, useState, useEffect } from 'react';
import { ActivityIndicator, Animated, Easing, Image, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Dimensions, Keyboard, KeyboardEvent } from 'react-native';
import { BlurView } from 'expo-blur';

import CustomText from '../../components/CustomText';
import { auth } from '../../firebase/config';
import loginStyles from '../styles/loginStyles';
import AnimatedBubblesBackground from '../components/AnimatedBubblesBackground';

export default function LoginScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'input' | 'password'>('input');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [anim] = useState(new Animated.Value(60)); // For password slide up
  const outlineAnim = useRef(new Animated.Value(0)).current; // 0 for email, 1 for phone
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardDismissing, setIsKeyboardDismissing] = useState(false);
  const { width } = Dimensions.get('window');

  const MODAL_WIDTH = width - 48;
  const MODAL_HEIGHT = 420;
  const modalAnim = useRef(new Animated.Value(MODAL_HEIGHT + 40)).current;
  const keyboardOffset = 20;

  useEffect(() => {
    Animated.spring(modalAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 7,
      tension: 60,
    }).start();

    const handleKeyboardShow = (e: KeyboardEvent) => {
      setIsKeyboardDismissing(false);
      const keyboardHeight = e.endCoordinates.height;
      const screenHeight = Dimensions.get('window').height;
      const maxOffset = Math.min(keyboardHeight * 0.01, 2); // Reduced offset even more
      
      Animated.timing(modalAnim, {
        toValue: -maxOffset,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    };
    const handleKeyboardHide = () => {
      if (!isKeyboardDismissing) {
        Animated.timing(modalAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }).start();
      }
    };
    const showSub = Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  // Helper to format phone number as 123-456-7890
  function formatPhoneNumber(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 3));
    if (digits.length > 3) parts.push(digits.slice(3, 6));
    if (digits.length > 6) parts.push(digits.slice(6, 10));
    return parts.join('-');
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

  const dismissKeyboard = () => {
    setIsKeyboardDismissing(true);
    Keyboard.dismiss();
    // Reset the flag after a short delay
    setTimeout(() => {
      setIsKeyboardDismissing(false);
    }, 300);
  };

  // Tab button styles
  const tabButton = (selected: boolean) => ({
    flex: 1,
    backgroundColor: selected ? 'transparent' : '#f2f2f2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center' as const,
    borderWidth: 0,
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
        <View style={{ flex: 1, backgroundColor: '#FFF7F2' }}>
          <AnimatedBubblesBackground />
          {/* Back Arrow at top left */}
          <TouchableOpacity style={[loginStyles.backButton, { position: 'absolute', top: 16, left: 16, zIndex: 20, backgroundColor: 'rgba(255,255,255,0.12)' }]} onPress={() => {
            if (router.canGoBack && router.canGoBack()) {
              router.back();
            } else {
              router.replace('../unauthenticated_tabs/onboarding');
            }
          }}>
            <AntDesign name="arrowleft" size={28} color="#FB7A20" />
          </TouchableOpacity>
          {/* Logo above card */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, alignItems: 'center' }}>
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
              <Image source={require('../../assets/icon.png')} style={{ width: 80, height: 80, resizeMode: 'contain' }} />
            </View>
          </View>
        {/* Animated modal card */}
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <Animated.View style={{
            position: 'absolute',
            left: 24,
            right: 24,
            bottom: -40,
            width: MODAL_WIDTH,
            zIndex: 10,
            minHeight: MODAL_HEIGHT,
            backgroundColor: 'transparent',
            justifyContent: 'flex-end',
            alignSelf: 'center',
            transform: [{ translateY: modalAnim }],
          }}>
          <BlurView
            intensity={40}
            tint="light"
            style={{
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              paddingHorizontal: 32,
              paddingTop: 32,
              paddingBottom: 32,
              flex: 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.18,
              shadowRadius: 24,
              elevation: 18,
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: MODAL_WIDTH,
              overflow: 'hidden',
              backgroundColor: 'rgba(255,255,255,0.55)',
            }}
          >
            {/* Welcome Text */}
            <View style={loginStyles.textContainer}>
              <CustomText variant="title" weight="bold" fontFamily="figtree" style={loginStyles.title}>
                Welcome Back!
              </CustomText>
              <CustomText variant="subtitle" weight="medium" fontFamily="figtree" style={loginStyles.subtitle}>
                Login to your Punch account
              </CustomText>
            </View>
            {/* Tab Switcher with Animated Orange Outline */}
            <View style={{ flexDirection: 'row', width: '100%', marginBottom: 24, gap: 8, position: 'relative', height: 48 }}>
              {/* Animated orange outline border */}
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: outlineAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] }),
                  width: '50%',
                  height: 48,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#FB7A20',
                  backgroundColor: 'transparent',
                  zIndex: 0,
                }}
              />
              <TouchableOpacity
                style={[tabButton(tab === 'email'), { zIndex: 1, position: 'relative', flex: 1 }]}
                onPress={() => {
                  if (tab !== 'email') {
                    setTab('email');
                    setStep('input');
                    setError('');
                    Animated.timing(outlineAnim, {
                      toValue: 0,
                      duration: 250,
                      easing: Easing.out(Easing.exp),
                      useNativeDriver: false,
                    }).start();
                  }
                }}
              >
                <CustomText style={{ color: tab === 'email' ? '#3A3A3A' : '#7A7A7A', fontWeight: '600', fontSize: 16 }}>Email</CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[tabButton(tab === 'phone'), { zIndex: 1, position: 'relative', flex: 1 }]}
                onPress={() => {
                  if (tab !== 'phone') {
                    setTab('phone');
                    setStep('input');
                    setError('');
                    Animated.timing(outlineAnim, {
                      toValue: 1,
                      duration: 250,
                      easing: Easing.out(Easing.exp),
                      useNativeDriver: false,
                    }).start();
                  }
                }}
              >
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
                    style={[loginStyles.input, { fontFamily: 'Figtree_400Regular' }]}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                    placeholderTextColor="#aaa"
                    maxLength={30}
                  />
                </View>
              )}
              {tab === 'phone' && (
                <View style={loginStyles.inputContainer}>
                  <AntDesign name="phone" size={20} color="#FB7A20" style={loginStyles.inputIcon} />
                  <TextInput
                    placeholder="Phone"
                    style={[loginStyles.input, { fontFamily: 'Figtree_400Regular' }]}
                    value={formatPhoneNumber(phone)}
                    onChangeText={text => setPhone(text.replace(/\D/g, '').slice(0, 10))}
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
                  <CustomText variant="button" weight="bold" fontFamily="figtree" style={loginStyles.loginButtonText}>
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
                        style={[loginStyles.input, { flex: 1, fontFamily: 'Figtree_400Regular' }]}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        editable={!loading}
                        placeholderTextColor="#aaa"
                        maxLength={30}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword((prev) => !prev)}
                        style={{ padding: 4 }}
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <Feather name="eye-off" size={20} color="#FB7A20" />
                        ) : (
                          <Feather name="eye" size={20} color="#FB7A20" />
                        )}
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[loginStyles.loginButton, loading && loginStyles.loginButtonDisabled]}
                      onPress={handleLogin}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <CustomText variant="button" weight="bold" fontFamily="figtree" style={loginStyles.loginButtonText}>
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
                  <CustomText variant="body" weight="medium" fontFamily="figtree" style={loginStyles.errorText}>
                    {error}
                  </CustomText>
                </View>
              ) : null}
            </View>
            {/* Sign Up Link */}
            <View style={loginStyles.signupContainer}>
              <CustomText variant="body" weight="normal" fontFamily="figtree" style={loginStyles.signupText}>
                {"Don't have an account? "}
              </CustomText>
              <TouchableOpacity onPress={() => router.push('../unauthenticated_tabs/signup')}>
                <CustomText variant="body" weight="bold" fontFamily="figtree" style={loginStyles.signupLink}>
                  Sign Up
                </CustomText>
              </TouchableOpacity>
            </View>
          </BlurView>
          </Animated.View>
        </TouchableWithoutFeedback>
        </View>
    </KeyboardAvoidingView>
  );
}