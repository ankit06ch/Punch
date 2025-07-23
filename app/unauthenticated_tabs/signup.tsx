import { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Animated, Easing, Dimensions } from 'react-native';
import { auth, db } from '../../firebase/config';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, getDocs, collection, query, where } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../../components/CustomText';
import { AntDesign } from '@expo/vector-icons';

const steps = [
  {
    key: 'name',
    prompt: "First things first, what's your name?",
    placeholder: 'Your full name',
    icon: 'user',
    validate: (val: string) => val.trim().length > 1 || 'Please enter your name.',
  },
  {
    key: 'username',
    prompt: "Nice to meet you! What should we call you? (Pick a username)",
    placeholder: 'Username',
    icon: 'tag',
    validate: (val: string) => val.trim().length > 2 || 'Username must be at least 3 characters.',
  },
  {
    key: 'bio',
    prompt: "Want to add a short bio? (Optional)",
    placeholder: 'Tell us about yourself (or skip)',
    icon: 'edit',
    validate: () => true, // Optional
  },
  {
    key: 'contact',
    prompt: "How should we contact you?",
    placeholder: '',
    icon: '',
    validate: () => true,
  },
  {
    key: 'email',
    prompt: "What's your email address?",
    placeholder: 'Email',
    icon: 'mail',
    validate: (val: string) => /.+@.+\..+/.test(val) || 'Please enter a valid email.',
  },
  {
    key: 'phone',
    prompt: "What's your phone number?",
    placeholder: 'Phone number',
    icon: 'phone',
    validate: (val: string) => val.replace(/\D/g, '').length === 10 || 'Please enter a valid 10-digit phone number.',
  },
  {
    key: 'password',
    prompt: "Set a password to keep your account safe.",
    placeholder: 'Password',
    icon: 'lock',
    secure: true,
    validate: (val: string) => val.length >= 6 || 'Password should be at least 6 characters.',
  },
  {
    key: 'summary',
    prompt: "All set! Let's review your info before creating your account.",
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
  const [form, setForm] = useState({ name: '', username: '', bio: '', email: '', phone: '', password: '' });
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle');
  const anim = useState(new Animated.Value(0))[0];
  // Typewriter effect
  const [typedPrompt, setTypedPrompt] = useState('');
  const promptTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animate step transitions
  const animateStep = () => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  };

  // Typewriter effect for prompt
  useEffect(() => {
    const current = steps[step];
    setTypedPrompt('');
    if (promptTimeout.current) clearTimeout(promptTimeout.current);
    let i = 0;
    function typeNext() {
      setTypedPrompt(current.prompt.slice(0, i));
      if (i <= current.prompt.length) {
        promptTimeout.current = setTimeout(typeNext, 18 + Math.random() * 30);
        i++;
      }
    }
    typeNext();
    return () => {
      if (promptTimeout.current) clearTimeout(promptTimeout.current);
    };
  }, [step]);

  // Username check
  const checkUsername = async (username: string) => {
    setUsernameCheck('checking');
    const querySnapshot = await getDocs(query(collection(db, 'users'), where('username', '==', username)));
    if (!querySnapshot.empty) {
      setUsernameCheck('taken');
      setError('This username is already taken.');
      return false;
    }
    setUsernameCheck('available');
    setError('');
    return true;
  };

  // Handle next step
  const handleNext = async () => {
    setError('');
    const current = steps[step];
    const value = form[current.key as keyof typeof form];
    if (current.key === 'bio') {
      setStep(step + 1);
      animateStep();
      return;
    }
    if (current.key === 'username') {
      if (typeof current.validate === 'function') {
        const valid = current.validate(value);
        if (valid !== true) {
          setError(typeof valid === 'string' ? valid : 'Please enter a username.');
          return;
        }
      }
      const ok = await checkUsername(value);
      if (!ok) return;
      setStep(step + 1);
      animateStep();
      return;
    }
    // Contact step: choose email or phone
    if (current.key === 'contact') {
      setStep(step + 1);
      animateStep();
      return;
    }
    // Email/phone step: validate only the selected mode
    if ((current.key === 'email' && mode === 'email') || (current.key === 'phone' && mode === 'phone')) {
      if (typeof current.validate === 'function') {
        const valid = current.validate(value);
        if (valid !== true) {
          setError(typeof valid === 'string' ? valid : 'Please fill this in.');
          return;
        }
      }
      setStep(step + 1);
      animateStep();
      return;
    }
    // Skip phone/email step if not selected
    if ((current.key === 'email' && mode === 'phone') || (current.key === 'phone' && mode === 'email')) {
      setStep(step + 1);
      animateStep();
      return;
    }
    if (typeof current.validate === 'function') {
      const valid = current.validate(value);
      if (valid !== true) {
        setError(typeof valid === 'string' ? valid : 'Please fill this in.');
        return;
      }
    }
    setStep(step + 1);
    animateStep();
  };

  // Handle back
  const handleBack = () => {
    if (step === 0) {
      router.replace('/unauthenticated_tabs/onboarding');
      return;
    }
    setError('');
    setStep(step - 1);
    animateStep();
  };

  // Handle signup
  const handleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: form.name,
        username: form.username,
        bio: form.bio,
        profilePictureUrl: '',
        storesVisitedCount: 0,
        storesVisitedHistory: [],
        rewardsRedeemed: [],
        followersCount: 0,
        followingCount: 0,
        followerUids: [],
        followingUids: [],
      });
      router.replace('../authenticated_tabs/home');
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code));
    }
    setLoading(false);
  };

  // Animated progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / (steps.length - 1), // Exclude summary
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [step]);

  // Step content
  const current = steps[step];
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

  return (
    // soft peachy background
    <View style={[styles.container, { backgroundColor: '#FFF7F2' }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Back Button at top left of screen */}
        <TouchableOpacity style={styles.backButtonScreen} onPress={handleBack}>
          <AntDesign name="arrowleft" size={28} color="#FB7A20" />
        </TouchableOpacity>
        {/* Logo above card */}
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/Punch_Logos/Punch_T/black_logo.png')} style={styles.logo} />
        </View>
        {/* Animated progress bar above card */}
        <View style={styles.progressBarWrap}>
          <Animated.View
            style={{
              height: 6,
              backgroundColor: '#FB7A20',
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          />
        </View>
        {/* Card/modal effect for the form */}
        <View style={styles.cardModal}>
          <Animated.View
            style={{
              width: '100%',
              alignItems: 'center',
              opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
            }}
          >
            {/* Animated typewriter prompt */}
            <CustomText variant="title" weight="bold" style={styles.prompt}>
              {typedPrompt}
              <Animated.Text style={{ opacity: 0.7, fontSize: 22, color: '#FB7A20' }}>|</Animated.Text>
            </CustomText>
            {/* Contact method tab switcher */}
            {current.key === 'contact' && renderContactTabs()}
            {/* Email/phone input step */}
            {((current.key === 'email' && mode === 'email') || (current.key === 'phone' && mode === 'phone')) && (
              <View style={styles.inputContainer}>
                <AntDesign name={current.icon as any} size={20} color="#FB7A20" style={styles.inputIcon} />
                <TextInput
                  placeholder={current.placeholder}
                  style={styles.input}
                  value={mode === 'email' ? form.email : formatPhoneNumber(form.phone)}
                  onChangeText={text => {
                    setForm({ ...form, [mode]: mode === 'email' ? text : text.replace(/\D/g, '').slice(0, 10) });
                    setError('');
                  }}
                  autoCapitalize="none"
                  placeholderTextColor="#aaa"
                  keyboardType={mode === 'email' ? 'email-address' : 'phone-pad'}
                  editable={!loading}
                  maxLength={mode === 'email' ? 30 : 12}
                  onSubmitEditing={handleNext}
                  returnKeyType="next"
                />
              </View>
            )}
            {/* All other steps */}
            {!isSummary && !['contact', 'email', 'phone'].includes(current.key) && (
              <View style={styles.inputContainer}>
                <AntDesign name={current.icon as any} size={20} color="#FB7A20" style={styles.inputIcon} />
                <TextInput
                  placeholder={current.placeholder}
                  style={styles.input}
                  value={form[current.key as keyof typeof form] as string}
                  onChangeText={text => {
                    setForm({ ...form, [current.key]: text });
                    setError('');
                    if (current.key === 'username') setUsernameCheck('idle');
                  }}
                  autoCapitalize={current.key === 'name' ? 'words' : 'none'}
                  placeholderTextColor="#aaa"
                  secureTextEntry={current.secure}
                  editable={!loading}
                  multiline={current.key === 'bio'}
                  numberOfLines={current.key === 'bio' ? 3 : 1}
                  onSubmitEditing={handleNext}
                  returnKeyType="next"
                />
                {/* Username check indicator */}
                {current.key === 'username' && usernameCheck === 'checking' && (
                  <ActivityIndicator size="small" color="#FB7A20" style={{ marginLeft: 8 }} />
                )}
                {current.key === 'username' && usernameCheck === 'taken' && (
                  <AntDesign name="closecircle" size={18} color="#FB7A20" style={{ marginLeft: 8 }} />
                )}
                {current.key === 'username' && usernameCheck === 'available' && (
                  <AntDesign name="checkcircle" size={18} color="#4BB543" style={{ marginLeft: 8 }} />
                )}
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
            <View style={styles.buttonRow}>
              {step > 0 && !isSummary && (
                <TouchableOpacity style={styles.secondaryButton} onPress={handleBack} disabled={loading}>
                  <CustomText variant="button" weight="bold" style={styles.secondaryButtonText}>Back</CustomText>
                </TouchableOpacity>
              )}
              {!isSummary && (
                <TouchableOpacity
                  style={[styles.nextButton, loading && styles.nextButtonDisabled]}
                  onPress={handleNext}
                  disabled={loading}
                >
                  <CustomText variant="button" weight="bold" style={styles.nextButtonText}>
                    Next
                  </CustomText>
                </TouchableOpacity>
              )}
              {isSummary && (
                <TouchableOpacity
                  style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                  onPress={handleSignup}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FB7A20" />
                  ) : (
                    <CustomText variant="button" weight="bold" style={styles.signupButtonText}>
                      Create Account
                    </CustomText>
                  )}
                </TouchableOpacity>
              )}
            </View>
            {/* Summary */}
            {isSummary && (
              <View style={styles.summaryBox}>
                <CustomText variant="body" weight="semibold" style={{ marginBottom: 8 }}>
                  <AntDesign name="user" size={16} color="#FB7A20" />  {form.name}
                </CustomText>
                <CustomText variant="body" weight="semibold" style={{ marginBottom: 8 }}>
                  <AntDesign name="tag" size={16} color="#FB7A20" />  @{form.username}
                </CustomText>
                {form.bio ? (
                  <CustomText variant="body" weight="normal" style={{ marginBottom: 8 }}>
                    <AntDesign name="edit" size={16} color="#FB7A20" />  {form.bio}
                  </CustomText>
                ) : null}
                {mode === 'email' && (
                  <CustomText variant="body" weight="normal" style={{ marginBottom: 8 }}>
                    <AntDesign name="mail" size={16} color="#FB7A20" />  {form.email}
                  </CustomText>
                )}
                {mode === 'phone' && (
                  <CustomText variant="body" weight="normal" style={{ marginBottom: 8 }}>
                    <AntDesign name="phone" size={16} color="#FB7A20" />  {formatPhoneNumber(form.phone)}
                  </CustomText>
                )}
              </View>
            )}
          </Animated.View>
        </View>
        {/* Login Link */}
        <View style={styles.loginContainer}>
          <CustomText variant="body" weight="normal" style={styles.loginText}>
            Already have an account?{' '}
          </CustomText>
          <TouchableOpacity onPress={() => router.push('../unauthenticated_tabs/login')}>
            <CustomText variant="body" weight="bold" style={styles.loginLink}>
              Login
            </CustomText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
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