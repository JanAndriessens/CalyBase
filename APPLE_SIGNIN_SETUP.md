# 🍎 Apple Sign-In Setup Guide for CalyBase

## Current Status
✅ **Code Implementation**: Complete - Apple Sign-In is fully implemented in the codebase
✅ **UI Interface**: Complete - Apple Sign-In button is styled and functional
✅ **Firebase Integration**: Complete - Uses Firebase Auth's OAuthProvider for Apple
⚠️ **Missing**: Apple Developer account configuration and Firebase Console setup

## What's Already Implemented

### Frontend (login.html)
- Apple Sign-In button with official Apple styling
- `handleAppleSignIn()` function using Firebase Auth
- Error handling for Apple-specific scenarios
- Loading states and user feedback
- French localization support

### Configuration (firebase-config.js)
- Apple OAuth configuration: `com.calybase.signin`
- Redirect URI: `https://calybase.firebaseapp.com/__/auth/handler`
- Integration with Firebase Auth system

## Required Setup Steps

### 1. Apple Developer Account Setup

#### Prerequisites
- Apple Developer Account ($99/year) - [https://developer.apple.com/](https://developer.apple.com/)
- Access to Apple Developer Console

#### Step 1: Create App ID
1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** (Add new)
4. Select **App IDs** → **App**
5. Configure:
   - **Description**: `CalyBase Web Application`
   - **Bundle ID**: `com.calybase.app` (use your preferred bundle ID)
   - **Capabilities**: Enable "Sign In with Apple"

#### Step 2: Create Services ID
1. Go to **Identifiers** → **+** (Add new)
2. Select **Services IDs**
3. Configure:
   - **Description**: `CalyBase Sign In Service`
   - **Identifier**: `com.calybase.signin` (matches firebase-config.js)
   - Enable "Sign In with Apple"

#### Step 3: Configure Sign In with Apple for Services ID
1. Click on the Services ID you just created
2. Check "Sign In with Apple" and click **Configure**
3. Configure domains and URLs:
   - **Primary App ID**: Select the App ID created in Step 1
   - **Web Domain**: `caly-base.vercel.app`
   - **Return URLs**: 
     - `https://calybase.firebaseapp.com/__/auth/handler`
     - `https://caly-base.vercel.app/__/auth/handler` (if using Vercel domain)

### 2. Firebase Console Configuration

#### Enable Apple Sign-In Provider
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your CalyBase project
3. Navigate to **Authentication** → **Sign-in method**
4. Click **Apple** provider
5. Enable Apple Sign-In
6. Configure:
   - **Service ID**: `com.calybase.signin`
   - **Apple team ID**: Your Apple Developer Team ID (found in Apple Developer account)
   - **Key ID**: Create a new key in Apple Developer Console
   - **Private key**: Upload the .p8 file from Apple Developer Console

#### Create Apple Sign-In Key
1. In Apple Developer Console, go to **Keys**
2. Click **+** (Add new key)
3. Configure:
   - **Key Name**: `CalyBase Sign In Key`
   - **Enable**: Sign In with Apple
   - **Primary App ID**: Select your App ID
4. Download the .p8 key file (keep it secure!)
5. Note the Key ID for Firebase configuration

### 3. Domain Verification

#### Add Authorized Domains in Firebase
1. In Firebase Console → **Authentication** → **Settings**
2. Add authorized domains:
   - `caly-base.vercel.app`
   - `calybase.web.app` (if using Firebase Hosting)
   - `localhost` (for development)

#### Verify Domain in Apple Developer Console  
1. In your Services ID configuration
2. Add web domains that will use Sign In with Apple
3. Apple will provide a verification file to upload to your domain

## Testing the Implementation

### Local Testing
1. Ensure Firebase config is updated with real Apple Service ID
2. Test Apple Sign-In flow in development environment
3. Check console for any authentication errors

### Production Testing
1. Deploy updated configuration to production
2. Test Apple Sign-In on live site
3. Verify user creation and approval workflow

## Expected User Flow

1. **User clicks Apple Sign-In button** → Apple authentication popup opens
2. **User authenticates with Apple** → Returns to CalyBase with Apple credentials
3. **User document created** in Firestore with:
   - `loginProvider: 'apple'`
   - `status: 'pending'` (requires admin approval)
   - User data from Apple (name, email)
4. **Admin approves user** in user management interface
5. **User can access CalyBase** with Apple Sign-In

## Troubleshooting

### Common Issues
- **Invalid client**: Check Service ID matches firebase-config.js
- **Domain not verified**: Ensure domains are properly configured in both Apple and Firebase
- **Popup blocked**: User needs to allow popups for authentication
- **Team ID mismatch**: Verify Apple Team ID in Firebase configuration

### Debug Steps
1. Check browser console for Firebase Auth errors
2. Verify Apple Service ID configuration
3. Test with different browsers/devices
4. Check Firebase Auth logs in Firebase Console

## Security Considerations

- Keep Apple private key (.p8 file) secure
- Only add necessary domains to authorized domains list
- Regularly review Apple Sign-In usage in Apple Developer Console
- Monitor Firebase Auth logs for suspicious activity

## Support Resources

- [Apple Sign-In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Firebase Auth Apple Provider Docs](https://firebase.google.com/docs/auth/web/apple)
- [Apple Developer Support](https://developer.apple.com/support/)

---

**Once you complete the Apple Developer setup and provide the Service ID, I can help test and debug the implementation!**