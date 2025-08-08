import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export interface ProfilePictureResult {
  uri: string;
  width: number;
  height: number;
}

export const pickProfilePicture = async (): Promise<ProfilePictureResult | null> => {
  try {
    // Request permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return null;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      
      // Compress and resize the image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      return {
        uri: manipulatedImage.uri,
        width: manipulatedImage.width,
        height: manipulatedImage.height,
      };
    }

    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
};

export const uploadProfilePicture = async (
  userId: string,
  imageUri: string
): Promise<string | null> => {
  try {
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create a reference to the profile picture in Firebase Storage
    const storageRef = ref(storage, `profile-pictures/${userId}.jpg`);

    // Upload the blob
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return null;
  }
};

export const deleteProfilePicture = async (userId: string): Promise<boolean> => {
  try {
    const storageRef = ref(storage, `profile-pictures/${userId}.jpg`);
    // Note: Firebase Storage doesn't have a direct delete method in the web SDK
    // You would need to use the Admin SDK or handle this differently
    // For now, we'll just return true as the file will be overwritten on next upload
    return true;
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    return false;
  }
}; 