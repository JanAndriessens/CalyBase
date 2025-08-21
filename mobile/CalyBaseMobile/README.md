# CalyBase Mobile Test App

This is a test React Native app that connects to the existing CalyBase Firebase backend.

## Features

- ✅ Firebase Authentication (using existing CalyBase backend)
- ✅ Member listing from Firestore database
- ✅ Login/Logout functionality
- ✅ Real-time data from existing web app database

## Setup Complete

The app is ready to test and includes:

1. **Firebase Configuration**: Uses the same Firebase project as the web app
2. **Authentication**: Login with existing CalyBase user accounts
3. **Member Display**: Shows member data from the existing Firestore database
4. **Cross-Platform**: Works on iOS, Android, and Web

## How to Run

### Web Version (Easiest for Testing)
```bash
npm run web
```

### Mobile Device (iOS/Android)
1. Install Expo Go app on your device
2. Run: `npm start`
3. Scan the QR code with your camera (iOS) or Expo Go app (Android)

### iOS Simulator
```bash
npm run ios
```

### Android Emulator
```bash
npm run android
```

## Integration with CalyBase

This mobile app:
- Uses the **same Firebase project** as the web app
- Connects to the **same Firestore database**
- Shares **user authentication** with the web app
- Can be used alongside the existing web application

## Test Login

Use any existing CalyBase user account to test the mobile app. The login will authenticate against the same Firebase Auth instance used by the web application.

## Next Steps

This foundation can be extended with:
- Event management screens
- Push notifications
- Offline support
- Camera integration for member photos
- Payconiq payment integration (Belgium-specific)

## Technical Details

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Dependencies**: Firebase SDK v12, React Native AsyncStorage