import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { User, InsertUser } from "@shared/schema";

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user exists in our database
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists()) {
      // Create new user in our database
      const userData: Partial<User> = {
        firebaseUid: user.uid,
        email: user.email!,
        firstName: user.displayName?.split(" ")[0] || "",
        lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
        profilePicture: user.photoURL,
        referralCode: generateReferralCode(),
        role: "student",
        isActive: true,
      };
      
      await setDoc(doc(db, "users", user.uid), userData);
    }
    
    return result;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error) {
    console.error("Email sign-in error:", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, userData: Partial<InsertUser>) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Create user in our database
    const fullUserData: Partial<User> = {
      ...userData,
      firebaseUid: user.uid,
      email: user.email!,
      referralCode: generateReferralCode(),
      role: "student",
      isActive: true,
    };
    
    await setDoc(doc(db, "users", user.uid), fullUserData);
    
    return result;
  } catch (error) {
    console.error("Email sign-up error:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  
  try {
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    if (userDoc.exists()) {
      return { ...userDoc.data(), id: userDoc.id } as User;
    }
    return null;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
};

const generateReferralCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};
