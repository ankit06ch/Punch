# NFC Setup Guide for iOS

## Requirements

### 1. Apple Developer Account

- **Paid Apple Developer Account** ($99/year) is **REQUIRED** for NFC capabilities
- Free developer accounts cannot use NFC features
- This is an Apple restriction, not a technical limitation

### 2. Device Requirements

- iPhone 7 or newer (iPhone 6s and earlier don't support NFC)
- iOS 11 or later

## Configuration Steps

### 1. Xcode Configuration

#### A. Enable NFC Capabilities

1. Open your project in Xcode
2. Select your target
3. Go to "Signing & Capabilities"
4. Click "+ Capability"
5. Add "Near Field Communication Tag Reading"

#### B. Configure Entitlements

The `punch.entitlements` file has been updated with:

```xml
<key>com.apple.developer.nfc.readersession.formats</key>
<array>
    <string>TAG</string>
    <string>NDEF</string>
</array>
```

#### C. Info.plist Configuration

The `Info.plist` has been updated with:

```xml
<key>NFCReaderUsageDescription</key>
<string>This app uses NFC to scan tags and share information with other users.</string>
```

### 2. App Store Review Requirements

When submitting to the App Store, you must justify NFC usage:

#### Acceptable Use Cases:

- **Payment processing** (Apple Pay, etc.)
- **Access control** (building entry, etc.)
- **Information sharing** between users
- **Product identification** (inventory, etc.)
- **Transportation** (transit cards, etc.)

#### Your App's Justification:

"Our app uses NFC to enable users to share profile information and connect with other users by tapping their phones together, similar to how business cards work digitally."

### 3. Testing NFC

#### A. Development Testing

- Use a **physical device** (not simulator)
- Test with actual NFC tags or another iPhone
- NFC tags can be purchased online for testing

#### B. Common NFC Tags for Testing:

- **NTAG213/215/216**: Most common, cheap
- **MIFARE Ultralight**: Another popular option
- **ISO14443 Type A**: Standard format

### 4. Troubleshooting

#### If NFC Scanner Doesn't Appear:

1. **Check Developer Account**: Ensure you have a paid account
2. **Verify Capabilities**: NFC must be enabled in Xcode
3. **Check Device**: iPhone 7+ required
4. **iOS Version**: iOS 11+ required
5. **Permissions**: User must grant NFC permission

#### Common Errors:

- **"NFC module not available"**: Check if react-native-nfc-manager is installed
- **"Session invalidated"**: Normal iOS behavior when user cancels
- **"User cancelled"**: User tapped cancel or moved phone away

### 5. Alternative for Development

If you don't have a paid developer account, you can:

#### A. Use Android for Testing

- NFC works on Android with free developer account
- Test the functionality on Android devices

#### B. Simulate NFC

- Use the current simulated version for UI testing
- Add a development flag to switch between real/simulated NFC

#### C. Use Expo Development Build

- Build with EAS Build
- Test on physical devices with development builds

## Code Implementation

The NFC implementation includes:

- Real NFC scanning with `react-native-nfc-manager`
- Platform-specific handling for iOS/Android
- Error handling for various scenarios
- User-friendly status messages
- Tag data display

## Next Steps

1. **Get a paid Apple Developer account** if you want to test on iOS
2. **Test on Android** first (works with free account)
3. **Purchase NFC tags** for testing
4. **Submit to App Store** with proper NFC justification

## Cost Breakdown

- **Apple Developer Account**: $99/year
- **NFC Tags for Testing**: $10-50 (one-time)
- **Total**: ~$109-149 first year, $99/year after

This is the standard cost for any iOS app that uses NFC functionality.
