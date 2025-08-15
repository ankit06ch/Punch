import React from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Switch, Animated } from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import CustomText from '../../components/CustomText';
import loginStyles from '../styles/loginStyles';
import signupStyles from '../styles/signupStyles';

interface SignupFormProps {
  current: any;
  step: number;
  steps: any[];
  form: any;
  setForm: (form: any) => void;
  setError: (error: string) => void;
  loading: boolean;
  profilePicture: string | null;
  uploadingPicture: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  agree: boolean;
  setAgree: (agree: boolean) => void;
  notifEmail: boolean;
  setNotifEmail: (notif: boolean) => void;
  notifText: boolean;
  setNotifText: (notif: boolean) => void;
  mode: 'email' | 'phone';
  setMode: (mode: 'email' | 'phone') => void;
  emailExists: boolean;
  phoneExists: boolean;
  isValidating: boolean;
  showMoreCuisine: boolean;
  setShowMoreCuisine: (show: boolean) => void;
  cuisineOptions: string[];
  showLoadingScreen: boolean;

  loadingMessage: string;

  pulsateAnim: Animated.Value;
  onProfilePicturePick: () => void;
  onLogoPick: () => void;
  onRemoveProfilePicture: () => void;
  onRemoveLogo: () => void;
  formatPhoneNumber: (value: string) => string;
}

export default function SignupForm({
  current,
  step,
  steps,
  form,
  setForm,
  setError,
  loading,
  profilePicture,
  uploadingPicture,
  showPassword,
  setShowPassword,
  agree,
  setAgree,
  notifEmail,
  setNotifEmail,
  notifText,
  setNotifText,
  mode,
  setMode,
  emailExists,
  phoneExists,
  isValidating,
  showMoreCuisine,
  setShowMoreCuisine,
  cuisineOptions,
  showLoadingScreen,
  loadingMessage,
  pulsateAnim,
  onProfilePicturePick,
  onLogoPick,
  onRemoveProfilePicture,
  onRemoveLogo,
  formatPhoneNumber
}: SignupFormProps) {
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

  // Tab switcher for contact method
  const renderContactTabs = () => (
    <View style={{ flexDirection: 'row', width: '100%', marginBottom: 24, gap: 8, position: 'relative', height: 48 }}>
      {/* Animated orange outline border */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: mode === 'email' ? '0%' : '50%',
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
        style={[tabButton(mode === 'email'), { zIndex: 1, position: 'relative', flex: 1 }]}
        onPress={() => setMode('email')}
      >
        <CustomText style={{ color: mode === 'email' ? '#3A3A3A' : '#7A7A7A', fontWeight: '600', fontSize: 16 }}>Email</CustomText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[tabButton(mode === 'phone'), { zIndex: 1, position: 'relative', flex: 1 }]}
        onPress={() => setMode('phone')}
      >
        <CustomText style={{ color: mode === 'phone' ? '#3A3A3A' : '#7A7A7A', fontWeight: '600', fontSize: 16 }}>Phone</CustomText>
      </TouchableOpacity>
    </View>
  );

  // Tab button styles
  const tabButton = (selected: boolean) => ({
    flex: 1,
    backgroundColor: selected ? 'transparent' : '#f2f2f2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center' as const,
    borderWidth: 0,
  });

  if (showLoadingScreen) {
    return (
      <View style={loginStyles.textContainer}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                      <Animated.Image 
              source={require('../../assets/images/onboarding/onboarding2/10.png')}
              style={{
                width: 120,
                height: 120,
                resizeMode: 'contain',
                marginBottom: 16,
                transform: [{ scale: pulsateAnim }],
              }}
            />
          <CustomText 
            variant="title" 
            weight="bold" 
            fontFamily="figtree" 
            style={[loginStyles.title, { textAlign: 'center' }]}
          >
            {loadingMessage}
          </CustomText>
        </View>
      </View>
    );
  }



  if (steps.length === 0) {
    return null;
  }

  return (
    <>
      {/* Progress indicator */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24, gap: 6 }}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: index <= step ? '#FB7A20' : '#eee',
            }}
          />
        ))}
      </View>

      {/* Step prompt */}
      <View style={loginStyles.textContainer}>
        <CustomText variant="title" weight="bold" fontFamily="figtree" style={loginStyles.title}>
          {current?.prompt || ''}
        </CustomText>
      </View>

      {/* Form content */}
      <View style={loginStyles.formContainer}>
        {/* Name step */}
        {current.key === 'name' && (
          <View style={loginStyles.inputContainer}>
            <AntDesign name="user" size={20} color="#FB7A20" style={loginStyles.inputIcon} />
            <TextInput
              placeholder="Your full name"
              style={[loginStyles.input, { fontFamily: 'Figtree_400Regular' }]}
              value={form.name}
              onChangeText={text => {
                setForm({ ...form, name: text });
                setError('');
              }}
              autoCapitalize="words"
              placeholderTextColor="#aaa"
              editable={!loading}
              maxLength={40}
            />
          </View>
        )}

        {/* Profile Picture step */}
        {current.key === 'profilePicture' && (
          <View style={signupStyles.profilePictureContainer}>
            <View style={signupStyles.profilePictureWrapper}>
              <TouchableOpacity 
                style={signupStyles.profilePictureButton} 
                onPress={onProfilePicturePick}
                disabled={uploadingPicture}
              >
                {profilePicture ? (
                  <Animated.Image source={{ uri: profilePicture }} style={signupStyles.profilePicture} />
                ) : (
                  <View style={signupStyles.profilePicturePlaceholder}>
                    <View style={signupStyles.cameraIconContainer}>
                      <AntDesign name="camera" size={28} color="#FB7A20" />
                    </View>
                    <CustomText fontFamily="figtree" style={signupStyles.profilePictureText}>
                      {uploadingPicture ? 'Uploading...' : 'Add Profile Photo'}
                    </CustomText>
                  </View>
                )}
              </TouchableOpacity>
              
              {profilePicture && (
                <TouchableOpacity 
                  style={signupStyles.removePictureButton}
                  onPress={onRemoveProfilePicture}
                >
                  <AntDesign name="close" size={16} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            
            {!profilePicture && (
              <CustomText fontFamily="figtree" style={signupStyles.photoOptionalText}>
                This step is optional - you can add a photo later
              </CustomText>
            )}
          </View>
        )}

        {/* Business Name step */}
        {current.key === 'businessName' && (
          <View style={loginStyles.inputContainer}>
            <AntDesign name="home" size={20} color="#FB7A20" style={loginStyles.inputIcon} />
            <TextInput
              placeholder="Your business name"
              style={[loginStyles.input, { fontFamily: 'Figtree_400Regular' }]}
              value={form.businessName}
              onChangeText={text => {
                setForm({ ...form, businessName: text });
                setError('');
              }}
              autoCapitalize="words"
              placeholderTextColor="#aaa"
              editable={!loading}
              maxLength={50}
            />
          </View>
        )}

        {/* Cuisine step */}
        {current.key === 'cuisine' && (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <View style={signupStyles.cuisineContainer}>
              {(showMoreCuisine ? cuisineOptions : cuisineOptions.slice(0, 12)).map((cuisine) => (
                <TouchableOpacity
                  key={cuisine}
                  style={[
                    signupStyles.cuisineTag,
                    form.cuisine.includes(cuisine) && signupStyles.cuisineTagSelected
                  ]}
                  onPress={() => {
                    const newCuisine = form.cuisine.includes(cuisine)
                      ? form.cuisine.filter((c: string) => c !== cuisine)
                      : [...form.cuisine, cuisine];
                    setForm({ ...form, cuisine: newCuisine });
                  }}
                >
                  <CustomText 
                    variant="body" 
                    weight="medium" 
                    fontFamily="figtree" 
                    style={[
                      signupStyles.cuisineTagText,
                      form.cuisine.includes(cuisine) && signupStyles.cuisineTagTextSelected
                    ]}
                  >
                    {cuisine}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* See More/Less button */}
            <TouchableOpacity
              style={signupStyles.seeMoreButton}
              onPress={() => setShowMoreCuisine(!showMoreCuisine)}
            >
              <CustomText 
                fontFamily="figtree" 
                style={signupStyles.seeMoreButtonText}
              >
                {showMoreCuisine ? 'Show Less' : 'See More'}
              </CustomText>
            </TouchableOpacity>
          </View>
        )}

        {/* Pricing step */}
        {current.key === 'pricing' && (
          <View style={loginStyles.inputContainer}>
            <AntDesign name="tag" size={20} color="#FB7A20" style={loginStyles.inputIcon} />
            <TextInput
              placeholder="Average price per person (e.g., $25)"
              style={[loginStyles.input, { fontFamily: 'Figtree_400Regular' }]}
              value={form.pricing}
              onChangeText={text => {
                setForm({ ...form, pricing: text });
                setError('');
              }}
              keyboardType="numeric"
              placeholderTextColor="#aaa"
              editable={!loading}
              maxLength={10}
            />
          </View>
        )}

        {/* Address step */}
        {current.key === 'address' && (
          <View style={loginStyles.inputContainer}>
            <AntDesign name="enviroment" size={20} color="#FB7A20" style={loginStyles.inputIcon} />
            <TextInput
              placeholder="Business address"
              style={[loginStyles.input, { fontFamily: 'Figtree_400Regular' }]}
              value={form.address}
              onChangeText={text => {
                setForm({ ...form, address: text });
                setError('');
              }}
              placeholderTextColor="#aaa"
              editable={!loading}
              maxLength={100}
            />
          </View>
        )}

        {/* Logo step */}
        {current.key === 'logo' && (
          <View style={signupStyles.profilePictureContainer}>
            <TouchableOpacity 
              style={signupStyles.profilePictureButton} 
              onPress={onLogoPick}
              disabled={uploadingPicture}
            >
              {form.logo ? (
                <Animated.Image source={{ uri: form.logo }} style={signupStyles.profilePicture} />
              ) : (
                <View style={signupStyles.profilePicturePlaceholder}>
                  <AntDesign name="picture" size={32} color="#FB7A20" />
                  <CustomText fontFamily="figtree" style={signupStyles.profilePictureText}>
                    {uploadingPicture ? 'Uploading...' : 'Tap to add logo'}
                  </CustomText>
                </View>
              )}
            </TouchableOpacity>
            {form.logo && (
              <TouchableOpacity 
                style={signupStyles.removePictureButton}
                onPress={onRemoveLogo}
              >
                <CustomText variant="body" weight="medium" fontFamily="figtree" style={signupStyles.removePictureText}>
                  Remove
                </CustomText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Contact step */}
        {current.key === 'contact' && (
          <View style={{ width: '100%', alignItems: 'center' }}>
            {renderContactTabs()}
            
            {/* Email input */}
            {mode === 'email' && (
              <>
                <View style={loginStyles.inputContainer}>
                  <AntDesign name="mail" size={20} color="#FB7A20" style={loginStyles.inputIcon} />
                  <TextInput
                    placeholder="Email"
                    style={[
                      loginStyles.input, 
                      { fontFamily: 'Figtree_400Regular' },
                      emailExists && { borderColor: '#ff4444' }
                    ]}
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
                  />
                </View>
                
                {/* Email validation status */}
                {form.email && (
                  <View style={signupStyles.validationContainer}>
                    {isValidating ? (
                      <View style={signupStyles.validationStatus}>
                        <ActivityIndicator size="small" color="#FB7A20" />
                        <CustomText style={signupStyles.validationText}>Checking availability...</CustomText>
                      </View>
                    ) : emailExists ? (
                      <View style={signupStyles.validationStatus}>
                        <AntDesign name="closecircle" size={16} color="#ff4444" />
                        <CustomText style={[signupStyles.validationText, signupStyles.validationError]}>
                          This email is already in use
                        </CustomText>
                      </View>
                    ) : form.email && /.+@.+\..+/.test(form.email) ? (
                      <View style={signupStyles.validationStatus}>
                        <AntDesign name="checkcircle" size={16} color="#4CAF50" />
                        <CustomText style={[signupStyles.validationText, signupStyles.validationSuccess]}>
                          Email is available
                        </CustomText>
                      </View>
                    ) : null}
                  </View>
                )}
              </>
            )}
            
            {/* Phone input */}
            {mode === 'phone' && (
              <>
                <View style={loginStyles.inputContainer}>
                  <AntDesign name="phone" size={20} color="#FB7A20" style={loginStyles.inputIcon} />
                  <TextInput
                    placeholder="Phone number"
                    style={[
                      loginStyles.input, 
                      { fontFamily: 'Figtree_400Regular' },
                      phoneExists && { borderColor: '#ff4444' }
                    ]}
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
                  />
                </View>
                
                {/* Phone validation status */}
                {form.phone && (
                  <View style={signupStyles.validationContainer}>
                    {isValidating ? (
                      <View style={signupStyles.validationStatus}>
                        <ActivityIndicator size="small" color="#FB7A20" />
                        <CustomText style={signupStyles.validationText}>Checking availability...</CustomText>
                      </View>
                    ) : phoneExists ? (
                      <View style={signupStyles.validationStatus}>
                        <AntDesign name="closecircle" size={16} color="#ff4444" />
                        <CustomText style={[signupStyles.validationText, signupStyles.validationError]}>
                          This phone number is already in use
                        </CustomText>
                      </View>
                    ) : form.phone && form.phone.length >= 10 ? (
                      <View style={signupStyles.validationStatus}>
                        <AntDesign name="checkcircle" size={16} color="#4CAF50" />
                        <CustomText style={[signupStyles.validationText, signupStyles.validationSuccess]}>
                          Phone number is available
                        </CustomText>
                      </View>
                    ) : null}
                  </View>
                )}
              </>
            )}
            
            {/* Notification preferences */}
            {mode === 'email' && (
              <View style={{ width: '100%', marginTop: 12, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Switch value={notifEmail} onValueChange={setNotifEmail} thumbColor={notifEmail ? '#FB7A20' : '#ccc'} trackColor={{ true: '#fcd7b0', false: '#eee' }} />
                  <CustomText fontFamily="figtree" style={{ marginLeft: 8, color: '#222' }}>Email me updates{' '}<CustomText fontFamily="figtree" style={{ color: '#222' }}>&</CustomText>{' '}rewards</CustomText>
                </View>
              </View>
            )}
            
            {mode === 'phone' && (
              <View style={{ width: '100%', marginTop: 12, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Switch value={notifText} onValueChange={setNotifText} thumbColor={notifText ? '#FB7A20' : '#ccc'} trackColor={{ true: '#fcd7b0', false: '#eee' }} />
                  <CustomText fontFamily="figtree" style={{ marginLeft: 8, color: '#222' }}>Message me updates{' '}<CustomText fontFamily="figtree" style={{ color: '#222' }}>&</CustomText>{' '}rewards</CustomText>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Password step */}
        {current.key === 'password' && (
          <>
            <View style={loginStyles.inputContainer}>
              <AntDesign name="lock" size={20} color="#FB7A20" style={loginStyles.inputIcon} />
              <TextInput
                placeholder="Password"
                style={[loginStyles.input, { flex: 1, fontFamily: 'Figtree_400Regular' }]}
                value={form.password}
                onChangeText={text => {
                  setForm({ ...form, password: text });
                  setError('');
                }}
                autoCapitalize="none"
                placeholderTextColor="#aaa"
                secureTextEntry={!showPassword}
                editable={!loading}
                maxLength={30}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
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
            
            {/* Terms and Privacy checkbox */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 8 }}>
              <CustomCheckbox value={agree} onValueChange={setAgree} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                <CustomText fontFamily="figtree" style={{ color: '#222' }}>I agree to </CustomText>
                <CustomText fontFamily="figtree" style={{ color: '#FB7A20', textDecorationLine: 'underline' }} onPress={() => {/* This will be handled by parent component */}}>Terms of Service</CustomText>
                <CustomText fontFamily="figtree" style={{ color: '#222' }}>{' & '}</CustomText>
                <CustomText fontFamily="figtree" style={{ color: '#FB7A20', textDecorationLine: 'underline' }} onPress={() => {/* This will be handled by parent component */}}>Privacy Policy</CustomText>
              </View>
            </View>
          </>
        )}
      </View>
    </>
  );
} 