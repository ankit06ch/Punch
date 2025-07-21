import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView style={styles.safeArea}>
      {/* Back to Onboarding Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.push('/unauthenticated_tabs/onboarding')}
      >
        <Text style={styles.backButtonText}>← Back to Onboarding</Text>
      </TouchableOpacity>

      <View style={styles.container}>
        <Image source={require('../../assets/Punch_Logos/Punch_T/black_logo.png')} style={styles.logo} />
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Login to your Punch account</Text>
        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
          placeholderTextColor="#aaa"
        />
        <TextInput
          placeholder="Password"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          placeholderTextColor="#aaa"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? (
          <ActivityIndicator size="large" color="#fb7a20" />
        ) : (
          <>
            <Button title="Login" color="#fb7a20" onPress={handleLogin} />
            <Button title="Don't have an account? Sign Up" color="#222" onPress={() => router.push('../unauthenticated_tabs/signup')} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fb7a20',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logo: { width: 120, height: 120, marginBottom: 24, resizeMode: 'contain' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fb7a20', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#222', marginBottom: 24, textAlign: 'center' },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#fb7a20',
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    color: '#222',
    fontSize: 16,
  },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' },
});