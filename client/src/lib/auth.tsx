import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, createUserDocument, getUserDocument } from './firebase';

interface AuthContextType {
  currentUser: User | null;
  userDocument: any;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userDocument: null,
  loading: true,
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userDocument, setUserDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        setCurrentUser(user);
        // Create user document if it doesn't exist
        await createUserDocument(user);
        // Get user document
        const userDoc = await getUserDocument(user.uid);
        setUserDocument(userDoc);
      } else {
        setCurrentUser(null);
        setUserDocument(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      const { logOut } = await import('./firebase');
      await logOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    currentUser,
    userDocument,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
