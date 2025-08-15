import { AntDesign, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useRef, useState, useEffect } from 'react';
import { ActivityIndicator, Animated, Easing, Image, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Dimensions, Keyboard, KeyboardEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomText from '../../components/CustomText';
import { auth } from '../../firebase/config';
import loginStyles from '../styles/loginStyles';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Preload background image to prevent lag
  const backgroundImage = require('../../assets/images/login:signup/bg.png');
  
  // State to ensure background images are properly sized
  const [backgroundReady, setBackgroundReady] = useState(false);
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'input' | 'password'>('input');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [anim] = useState(new Animated.Value(60)); // For password slide up
  const outlineAnim = useRef(new Animated.Value(0)).current; // 0 for email, 1 for phone
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardDismissing, setIsKeyboardDismissing] = useState(false);

  // Ensure background images are properly sized
  useEffect(() => {
    const timer = setTimeout(() => {
      setBackgroundReady(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  const { width, height } = Dimensions.get('window');

  const MODAL_WIDTH = width - 48;
  const MODAL_HEIGHT = 420;
  const modalAnim = useRef(new Animated.Value(MODAL_HEIGHT + 80)).current; // Increased from 40 to 80 to move modal higher
  const keyboardOffset = 20;
  
  // Entrance animations for fly-in effects
  const orangeBackgroundAnim = useRef(new Animated.Value(200)).current; // Start off-screen
  const welcomeModalAnim = useRef(new Animated.Value(300)).current; // Start off-screen
  const logoSizeAnim = useRef(new Animated.Value(1)).current; // Logo size animation (1 = normal, 0.7 = smaller)

  useEffect(() => {
    // Main modal entrance animation
    Animated.spring(modalAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 7,
      tension: 60,
    }).start();

    // Orange background fly-in animation
    Animated.spring(orangeBackgroundAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();

    // Welcome modal fly-in animation
    Animated.spring(welcomeModalAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();

    const handleKeyboardShow = (e: KeyboardEvent) => {
      setIsKeyboardDismissing(false);
      const keyboardHeight = e.endCoordinates.height;
      const screenHeight = Dimensions.get('window').height;
      const maxOffset = Math.min(keyboardHeight * 0.01, 2); // Reduced offset even more
      
      // Animate modal up
      Animated.timing(modalAnim, {
        toValue: -maxOffset,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
      
      // Animate logo smaller
      Animated.timing(logoSizeAnim, {
        toValue: 0.7,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    };
    const handleKeyboardHide = () => {
      if (!isKeyboardDismissing) {
        // Animate modal back to original position
        Animated.timing(modalAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }).start();
        
        // Animate logo back to normal size
        Animated.timing(logoSizeAnim, {
          toValue: 1,
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
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/operation-not-allowed':
        return 'This operation is not allowed.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
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

  const handleForgotPassword = async () => {
    if (tab !== 'email') {
      setError('Password reset is only available for email login.');
      return;
    }
    
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }

    setForgotPasswordLoading(true);
    setError('');
    
    try {
      await sendPasswordResetEmail(auth, email);
      setForgotPasswordSent(true);
      setForgotPasswordLoading(false);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(getFriendlyErrorMessage(error.code));
      setForgotPasswordLoading(false);
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
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                  {backgroundReady && (
          <Image 
            source={backgroundImage} 
            style={{
              position: 'absolute',
              top: -insets.top, // Extend above safe area to cover status bar
              left: 0,
              right: 0,
              width: '100%',
              height: (height * 0.5) + insets.top, // Add status bar height to cover full area
              resizeMode: 'cover',
              zIndex: 1,
            }}
            fadeDuration={0}
          />
        )}
          
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
              <Image source={require('../../assets/Punch_Logos/Punch_T/black_logo.png')} style={{ width: 80, height: 80, resizeMode: 'contain' }} />
            </View>
          </Animated.View>
        {/* Orange circular rectangle background - behind the modal */}
        <Animated.View style={{
          position: 'absolute',
          top: '28%', // Position slightly lower down
          left: '3%', // 3% margin on each side for 94% width
          right: '3%', // 3% margin on each side for 94% width
          height: 200, // Much taller to be clearly visible
          backgroundColor: '#FB7A20',
          borderRadius: 20,
          zIndex: 8, // Higher z-index to ensure visibility
          transform: [{ translateY: orangeBackgroundAnim }], // Fly-in animation
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
        
        {/* Animated modal card */}
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <Animated.View style={{
            position: 'absolute',
            left: 0, // No left margin for edge-to-edge
            right: 0, // No right margin for edge-to-edge
            bottom: -40, // Position modal 40px down from bottom (lower on screen)
            width: '100%', // Full width edge-to-edge
            zIndex: 10,
            height: step === 'password' ? '85%' : '75%', // Increase height when password step is shown
            backgroundColor: 'transparent',
            justifyContent: 'flex-start', // Start content from top of modal
            alignSelf: 'center',
            transform: [{ translateY: welcomeModalAnim }], // Fly-in animation from bottom
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 12,
          }}>
          <View
            style={{
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 0, // Remove bottom border radius for edge-to-edge
              borderBottomRightRadius: 0, // Remove bottom border radius for edge-to-edge
              paddingHorizontal: 32,
              paddingTop: 32,
              paddingBottom: 0, // Remove bottom padding to reach edge
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
                    
                    {/* Forgot Password Link */}
                    <TouchableOpacity 
                      onPress={handleForgotPassword}
                      disabled={forgotPasswordLoading}
                      style={{ 
                        alignSelf: 'flex-end', 
                        marginTop: 8, 
                        marginBottom: 16,
                        paddingVertical: 4,
                        paddingHorizontal: 8
                      }}
                    >
                      {forgotPasswordLoading ? (
                        <ActivityIndicator size="small" color="#FB7A20" />
                      ) : forgotPasswordSent ? (
                        <CustomText variant="body" weight="medium" fontFamily="figtree" style={{ color: '#4CAF50', fontSize: 14 }}>
                          ✓ Reset email sent!
                        </CustomText>
                      ) : (
                        <CustomText variant="body" weight="medium" fontFamily="figtree" style={{ color: '#FB7A20', fontSize: 14 }}>
                          Forgot Password?
                        </CustomText>
                      )}
                    </TouchableOpacity>
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
          </View>
          </Animated.View>
        </TouchableWithoutFeedback>
        </View>
    </KeyboardAvoidingView>
  );
}