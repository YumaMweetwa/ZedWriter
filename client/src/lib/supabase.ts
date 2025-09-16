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
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
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

// Helper to get user profile (use users table instead of profiles)
export const getUserProfile = async (userId?: string) => {
  const uid = userId || (await getCurrentUser())?.id
  if (!uid) return null
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .maybeSingle() // Use maybeSingle instead of single to handle 0 rows
    
  if (error) throw error
  return data // Will be null if no profile exists yet
}

// SECURE: Helper to create user profile via secure server endpoint
export const createUserProfile = async (userData: {
  email: string;
  first_name?: string;
  last_name?: string;
}) => {
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
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create user profile');
  }
  
  return await response.json();
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