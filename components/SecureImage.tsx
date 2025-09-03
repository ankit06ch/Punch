import React from 'react';
import { Image, ImageProps, ImageSourcePropType } from 'react-native';
import { sanitizeImageUri } from '../utils/urlUtils';

interface SecureImageProps extends Omit<ImageProps, 'source'> {
  source: ImageSourcePropType | string | null | undefined;
  fallbackSource?: ImageSourcePropType;
}

/**
 * A secure Image component that automatically handles URL sanitization
 * and provides fallback for insecure or invalid URLs
 */
export const SecureImage: React.FC<SecureImageProps> = ({ 
  source, 
  fallbackSource,
  ...props 
}) => {
  // Handle different source types
  const getSecureSource = (): ImageSourcePropType | undefined => {
    if (!source) {
      return fallbackSource;
    }

    // If source is an object (like require() or { uri: string })
    if (typeof source === 'object' && source !== null) {
      // If it has a uri property, sanitize it
      if ('uri' in source && typeof source.uri === 'string') {
        const secureUri = sanitizeImageUri(source.uri);
        if (secureUri) {
          return { ...source, uri: secureUri };
        } else {
          console.warn('Insecure or invalid image URI:', source.uri);
          return fallbackSource;
        }
      }
      // If it's a require() or other object, use as is
      return source;
    }

    // If source is a string URI
    if (typeof source === 'string') {
      const secureUri = sanitizeImageUri(source);
      if (secureUri) {
        return { uri: secureUri };
      } else {
        console.warn('Insecure or invalid image URI:', source);
        return fallbackSource;
      }
    }

    return fallbackSource;
  };

  const secureSource = getSecureSource();

  if (!secureSource) {
    // If no secure source is available, return null or a placeholder
    return null;
  }

  return <Image source={secureSource} {...props} />;
};

export default SecureImage;