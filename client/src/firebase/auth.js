// Authentication management
import { 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getFirebaseAuth, getFirebaseFirestore } from './config.js';

export class AuthManager {
  constructor() {
    this.auth = getFirebaseAuth();
    this.db = getFirebaseFirestore();
    this.googleProvider = new GoogleAuthProvider();
    this.currentUser = null;
    
    // Configure Google provider
    this.googleProvider.addScope('email');
    this.googleProvider.addScope('profile');
    
    // Handle redirect result on page load
    this.handleRedirectResult();
  }

  async handleRedirectResult() {
    try {
      const result = await getRedirectResult(this.auth);
      if (result) {
        // User signed in successfully
        console.log('Redirect sign-in successful:', result.user);
        await this.createOrUpdateUserDocument(result.user);
      }
    } catch (error) {
      console.error('Redirect sign-in error:', error);
      this.showError(error.message);
    }
  }

  onAuthStateChanged(callback) {
    return onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        // Ensure user document exists
        const userDoc = await this.getUserDocument(user.uid);
        this.currentUser = { ...user, ...userDoc };
      } else {
        this.currentUser = null;
      }
      callback(this.currentUser);
    });
  }

  async signInWithGoogle() {
    try {
      await signInWithRedirect(this.auth, this.googleProvider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      this.showError(error.message);
      throw error;
    }
  }

  async signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      await this.createOrUpdateUserDocument(result.user);
      return result.user;
    } catch (error) {
      console.error('Email sign-in error:', error);
      this.showError(this.getReadableError(error.code));
      throw error;
    }
  }

  async signUpWithEmail(email, password, userData = {}) {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Update profile if display name provided
      if (userData.displayName) {
        await updateProfile(result.user, {
          displayName: userData.displayName
        });
      }

      // Create user document
      await this.createOrUpdateUserDocument(result.user, userData);
      
      return result.user;
    } catch (error) {
      console.error('Email sign-up error:', error);
      this.showError(this.getReadableError(error.code));
      throw error;
    }
  }

  async signOut() {
    try {
      await signOut(this.auth);
      this.currentUser = null;
    } catch (error) {
      console.error('Sign-out error:', error);
      this.showError(error.message);
      throw error;
    }
  }

  async createOrUpdateUserDocument(user, additionalData = {}) {
    if (!user) return;

    const userRef = doc(this.db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const { displayName, email } = user;
      const [firstName, ...lastNameParts] = (displayName || '').split(' ');
      
      const userData = {
        displayName: displayName || '',
        firstName: firstName || '',
        lastName: lastNameParts.join(' ') || '',
        email,
        phone: '',
        school: '',
        role: 'user',
        avatarUrl: user.photoURL || '',
        referralCode: this.generateReferralCode(user.uid),
        referredBy: additionalData.referredBy || '',
        points: 0,
        payoutMethod: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...additionalData
      };

      try {
        await setDoc(userRef, userData);
        console.log('User document created successfully');
        
        // Award referral points if user was referred
        if (userData.referredBy) {
          await this.awardReferralPoints(userData.referredBy, 'signup', user.uid);
        }
      } catch (error) {
        console.error('Error creating user document:', error);
      }
    } else {
      // Update existing user document
      const updateData = {
        updatedAt: new Date(),
        ...additionalData
      };

      try {
        await setDoc(userRef, updateData, { merge: true });
        console.log('User document updated successfully');
      } catch (error) {
        console.error('Error updating user document:', error);
      }
    }
  }

  async getUserDocument(uid) {
    try {
      const userRef = doc(this.db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user document:', error);
      return null;
    }
  }

  generateReferralCode(uid) {
    // Generate a simple referral code based on uid
    const code = uid.slice(-6).toUpperCase();
    return `ZW${code}`;
  }

  async awardReferralPoints(referrerCode, event, sourceUid) {
    try {
      // Find referrer by code
      const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      
      const usersRef = collection(this.db, 'users');
      const q = query(usersRef, where('referralCode', '==', referrerCode));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const referrerDoc = querySnapshot.docs[0];
        const referrerId = referrerDoc.id;

        // Award points based on event
        const pointsMap = {
          signup: 2,
          proposal_paid: 25,
          dissertation_paid: 50
        };

        const points = pointsMap[event] || 0;
        if (points > 0) {
          // Add referral record
          const { addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
          
          await addDoc(collection(this.db, 'referrals'), {
            ownerUid: referrerId,
            event,
            deltaPoints: points,
            sourceUid,
            createdAt: new Date()
          });

          console.log(`Awarded ${points} points for ${event}`);
        }
      }
    } catch (error) {
      console.error('Error awarding referral points:', error);
    }
  }

  getReadableError(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.'
    };

    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
  }

  showError(message) {
    // This would typically show a toast or modal
    console.error('Auth error:', message);
    
    // Try to show toast if available
    if (window.showToast) {
      window.showToast(message, 'error');
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  isAdmin() {
    return this.currentUser?.role === 'admin';
  }
}
