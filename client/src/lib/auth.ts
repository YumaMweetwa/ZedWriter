import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "./firebase";
import { User, InsertUser } from "@shared/types";

const googleProvider = new GoogleAuthProvider();

// API helper function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
};

export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error("Firebase authentication is not configured");
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user exists in our PostgreSQL database
    try {
      const existingUser = await apiRequest(`/api/users/firebase/${user.uid}`);
      if (existingUser) {
        return result;
      }
    } catch (error) {
      // User doesn't exist, create them
    }

    // Create new user in our PostgreSQL database
    const userData: InsertUser = {
      firebaseUid: user.uid,
      email: user.email!,
      firstName: user.displayName?.split(" ")[0] || "",
      lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
      profilePicture: user.photoURL || undefined,
      referralCode: generateReferralCode(),
      role: "student",
    };
    
    await apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    return result;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!auth) {
    throw new Error("Firebase authentication is not configured");
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error) {
    console.error("Email sign-in error:", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, userData: Partial<InsertUser>) => {
  if (!auth) {
    throw new Error("Firebase authentication is not configured");
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Create user in our PostgreSQL database
    const fullUserData: InsertUser = {
      ...userData,
      firebaseUid: user.uid,
      email: user.email!,
      referralCode: generateReferralCode(),
      role: "student",
    } as InsertUser;
    
    await apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify(fullUserData),
    });
    
    return result;
  } catch (error) {
    console.error("Email sign-up error:", error);
    throw error;
  }
};

export const logout = async () => {
  if (!auth) {
    throw new Error("Firebase authentication is not configured");
  }

  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  if (!auth) {
    throw new Error("Firebase authentication is not configured");
  }

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (!auth) {
    return null;
  }

  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  
  try {
    const user = await apiRequest(`/api/users/firebase/${firebaseUser.uid}`);
    return user;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
};

const generateReferralCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};