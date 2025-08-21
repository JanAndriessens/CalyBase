// Firebase configuration for CalyBase Mobile App
// This uses the same configuration as the web app for consistency

import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// Firebase config copied from existing web app
const firebaseConfig = {
  apiKey: "AIzaSyDxsHCt4LAfPBJ2TAP-2IaOAQXXMOK2R7Q",
  authDomain: "calybase.firebaseapp.com",
  projectId: "calybase",
  storageBucket: "calybase.firebasestorage.app",
  messagingSenderId: "108529148364",
  appId: "1:108529148364:web:08289524026f6a91f6bd69"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with platform-specific persistence
let auth;
if (Platform.OS === 'web') {
  // Use default web persistence for web platform
  auth = getAuth(app);
} else {
  // Use React Native persistence for mobile platforms
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { auth, db, storage };
export default app;