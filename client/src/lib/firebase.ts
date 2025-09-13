import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, User, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "improvedzedwriter"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "improvedzedwriter",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "improvedzedwriter"}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:demo",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

// Initialize Firebase
try {
  console.log('Initializing Firebase with config:', {
    apiKey: firebaseConfig.apiKey ? '***' : 'missing',
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  });
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error("Firebase initialization failed:", error);
  console.warn("Authentication and cloud features will be disabled.");
  auth = null;
  db = null;
  storage = null;
}

export { auth, db, storage };

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    // If Firebase is not initialized, call callback with null user
    callback(null);
    return () => {}; // Return empty unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
};

// Create user document in Firestore
export const createUserDocument = async (user: User) => {
  if (!user || !db) return;
  
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnapshot = await getDoc(userRef);
    
    if (!userSnapshot.exists()) {
      const { displayName, email } = user;
      await setDoc(userRef, {
        displayName,
        email,
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Error creating user document:', error);
  }
};

// Get user document from Firestore
export const getUserDocument = async (uid: string) => {
  if (!uid || !db) return null;
  
  try {
    const userRef = doc(db, 'users', uid);
    const userSnapshot = await getDoc(userRef);
    
    if (userSnapshot.exists()) {
      return userSnapshot.data();
    }
  } catch (error) {
    console.error('Error getting user document:', error);
  }
  
  return null;
};

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Google Sign In
export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error('Firebase auth not initialized. Please check your Firebase configuration in .env file.');
  }
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create user document in Firestore if it doesn't exist
    await createUserDocument(user);
    
    return user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Email/Password Sign In
export const signInWithEmail = async (email: string, password: string) => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }
  
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Create user document in Firestore if it doesn't exist
    await createUserDocument(user);
    
    return user;
  } catch (error) {
    console.error('Error signing in with email:', error);
    throw error;
  }
};

// Email/Password Sign Up
export const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }
  
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Update display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    // Create user document in Firestore
    await createUserDocument(user);
    
    return user;
  } catch (error) {
    console.error('Error signing up with email:', error);
    throw error;
  }
};

// File Upload to Firebase Storage
export const uploadFile = async (file: File, path: string) => {
  if (!storage) {
    throw new Error('Firebase storage not initialized');
  }
  
  try {
    const fileRef = ref(storage, path);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Sign out
export const logOut = () => {
  if (!auth) {
    console.warn('Firebase auth not initialized');
    return Promise.resolve();
  }
  return signOut(auth);
};

export default app;
