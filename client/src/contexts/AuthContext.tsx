import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, ensureProfile } from '@/lib/supabase';

// Profile type for the profiles table
interface Profile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  school?: string | null;
  student_id?: string | null;
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
  isAdmin?: boolean;
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
    const { data } = await supabase.auth.getSession()
    setSession(data.session ?? null)
    if (data.session?.user) {
      const profileData = await ensureProfile(data.session.user.id)
      setProfile(profileData)
      
      // Create combined user object
      const combinedUser: CombinedUser = {
        id: data.session.user.id,
        email: data.session.user.email || '',
        firstName: profileData?.first_name || '',
        lastName: profileData?.last_name || '',
        phone: profileData?.phone || undefined,
        school: profileData?.school || undefined,
        studentId: profileData?.student_id || undefined,
        role: 'student',
        profilePicture: undefined,
        referralCode: undefined,
        referralPoints: 0,
        totalPaid: 0,
        totalOwed: 0,
        isActive: true,
        createdAt: profileData?.created_at || data.session.user.created_at,
        isAdmin: false,
        displayName: profileData?.first_name && profileData?.last_name 
          ? `${profileData.first_name} ${profileData.last_name}` 
          : undefined,
        points: 0,
        avatarUrl: undefined
      };
      
      setUser(combinedUser);
    } else {
      setUser(null);
      setProfile(null);
    }
  }

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
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session ?? null)
      if (session?.user) {
        const profileData = await ensureProfile(session.user.id)
        setProfile(profileData)
        
        // Create combined user object
        const combinedUser: CombinedUser = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: profileData?.first_name || '',
          lastName: profileData?.last_name || '',
          phone: profileData?.phone || undefined,
          school: profileData?.school || undefined,
          studentId: profileData?.student_id || undefined,
          role: 'student',
          profilePicture: undefined,
          referralCode: undefined,
          referralPoints: 0,
          totalPaid: 0,
          totalOwed: 0,
          isActive: true,
          createdAt: profileData?.created_at || session.user.created_at,
          isAdmin: false,
          displayName: profileData?.first_name && profileData?.last_name 
            ? `${profileData.first_name} ${profileData.last_name}` 
            : undefined,
          points: 0,
          avatarUrl: undefined
        };
        
        setUser(combinedUser);
      } else {
        setProfile(null)
        setUser(null)
      }
      setLoading(false)
    })

    // Set initial state on first load
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session ?? null)
      if (data.session?.user) {
        const profileData = await ensureProfile(data.session.user.id)
        setProfile(profileData)
        
        // Create combined user object
        const combinedUser: CombinedUser = {
          id: data.session.user.id,
          email: data.session.user.email || '',
          firstName: profileData?.first_name || '',
          lastName: profileData?.last_name || '',
          phone: profileData?.phone || undefined,
          school: profileData?.school || undefined,
          studentId: profileData?.student_id || undefined,
          role: 'student',
          profilePicture: undefined,
          referralCode: undefined,
          referralPoints: 0,
          totalPaid: 0,
          totalOwed: 0,
          isActive: true,
          createdAt: profileData?.created_at || data.session.user.created_at,
          isAdmin: false,
          displayName: profileData?.first_name && profileData?.last_name 
            ? `${profileData.first_name} ${profileData.last_name}` 
            : undefined,
          points: 0,
          avatarUrl: undefined
        };
        
        setUser(combinedUser);
      }
      setLoading(false)
    })()

    return () => sub.subscription.unsubscribe()
  }, [])

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