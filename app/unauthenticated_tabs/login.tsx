import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';

import CustomText from '../../components/CustomText';
import { auth } from '../../firebase/config';
import loginStyles from '../styles/loginStyles';


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
      setError(getFriendlyErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={loginStyles.container}>
        <ScrollView contentContainerStyle={loginStyles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

          <View style={loginStyles.formContainer}>
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

            {error ? (
              <View style={loginStyles.errorContainer}>
                <AntDesign name="exclamationcircleo" size={16} color="#FB7A20" />
                <CustomText variant="body" weight="medium" style={loginStyles.errorText}>
                  {error}
                </CustomText>
              </View>
            ) : null}

            <TouchableOpacity
              style={[loginStyles.loginButton, loading && loginStyles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <CustomText variant="button" weight="bold" style={loginStyles.loginButtonText}>
                  Login
                </CustomText>
              )}
            </TouchableOpacity>
          </View>

          {/* Social Login */}
          <View style={loginStyles.socialContainer}>
            {/* Removed Google Sign-In */}
            {/* Removed Apple Sign-In */}
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