import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { storage } from '../storage';

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        userId: string; // Our database user ID
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
    
    let decodedToken;
    
    try {
      // Try to verify the Firebase ID token
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (adminError) {
      console.warn('Firebase Admin token verification failed:', adminError);
      
      // Fallback: Basic token validation (in development mode)
      // In production, you should have proper service account setup
      if (process.env.NODE_ENV === 'development') {
        // For development, we'll trust the frontend Firebase Auth
        // This is NOT secure for production
        try {
          // Basic JWT decode (NOT verification - just extraction)
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          decodedToken = { uid: payload.user_id, email: payload.email };
          console.warn('Using development token fallback - NOT SECURE FOR PRODUCTION');
        } catch (decodeError) {
          return res.status(401).json({ error: 'Invalid token format' });
        }
      } else {
        return res.status(401).json({ error: 'Token verification failed' });
      }
    }
    
    // Get user from our database using Firebase UID
    const user = await storage.getUserByFirebaseUid(decodedToken.uid);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found in database' });
    }

    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      userId: user.id,
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
      
      let decodedToken;
      
      try {
        decodedToken = await admin.auth().verifyIdToken(token);
      } catch (adminError) {
        // Fallback for development mode
        if (process.env.NODE_ENV === 'development') {
          try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            decodedToken = { uid: payload.user_id, email: payload.email };
          } catch (decodeError) {
            return next(); // Continue without auth
          }
        } else {
          return next(); // Continue without auth
        }
      }
      
      const user = await storage.getUserByFirebaseUid(decodedToken.uid);
      
      if (user) {
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          userId: user.id,
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};