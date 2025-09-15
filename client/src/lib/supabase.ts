import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
})

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

// Helper to get user profile
export const getUserProfile = async (userId?: string) => {
  const uid = userId || (await getCurrentUser())?.id
  if (!uid) return null
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single()
    
  if (error) throw error
  return data
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