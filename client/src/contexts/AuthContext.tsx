import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, getUserProfile, createUserProfile } from '@/lib/supabase';

// User profile type from our backend users table
interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  school: string | null;
  student_id: string | null;
  role: string;
  profile_picture: string | null;
  referral_code: string | null;
  referral_points: number | null;
  total_paid: number | null;
  total_owed: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
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
  profile: UserProfile | null;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        try {
          let profileData = await getUserProfile(authUser.id);
          
          // If no profile exists, create one automatically for new users
          if (!profileData) {
            console.log('Creating new user profile for:', authUser.id);
            try {
              // Use the correct createUserProfile function that calls the right endpoint
              profileData = await createUserProfile({
                email: authUser.email || '',
                first_name: authUser.user_metadata?.first_name || 'User',
                last_name: authUser.user_metadata?.last_name || '',
              });
              console.log('Created user profile successfully');
            } catch (createError) {
              console.error('Failed to create user profile:', createError);
              // Continue with auth user data even if profile creation fails
            }
          }
          
          setProfile(profileData);
          
          // Create combined user object
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
              : authUser.user_metadata?.full_name || undefined,
            points: profileData?.referral_points || 0,
            avatarUrl: profileData?.profile_picture || authUser.user_metadata?.avatar_url || undefined
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
    } finally {
      setLoading(false);
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
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      if (session?.user) {
        refreshProfile();
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        
        if (session?.user) {
          // Only refresh profile if it's not already set or if the user ID changed
          if (!user || user.id !== session.user.id) {
            await refreshProfile();
          }
        } else {
          setProfile(null);
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [user?.id]); // Only re-run if user ID changes

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
