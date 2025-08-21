import React from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Switch, Animated, ScrollView } from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import CustomText from '../../components/CustomText';
import loginStyles from '../styles/loginStyles';
import signupStyles from '../styles/signupStyles';

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';

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
  // Address search state
  const [addressSuggestions, setAddressSuggestions] = React.useState<string[]>([]);
  const [addressSearching, setAddressSearching] = React.useState(false);
  const [placeDetails, setPlaceDetails] = React.useState<any>(null);
  const [placeIds, setPlaceIds] = React.useState<string[]>([]);
  const [lastSearchQuery, setLastSearchQuery] = React.useState<string>('');
  
  // Debounce timer for address search
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Address search function using Google Places API
  const searchAddresses = async (query: string) => {
    if (query.length < 2) { // Reduced from 3 to 2 characters for earlier results
      setAddressSuggestions([]);
      return;
    }

    if (!GOOGLE_PLACES_API_KEY) {
      setAddressSuggestions(['Google Places API key not configured. Please check your environment variables.']);
      return;
    }

    setAddressSearching(true);
    
    try {
      // Use a single, comprehensive search strategy instead of multiple strategies
      const params = new URLSearchParams({
        input: query,
        key: GOOGLE_PLACES_API_KEY,
        language: 'en'
        // Removed sessiontoken and strictbounds that were causing viewport issues
      });

      const response = await fetch(`${GOOGLE_PLACES_BASE_URL}?${params}`);
      const data = await response.json();

      if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
        // Extract formatted addresses and place IDs from predictions
        const suggestions = data.predictions.map((prediction: any) => prediction.description);
        const ids = data.predictions.map((prediction: any) => prediction.place_id);
        
        setAddressSuggestions(suggestions);
        setPlaceIds(ids);
        
        console.log('✅ Address search successful:', suggestions.length, 'results');
        console.log('Query:', query);
        console.log('First few suggestions:', suggestions.slice(0, 3));
      } else if (data.status === 'ZERO_RESULTS') {
        console.log('❌ No address suggestions found for query:', query);
        setAddressSuggestions(['No addresses found. Try a different search term.']);
      } else if (data.status === 'INVALID_REQUEST') {
        console.error('Google Places API invalid request:', data.error_message);
        // Try a simpler search without problematic parameters
        console.log('🔄 Retrying with simplified search...');
        await retrySimpleSearch(query);
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        console.error('Google Places API quota exceeded');
        setAddressSuggestions(['Search quota exceeded. Please try again later.']);
      } else if (data.status === 'REQUEST_DENIED') {
        console.error('Google Places API request denied:', data.error_message);
        setAddressSuggestions(['API access denied. Please check your configuration.']);
      } else {
        console.error('Google Places API error:', data.status, data.error_message);
        setAddressSuggestions([`Search error: ${data.status}. Please try again.`]);
      }
      
    } catch (error) {
      console.error('Address search error:', error);
      setAddressSuggestions(['Network error. Please check your connection.']);
    } finally {
      setAddressSearching(false);
    }
  };

  // Fallback search function with minimal parameters
  const retrySimpleSearch = async (query: string) => {
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key not configured');
      setAddressSuggestions(['API key not configured. Please check your environment variables.']);
      return;
    }

    try {
      console.log('🔄 Attempting simplified search for:', query);
      
      const params = new URLSearchParams({
        input: query,
        key: GOOGLE_PLACES_API_KEY
        // Minimal parameters to avoid viewport issues
      });

      const response = await fetch(`${GOOGLE_PLACES_BASE_URL}?${params}`);
      const data = await response.json();

      if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
        const suggestions = data.predictions.map((prediction: any) => prediction.description);
        const ids = data.predictions.map((prediction: any) => prediction.place_id);
        
        setAddressSuggestions(suggestions);
        setPlaceIds(ids);
        
        console.log('✅ Simplified search successful:', suggestions.length, 'results');
        console.log('First few suggestions:', suggestions.slice(0, 3));
      } else {
        console.log('❌ Simplified search also failed:', data.status);
        setAddressSuggestions(['Search failed. Please try a different address.']);
      }
    } catch (error) {
      console.error('Simplified search error:', error);
      setAddressSuggestions(['Search error. Please try again.']);
    }
  };

  // Get detailed information about a selected place
  const getPlaceDetails = async (placeId: string) => {
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key not configured');
      return null;
    }

    try {
      const params = new URLSearchParams({
        place_id: placeId,
        key: GOOGLE_PLACES_API_KEY,
        fields: 'formatted_address,geometry,name,place_id,types,business_status,rating,user_ratings_total,vicinity'
      });

      const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params}`);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        console.log('Place details retrieved:', data.result);
        return data.result;
      } else {
        console.error('Place details error:', data.status, data.error_message);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
    return null;
  };

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
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        paddingHorizontal: 20
      }}>
        <View style={{ alignItems: 'center' }}>
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
    <ScrollView 
      style={{ flex: 1 }} 
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
    >
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
          <View style={{ width: '100%' }}>
            <View style={loginStyles.inputContainer}>
              <AntDesign name="enviroment" size={20} color="#FB7A20" style={loginStyles.inputIcon} />
              <TextInput
                placeholder="Start typing your business address..."
                style={[loginStyles.input, { fontFamily: 'Figtree_400Regular' }]}
                value={form.address}
                onChangeText={text => {
                  setForm({ ...form, address: text });
                  setError('');
                  
                  // Clear suggestions if input is too short
                  if (text.length < 2) {
                    setAddressSuggestions([]);
                    setPlaceIds([]);
                    return;
                  }
                  
                  // Clear previous timeout and set new one for debounced search
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }
                  
                  searchTimeoutRef.current = setTimeout(() => {
                    if (text.length >= 2) {
                      // Only search if the query has changed significantly (prevents searching for minor variations)
                      const queryChanged = !lastSearchQuery || 
                        !text.toLowerCase().includes(lastSearchQuery.toLowerCase()) ||
                        !lastSearchQuery.toLowerCase().includes(text.toLowerCase());
                      
                      if (queryChanged) {
                        console.log('🔍 Debounced search for address:', text);
                        setLastSearchQuery(text);
                        searchAddresses(text);
                      } else {
                        console.log('⏭️ Skipping search - query too similar to last search');
                      }
                    }
                  }, 500); // Increased delay to 500ms for more stability
                }}
                placeholderTextColor="#aaa"
                editable={!loading}
                maxLength={100}
                autoFocus
              />
            </View>
            
            {/* Address suggestions */}
            {addressSuggestions.length > 0 && (
              <View style={signupStyles.addressSuggestionsContainer}>
                {/* Search status indicator */}
                <View style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: '#f8f9fa',
                  borderBottomWidth: 1,
                  borderBottomColor: '#eee'
                }}>
                  <CustomText style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                    {addressSearching ? '🔍 Searching...' : `📍 ${addressSuggestions.length} address suggestions`}
                  </CustomText>
                </View>
                
                <ScrollView 
                  style={{ maxHeight: 250 }} // Allow scrolling within the container
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {addressSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={signupStyles.addressSuggestionItem}
                      onPress={async () => {
                        const selectedPlaceId = placeIds[index];
                        if (selectedPlaceId) {
                          const details = await getPlaceDetails(selectedPlaceId);
                          if (details) {
                            setPlaceDetails(details);
                            // Store both the formatted address and additional details
                            setForm({ 
                              ...form, 
                              address: details.formatted_address || suggestion,
                              placeId: details.place_id,
                              latitude: details.geometry?.location?.lat,
                              longitude: details.geometry?.location?.lng
                            });
                          } else {
                            setForm({ ...form, address: suggestion });
                          }
                        } else {
                          setForm({ ...form, address: suggestion });
                        }
                        setAddressSuggestions([]);
                        setPlaceIds([]);
                      }}
                      disabled={addressSearching}
                    >
                      <AntDesign name="enviroment" size={16} color="#666" style={{ marginRight: 8 }} />
                      {addressSearching ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <ActivityIndicator size="small" color="#FB7A20" style={{ marginRight: 8 }} />
                          <CustomText 
                            fontFamily="figtree" 
                            style={[signupStyles.addressSuggestionText, { color: '#999' }]}
                          >
                            Searching...
                          </CustomText>
                        </View>
                      ) : (
                        <CustomText 
                          fontFamily="figtree" 
                          style={signupStyles.addressSuggestionText}
                          numberOfLines={2}
                        >
                          {suggestion}
                        </CustomText>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Hours step */}
        {current.key === 'hours' && (
          <View style={{ width: '100%', height: '100%' }}>
            {/* Fixed Header */}
            <View style={signupStyles.hoursHeaderContainer}>
              <CustomText 
                fontFamily="figtree" 
                style={signupStyles.hoursTitle}
              >
                Set your business operating hours for each day
              </CustomText>
              <CustomText 
                fontFamily="figtree" 
                style={signupStyles.hoursSubtitle}
              >
                Use 12-hour format (e.g., 9:00 AM, 5:00 PM)
              </CustomText>
            </View>
            
            {/* Scrollable Hours Content */}
            <ScrollView 
              style={signupStyles.hoursScrollContainer}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <View key={day} style={signupStyles.hoursDayContainer}>
                  <View style={signupStyles.hoursDayHeader}>
                    <CustomText 
                      fontFamily="figtree" 
                      style={signupStyles.hoursDayText}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </CustomText>
                    <Switch
                      value={form.hours[day].isOpen}
                      onValueChange={(value) => {
                        const newHours = { ...form.hours };
                        newHours[day].isOpen = value;
                        if (!value) {
                          newHours[day].slots = [];
                        } else if (newHours[day].slots.length === 0) {
                          newHours[day].slots = [{ open: '9:00 AM', close: '5:00 PM' }];
                        }
                        setForm({ ...form, hours: newHours });
                      }}
                      thumbColor={form.hours[day].isOpen ? '#FB7A20' : '#ccc'}
                      trackColor={{ true: '#fcd7b0', false: '#eee' }}
                    />
                  </View>
                  
                  {form.hours[day].isOpen && (
                    <View style={signupStyles.hoursSlotsContainer}>
                      {form.hours[day].slots.map((slot: { open: string; close: string }, slotIndex: number) => (
                        <View key={slotIndex} style={signupStyles.hoursSlotRow}>
                          <View style={signupStyles.timeInputContainer}>
                            <CustomText fontFamily="figtree" style={signupStyles.timeLabel}>Open</CustomText>
                            <TextInput
                              style={signupStyles.timeInput}
                              value={slot.open}
                              onChangeText={(text) => {
                                const newHours = { ...form.hours };
                                newHours[day].slots[slotIndex].open = text;
                                setForm({ ...form, hours: newHours });
                              }}
                              placeholder="9:00 AM"
                              placeholderTextColor="#aaa"
                              maxLength={8}
                              keyboardType="default"
                            />
                          </View>
                          
                          <View style={signupStyles.timeInputContainer}>
                            <CustomText fontFamily="figtree" style={signupStyles.timeLabel}>Close</CustomText>
                            <TextInput
                              style={signupStyles.timeInput}
                              value={slot.close}
                              onChangeText={(text) => {
                                const newHours = { ...form.hours };
                                newHours[day].slots[slotIndex].close = text;
                                setForm({ ...form, hours: newHours });
                              }}
                              placeholder="5:00 PM"
                              placeholderTextColor="#aaa"
                              maxLength={8}
                              keyboardType="default"
                            />
                          </View>
                          
                          {form.hours[day].slots.length > 1 && (
                            <TouchableOpacity
                              style={signupStyles.removeSlotButton}
                              onPress={() => {
                                const newHours = { ...form.hours };
                                newHours[day].slots.splice(slotIndex, 1);
                                setForm({ ...form, hours: newHours });
                              }}
                            >
                              <AntDesign name="minuscircle" size={20} color="#ff4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      
                      <TouchableOpacity
                        style={signupStyles.addSlotButton}
                        onPress={() => {
                          const newHours = { ...form.hours };
                          newHours[day].slots.push({ open: '9:00 AM', close: '5:00 PM' });
                          setForm({ ...form, hours: newHours });
                        }}
                      >
                        <AntDesign name="pluscircle" size={20} color="#FB7A20" />
                        <CustomText fontFamily="figtree" style={signupStyles.addSlotText}>
                          Add another time slot
                        </CustomText>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 24 }}>
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
    </ScrollView>
  );
} 