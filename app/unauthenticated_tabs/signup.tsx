import { collection, query, where, getDocs } from 'firebase/firestore';
import { useState } from 'react';
import { View, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import CustomText from '../../components/CustomText';
import { AntDesign } from '@expo/vector-icons';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const usernameExists = async (username: string) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleSignup = async () => {
    if (!name || !username) {
      setError('Please enter your name and username.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const taken = await usernameExists(username);
      if (taken) {
        setError('This username is already taken. Please choose another.');
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        username,
        bio,
        profilePictureUrl: '', // you can update this later
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
        console.error('Signup error:', err);
        const friendlyMessage = getFriendlyErrorMessage(err.code);
        setError(friendlyMessage);
      }
  };

  return (
    <LinearGradient
      colors={['#FB7A20', '#FF8C42', '#FFA366']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/unauthenticated_tabs/onboarding')}>
          <AntDesign name="arrowleft" size={28} color="white" />
        </TouchableOpacity>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/Punch_Logos/Punch_T/white_logo.png')} 
              style={styles.logo} 
            />
          </View>

          {/* Welcome Text */}
          <View style={styles.textContainer}>
            <CustomText variant="title" weight="bold" style={styles.title}>
              Join Punch
            </CustomText>
            <CustomText variant="subtitle" weight="medium" style={styles.subtitle}>
              Create your account to start earning rewards
            </CustomText>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <AntDesign name="user" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
              <TextInput
                placeholder="Full Name"
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
            </View>

            <View style={styles.inputContainer}>
              <AntDesign name="tag" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
              <TextInput
                placeholder="Username"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
            </View>

            <View style={styles.inputContainer}>
              <AntDesign name="edit" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
              <TextInput
                placeholder="Bio (optional)"
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
            </View>

            <View style={styles.inputContainer}>
              <AntDesign name="mail" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
              <TextInput
                placeholder="Email"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
            </View>

            <View style={styles.inputContainer}>
              <AntDesign name="lock" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <AntDesign name="exclamationcircleo" size={16} color="white" />
                <CustomText variant="body" weight="medium" style={styles.errorText}>
                  {error}
                </CustomText>
              </View>
            ) : null}

            <TouchableOpacity 
              style={[styles.signupButton, loading && styles.signupButtonDisabled]} 
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <CustomText variant="button" weight="bold" style={styles.signupButtonText}>
                  Create Account
                </CustomText>
              )}
            </TouchableOpacity>
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
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
    marginTop: 16,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 16,
  },
  bioInput: {
    textAlignVertical: 'top',
    paddingTop: 16,
    paddingBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  errorText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
  },
  signupButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: '#FB7A20',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: 'white',
    opacity: 0.8,
  },
  loginLink: {
    color: 'white',
    textDecorationLine: 'underline',
  },
});