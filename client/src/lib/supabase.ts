import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Using fallback values for development.')
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'zedwriter-app'
      }
    }
  }
)

// Auth helpers
export const auth = supabase.auth

// Storage helpers 
export const storage = supabase.storage

// Database helpers
export const db = supabase

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Helper to get user profile (use profiles table)
export const getUserProfile = async (userId?: string) => {
  try {
    const uid = userId || (await getCurrentUser())?.id
    if (!uid) return null
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle() // Use maybeSingle instead of single to handle 0 rows
      
    if (error) {
      console.error('Supabase query error:', error);
      return null; // Return null instead of throwing
    }
    return data; // Will be null if no profile exists yet
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null; // Always return null instead of throwing
  }
}

// Ensure a profile row exists (create it on first login)
export const ensureProfile = async (userId: string) => {
  const { data, error, status } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // 406 = no rows (PostgREST), or use error?.code === 'PGRST116' depending on SDK
  if (status === 406 || error?.code === 'PGRST116') {
    const { error: insertErr } = await supabase
      .from('profiles')
      .insert({ id: userId })
    if (insertErr) {
      console.error('insert profile error', insertErr)
      return null
    }
    return { id: userId }
  }

  if (error) {
    console.error('select profile error', error) // 401 here means missing RLS policy
    return null
  }

  return data
}

// SECURE: Helper to create user profile via secure server endpoint
export const createUserProfile = async (userData: {
  email: string;
  first_name?: string;
  last_name?: string;
}) => {
  try {
    // Get the current session to ensure user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Authentication required');
    }
    
    // Make secure API call to server endpoint
    const response = await fetch('/api/users/create-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to create user profile via API:', error);
    // Return a minimal profile object so the app can continue
    return {
      id: userData.email, // Use email as temporary ID
      email: userData.email,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      role: 'student',
      is_active: true,
      created_at: new Date().toISOString(),
      // Mark this as a temporary/offline profile
      _isTemporary: true
    };
  }
}

// Helper to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Helper for real-time subscriptions
export const subscribe = (table: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe()
}