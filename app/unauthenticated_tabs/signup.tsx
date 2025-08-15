import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useRef, useState, useEffect } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, View, Dimensions, Keyboard, KeyboardEvent, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';

import { auth, db } from '../../firebase/config';
import { setDoc, doc, query, collection, where, getDocs } from 'firebase/firestore';
import { pickProfilePicture, uploadProfilePicture } from '../../utils/profilePictureUtils';
import AccountTypeSelection from '../components/AccountTypeSelection';
import SignupForm from '../components/SignupForm';
import SignupNavigation from '../components/SignupNavigation';
import SignupBackground from '../components/SignupBackground';
import CustomText from '../../components/CustomText';
import loginStyles from '../styles/loginStyles';

export default function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState<number>(0);
  const [isBusiness, setIsBusiness] = useState<boolean | null>(null);
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '',
    businessName: '',
    cuisine: [] as string[],
    customCuisine: '',
    pricing: '',
    address: '',
    hours: {
      monday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
      tuesday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
      wednesday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
      thursday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
      friday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
      saturday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
      sunday: { isOpen: true, slots: [{ open: '09:00', close: '17:00' }] },
    },
    logo: null as string | null,
  });
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  
  // Debug mode changes
  useEffect(() => {
    console.log('Mode changed to:', mode);
  }, [mode]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifText, setNotifText] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardDismissing, setIsKeyboardDismissing] = useState(false);
  const [showMoreCuisine, setShowMoreCuisine] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');


  const { width, height } = Dimensions.get('window');

  // Safety check for dimensions
  const safeHeight = height && !isNaN(height) && isFinite(height) ? height : 800;
  const safeWidth = width && !isNaN(width) && isFinite(width) ? width : 400;
  
  const MODAL_HEIGHT = 420;
  const modalAnim = useRef(new Animated.Value(MODAL_HEIGHT + 80)).current;
  
  // Entrance animations for fly-in effects
  const orangeBackgroundAnim = useRef(new Animated.Value(200)).current;
  const welcomeModalAnim = useRef(new Animated.Value(300)).current;
  const logoSizeAnim = useRef(new Animated.Value(1)).current;
  const pulsateAnim = useRef(new Animated.Value(1)).current;
  
  // Ensure all animation values are valid numbers
  useEffect(() => {
    // Reset any potentially corrupted animation values
    orangeBackgroundAnim.setValue(200);
    welcomeModalAnim.setValue(300);
    logoSizeAnim.setValue(1);
    pulsateAnim.setValue(1);
  }, []);

  // Loading messages for the loading screen
  const loadingMessages = [
    "Warming up the gloves… 🥊",
    "Wrapping your hands for the big fight…",
    "Getting in your corner…",
    "Bouncing on our toes…",
    "Loading punches… please dodge.",
    "Sharpening the one-two combo…"
  ];



  // Cuisine options
  const cuisineOptions = [
    'American', 'Bar', 'BBQ', 'Bakery', 'Breakfast', 'Brunch', 'Burgers', 'Cafe',
    'Chinese', 'Indian', 'Italian', 'Japanese', 'Korean', 'Mexican', 'Thai',
    'Vegan', 'Vegetarian', 'Mediterranean', 'Middle Eastern', 'French', 'Greek',
    'Spanish', 'Vietnamese', 'Korean BBQ', 'Sushi', 'Pizza', 'Steakhouse',
    'Seafood', 'Deli', 'Food Truck', 'Fine Dining', 'Fast Food', 'Dessert',
    'Coffee Shop', 'Tea House', 'Wine Bar', 'Cocktail Bar', 'Brewery'
  ];

  // Step definitions
  const businessSteps = [
    { key: 'contact', prompt: "How can we reach you?", icon: 'mail' },
    { key: 'password', prompt: "Create a password", icon: 'lock' },
    { key: 'name', prompt: "What's your name?", placeholder: 'Your full name', icon: 'user' },
    { key: 'businessName', prompt: "What's your business name?", placeholder: 'Sushi Town', icon: 'home' },
    { key: 'cuisine', prompt: "What type of cuisine do you serve?", icon: 'tag' },
    { key: 'pricing', prompt: "What's your average price per person?", placeholder: '50 or 50$', icon: 'tag' },
    { key: 'address', prompt: "Where is your business located?", placeholder: '123 Main St, San Francisco, CA', icon: 'enviroment' },
    { key: 'hours', prompt: "What are your operating hours?", icon: 'clockcircle' },
    { key: 'logo', prompt: "Upload your business logo", icon: 'picture' },
  ];

  const personalSteps = [
    { key: 'contact', prompt: "How can we reach you?", icon: 'mail' },
    { key: 'password', prompt: "Create a password", icon: 'lock' },
    { key: 'name', prompt: "What's your name?", placeholder: 'Your full name', icon: 'user' },
    { key: 'profilePicture', prompt: "Add a profile picture (optional)", icon: 'camera' },
  ];

  const getCurrentSteps = () => {
    if (isBusiness === null) return [];
    return isBusiness ? businessSteps : personalSteps;
  };

  const steps = getCurrentSteps();
  console.log('Steps array:', steps);
  console.log('Current step:', step);

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

  // Start the loading sequence after email/password entry
  const startLoadingSequence = () => {
    const randomLoadingMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    setLoadingMessage(randomLoadingMessage);
    setShowLoadingScreen(true);
    
    // Ensure pulsateAnim starts with a valid value
    pulsateAnim.setValue(1);
    
    const pulsateAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulsateAnim, {
          toValue: 1.4,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(pulsateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
      ])
    );
    
    pulsateAnimation.start();
    
    let hapticCounter = 0;
    const hapticInterval = setInterval(() => {
      hapticCounter++;
      if (hapticCounter > 6) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (hapticCounter > 3) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 200);
    
    setTimeout(() => {
      pulsateAnimation.stop();
      clearInterval(hapticInterval);
      setShowLoadingScreen(false);
        setStep(step + 1);
    }, 3000);
  };

  // Check if email already exists
  const checkEmailExists = async (email: string) => {
    if (!email || !/.+@.+\..+/.test(email)) return false;
    
    try {
      console.log('=== EMAIL VALIDATION DEBUG ===');
      console.log('Checking if email exists:', email);
      console.log('Database reference:', db);
      
      // First, let's test if we can query the database at all
      console.log('Testing database connection...');
      const testRef = collection(db, 'users');
      const testQuery = query(testRef);
      const testSnapshot = await getDocs(testQuery);
      console.log('Database connection test - Total users in collection:', testSnapshot.size);
      
      // Let's also try to see what's in the first few documents
      if (testSnapshot.size > 0) {
        console.log('First few documents:');
        testSnapshot.docs.slice(0, 3).forEach((doc, index) => {
          const data = doc.data();
          console.log(`Document ${index + 1}:`, doc.id);
          console.log('  Data keys:', Object.keys(data));
          console.log('  Full data:', JSON.stringify(data, null, 2));
        });
      } else {
        console.log('No documents found in users collection');
      }
      
      // Check Firestore users collection for specific email
      const usersRef = collection(db, 'users');
      console.log('Users collection reference:', usersRef);
      
      // Try different possible field names for email
      console.log('Trying different email field names...');
      
      // Try 'email' field
      let q = query(usersRef, where('email', '==', email));
      let querySnapshot = await getDocs(q);
      console.log('Query with "email" field - docs found:', querySnapshot.size);
      
      // Try 'emailAddress' field
      q = query(usersRef, where('emailAddress', '==', email));
      querySnapshot = await getDocs(q);
      console.log('Query with "emailAddress" field - docs found:', querySnapshot.size);
      
      // Try 'userEmail' field
      q = query(usersRef, where('userEmail', '==', email));
      querySnapshot = await getDocs(q);
      console.log('Query with "userEmail" field - docs found:', querySnapshot.size);
      
      // Try 'contact' field
      q = query(usersRef, where('contact', '==', email));
      querySnapshot = await getDocs(q);
      console.log('Query with "contact" field - docs found:', querySnapshot.size);
      
      // Now try the original email field for the final result
      q = query(usersRef, where('email', '==', email));
      querySnapshot = await getDocs(q);
      console.log('Final query with "email" field - docs found:', querySnapshot.size);
      
      // Log all documents to see what's in the collection
      querySnapshot.forEach((doc) => {
        console.log('Document found:', doc.id, doc.data());
      });
      
      // Also check if there's already a user signed in with this email
      // This handles the case where a user was created but not yet saved to Firestore
      if (auth.currentUser && auth.currentUser.email === email) {
        console.log('User already signed in with this email');
        return true;
      }
      
      const result = !querySnapshot.empty;
      console.log('Final email exists result:', result);
      console.log('=== END EMAIL VALIDATION DEBUG ===');
      return result;
    } catch (error) {
      console.error('Error checking email:', error);
      console.error('Error details:', error);
      return false;
    }
  };

  // Check if phone already exists
  const checkPhoneExists = async (phone: string) => {
    console.log('=== PHONE VALIDATION DEBUG ===');
    console.log('Checking if phone exists:', phone);
    
    if (!phone || phone.length < 10) {
      console.log('Phone too short, returning false');
      return false;
    }
    
    try {
      const q = query(collection(db, 'users'), where('phone', '==', phone));
      console.log('Phone query created:', q);
      
      const querySnapshot = await getDocs(q);
      console.log('Phone query result - docs found:', querySnapshot.size);
      
      const result = !querySnapshot.empty;
      console.log('Phone exists result:', result);
      console.log('=== END PHONE VALIDATION DEBUG ===');
      return result;
    } catch (error) {
      console.error('Error checking phone:', error);
      console.error('Phone validation error details:', error);
      return false;
    }
  };

  useEffect(() => {
    Animated.spring(modalAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 7,
      tension: 60,
    }).start();

    Animated.spring(orangeBackgroundAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();

    Animated.spring(welcomeModalAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  }, []);

  // Validate email when it changes
  useEffect(() => {
    if (mode === 'email' && form.email) {
      const validateEmail = async () => {
        console.log('Validating email:', form.email);
        setIsValidating(true);
        const exists = await checkEmailExists(form.email);
        console.log('Email validation result:', exists);
        setEmailExists(exists);
        setIsValidating(false);
      };
      
      const timeoutId = setTimeout(validateEmail, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [form.email, mode]);

  // Validate phone when it changes
  useEffect(() => {
    console.log('Phone validation useEffect - mode:', mode, 'phone:', form.phone);
    if (mode === 'phone' && form.phone) {
      const validatePhone = async () => {
        console.log('Validating phone:', form.phone);
        setIsValidating(true);
        const exists = await checkPhoneExists(form.phone);
        console.log('Phone validation result:', exists);
        setPhoneExists(exists);
        setIsValidating(false);
      };
      
      const timeoutId = setTimeout(validatePhone, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [form.phone, mode]);

  useEffect(() => {
    const handleKeyboardShow = (e: KeyboardEvent) => {
      setIsKeyboardDismissing(false);
      const keyboardHeight = e.endCoordinates.height;
      
      // Safety check to ensure keyboardHeight is a valid number
      if (keyboardHeight && !isNaN(keyboardHeight) && isFinite(keyboardHeight)) {
        const modalOffset = -keyboardHeight * 0.35;
        const backgroundOffset = -keyboardHeight * 0.005;
        
        // Only animate if we have valid calculated values
        if (!isNaN(modalOffset) && isFinite(modalOffset)) {
      Animated.timing(modalAnim, {
            toValue: modalOffset,
            duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
        }
      
        if (!isNaN(backgroundOffset) && isFinite(backgroundOffset)) {
      Animated.timing(orangeBackgroundAnim, {
            toValue: backgroundOffset,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
        }
      }
      
      // Logo animation is safe as it uses fixed values
      Animated.timing(logoSizeAnim, {
        toValue: 0.7,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    };

    const handleKeyboardHide = () => {
      if (!isKeyboardDismissing) {
        Animated.timing(modalAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }).start();
        
        Animated.timing(orangeBackgroundAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }).start();
        
        Animated.timing(logoSizeAnim, {
          toValue: 1,
          duration: 300,
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

  const current = steps[step] || steps[steps.length - 1];

  const handleProfilePicturePick = async () => {
    try {
      setUploadingPicture(true);
      setError('');
      
      const result = await pickProfilePicture();
      
      if (result && result.uri) {
        setProfilePicture(result.uri);
      }
    } catch (error) {
      console.error('Profile picture picker failed:', error);
      setError('Unable to open photo picker. Please try again.');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleLogoPick = async () => {
    try {
      setUploadingPicture(true);
      setError('');
      
      const result = await pickProfilePicture();
      
      if (result && result.uri) {
        setForm({ ...form, logo: result.uri });
      }
    } catch (error) {
      console.error('Error picking logo:', error);
      setError('Failed to pick logo. Please try again.');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleAccountTypeSelect = (business: boolean) => {
    setIsBusiness(business);
    setStep(0);
  };

  const handleNext = async () => {
    console.log('handleNext called, current step:', step, 'current key:', steps[step]?.key);
    setError('');
    const current = steps[step];
    
    if (current.key === 'profilePicture' || current.key === 'logo') {
      // For profile picture/logo steps, allow signup if required fields are filled
      if (step < steps.length - 1) {
        setStep(step + 1);
      } else {
        // If this is the last step, try to signup
        await handleSignup();
      }
      return;
    }
    
    if (current.key === 'contact') {
      if (mode === 'email') {
        if (!form.email || !/.+@.+\..+/.test(form.email)) {
          setError('Please enter a valid email address.');
          return;
        }
        if (emailExists) {
          setError('This email is already in use. Please choose a different one.');
          return;
        }
      } else if (mode === 'phone') {
        if (!form.phone || form.phone.length < 10) {
          setError('Please enter a valid phone number.');
          return;
        }
        if (phoneExists) {
          setError('This phone number is already in use. Please choose a different one.');
          return;
        }
      }
      if (step < steps.length - 1) {
        setStep(step + 1);
      }
      return;
    }
    
    if (current.key === 'password') {
      if (!form.password || form.password.length < 6) {
        setError('Password should be at least 6 characters.');
        return;
      }
      if (step < steps.length - 1) {
        setStep(step + 1);
      }
      return;
    }
    
    if (current.key === 'name' || current.key === 'businessName') {
      const value = form[current.key as keyof typeof form];
      if (typeof value === 'string' && (!value || value.trim().length < 2)) {
        setError(`Please enter your ${current.key === 'name' ? 'name' : 'business name'}.`);
        return;
      }
    }
    
    // Only trigger signup on the final step, not when required fields are filled
    console.log('Step validation - step:', step, 'total steps:', steps.length);
    console.log('Form data:', { name: form.name, password: form.password, email: form.email, phone: form.phone });
    
    if (step === steps.length - 1) {
      console.log('Final step reached, attempting signup...');
      await handleSignup();
    } else if (step < steps.length - 1) {
      console.log('Advancing to next step...');
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 0) {
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
      if (!form.password || !form.name) {
        setError('Please fill in all required fields.');
        setLoading(false);
        return;
      }
      
      if (mode === 'email' && (!form.email || !/.+@.+\..+/.test(form.email))) {
        setError('Please enter a valid email address.');
        setLoading(false);
        return;
      } else if (mode === 'phone' && (!form.phone || form.phone.length < 10)) {
        setError('Please enter a valid phone number.');
        setLoading(false);
        return;
      }
      
      // Double-check email/phone existence right before signup to avoid race conditions
      if (mode === 'email') {
        console.log('Double-checking email before signup:', form.email);
        const emailStillExists = await checkEmailExists(form.email);
        console.log('Email still exists check result:', emailStillExists);
        if (emailStillExists) {
          setError('This email is already in use. Please choose a different one.');
          setLoading(false);
          return;
        }
      } else if (mode === 'phone') {
        console.log('Double-checking phone before signup:', form.phone);
        const phoneStillExists = await checkPhoneExists(form.phone);
        console.log('Phone still exists check result:', phoneStillExists);
        if (phoneStillExists) {
          setError('This phone number is already in use. Please choose a different one.');
          setLoading(false);
          return;
        }
      }
      
      if (isBusiness && (!form.businessName || !form.cuisine || !form.pricing || !form.address || !form.hours)) {
        setError('Please fill in all business information.');
        setLoading(false);
        return;
      }
      
      let user;
      
      if (mode === 'email') {
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        user = userCredential.user;
      } else if (mode === 'phone') {
        const phoneEmail = `${form.phone}@phone.punch.com`;
        const userCredential = await createUserWithEmailAndPassword(auth, phoneEmail, form.password);
        user = userCredential.user;
      }
      
      if (!user) {
        setError('Failed to create user account.');
        setLoading(false);
        return;
      }
      
      let profilePictureUrl = '';
      if (profilePicture) {
        try {
          profilePictureUrl = await uploadProfilePicture(user.uid, profilePicture) || '';
        } catch (error) {
          console.error('Error uploading profile picture:', error);
        }
      }
      
      let logoUrl = '';
      if (isBusiness && form.logo) {
        try {
          logoUrl = await uploadProfilePicture(user.uid, form.logo) || '';
        } catch (error) {
          console.error('Error uploading logo:', error);
        }
      }
      
      if (isBusiness) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: form.name,
          businessName: form.businessName,
          cuisine: form.cuisine,
          pricing: form.pricing,
          address: form.address,
          hours: form.hours,
          logoUrl: logoUrl,
          isBusiness: true,
          contactMethod: mode,
          email: mode === 'email' ? form.email : null,
          phone: mode === 'phone' ? form.phone : null,
          bio: '',
          profilePictureUrl: profilePictureUrl,
          storesVisitedCount: 0,
          storesVisitedHistory: [],
          rewardsRedeemed: [],
          followersCount: 0,
          followingCount: 0,
          followerUids: [],
          followingUids: [],
          emailNotifications: notifEmail,
          textNotifications: notifText,
        });
      } else {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: form.name,
          contactMethod: mode,
          email: mode === 'email' ? form.email : null,
          phone: mode === 'phone' ? form.phone : null,
          bio: '',
          profilePictureUrl: profilePictureUrl,
          isBusiness: false,
          storesVisitedCount: 0,
          storesVisitedHistory: [],
          rewardsRedeemed: [],
          followersCount: 0,
          followingCount: 0,
          followerUids: [],
          followingUids: [],
          emailNotifications: notifEmail,
          textNotifications: notifText,
        });
      }
      
      console.log('Signup successful, navigating to home...');
      console.log('User UID:', user.uid);
      console.log('Current auth state:', auth.currentUser);
      console.log('User email verified:', user.emailVerified);
      
      // Email verification disabled for now
      console.log('Email verification disabled - proceeding with signup');
      
      // Ensure we're not loading anymore before navigation
      setLoading(false);
      
      // Force a refresh of the auth state to ensure it's up to date
      await auth.updateCurrentUser(user);
      console.log('Updated current user, auth state should now reflect the new user');
      
      // Try to sign in the user to ensure they're properly authenticated
      console.log('Signing in user to ensure authentication...');
      try {
        if (mode === 'email') {
          await signInWithEmailAndPassword(auth, form.email, form.password);
        } else if (mode === 'phone') {
          const phoneEmail = `${form.phone}@phone.punch.com`;
          await signInWithEmailAndPassword(auth, phoneEmail, form.password);
        }
        console.log('User signed in successfully');
      } catch (signInError) {
        console.error('Error signing in user:', signInError);
      }
      
      // Check if user is now authenticated
      const currentUser = auth.currentUser;
      console.log('After sign in - Current auth state:', currentUser);
      console.log('User is authenticated:', !!currentUser);
      
      if (currentUser) {
        console.log('User is authenticated, navigating to home...');
        // Try to navigate directly since user is authenticated
        try {
          router.replace('/authenticated_tabs/home');
        } catch (error) {
          console.log('Direct navigation failed, falling back to auth state listener');
        }
      } else {
        console.log('User not authenticated yet, waiting for auth state change...');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(getFriendlyErrorMessage(err.code));
    setLoading(false);
    }
  };

  const dismissKeyboard = () => {
    setIsKeyboardDismissing(true);
    Keyboard.dismiss();
    setTimeout(() => {
      setIsKeyboardDismissing(false);
    }, 300);
  };

  const handleLoginPress = () => {
    router.push('../unauthenticated_tabs/login');
  };

  const handleTermsPress = () => {
    Linking.openURL('https://www.punchrewards.app/terms-of-service');
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://www.punchrewards.app/privacy-policy');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <SignupBackground
          height={safeHeight}
          logoSizeAnim={logoSizeAnim}
          orangeBackgroundAnim={orangeBackgroundAnim}
          onBackPress={handleBack}
        />
        
          {/* Account Type Selection */}
          {isBusiness === null && (
          <AccountTypeSelection
            onSelect={handleAccountTypeSelect}
            welcomeModalAnim={welcomeModalAnim}
            onLoginPress={handleLoginPress}
          />
          )}
          
                  {/* Signup Form Modal */}
        {isBusiness !== null && (
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <Animated.View style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: -50,
              width: '100%',
              zIndex: 10,
              height: '85%',
              backgroundColor: 'transparent',
              justifyContent: 'flex-start',
              alignSelf: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 12,
            }}>
              <View style={{
                  borderTopLeftRadius: 32,
                  borderTopRightRadius: 32,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  paddingHorizontal: 32,
                  paddingTop: 32,
                  paddingBottom: 0,
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
              }}>
                <SignupForm
                  current={current}
                  step={step}
                  steps={steps}
                  form={form}
                  setForm={setForm}
                  setError={setError}
                  loading={loading}
                  profilePicture={profilePicture}
                  uploadingPicture={uploadingPicture}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  agree={agree}
                  setAgree={setAgree}
                  notifEmail={notifEmail}
                  setNotifEmail={setNotifEmail}
                  notifText={notifText}
                  setNotifText={setNotifText}
                  mode={mode}
                  setMode={setMode}
                  emailExists={emailExists}
                  phoneExists={phoneExists}
                  isValidating={isValidating}
                  showMoreCuisine={showMoreCuisine}
                  setShowMoreCuisine={setShowMoreCuisine}
                  cuisineOptions={cuisineOptions}
                  showLoadingScreen={showLoadingScreen}
                  loadingMessage={loadingMessage}
                  pulsateAnim={pulsateAnim}
                  onProfilePicturePick={handleProfilePicturePick}
                  onLogoPick={handleLogoPick}
                  onRemoveProfilePicture={() => setProfilePicture(null)}
                  onRemoveLogo={() => setForm({ ...form, logo: null })}
                  formatPhoneNumber={formatPhoneNumber}
                />

                {/* Error message */}
                {error ? (
                  <View style={loginStyles.errorContainer}>
                    <CustomText variant="body" weight="medium" fontFamily="figtree" style={loginStyles.errorText}>
                      {error}
                    </CustomText>
                  </View>
                ) : null}

                {/* Navigation buttons */}
                <SignupNavigation
                  current={current}
                  step={step}
                  steps={steps}
                  loading={loading}
                  form={form}
                  agree={agree}
                  profilePicture={profilePicture}
                  onNext={handleNext}
                  onBack={handleBack}
                  onSignup={handleSignup}
                  onStartLoadingSequence={startLoadingSequence}
                />
                      </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        )}
    </View>
  </KeyboardAvoidingView>
  );
}

 