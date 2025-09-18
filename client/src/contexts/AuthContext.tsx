import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, getUserProfile, createUserProfile } from '@/lib/supabase';

// Profile type for the profiles table
interface Profile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  school?: string | null;
  student_id?: string | null;
  role?: string;
  created_at?: string;
}

// Combined user type that matches what components expect
interface CombinedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  school?: string;
  studentId?: string;
  role: string;
  profilePicture?: string;
  referralCode?: string;
  referralPoints?: number;
  totalPaid?: number;
  totalOwed?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  // Admin field
  isAdmin?: boolean;
  // Additional properties for compatibility
  displayName?: string;
  points?: number;
  avatarUrl?: string;
}

interface AuthContextType {
  user: CombinedUser | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<CombinedUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    console.log('🔍 AUTH DIAGNOSTIC - Context state changed:');
    console.log('  - user:', user ? `${user.id} (${user.email})` : 'null');
    console.log('  - profile:', profile ? 'loaded' : 'null');
    console.log('  - session:', session ? 'exists' : 'null');
    console.log('  - loading:', loading);
    console.log('  - profile loading:', false);
    
    try {
      setLoading(true);
      console.log('🔍 Getting auth user from Supabase...');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('🔍 Auth user result:', authUser ? 'Found user' : 'No user', authUser?.id);
      
      if (authUser) {
        let profileData = null;
        
        try {
          profileData = await getUserProfile(authUser.id);
          
          // If no profile exists, create one automatically for new users
          if (!profileData) {
            console.log('User profile not found, attempting to create...');
            try {
              profileData = await createUserProfile({
                email: authUser.email || '',
                first_name: authUser.user_metadata?.first_name || 'User',
                last_name: authUser.user_metadata?.last_name || '',
              });
              console.log('Profile created successfully');
            } catch (createError) {
              console.error('Failed to create user profile:', createError);
              // Continue with null profileData but still set user from auth data
            }
          }
        } catch (profileError) {
          console.error('Error getting/creating profile:', profileError);
          // Continue with null profileData but still set user from auth data
        }
        
        setProfile(profileData);
        
        // CRITICAL FIX: Always create user object from auth data, regardless of profile success/failure
        const combinedUser: CombinedUser = {
          id: authUser.id,
          email: authUser.email || '',
          firstName: profileData?.first_name || authUser.user_metadata?.first_name || 'User',
          lastName: profileData?.last_name || authUser.user_metadata?.last_name || '',
          phone: profileData?.phone || undefined,
          school: profileData?.school || undefined,
          studentId: profileData?.student_id || undefined,
          role: profileData?.role || 'student',
          profilePicture: profileData?.profile_picture || undefined,
          referralCode: profileData?.referral_code || undefined,
          referralPoints: profileData?.referral_points || 0,
          totalPaid: profileData?.total_paid || 0,
          totalOwed: profileData?.total_owed || 0,
          isActive: profileData?.is_active ?? true,
          createdAt: profileData?.created_at || authUser.created_at,
          updatedAt: profileData?.updated_at || undefined,
          isAdmin: profileData?.role === 'admin',
          // Additional properties for compatibility
          displayName: profileData?.first_name && profileData?.last_name 
            ? `${profileData.first_name} ${profileData.last_name}` 
            : authUser.user_metadata?.full_name || 'User',
          points: profileData?.referral_points || 0,
          avatarUrl: profileData?.profile_picture || authUser.user_metadata?.avatar_url || undefined
        };
        
        console.log('Setting user object in AuthContext:', combinedUser.id, combinedUser.email);
        setUser(combinedUser);
      } else {
        console.log('No authenticated user found, clearing state');
        setProfile(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Critical error in refreshProfile:', error);
      // Even on critical error, try to get basic auth user info
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          console.log('Setting fallback user object from auth data');
          const fallbackUser: CombinedUser = {
            id: authUser.id,
            email: authUser.email || '',
            firstName: authUser.user_metadata?.first_name || 'User',
            lastName: authUser.user_metadata?.last_name || '',
            role: 'student',
            profilePicture: undefined,
            referralCode: undefined,
            referralPoints: 0,
            totalPaid: 0,
            totalOwed: 0,
            isActive: true,
            createdAt: authUser.created_at,
            updatedAt: undefined,
            isAdmin: false,
            displayName: authUser.user_metadata?.full_name || 'User',
            points: 0,
            avatarUrl: authUser.user_metadata?.avatar_url || undefined
          };
          setUser(fallbackUser);
        } else {
          setUser(null);
        }
      } catch (fallbackError) {
        console.error('Even fallback failed:', fallbackError);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Step 1: Get existing session on mount
    const getInitialSession = async () => {
      try {
        console.log('🔍 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
        } else {
          console.log('🎯 Initial session:', session ? '✅ Found' : '❌ None');
        }
        
        if (mounted) {
          setSession(session);
          if (session?.user) {
            console.log('🔍 AUTH DIAGNOSTIC - Auth event:', 'INITIAL_SESSION', 'User ID:', session.user.id);
            await refreshProfile();
          } else {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('💥 Critical session error:', error);
        if (mounted) setLoading(false);
      }
    };

    // Step 2: Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔍 AUTH DIAGNOSTIC - Auth event:', event, 'User ID:', session?.user?.id);
        console.log('🔔 Auth event:', event, session ? '✅ Session exists' : '❌ No session');
        
        if (mounted) {
          setSession(session);
          if (session?.user) {
            await refreshProfile();
          } else {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        }
      }
    );

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    profile,
    session,
    loading,
    refreshProfile,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};