import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { InsertUser } from '@shared/types';

export const useAuthActions = () => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } = useAuth();
  const { showToast, setLoading } = useApp();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setLoading({ isLoading: true, title: 'Signing in...', message: 'Please wait while we sign you in with Google.' });
      
      await signInWithGoogle();
      
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
      
      showToast({
        type: 'success',
        title: 'Welcome back!',
        message: 'Successfully signed in.'
      });
    } catch (error: any) {
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and confirm your account.';
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

  const handleEmailSignUp = async (email: string, password: string, userData?: Partial<InsertUser>) => {
    try {
      setIsLoading(true);
      setLoading({ isLoading: true, title: 'Creating account...', message: 'Please wait while we create your account.' });
      
      await signUpWithEmail(email, password);
      
      showToast({
        type: 'success',
        title: 'Account created!',
        message: 'Welcome to Zedwriter! Please check your email to confirm your account.'
      });
    } catch (error: any) {
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists.';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.message?.includes('Invalid email')) {
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
      await signOut();
      
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
      // Note: We'll need to add this to AuthContext if password reset is needed
      showToast({
        type: 'info',
        title: 'Password Reset',
        message: 'Password reset functionality will be available soon. Please contact support.'
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Reset Failed',
        message: 'Failed to send reset email. Please try again.'
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
