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
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
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
      const decodedToken = await admin.auth().verifyIdToken(token);
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