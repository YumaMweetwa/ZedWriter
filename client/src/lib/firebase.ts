import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Check if Firebase environment variables are configured
const hasFirebaseConfig = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID
);

// Use placeholder config if Firebase keys are not provided
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id",
};

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

try {
  if (hasFirebaseConfig) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } else {
    console.warn("Firebase configuration missing. Authentication and cloud features will be disabled.");
    // Create mock objects that won't cause errors
    auth = null;
    db = null;
    storage = null;
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
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

// Sign out
export const logOut = () => {
  if (!auth) {
    console.warn('Firebase auth not initialized');
    return Promise.resolve();
  }
  return signOut(auth);
};

export default app;
