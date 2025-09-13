import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, logout, resetPassword } from '@/lib/auth';
import { InsertUser } from '@shared/types';

export const useAuthActions = () => {
  const { refreshUser } = useAuth();
  const { showToast, setLoading } = useApp();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setLoading({ isLoading: true, title: 'Signing in...', message: 'Please wait while we sign you in with Google.' });
      
      await signInWithGoogle();
      await refreshUser();
      
      showToast({
        type: 'success',
        title: 'Welcome!',
        message: 'Successfully signed in with Google.'
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Sign In Failed',
        message: error.message || 'Failed to sign in with Google. Please try again.'
      });
    } finally {
      setIsLoading(false);
      setLoading({ isLoading: false });
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setLoading({ isLoading: true, title: 'Signing in...', message: 'Please wait while we verify your credentials.' });
      
      await signInWithEmail(email, password);
      await refreshUser();
      
      showToast({
        type: 'success',
        title: 'Welcome back!',
        message: 'Successfully signed in.'
      });
    } catch (error: any) {
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      }
      
      showToast({
        type: 'error',
        title: 'Sign In Failed',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
      setLoading({ isLoading: false });
    }
  };

  const handleEmailSignUp = async (email: string, password: string, userData: Partial<InsertUser>) => {
    try {
      setIsLoading(true);
      setLoading({ isLoading: true, title: 'Creating account...', message: 'Please wait while we create your account.' });
      
      await signUpWithEmail(email, password, userData);
      await refreshUser();
      
      showToast({
        type: 'success',
        title: 'Account created!',
        message: 'Welcome to Zedwriter! Your account has been created successfully.'
      });
    } catch (error: any) {
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      }
      
      showToast({
        type: 'error',
        title: 'Sign Up Failed',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
      setLoading({ isLoading: false });
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
      
      // Redirect to homepage after successful logout
      setLocation('/');
      
      showToast({
        type: 'success',
        title: 'Goodbye!',
        message: 'Successfully signed out.'
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Sign Out Failed',
        message: 'Failed to sign out. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      setIsLoading(true);
      await resetPassword(email);
      
      showToast({
        type: 'success',
        title: 'Reset link sent!',
        message: 'Check your email for password reset instructions.'
      });
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      }
      
      showToast({
        type: 'error',
        title: 'Reset Failed',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleGoogleSignIn,
    handleEmailSignIn,
    handleEmailSignUp,
    handleLogout,
    handlePasswordReset,
  };
};
