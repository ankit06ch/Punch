import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

export interface ProfilePictureResult {
  uri: string;
  width: number;
  height: number;
}

// Ultra-safe profile picture picker with multiple fallbacks
export const pickProfilePicture = async (): Promise<ProfilePictureResult | null> => {
  try {
    console.log('Requesting media library permissions...');
    
    // Request permissions with timeout
    const permissionPromise = ImagePicker.requestMediaLibraryPermissionsAsync();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Permission request timeout')), 10000)
    );
    
    const permissionResult = await Promise.race([permissionPromise, timeoutPromise]) as ImagePicker.PermissionResponse;
    
    if (permissionResult.granted === false) {
      console.log('Permission denied for media library');
      return null;
    }

    console.log('Permissions granted, launching image picker...');

    // Try multiple picker configurations if one fails
    const pickerConfigs = [
      {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.8,
        allowsMultipleSelection: false,
      },
      {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      },
      {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1.0,
        allowsMultipleSelection: false,
      }
    ];

    let result = null;
    let lastError = null;

    for (const config of pickerConfigs) {
      try {
        console.log('Trying picker config:', config);
        result = await ImagePicker.launchImageLibraryAsync(config);
        console.log('Picker result:', result);
        break;
      } catch (error) {
        console.log('Picker config failed:', config, error);
        lastError = error;
        continue;
      }
    }

    if (!result || result.canceled || !result.assets || !result.assets[0]) {
      console.log('No image selected or picker failed');
      return null;
    }

    const asset = result.assets[0];
    console.log('Asset selected:', asset);
    
    if (!asset.uri) {
      console.log('No URI in asset');
      return null;
    }

    // Try to manipulate the image, but fall back to original if it fails
    try {
      console.log('Starting image manipulation...');
      
              const manipulatedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 400, height: 400 } }],
          { 
            compress: 0.8, 
            format: ImageManipulator.SaveFormat.JPEG
          }
        );

      console.log('Image manipulation successful:', manipulatedImage);

      return {
        uri: manipulatedImage.uri,
        width: manipulatedImage.width,
        height: manipulatedImage.height,
      };
    } catch (manipulationError) {
      console.error('Image manipulation failed, using original:', manipulationError);
      
      // Fallback: return the original image without manipulation
      return {
        uri: asset.uri,
        width: asset.width || 400,
        height: asset.height || 400,
      };
    }

  } catch (error) {
    console.error('Critical error in pickProfilePicture:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return null;
  }
};

// Ultra-safe profile picture picker that never crashes
export const pickProfilePictureSafe = async (): Promise<ProfilePictureResult | null> => {
  try {
    console.log('Using ultra-safe profile picture picker...');
    
    // Simple, minimal picker that's less likely to crash
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1.0,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets && result.assets[0] && result.assets[0].uri) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width || 400,
        height: asset.height || 400,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Ultra-safe picker also failed:', error);
    return null;
  }
};

export const uploadProfilePicture = async (
  userId: string,
  imageUri: string
): Promise<string | null> => {
  try {
    console.log('Starting profile picture upload for user:', userId);
    console.log('Image URI:', imageUri);
    
    // Validate URI
    if (!imageUri || typeof imageUri !== 'string') {
      console.error('Invalid image URI:', imageUri);
      return null;
    }

    // Convert image URI to blob
    console.log('Fetching image...');
    const response = await fetch(imageUri);
    
    if (!response.ok) {
      console.error('Failed to fetch image:', response.status, response.statusText);
      return null;
    }
    
    console.log('Converting to blob...');
    const blob = await response.blob();
    console.log('Blob size:', blob.size);

    // Create a reference to the profile picture in Firebase Storage
    const storageRef = ref(storage, `profile-pictures/${userId}.jpg`);
    console.log('Storage reference created');

    // Upload the blob
    console.log('Uploading blob...');
    await uploadBytes(storageRef, blob);
    console.log('Upload successful');

    // Get the download URL
    console.log('Getting download URL...');
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return null;
  }
};

export const deleteProfilePicture = async (userId: string): Promise<boolean> => {
  try {
    console.log('Deleting profile picture for user:', userId);
    
    const storageRef = ref(storage, `profile-pictures/${userId}.jpg`);
    await deleteObject(storageRef);
    console.log('Profile picture deleted successfully');
    return true;
  } catch (error: any) {
    if (error && error.code === 'storage/object-not-found') {
      // It's ok if there wasn't a previous image
      console.log('No profile picture found to delete');
      return true;
    }
    console.error('Error deleting profile picture:', error);
    return false;
  }
}; 