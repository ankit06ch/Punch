import { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Animated, Easing, Keyboard, TouchableWithoutFeedback, Switch, KeyboardAvoidingView, Platform, Linking, Dimensions } from 'react-native';
// Custom Checkbox
function CustomCheckbox({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: value ? '#FB7A20' : '#ccc',
        backgroundColor: value ? '#FB7A20' : '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
    >
      {value && <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#fff' }} />}
    </TouchableOpacity>
  );
}
import { auth, db } from '../../firebase/config';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, getDocs, collection, query, where } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../../components/CustomText';
import { AntDesign } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import onboardingStyles from '../styles/onboardingStyles';
import Svg, { Path, Circle, G } from 'react-native-svg';
import AnimatedBubblesBackground from '../components/AnimatedBubblesBackground';
import { KeyboardEvent } from 'react-native';

const { width } = Dimensions.get('window');
const MODAL_WIDTH = width - 48;
const MODAL_HEIGHT = 420;

function CircularProgressWithLogo({ progress }: { progress: number }) {
  const size = 120;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedStroke = circumference * (1 - progress);
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
      <View style={{ position: 'relative', width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={'rgba(255,255,255,0.25)'}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Path
            stroke="#FB7A20"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animatedStroke}
            d={`M${size / 2},${size / 2} m0,-${radius} a${radius},${radius} 0 1,1 0,${2 * radius} a${radius},${radius} 0 1,1 0,-${2 * radius}`}
          />
        </Svg>
        <View style={{
          position: 'absolute',
          left: size / 2 - 40,
          top: size / 2 - 40,
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
        }}>
          <Image source={require('../../assets/Punch_Logos/Punch_T/black_logo.png')} style={{ width: 48, height: 48, resizeMode: 'contain' }} />
        </View>
      </View>
    </View>
  );
}

// Update the password step prompt
const steps = [
  {
    key: 'name',
    prompt: "First things first, what's your name?",
    placeholder: 'Your full name',
    icon: 'user',
    validate: (val: string) => val.trim().length > 1 || 'Please enter your name.',
  },
  {
    key: 'contact',
    prompt: "How can we reach you?",
    icon: 'mail',
    validate: (form: any) => {
      if (!form.email || !/.+@.+\..+/.test(form.email)) return 'Please enter a valid email.';
      // phone is optional
      return true;
    },
  },
  {
    key: 'password',
    prompt: "Finally, set a password to keep your account safe.",
    placeholder: 'Password',
    icon: 'lock',
    secure: true,
    validate: (val: string) => val.length >= 6 || 'Password should be at least 6 characters.',
  },
];

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  const parts = [];
  if (digits.length > 0) parts.push(digits.slice(0, 3));
  if (digits.length > 3) parts.push(digits.slice(3, 6));
  if (digits.length > 6) parts.push(digits.slice(6, 10));
  return parts.join('-');
}

function getFriendlyErrorMessage(errorCode: string) {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already in use. Please try logging in.';
    case 'auth/invalid-email':
      return 'The email address is not valid.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifText, setNotifText] = useState(false);
  // Remove modalVisible state and logic
  // Remove the setTimeout for modalVisible in useEffect
  // Always render the modal when SignupScreen is mounted
  const modalAnim = useRef(new Animated.Value(MODAL_HEIGHT + 80)).current;
  const keyboardOffset = 80; // how much to move modal up when keyboard is open

  useEffect(() => {
    // Animate modal in (fly up) only when component is mounted
    Animated.spring(modalAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 7,
      tension: 60,
    }).start();

    // Keyboard listeners
    const handleKeyboardShow = (e: KeyboardEvent) => {
      Animated.timing(modalAnim, {
        toValue: -keyboardOffset,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    };
    const handleKeyboardHide = () => {
      Animated.timing(modalAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    };
    const showSub = Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Step content
  const current = steps[step] || steps[steps.length - 1];
  const isSummary = current.key === 'summary';

  // Tab switcher for contact method
  const renderContactTabs = () => (
    <View style={{ flexDirection: 'row', width: '80%', marginBottom: 16, alignSelf: 'center', gap: 8 }}>
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: mode === 'email' ? '#FB7A20' : '#f2f2f2',
          borderRadius: 12,
          paddingVertical: 12,
          alignItems: 'center',
          borderWidth: 0,
        }}
        onPress={() => setMode('email')}
      >
        <CustomText style={{ color: mode === 'email' ? 'white' : '#7A7A7A', fontWeight: '600', fontSize: 16 }}>Email</CustomText>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: mode === 'phone' ? '#FB7A20' : '#f2f2f2',
          borderRadius: 12,
          paddingVertical: 12,
          alignItems: 'center',
          borderWidth: 0,
        }}
        onPress={() => setMode('phone')}
      >
        <CustomText style={{ color: mode === 'phone' ? 'white' : '#7A7A7A', fontWeight: '600', fontSize: 16 }}>Phone</CustomText>
      </TouchableOpacity>
    </View>
  );

  const handleNext = async () => {
    setError('');
    const current = steps[step];
    const value = form[current.key as keyof typeof form];
    if (current.key === 'contact') {
      if (typeof current.validate === 'function') {
        const valid = current.validate(form);
        if (valid !== true) {
          setError(typeof valid === 'string' ? valid : 'Please fill this in.');
          return;
        }
      }
      if (step < steps.length - 1) {
        setStep(step + 1);
      }
      return;
    }
    if (typeof current.validate === 'function') {
      const valid = current.validate(value);
      if (valid !== true) {
        setError(typeof valid === 'string' ? valid : 'Please fill this in.');
        return;
      }
    }
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 0) {
      // Animate signup modal down before navigating back to onboarding
      Animated.timing(modalAnim, {
        toValue: MODAL_HEIGHT + 80,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.cubic),
      }).start(() => {
        router.replace('/unauthenticated_tabs/onboarding?fromSignup=1');
      });
      return;
    }
    setError('');
    setStep(step - 1);
  };

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: form.name,
        bio: '', // Removed bio
        profilePictureUrl: '',
        storesVisitedCount: 0,
        storesVisitedHistory: [],
        rewardsRedeemed: [],
        followersCount: 0,
        followingCount: 0,
        followerUids: [],
        followingUids: [],
        emailNotifications: notifEmail, // Added email notifications
        textNotifications: notifText, // Added text notifications
      });
      router.replace('../authenticated_tabs/home');
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code));
    }
    setLoading(false);
  };

  return (
    // soft peachy background
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[onboardingStyles.container, { backgroundColor: '#FFF7F2' }]}> {/* Use onboardingStyles */}
        <AnimatedBubblesBackground />
        <SafeAreaView style={onboardingStyles.safeArea}>
          {/* Back Button at top left of screen */}
          <TouchableOpacity style={styles.backButtonScreen} onPress={handleBack}>
            <AntDesign name="arrowleft" size={28} color="#FB7A20" />
          </TouchableOpacity>
          {/* Logo and circular progress above card */}
          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
            <CircularProgressWithLogo progress={(step + 1) / steps.length} />
          </View>
          {/* Card/modal effect for the form, wrapped in KeyboardAvoidingView */}
          <KeyboardAvoidingView
            style={{ flex: 1, width: '100%' }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <Animated.View style={{
              position: 'absolute',
              left: 24,
              right: 24,
              bottom: 0,
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
                {/* Animated typewriter prompt and all step content here (move from Animated.View) */}
                <CustomText variant="title" weight="bold" style={styles.prompt}>
                  {current.prompt}
                </CustomText>
                {/* Name step: show name input */}
                {current.key === 'name' && (
                  <View style={styles.inputContainer}>
                    <AntDesign name="user" size={20} color="#FB7A20" style={styles.inputIconCentered} />
                    <TextInput
                      placeholder="Your full name"
                      style={styles.input}
                      value={form.name}
                      onChangeText={text => {
                        setForm({ ...form, name: text });
                        setError('');
                      }}
                      autoCapitalize="words"
                      placeholderTextColor="#aaa"
                      editable={!loading}
                      maxLength={40}
                      onSubmitEditing={handleNext}
                      returnKeyType="next"
                    />
                  </View>
                )}
                {/* Password step: show password input */}
                {current.key === 'password' && (
                  <>
                    <View style={styles.inputContainer}>
                      <AntDesign name="lock" size={20} color="#FB7A20" style={styles.inputIconCentered} />
                      <TextInput
                        placeholder="Password"
                        style={styles.input}
                        value={form.password}
                        onChangeText={text => {
                          setForm({ ...form, password: text });
                          setError('');
                        }}
                        autoCapitalize="none"
                        placeholderTextColor="#aaa"
                        secureTextEntry={true}
                        editable={!loading}
                        maxLength={30}
                        onSubmitEditing={handleNext}
                        returnKeyType="done"
                      />
                    </View>
                    {/* Terms and Privacy checkbox */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 8 }}>
                      <CustomCheckbox value={agree} onValueChange={setAgree} />
                      <CustomText style={{ marginLeft: 8, color: '#222' }}>
                        I agree to <CustomText style={{ color: '#FB7A20', textDecorationLine: 'underline' }} onPress={() => Linking.openURL('https://your-terms-url.com')}>Terms of Service</CustomText> & <CustomText style={{ color: '#FB7A20', textDecorationLine: 'underline' }} onPress={() => Linking.openURL('https://your-privacy-url.com')}>Privacy Policy</CustomText>
                      </CustomText>
                    </View>
                    {/* Back and Create Account buttons in the same row */}
                    <View style={styles.buttonRow}>
                      {step > 0 && (
                        <TouchableOpacity style={styles.secondaryButton} onPress={handleBack} disabled={loading}>
                          <CustomText variant="button" weight="bold" style={styles.secondaryButtonText}>Back</CustomText>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.signupButton, (!agree || loading || !(form.password && form.password.length >= 6)) && styles.signupButtonDisabled]}
                        onPress={handleSignup}
                        disabled={!agree || loading || !(form.password && form.password.length >= 6)}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#FB7A20" />
                        ) : (
                          <CustomText variant="button" weight="bold" style={styles.signupButtonText}>
                            Create Account
                          </CustomText>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
                {/* Contact step: show both email and phone fields */}
                {current.key === 'contact' && (
                  <View style={{ width: '100%', alignItems: 'center' }}>
                    <View style={styles.inputContainer}>
                      <AntDesign name="mail" size={20} color="#FB7A20" style={styles.inputIconCentered} />
                      <TextInput
                        placeholder="Email"
                        style={styles.input}
                        value={form.email}
                        onChangeText={text => {
                          setForm({ ...form, email: text });
                          setError('');
                        }}
                        autoCapitalize="none"
                        placeholderTextColor="#aaa"
                        keyboardType="email-address"
                        editable={!loading}
                        maxLength={30}
                        onSubmitEditing={handleNext}
                        returnKeyType="next"
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <AntDesign name="phone" size={20} color="#FB7A20" style={styles.inputIconCentered} />
                      <TextInput
                        placeholder="Phone (optional)"
                        style={styles.input}
                        value={formatPhoneNumber(form.phone)}
                        onChangeText={text => {
                          setForm({ ...form, phone: text.replace(/\D/g, '').slice(0, 10) });
                          setError('');
                        }}
                        autoCapitalize="none"
                        placeholderTextColor="#aaa"
                        keyboardType="phone-pad"
                        editable={!loading}
                        maxLength={12}
                        onSubmitEditing={handleNext}
                        returnKeyType="next"
                      />
                    </View>
                  </View>
                )}
                {/* Notification preferences */}
                {current.key === 'contact' && (
                  <View style={{ width: '100%', marginTop: 12, marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Switch value={notifEmail} onValueChange={setNotifEmail} thumbColor={notifEmail ? '#FB7A20' : '#ccc'} trackColor={{ true: '#fcd7b0', false: '#eee' }} />
                      <CustomText style={{ marginLeft: 8, color: '#222' }}>Email me updates & rewards</CustomText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Switch value={notifText} onValueChange={setNotifText} thumbColor={notifText ? '#FB7A20' : '#ccc'} trackColor={{ true: '#fcd7b0', false: '#eee' }} />
                      <CustomText style={{ marginLeft: 8, color: '#222' }}>Text me updates & rewards</CustomText>
                    </View>
                  </View>
                )}
                {/* Error message */}
                {error ? (
                  <View style={styles.errorContainer}>
                    <AntDesign name="exclamationcircleo" size={16} color="#FB7A20" />
                    <CustomText variant="body" weight="medium" style={styles.errorText}>
                      {error}
                    </CustomText>
                  </View>
                ) : null}
                {/* Step navigation */}
                {/* On the name step, show only Next (disabled unless valid), no Back */}
                {current.key === 'name' && (
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.nextButton, (loading || !(form.name && form.name.trim().length > 1)) && styles.nextButtonDisabled]}
                      onPress={handleNext}
                      disabled={loading || !(form.name && form.name.trim().length > 1)}
                    >
                      <CustomText variant="button" weight="bold" style={styles.nextButtonText}>
                        Next
                      </CustomText>
                    </TouchableOpacity>
                  </View>
                )}
                {/* On the contact step, show Back and Next (Next disabled unless valid) */}
                {current.key === 'contact' && (
                  <View style={styles.buttonRow}>
                    {step > 0 && (
                      <TouchableOpacity style={styles.secondaryButton} onPress={handleBack} disabled={loading}>
                        <CustomText variant="button" weight="bold" style={styles.secondaryButtonText}>Back</CustomText>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.nextButton, (loading || !form.email || !/.+@.+\..+/.test(form.email)) && styles.nextButtonDisabled]}
                      onPress={handleNext}
                      disabled={loading || !form.email || !/.+@.+\..+/.test(form.email)}
                    >
                      <CustomText variant="button" weight="bold" style={styles.nextButtonText}>
                        Next
                      </CustomText>
                    </TouchableOpacity>
                  </View>
                )}
                {/* On the password step, do not render Back or Next buttons */}
                {/* Login Link inside modal */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
                  <CustomText variant="body" weight="normal" style={styles.loginText}>
                    Already have an account?{' '}
                  </CustomText>
                  <TouchableOpacity onPress={() => router.push('../unauthenticated_tabs/login')}>
                    <CustomText variant="body" weight="bold" style={styles.loginLink}>
                      Login
                    </CustomText>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </Animated.View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    padding: 8,
  },
  backButtonScreen: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    padding: 8,
  },
  logoContainer: {
    marginTop: 48,
    marginBottom: 24,
    alignItems: 'center',
  },
  logo: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  prompt: {
    color: '#222',
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    width: '90%',
    alignSelf: 'center',
  },
  inputIcon: {
    marginRight: 12,
    marginTop: 16,
  },
  input: {
    flex: 1,
    color: 'black',
    fontSize: 16,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,122,32,0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    marginTop: 4,
  },
  errorText: {
    color: '#FB7A20',
    marginLeft: 8,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    gap: 12,
  },
  nextButton: {
    backgroundColor: '#FB7A20',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#FB7A20',
    alignItems: 'center',
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#FB7A20',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupButton: {
    backgroundColor: '#FB7A20',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 180,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#eee',
    marginHorizontal: 3,
  },
  progressDotActive: {
    backgroundColor: '#FB7A20',
  },
  summaryBox: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 12,
    padding: 18,
    marginTop: 16,
    width: '90%',
    alignSelf: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: 'black',
    opacity: 0.8,
  },
  loginLink: {
    color: '#FB7A20',
    textDecorationLine: 'underline',
  },
  cardModal: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 28,
    padding: 28,
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 16,
    shadowColor: '#FB7A20',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 12,
    alignSelf: 'center',
    width: '94%',
    maxWidth: 420,
    minHeight: 320,
    alignItems: 'center',
    position: 'relative',
  },
  cardModalFull: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 28,
    marginHorizontal: 0,
    marginTop: 32,
    marginBottom: 0,
    shadowColor: '#FB7A20',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 12,
    alignSelf: 'stretch',
    width: '100%',
    maxWidth: undefined,
    minHeight: 320,
    alignItems: 'center',
    position: 'relative',
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  inputIconCentered: {
    marginRight: 12,
    alignSelf: 'center',
    marginTop: 0,
  },
  progressBarWrap: {
    width: '94%',
    maxWidth: 420,
    alignSelf: 'center',
    height: 6,
    backgroundColor: '#f3e1d2',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
});