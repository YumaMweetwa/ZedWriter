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
    try {
      setLoading(true);
      console.log('🔍 Getting auth user from Supabase...');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('🔍 Auth user result:', authUser ? 'Found user' : 'No user', authUser?.id);
      
      if (authUser) {
        // Create basic user object first to prevent null state
        const basicUser: CombinedUser = {
          id: authUser.id,
          email: authUser.email || '',
          firstName: authUser.user_metadata?.first_name || 'User',
          lastName: authUser.user_metadata?.last_name || '',
          phone: undefined,
          school: undefined,
          studentId: undefined,
          role: 'student', // Default role
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
        
        // Set basic user immediately to prevent null state
        setUser(basicUser);
        console.log('✅ Set basic user object:', authUser.id, authUser.email);
        
        // Now try to get profile data to enhance the user object
        try {
          console.log('🔍 Fetching user profile...');
          const profileData = await getUserProfile(authUser.id);
          console.log('🔍 Profile result:', profileData ? 'Found profile' : 'No profile');
          
          if (profileData) {
            // Update user with profile data
            const enhancedUser: CombinedUser = {
              ...basicUser,
              firstName: profileData.first_name || basicUser.firstName,
              lastName: profileData.last_name || basicUser.lastName,
              phone: profileData.phone || undefined,
              school: profileData.school || undefined,
              studentId: profileData.student_id || undefined,
              role: profileData.role || 'student',
              isAdmin: profileData.role === 'admin',
              displayName: profileData.first_name && profileData.last_name 
                ? `${profileData.first_name} ${profileData.last_name}` 
                : basicUser.displayName,
            };
            
            setUser(enhancedUser);
            setProfile(profileData);
            console.log('✅ Enhanced user with profile data. Role:', enhancedUser.role);
          } else {
            console.log('❌ No profile found, keeping basic user');
          }
        } catch (profileError) {
          console.error('❌ Error fetching profile, keeping basic user:', profileError);
        }
      } else {
        console.log('❌ No authenticated user found, clearing state');
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

  // Debug logging for current state
  useEffect(() => {
    console.log('🔍 AUTH DIAGNOSTIC - Context state changed:');
    console.log('  - user:', user ? `${user.id} (${user.email}) Role: ${user.role}` : 'null');
    console.log('  - profile:', profile ? 'loaded' : 'null');
    console.log('  - session:', session ? 'exists' : 'null');
    console.log('  - loading:', loading);
    console.log('  - profile loading:', false);
  }, [user, profile, session, loading]);

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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Manually clear all state
      setUser(null);
      setProfile(null);
      setSession(null);
      console.log('🔍 Sign out completed - all state cleared');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
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