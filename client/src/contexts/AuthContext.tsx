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

interface AuthContextType {
  user: SupabaseUser | null;
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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user) {
      try {
        const profileData = await getUserProfile(user.id);
        setProfile(profileData);
      } catch (error) {
        console.error('Error refreshing profile:', error);
        setProfile(null);
      }
    } else {
      setProfile(null);
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
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshProfile();
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await refreshProfile();
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Update profile when user changes
  useEffect(() => {
    if (user && !loading) {
      refreshProfile();
    }
  }, [user?.id]);

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
