import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export const pickProfilePicture = async (): Promise<string | null> => {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      return manipulatedImage.uri;
    }

    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
};

export const uploadProfilePicture = async (
  imageUri: string,
  type: 'profile' | 'logo'
): Promise<string | null> => {
  try {
    // Sanitize the image URI to ensure it's secure
    const secureUri = sanitizeImageUri(imageUri);
    if (!secureUri) {
      console.error('Invalid or insecure image URI:', imageUri);
      return null;
    }
    
    const response = await fetch(secureUri);
    const blob = await response.blob();

    const fileName = `${type}-${Date.now()}.jpg`;
    const storageRef = ref(storage, `${type}s/${fileName}`);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}; 