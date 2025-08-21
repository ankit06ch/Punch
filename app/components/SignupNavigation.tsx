import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import CustomText from '../../components/CustomText';
import loginStyles from '../styles/loginStyles';
import signupStyles from '../styles/signupStyles';

interface SignupNavigationProps {
  current: any;
  step: number;
  steps: any[];
  loading: boolean;
  form: any;
  agree: boolean;
  profilePicture: string | null;
  showLoadingScreen: boolean;
  onNext: () => void;
  onBack: () => void;
  onSignup: () => void;
  onStartLoadingSequence: () => void;
}

export default function SignupNavigation({
  current,
  step,
  steps,
  loading,
  form,
  agree,
  profilePicture,
  showLoadingScreen,
  onNext,
  onBack,
  onSignup,
  onStartLoadingSequence
}: SignupNavigationProps) {
  if (steps.length === 0) {
    return null;
  }

  // Hide buttons during loading screen
  if (showLoadingScreen) {
    return null;
  }

  const renderButtons = () => {
    // Name step
    if (current.key === 'name') {
      return (
        <TouchableOpacity
          style={[loginStyles.loginButton, (loading || !(form.name && form.name.trim().length > 1)) && loginStyles.loginButtonDisabled]}
          onPress={onNext}
          disabled={loading || !(form.name && form.name.trim().length > 1)}
        >
          <CustomText variant="button" weight="bold" fontFamily="figtree" style={loginStyles.loginButtonText}>
            Next
          </CustomText>
        </TouchableOpacity>
      );
    }

    // Business Name step
    if (current.key === 'businessName') {
      return (
        <View style={signupStyles.buttonRow}>
          <TouchableOpacity style={signupStyles.secondaryButton} onPress={onBack} disabled={loading}>
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={signupStyles.secondaryButtonText}>Back</CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[loginStyles.loginButton, { flex: 1, marginLeft: 6 }, (loading || !(form.businessName && form.businessName.trim().length > 1)) && loginStyles.loginButtonDisabled]}
            onPress={onNext}
            disabled={loading || !(form.businessName && form.businessName.trim().length > 1)}
          >
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={loginStyles.loginButtonText}>
              Next
            </CustomText>
          </TouchableOpacity>
        </View>
      );
    }

    // Profile Picture step
    if (current.key === 'profilePicture') {
      return (
        <View style={signupStyles.buttonRow}>
          <TouchableOpacity style={signupStyles.secondaryButton} onPress={onBack} disabled={loading}>
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={signupStyles.secondaryButtonText}>Back</CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[loginStyles.loginButton, { flex: 1, marginLeft: 6 }]}
            onPress={onNext}
            disabled={loading}
          >
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={loginStyles.loginButtonText}>
              {profilePicture ? 'Next' : 'Skip'}
            </CustomText>
          </TouchableOpacity>
        </View>
      );
    }

    // Cuisine step
    if (current.key === 'cuisine') {
      return (
        <View style={signupStyles.buttonRow}>
          <TouchableOpacity style={signupStyles.secondaryButton} onPress={onBack} disabled={loading}>
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={signupStyles.secondaryButtonText}>Back</CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[loginStyles.loginButton, { flex: 1, marginLeft: 6 }, (loading || form.cuisine.length === 0) && loginStyles.loginButtonDisabled]}
            onPress={onNext}
            disabled={loading || form.cuisine.length === 0}
          >
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={loginStyles.loginButtonText}>
              Next
            </CustomText>
          </TouchableOpacity>
        </View>
      );
    }

    // Pricing step
    if (current.key === 'pricing') {
      return (
        <View style={signupStyles.buttonRow}>
          <TouchableOpacity style={signupStyles.secondaryButton} onPress={onBack} disabled={loading}>
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={signupStyles.secondaryButtonText}>Back</CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[loginStyles.loginButton, { flex: 1, marginLeft: 6 }, (loading || !form.pricing || form.pricing.trim().length === 0) && loginStyles.loginButtonDisabled]}
            onPress={onNext}
            disabled={loading || !form.pricing || form.pricing.trim().length === 0}
          >
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={loginStyles.loginButtonText}>
              Next
            </CustomText>
          </TouchableOpacity>
        </View>
      );
    }

    // Address step
    if (current.key === 'address') {
      return (
        <View style={signupStyles.buttonRow}>
          <TouchableOpacity style={signupStyles.secondaryButton} onPress={onBack} disabled={loading}>
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={signupStyles.secondaryButtonText}>Back</CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[loginStyles.loginButton, { flex: 1, marginLeft: 6 }, (loading || !form.address || form.address.trim().length === 0) && loginStyles.loginButtonDisabled]}
            onPress={onNext}
            disabled={loading || !form.address || form.address.trim().length === 0}
          >
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={loginStyles.loginButtonText}>
              Next
            </CustomText>
          </TouchableOpacity>
        </View>
      );
    }

    // Logo step
    if (current.key === 'logo') {
      return (
        <View style={signupStyles.buttonRow}>
          <TouchableOpacity style={signupStyles.secondaryButton} onPress={onBack} disabled={loading}>
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={signupStyles.secondaryButtonText}>Back</CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[loginStyles.loginButton, { flex: 1, marginLeft: 6 }]}
            onPress={onNext}
            disabled={loading}
          >
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={loginStyles.loginButtonText}>
              Next
            </CustomText>
          </TouchableOpacity>
        </View>
      );
    }

    // Contact step
    if (current.key === 'contact') {
      return (
        <View style={signupStyles.buttonRow}>
          <TouchableOpacity style={signupStyles.secondaryButton} onPress={onBack} disabled={loading}>
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={signupStyles.secondaryButtonText}>Back</CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[loginStyles.loginButton, { flex: 1, marginLeft: 6 }, (loading || !form.email || !/.+@.+\..+/.test(form.email)) && loginStyles.loginButtonDisabled]}
            onPress={onNext}
            disabled={loading || !form.email || !/.+@.+\..+/.test(form.email)}
          >
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={loginStyles.loginButtonText}>
              Next
            </CustomText>
          </TouchableOpacity>
        </View>
      );
    }

    // Password step
    if (current.key === 'password') {
      return (
        <View style={signupStyles.buttonRow}>
          <TouchableOpacity style={signupStyles.secondaryButton} onPress={onBack} disabled={loading}>
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={signupStyles.secondaryButtonText}>Back</CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[loginStyles.loginButton, { flex: 1, marginLeft: 6 }, (!agree || loading || !(form.password && form.password.length >= 6)) && loginStyles.loginButtonDisabled]}
            onPress={onStartLoadingSequence}
            disabled={!agree || loading || !(form.password && form.password.length >= 6)}
          >
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={loginStyles.loginButtonText}>
              Next
            </CustomText>
          </TouchableOpacity>
        </View>
      );
    }

    // Final Sign Up button for last step
    if (step === steps.length - 1) {
      return (
        <View style={signupStyles.buttonRow}>
          <TouchableOpacity style={signupStyles.secondaryButton} onPress={onBack} disabled={loading}>
            <CustomText variant="button" weight="bold" fontFamily="figtree" style={signupStyles.secondaryButtonText}>Back</CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[loginStyles.loginButton, { flex: 1, marginLeft: 6 }, (loading || !agree) && loginStyles.loginButtonDisabled]}
            onPress={onSignup}
            disabled={loading || !agree}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <CustomText variant="button" weight="bold" fontFamily="figtree" style={loginStyles.loginButtonText}>
                Sign Up
              </CustomText>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={{ width: '100%', marginTop: 0 }}>
      {renderButtons()}
    </View>
  );
} 