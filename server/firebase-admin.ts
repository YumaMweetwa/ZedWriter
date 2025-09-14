import admin from 'firebase-admin';

// Initialize Firebase Admin SDK for Replit environment
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Production: Use service account key
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "improvedzedwriter",
      });
      console.log('Firebase Admin initialized with service account');
    } else {
      // Development: Use Firebase config without service account for client-side operations only
      // In Replit, we'll rely on client-side Firebase Auth and validate tokens differently
      console.warn('Firebase Admin running without service account - limited functionality');
      
      // Still initialize for basic functionality but expect token verification to fail
      admin.initializeApp({
        projectId: "improvedzedwriter",
      });
    }
  } catch (error) {
    console.error('Firebase Admin initialization failed:', (error as Error).message);
    
    // Minimal initialization for Replit compatibility
    admin.initializeApp({
      projectId: "improvedzedwriter",
    });
  }
}

export default admin;