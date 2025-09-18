import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  school?: string | null;
  created_at: string;
  updated_at?: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProfileIfNeeded = async () => {
    if (!user?.id || !user?.email) return;

    try {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No auth token available');
        setError('Authentication required');
        return;
      }

      // Call the backend API to create the profile
      const response = await fetch('/api/users/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: user.email,
          first_name: user.user_metadata?.first_name || 'User',
          last_name: user.user_metadata?.last_name || '',
        }),
      });

      if (response.ok) {
        const newProfile = await response.json();
        setProfile(newProfile);
        console.log('Profile created successfully');
      } else {
        const errorData = await response.json();
        
        // If profile already exists, try to fetch it instead
        if (response.status === 409 && errorData.error === 'User profile already exists') {
          console.log('Profile already exists, fetching existing profile...');
          await fetchProfile();
          return;
        }
        
        console.error('Failed to create profile:', errorData);
        setError(`Could not create profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Profile creation failed');
    }
  };

  const fetchProfile = async () => {
    if (!user?.id) {
      setProfile(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No user found - try to create profile automatically
          console.log('User profile not found, attempting to create...');
          await createProfileIfNeeded();
          return;
        } else {
          console.error('Error fetching profile:', fetchError);
          setError('Could not load profile');
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Profile unavailable');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        setError('Could not update profile');
        throw updateError;
      }

      setProfile(data);
      return data;
    } catch (err) {
      console.error('Profile update error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile: fetchProfile
  };
};