/**
 * Utility functions for URL handling and security
 */

/**
 * Converts HTTP URLs to HTTPS for security compliance
 * @param url - The URL to convert
 * @returns HTTPS URL or original URL if already HTTPS or invalid
 */
export const ensureHttps = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return url;
  }
  
  // If it's already HTTPS, return as is
  if (url.startsWith('https://')) {
    return url;
  }
  
  // If it's HTTP, convert to HTTPS
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  
  // If it's a relative URL or doesn't start with a protocol, return as is
  return url;
};

/**
 * Validates if a URL is secure (HTTPS) or local
 * @param url - The URL to validate
 * @returns true if the URL is secure or local
 */
export const isSecureUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Allow HTTPS URLs
  if (url.startsWith('https://')) {
    return true;
  }
  
  // Allow local file URLs (for local images)
  if (url.startsWith('file://') || url.startsWith('content://') || url.startsWith('ph://')) {
    return true;
  }
  
  // Allow data URLs (base64 images)
  if (url.startsWith('data:')) {
    return true;
  }
  
  // Allow relative URLs (local assets)
  if (!url.includes('://')) {
    return true;
  }
  
  // Reject HTTP URLs
  return false;
};

/**
 * Sanitizes an image URI to ensure it's secure
 * @param uri - The image URI to sanitize
 * @returns A secure URI or null if invalid
 */
export const sanitizeImageUri = (uri: string | null | undefined): string | null => {
  if (!uri || typeof uri !== 'string') {
    return null;
  }
  
  // If it's not a secure URL, try to make it secure
  if (!isSecureUrl(uri)) {
    const secureUri = ensureHttps(uri);
    if (isSecureUrl(secureUri)) {
      return secureUri;
    }
    return null;
  }
  
  return uri;
};