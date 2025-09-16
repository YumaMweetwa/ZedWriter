import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  school?: string;
  created_at: string;
  updated_at?: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user?.id) {
      setProfile(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No profile found - create empty one
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              first_name: '',
              last_name: ''
            }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            setError('Could not create profile');
            return;
          }

          setProfile(newProfile);
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
        .from('profiles')
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