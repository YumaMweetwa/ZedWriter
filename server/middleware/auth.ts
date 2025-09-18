import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { SupabaseStorage } from '../storage-supabase';
import { pgClient } from '../db';

// Initialize Supabase client for server-side auth verification
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Initialize storage instance
const storage = new SupabaseStorage();

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string; // Alias for backward compatibility
        uid: string; // Alias for backward compatibility  
        email?: string;
        profile?: any; // User profile from our database
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Supabase auth verification failed:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Get user profile from our database (auto-create if needed)
    const profile = await getUserProfile(user.id, user.email);
    
    // Add user info to request
    req.user = {
      id: user.id,
      userId: user.id, // Backward compatibility alias
      uid: user.id, // Backward compatibility alias
      email: user.email,
      profile: profile,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Verify the JWT token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        // Get user profile from our database (auto-create if needed)
        const profile = await getUserProfile(user.id, user.email);
        
        req.user = {
          id: user.id,
          userId: user.id, // Backward compatibility alias
          uid: user.id, // Backward compatibility alias
          email: user.email,
          profile: profile,
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Helper function to get user profile and automatically create if doesn't exist
async function getUserProfile(userId: string, userEmail?: string) {
  try {
    // First try to get existing profile
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      return data;
    }
    
    // If profile doesn't exist and we have email, create it automatically
    if (userEmail) {
      console.log(`Creating profile automatically for user ${userId} (${userEmail})`);
      try {
        const result = await pgClient`
          SELECT * FROM public.ensure_user_profile(
            ${userId},
            ${userEmail},
            '',
            ''
          )
        `;
        
        if (result && result.length > 0) {
          console.log(`✅ Profile created automatically for ${userEmail}`);
          return result[0];
        }
      } catch (createError) {
        console.error('Error auto-creating profile:', createError);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}