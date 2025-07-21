import { useState } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import CustomText from '../../components/CustomText';
import { AntDesign } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('../authenticated_tabs/home');
    } catch (err: any) {
      const friendlyMessage = getFriendlyErrorMessage(err.code);
      setError(friendlyMessage);
    } finally {
      setLoading(false);
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
        <View style={styles.content}>
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
              Welcome Back!
            </CustomText>
            <CustomText variant="subtitle" weight="medium" style={styles.subtitle}>
              Login to your Punch account
            </CustomText>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <AntDesign name="mail" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
              <TextInput
                placeholder="Email"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
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
                editable={!loading}
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
              style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <CustomText variant="button" weight="bold" style={styles.loginButtonText}>
                  Login
                </CustomText>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <CustomText variant="body" weight="normal" style={styles.signupText}>
              Don't have an account?{' '}
            </CustomText>
            <TouchableOpacity onPress={() => router.push('../unauthenticated_tabs/signup')}>
              <CustomText variant="body" weight="bold" style={styles.signupLink}>
                Sign Up
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
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
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 16,
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
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FB7A20',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupText: {
    color: 'white',
    opacity: 0.8,
  },
  signupLink: {
    color: 'white',
    textDecorationLine: 'underline',
  },
});