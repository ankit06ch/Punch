# Google Maps Integration Documentation

## Overview

The "What's Near You" section in the home page now includes an interactive Google Maps view showing nearby restaurants and the user's current location.

## Components

### GoogleMapsView Component

- **Location**: `app/components/GoogleMapsView.tsx`
- **Features**:
  - Interactive Google Maps view (200px height)
  - User location tracking with blue dot
  - Restaurant markers with custom styling
  - Location permission handling
  - "Tap to view full map" overlay
  - Real-time location updates

## Dependencies

### Required Packages

```bash
pnpm add react-native-maps expo-location
```

### Configuration Files Updated

- `app.json` - Added location permissions and Google Maps API key configuration
- `seedRestaurants.js` - Added latitude/longitude coordinates to sample data

## Setup Requirements

### 1. Google Maps API Key

You need to obtain a Google Maps API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Maps SDK for Android and iOS
4. Create API key
5. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` in `app.json`

### 2. Location Permissions

The app automatically requests location permissions when the map component loads.

### 3. Restaurant Data

Restaurants need latitude and longitude coordinates to appear on the map:

```javascript
{
  name: "Restaurant Name",
  latitude: 37.78825,
  longitude: -122.4324,
  // ... other fields
}
```

## Usage

### In Home Page

The map is integrated into the "What's Near You" section:

```tsx
<GoogleMapsView
  restaurants={restaurants}
  onRestaurantPress={handleRestaurantPress}
/>
```

### Props

- `restaurants`: Array of restaurant objects with location data
- `onRestaurantPress`: Callback function when a restaurant marker is tapped

## Features

### Map Controls

- **Zoom**: Disabled (fixed view)
- **Scroll**: Disabled (fixed view)
- **Rotate**: Disabled
- **Pitch**: Disabled
- **User Location**: Enabled (blue dot)

### Markers

- Custom colored markers for each restaurant
- Shop icon inside markers
- Tap to select restaurant
- White border for visibility

### Location Handling

- Automatic permission request
- Fallback to default location if permission denied
- Error handling for location services
- Real-time location updates

## Troubleshooting

### Common Issues

1. **Font Import Errors**

   - Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`

2. **Map Not Loading**

   - Verify Google Maps API key is set correctly
   - Check internet connection
   - Ensure location permissions are granted

3. **No Restaurant Markers**

   - Verify restaurants have latitude/longitude coordinates
   - Check restaurant data structure

4. **Native Module Errors**

   - Ensure `react-native-maps` is properly installed
   - Rebuild the app after adding the dependency

### Development Commands

```bash
# Clear cache and restart
npx expo start --clear

# Reinstall dependencies
rm -rf node_modules && pnpm install

# Rebuild for native changes
npx expo run:ios
npx expo run:android
```

## Future Enhancements

### Potential Additions

- Full-screen map modal
- Directions to restaurants
- Distance calculations
- Real-time location updates
- Custom map styling
- Clustering for multiple markers
- Search functionality
- Route planning

### Integration Points

- Restaurant detail screens
- Navigation integration
- Push notifications for nearby deals
- Social features (check-ins)

## Technical Notes

### Why Google Maps?

- **Real Map Data**: Actual street maps and satellite imagery
- **Accurate Location**: Precise GPS coordinates
- **Rich Features**: Built-in location services
- **Professional Look**: Industry-standard mapping
- **Scalable**: Can handle many markers efficiently

### Alternative Options

If you encounter issues with Google Maps, consider:

- `expo-location` + web view with Google Maps
- `react-native-maps` with Apple Maps (iOS)
- Third-party map services (Mapbox, etc.)

### Performance Considerations

- Map rendering can be resource-intensive
- Consider lazy loading for large datasets
- Optimize marker rendering for many locations
- Cache location data when possible
