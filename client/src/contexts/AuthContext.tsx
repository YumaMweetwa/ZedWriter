import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, getUserProfile } from '@/lib/supabase';

// Profile type from our database
interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  university: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  referral_code: string | null;
  referred_by: string | null;
  created_at: string;
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
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      try {
        const profileData = await getUserProfile(authUser.id);
        setProfile(profileData);
        
        // Create combined user object
        const combinedUser: CombinedUser = {
          id: authUser.id,
          email: authUser.email || '',
          firstName: profileData?.full_name?.split(' ')[0] || '',
          lastName: profileData?.full_name?.split(' ').slice(1).join(' ') || '',
          phone: profileData?.phone || undefined,
          school: profileData?.university || undefined,
          studentId: undefined, // Not in profiles table
          role: profileData?.is_admin ? 'admin' : 'student',
          profilePicture: profileData?.avatar_url || undefined,
          referralCode: profileData?.referral_code || undefined,
          referralPoints: 0, // Would need to calculate from referral_rewards table
          totalPaid: 0, // Would need to calculate from payments table
          totalOwed: 0, // Would need to calculate from submissions table
          isActive: true,
          createdAt: profileData?.created_at || authUser.created_at,
          isAdmin: profileData?.is_admin || false,
          // Additional properties for compatibility
          displayName: profileData?.full_name || undefined,
          points: 0, // Same as referralPoints
          avatarUrl: profileData?.avatar_url || undefined
        };
        
        setUser(combinedUser);
      } catch (error) {
        console.error('Error refreshing profile:', error);
        setProfile(null);
        setUser(null);
      }
    } else {
      setProfile(null);
      setUser(null);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        refreshProfile();
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        
        if (session?.user) {
          await refreshProfile();
        } else {
          setProfile(null);
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Update profile when auth state changes
  useEffect(() => {
    if (session?.user && !loading) {
      refreshProfile();
    }
  }, [session?.user?.id]);

  const value = {
    user,
    profile,
    session,
    loading,
    refreshProfile,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
