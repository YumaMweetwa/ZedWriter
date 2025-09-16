import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

// Diagnostic component to verify authentication state (development only)
export const AuthDiagnostic = () => {
  // Only render in development mode
  if (import.meta.env.PROD) {
    return null;
  }
  const { user, profile, session, loading } = useAuth();
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);

  useEffect(() => {
    // Get direct Supabase auth state
    const getSupabaseAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setSupabaseUser(user);
    };
    
    getSupabaseAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 AUTH DIAGNOSTIC - Auth event:', event, 'User ID:', session?.user?.id);
      setSupabaseUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    console.log('🔍 AUTH DIAGNOSTIC - Context state changed:');
    console.log('  - user:', user ? `${user.id} (${user.email})` : 'null');
    console.log('  - profile:', profile ? 'loaded' : 'null');
    console.log('  - session:', session ? 'exists' : 'null');
    console.log('  - loading:', loading);
  }, [user, profile, session, loading]);

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-xs font-mono z-50 max-w-sm">
      <div className="font-bold mb-2">🔍 Auth Diagnostic</div>
      <div className="space-y-1">
        <div>Loading: {loading ? '⏳' : '✅'}</div>
        <div>Supabase User: {supabaseUser ? '✅ Signed In' : '❌ Not signed'}</div>
        <div>Context User: {user ? `✅ ${user.firstName || 'User'}` : '❌ Null'}</div>
        <div>Profile: {profile ? '✅' : '❌'}</div>
        <div>Session: {session ? '✅' : '❌'}</div>
        {user && (
          <div className="text-green-400">
            ID: {user.id.slice(0, 8)}...<br/>
            Email: {user.email}
          </div>
        )}
      </div>
    </div>
  );
};